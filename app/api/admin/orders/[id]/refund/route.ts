import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { amount, note } = await req.json()

  const db = createAdminClient()
  const { data: order } = await db.from('orders').select('id, total, stripe_payment_intent_id, status').eq('id', id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (!order.stripe_payment_intent_id) return NextResponse.json({ error: 'No payment on record' }, { status: 400 })

  const refundAmount = typeof amount === 'number' && amount > 0 ? amount : order.total
  if (refundAmount > order.total) return NextResponse.json({ error: 'Refund exceeds order total' }, { status: 400 })

  let stripeRefundId: string
  try {
    const stripe = getStripe()
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: Math.round(refundAmount * 100),
    })
    stripeRefundId = refund.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe refund failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  await db.from('payment_events').insert({
    order_id: id,
    type: 'refund_issued',
    amount: refundAmount,
    stripe_id: stripeRefundId,
    note: note || null,
  })

  // Mark order cancelled if full refund
  if (refundAmount >= order.total) {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', id)
  }

  return NextResponse.json({ success: true, refundId: stripeRefundId })
}
