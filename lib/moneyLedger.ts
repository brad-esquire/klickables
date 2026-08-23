// Money ledger sync helpers.
//
// The ledger (money_transactions) is kept in sync with orders, payment_events,
// and expenses by re-deriving the auto-managed rows from current source data.
// Each sync is idempotent: it deletes all non-override rows tied to the source
// record, then re-inserts. Rows with manual_override = true are preserved so a
// human edit is never clobbered.

import { createAdminClient } from './supabase'
import type { MoneyAccount, AccountBalance, PaymentMethod } from '@/types'

type DB = ReturnType<typeof createAdminClient>

function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase()
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

async function findAccount(db: DB, predicate: { name?: string; holder?: string }): Promise<MoneyAccount | null> {
  let q = db.from('money_accounts').select('*').eq('archived', false)
  if (predicate.name)   q = q.ilike('name',   predicate.name)
  if (predicate.holder) q = q.ilike('holder', predicate.holder)
  const { data } = await q.limit(1).maybeSingle()
  return data as MoneyAccount | null
}

async function destinationAccountForOrder(
  db: DB,
  paymentMethod: PaymentMethod | null,
  cashHolder: string | null,
): Promise<MoneyAccount | null> {
  if (!paymentMethod) return null
  if (paymentMethod === 'cash') {
    if (!cashHolder) return null
    return findAccount(db, { holder: cashHolder })
  }
  if (paymentMethod === 'stripe') return findAccount(db, { name: 'Stripe' })
  if (paymentMethod === 'venmo')  return findAccount(db, { name: 'Venmo' })
  if (paymentMethod === 'paypal') return findAccount(db, { name: 'PayPal' })
  if (paymentMethod === 'zelle')  return findAccount(db, { name: 'Zelle' })
  return null // 'other' — no auto-routing; user can record manually
}

interface OrderRow {
  id: string
  status: string
  total: number | null
  payment_method: PaymentMethod | null
  cash_holder: string | null
  created_at: string
}

interface PaymentEventRow {
  id: string
  type: string
  amount: number
  note: string | null
  paid_from_account_id: string | null
  created_at: string
}

interface ExpenseRow {
  id: string
  description: string
  amount: number
  date: string
  paid_from_account_id: string | null
}

// Re-derive every auto-managed ledger row for one order.
// Called after order create/update, payment_event insert, refund, etc.
export async function syncOrderTransactions(orderId: string): Promise<void> {
  const db = createAdminClient()

  const { data: orderData } = await db.from('orders').select('id, status, total, payment_method, cash_holder, created_at').eq('id', orderId).maybeSingle()
  const order = orderData as OrderRow | null
  if (!order) {
    // Order gone (deleted) — clear its auto rows.
    await db.from('money_transactions').delete().eq('order_id', orderId).eq('manual_override', false)
    return
  }

  const { data: eventsData } = await db.from('payment_events').select('id, type, amount, note, paid_from_account_id, created_at').eq('order_id', orderId)
  const events = (eventsData ?? []) as PaymentEventRow[]

  // Wipe all non-manual rows for this order so the rebuild is clean.
  await db.from('money_transactions').delete().eq('order_id', orderId).eq('manual_override', false)

  const includeSale = order.status !== 'pending' && order.status !== 'cancelled' && !!order.total && Number(order.total) > 0
  const orderDate = order.created_at.slice(0, 10)

  if (includeSale) {
    const dest = await destinationAccountForOrder(db, order.payment_method, order.cash_holder)
    if (dest) {
      const total = Number(order.total)

      await db.from('money_transactions').insert({
        occurred_at:     orderDate,
        kind:            'sale',
        from_account_id: null,
        to_account_id:   dest.id,
        amount:          total,
        order_id:        orderId,
        description:     `Sale — Order #${shortOrderId(orderId)}`,
      })

      // Auto-deducted processor fee (Venmo, PayPal, etc.). Stripe is excluded —
      // its real fees flow in via payment_events to avoid double-counting.
      const feeRate  = Number(dest.default_fee_rate)
      const feeFixed = Number(dest.default_fee_fixed)
      if (feeRate > 0 || feeFixed > 0) {
        const fee = round2(total * feeRate + feeFixed)
        if (fee > 0) {
          await db.from('money_transactions').insert({
            occurred_at:     orderDate,
            kind:            'expense',
            from_account_id: dest.id,
            to_account_id:   null,
            amount:          fee,
            order_id:        orderId,
            description:     `${dest.name} fee (auto)`,
          })
        }
      }
    }
  }

  // Outflows tied to payment_events. Each event's `paid_from_account_id` controls
  // which account is debited; for the events that ARE auto-deducted from Stripe
  // by Stripe itself (stripe_fee, refund_issued) we default to Stripe when unset.
  // Postage has no such default — it's typically paid out of pocket, so an
  // unassigned postage row stays out of the ledger until someone is attributed.
  const outflowEvents = events.filter((e) => e.type === 'stripe_fee' || e.type === 'postage_cost' || e.type === 'refund_issued')
  if (outflowEvents.length > 0) {
    const stripe = await findAccount(db, { name: 'Stripe' })
    for (const ev of outflowEvents) {
      const amount = Number(ev.amount)
      if (!amount || amount <= 0) continue
      const stripeDefaults = ev.type === 'stripe_fee' || ev.type === 'refund_issued'
      const fromId = ev.paid_from_account_id ?? (stripeDefaults ? stripe?.id : null)
      if (!fromId) continue
      let description: string
      if (ev.type === 'postage_cost') {
        description = `${ev.note ?? 'Postage'} — Order #${shortOrderId(orderId)}`
      } else if (ev.type === 'refund_issued') {
        description = `Refund — Order #${shortOrderId(orderId)}`
      } else {
        description = `Stripe fee — Order #${shortOrderId(orderId)}`
      }
      await db.from('money_transactions').insert({
        occurred_at:      ev.created_at.slice(0, 10),
        kind:             'expense',
        from_account_id:  fromId,
        to_account_id:    null,
        amount,
        order_id:         orderId,
        payment_event_id: ev.id,
        description,
      })
    }
  }
}

