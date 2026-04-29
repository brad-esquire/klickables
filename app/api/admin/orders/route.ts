import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    customer_name, email, fulfillment_type, shipping_address, pickup_location,
    status, subtotal, shipping_cost, discount_amount, total,
    discount_code, payment_note, line_items,
  } = body

  // Server-side validation
  if (!customer_name?.trim()) {
    return NextResponse.json({ error: 'Customer name is required' }, { status: 400 })
  }
  if (!Array.isArray(line_items) || line_items.length === 0) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }
  for (const item of line_items) {
    if (!item.product_id || !item.variant_id || item.quantity < 1 || item.unit_price < 0) {
      return NextResponse.json({ error: 'Invalid line item data' }, { status: 400 })
    }
  }
  if (!['pending', 'paid'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (total < 0) {
    return NextResponse.json({ error: 'Total cannot be negative' }, { status: 400 })
  }

  const db = createAdminClient()

  // Insert order
  const { data: order, error: orderError } = await db.from('orders').insert({
    stripe_payment_intent_id: null,
    email: email?.trim() ?? '',
    customer_name: customer_name.trim(),
    shipping_address,
    fulfillment_type,
    pickup_location: pickup_location || null,
    status,
    subtotal,
    shipping_cost,
    discount_amount,
    total,
    discount_code: discount_code || null,
  }).select().single()

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 400 })
  }

  // Insert order items
  const { error: itemsError } = await db.from('order_items').insert(
    line_items.map((item: { product_id: string; variant_id: string; product_name: string; variant_label: string | null; quantity: number; unit_price: number }) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_label: item.variant_label ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    await db.from('orders').delete().eq('id', order.id)
    return NextResponse.json({ error: itemsError.message }, { status: 400 })
  }

  // Record payment event if paid
  if (status === 'paid') {
    await db.from('payment_events').insert({
      order_id: order.id,
      type: 'payment_captured',
      amount: total,
      stripe_id: null,
      note: payment_note || null,
    })
  }

  return NextResponse.json({ id: order.id }, { status: 201 })
}
