import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { syncOrderTransactions, syncExpenseTransaction } from '@/lib/moneyLedger'

// One-shot resync. Walks every order and every expense with a paid_from_account_id
// and re-derives the ledger rows for them. Safe to run repeatedly — it preserves
// any rows where manual_override = true.
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const [{ data: orders }, { data: expenses }] = await Promise.all([
    db.from('orders').select('id'),
    db.from('expenses').select('id').not('paid_from_account_id', 'is', null),
  ])

  let orderCount = 0
  for (const o of (orders ?? []) as { id: string }[]) {
    await syncOrderTransactions(o.id)
    orderCount += 1
  }

  let expenseCount = 0
  for (const e of (expenses ?? []) as { id: string }[]) {
    await syncExpenseTransaction(e.id)
    expenseCount += 1
  }

  return NextResponse.json({ orders: orderCount, expenses: expenseCount })
}
