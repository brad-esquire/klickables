import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const { data } = await db.from('money_accounts').select('*').order('sort_order').order('name')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, kind, holder, default_fee_rate, default_fee_fixed, sort_order } = await req.json()
  if (!name?.trim() || !kind || !['digital', 'cash', 'external'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid account data' }, { status: 400 })
  }
  if ((kind === 'cash' || kind === 'external') && !holder?.trim()) {
    return NextResponse.json({ error: 'Holder name required for cash and external accounts' }, { status: 400 })
  }
  const db = createAdminClient()
  const { data, error } = await db.from('money_accounts').insert({
    name: name.trim(),
    kind,
    holder: holder?.trim() || null,
    default_fee_rate: Number(default_fee_rate) || 0,
    default_fee_fixed: Number(default_fee_fixed) || 0,
    sort_order: Number(sort_order) || 100,
  }).select().single()
  if (error) return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
