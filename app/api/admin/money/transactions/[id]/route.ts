import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json() as Record<string, unknown>
  const update: Record<string, unknown> = { manual_override: true }
  if (body.amount !== undefined) {
    const amt = Number(body.amount)
    if (!amt || amt <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    update.amount = amt
  }
  if (typeof body.occurred_at === 'string') update.occurred_at = body.occurred_at
  if (body.from_account_id !== undefined) update.from_account_id = body.from_account_id || null
  if (body.to_account_id   !== undefined) update.to_account_id   = body.to_account_id   || null
  if (typeof body.description === 'string' || body.description === null) update.description = body.description ? String(body.description).trim() : null
  if (typeof body.notes === 'string' || body.notes === null) update.notes = body.notes ? String(body.notes).trim() : null

  const db = createAdminClient()
  const { data, error } = await db.from('money_transactions').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  await db.from('money_transactions').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
