import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

const MANUAL_KINDS = new Set(['transfer', 'reimbursement', 'adjustment', 'expense', 'sale'])

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(req.url)
  const accountId = url.searchParams.get('account_id')
  const kind      = url.searchParams.get('kind')
  const from      = url.searchParams.get('from')
  const to        = url.searchParams.get('to')

  const db = createAdminClient()
  let q = db.from('money_transactions').select('*').order('occurred_at', { ascending: false }).order('created_at', { ascending: false })
  if (accountId) q = q.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
  if (kind)      q = q.eq('kind', kind)
  if (from)      q = q.gte('occurred_at', from)
  if (to)        q = q.lte('occurred_at', to)

  const { data } = await q
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { kind, from_account_id, to_account_id, amount, occurred_at, description, notes } = body as {
    kind: string; from_account_id: string | null; to_account_id: string | null
    amount: number | string; occurred_at: string; description?: string; notes?: string
  }
  if (!MANUAL_KINDS.has(kind)) return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  const amt = Number(amount)
  if (!amt || amt <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })

  // Per-kind requirements for from/to
  const needsFrom = kind === 'expense' || kind === 'transfer' || kind === 'reimbursement'
  const needsTo   = kind === 'sale'    || kind === 'transfer' || kind === 'reimbursement'
  if (needsFrom && !from_account_id) return NextResponse.json({ error: `${kind} requires "from" account` }, { status: 400 })
  if (needsTo   && !to_account_id)   return NextResponse.json({ error: `${kind} requires "to" account` },   { status: 400 })
  if (kind === 'adjustment' && !from_account_id && !to_account_id) {
    return NextResponse.json({ error: 'Adjustment requires from or to account' }, { status: 400 })
  }
  if (from_account_id && to_account_id && from_account_id === to_account_id) {
    return NextResponse.json({ error: 'From and to accounts must differ' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data, error } = await db.from('money_transactions').insert({
    kind,
    from_account_id: from_account_id || null,
    to_account_id:   to_account_id   || null,
    amount: amt,
    occurred_at: occurred_at || new Date().toISOString().slice(0, 10),
    description: description?.trim() || null,
    notes: notes?.trim() || null,
    manual_override: true,
  }).select().single()
  if (error) return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
