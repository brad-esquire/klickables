import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json() as Record<string, unknown>
  const update: Record<string, unknown> = {}
  if (typeof body.name === 'string') update.name = body.name.trim()
  if (typeof body.holder === 'string' || body.holder === null) update.holder = body.holder ? String(body.holder).trim() : null
  if (body.default_fee_rate !== undefined) update.default_fee_rate = Number(body.default_fee_rate) || 0
  if (body.default_fee_fixed !== undefined) update.default_fee_fixed = Number(body.default_fee_fixed) || 0
  if (typeof body.archived === 'boolean') update.archived = body.archived
  if (body.sort_order !== undefined) update.sort_order = Number(body.sort_order) || 0
  const db = createAdminClient()
  const { data, error } = await db.from('money_accounts').update(update).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  const { count } = await db
    .from('money_transactions')
    .select('id', { count: 'exact', head: true })
    .or(`from_account_id.eq.${id},to_account_id.eq.${id}`)
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Account has transactions — archive instead of deleting' }, { status: 400 })
  }
  await db.from('money_accounts').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