// Re-derive the auto-managed ledger row for one expense.
export async function syncExpenseTransaction(expenseId: string): Promise<void> {
  const db = createAdminClient()

  const { data: expData } = await db.from('expenses').select('id, description, amount, date, paid_from_account_id').eq('id', expenseId).maybeSingle()
  const exp = expData as ExpenseRow | null

  await db.from('money_transactions').delete().eq('expense_id', expenseId).eq('manual_override', false)

  if (exp && exp.paid_from_account_id) {
    // A negative expense is a refund: the money flows back INTO the account, so the
    // ledger row is reversed. money_transactions.amount is constrained to > 0, hence
    // the direction — not the sign — carries the meaning.
    const amount = Number(exp.amount)
    const isRefund = amount < 0
    if (amount !== 0) {
      await db.from('money_transactions').insert({
        occurred_at:     exp.date,
        kind:            'expense',
        from_account_id: isRefund ? null : exp.paid_from_account_id,
        to_account_id:   isRefund ? exp.paid_from_account_id : null,
        amount:          Math.abs(amount),
        expense_id:      expenseId,
        description:     exp.description,
      })
    }
  }
}

// Compute the current balance of each (non-archived) account, plus inflow/outflow totals.
export async function getAccountBalances(): Promise<AccountBalance[]> {
  const db = createAdminClient()

  const [{ data: accountsData }, { data: txnsData }] = await Promise.all([
    db.from('money_accounts').select('*').eq('archived', false).order('sort_order'),
    db.from('money_transactions').select('from_account_id, to_account_id, amount'),
  ])

  const accounts = (accountsData ?? []) as MoneyAccount[]
  const txns = (txnsData ?? []) as { from_account_id: string | null; to_account_id: string | null; amount: number }[]

  const stats = new Map<string, { inflow: number; outflow: number; count: number }>()
  for (const a of accounts) stats.set(a.id, { inflow: 0, outflow: 0, count: 0 })

  for (const t of txns) {
    const amt = Number(t.amount)
    if (t.to_account_id) {
      const s = stats.get(t.to_account_id)
      if (s) { s.inflow += amt; s.count += 1 }
    }
    if (t.from_account_id) {
      const s = stats.get(t.from_account_id)
      if (s) { s.outflow += amt; s.count += 1 }
    }
  }

  return accounts.map((account) => {
    const s = stats.get(account.id) ?? { inflow: 0, outflow: 0, count: 0 }
    return {
      account,
      balance:           round2(s.inflow - s.outflow),
      inflow:            round2(s.inflow),
      outflow:           round2(s.outflow),
      transaction_count: s.count,
    }
  })
}
