import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { syncExpenseTransaction } from '@/lib/moneyLedger'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { description, amount, category, date, paid_from_account_id } = await req.json()
  // Negative amounts are allowed — that's how a refund is logged against a category.
  const amt = Number(amount)
  if (!description?.trim() || !Number.isFinite(amt) || amt === 0 || !date) {
    return NextResponse.json({ error: 'Invalid expense data' }, { status: 400 })
  }
  const db = createAdminClient()
  const { data, error } = await db.from('expenses').update({
    description: description.trim(),
    amount: amt,
    category: category || 'Other',
    date,
    paid_from_account_id: paid_from_account_id || null,
  }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  await syncExpenseTransaction(id)
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  // Remove any auto-managed ledger row first; the FK would null it out and orphan it otherwise.
  await db.from('money_transactions').delete().eq('expense_id', id).eq('manual_override', false)
  await db.from('expenses').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
