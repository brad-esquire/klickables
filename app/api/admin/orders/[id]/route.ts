import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { sendShippedNotification } from '@/lib/email'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

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

  if (!customer_name || !['pending', 'paid', 'fulfilled', 'cancelled', 'shipped', 'out_for_delivery'].includes(status) || total < 0) {
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
  const body = await req.json()
  const { status, paymentNote, trackingNumber, shippingCarrier, postageCost, notes, action } = body
  const db = createAdminClient()

  if (action === 'fetch_stripe_fee') {
    const { data: order } = await db.from('orders').select('stripe_payment_intent_id, total').eq('id', id).single()
    if (!order?.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'No Stripe payment on this order' }, { status: 400 })
    }
    const { data: existing } = await db.from('payment_events').select('id').eq('order_id', id).eq('type', 'stripe_fee').maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'Fee already recorded' }, { status: 409 })
    }
    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id, {
      expand: ['latest_charge.balance_transaction'],
    })
    const charge = pi.latest_charge as Stripe.Charge
    const balanceTx = charge?.balance_transaction as Stripe.BalanceTransaction
    if (!balanceTx || balanceTx.fee <= 0) {
      return NextResponse.json({ error: 'No fee found on this payment' }, { status: 404 })
    }
    const feePercent = ((balanceTx.fee / balanceTx.amount) * 100).toFixed(2)
    await db.from('payment_events').insert({
      order_id: id,
      type: 'stripe_fee',
      amount: balanceTx.fee / 100,
      stripe_id: balanceTx.id,
      note: `${feePercent}% — net $${(balanceTx.net / 100).toFixed(2)}`,
    })
    return NextResponse.json({ success: true })
  }

  if (notes !== undefined) {
    await db.from('orders').update({ notes: notes || null }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  const update: Record<string, unknown> = { status }
  if (status === 'fulfilled') update.fulfilled_at = new Date().toISOString()
  if (status === 'shipped') {
    update.shipped_at = new Date().toISOString()
    if (trackingNumber) update.tracking_number = trackingNumber
    if (shippingCarrier) update.shipping_carrier = shippingCarrier
  }

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

  if (status === 'shipped') {
    if (postageCost && postageCost > 0) {
      await db.from('payment_events').insert({
        order_id: id,
        type: 'postage_cost',
        amount: postageCost,
        stripe_id: null,
        note: shippingCarrier ?? 'USPS',
      })
    }
    if (trackingNumber) {
      const { data: order } = await db.from('orders').select('*').eq('id', id).single()
      if (order) {
        await sendShippedNotification(order, trackingNumber, shippingCarrier ?? 'USPS').catch(() => {})
      }
    }
  }

  return NextResponse.json({ success: true })
}
