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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { customer_name, email, fulfillment_type, shipping_address, pickup_location, status, subtotal, shipping_cost, discount_amount, total, discount_code, line_items } = body

  if (!customer_name || !['pending', 'paid', 'fulfilled', 'cancelled'].includes(status) || total < 0) {
    return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
  }
  if (!line_items?.length) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }

  const db = createAdminClient()

  const orderUpdate: Record<string, unknown> = {
    customer_name, email: email ?? '', fulfillment_type, shipping_address,
    pickup_location: pickup_location ?? null, status,
    subtotal, shipping_cost, discount_amount, total,
    discount_code: discount_code ?? null,
  }
  if (status === 'fulfilled') orderUpdate.fulfilled_at = new Date().toISOString()

  await db.from('orders').update(orderUpdate).eq('id', id)
  await db.from('order_items').delete().eq('order_id', id)
  const { error: itemsError } = await db.from('order_items').insert(
    line_items.map((item: Record<string, unknown>) => ({ ...item, order_id: id }))
  )
  if (itemsError) return NextResponse.json({ error: 'Failed to save items' }, { status: 400 })

  return NextResponse.json({ success: true })
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
