import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { syncOrderTransactions } from '@/lib/moneyLedger'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, eventId } = await params
  const body = await req.json() as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (body.amount !== undefined) {
    const amt = Number(body.amount)
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    update.amount = amt
  }
  if (typeof body.note === 'string' || body.note === null) update.note = body.note || null
  if (body.paid_from_account_id !== undefined) update.paid_from_account_id = body.paid_from_account_id || null

  const db = createAdminClient()
  const { error } = await db.from('payment_events').update(update).eq('id', eventId).eq('order_id', id)
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  await syncOrderTransactions(id)
  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; eventId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, eventId } = await params
  const db = createAdminClient()
  // Remove the auto-managed ledger row first (FK is SET NULL otherwise → orphans).
  await db.from('money_transactions').delete().eq('payment_event_id', eventId).eq('manual_override', false)
  await db.from('payment_events').delete().eq('id', eventId).eq('order_id', id)
  await syncOrderTransactions(id)
  return NextResponse.json({ success: true })
}
