import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*, order_items(*)').eq('id', id).single()
  return data ? NextResponse.json(data) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { status, paymentNote } = await req.json()
  const db = createAdminClient()

  const update: Record<string, unknown> = { status }
  if (status === 'fulfilled') update.fulfilled_at = new Date().toISOString()

  await db.from('orders').update(update).eq('id', id)

  if (status === 'paid') {
    const { data: order } = await db.from('orders').select('total').eq('id', id).single()
    await db.from('payment_events').insert({
      order_id: id,
      type: 'payment_captured',
      amount: order?.total ?? 0,
      stripe_id: null,
      note: paymentNote ?? 'Cash',
    })
  }

  return NextResponse.json({ success: true })
}
