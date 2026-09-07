import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'
import { getStripe, isLegacyStripePayment, LEGACY_REFUND_MESSAGE } from '@/lib/stripe'
import { syncOrderTransactions } from '@/lib/moneyLedger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { amount, note } = await req.json()

  const db = createAdminClient()
  const { data: order } = await db.from('orders').select('id, total, stripe_payment_intent_id, status').eq('id', id).single()
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (!order.stripe_payment_intent_id) return NextResponse.json({ error: 'No payment on record' }, { status: 400 })
  if (isLegacyStripePayment(order.stripe_payment_intent_id)) {
    return NextResponse.json({ error: LEGACY_REFUND_MESSAGE, legacyAccount: true }, { status: 409 })
  }

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
    // A PaymentIntent from the previous Stripe account is invisible to the
    // current key, so Stripe reports it as missing rather than as a wrong-account
    // error. Treat that as the legacy case regardless of STRIPE_ACCOUNT_ID.
    if ((err as { code?: string })?.code === 'resource_missing') {
      return NextResponse.json({ error: LEGACY_REFUND_MESSAGE, legacyAccount: true }, { status: 409 })
    }
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

  await syncOrderTransactions(id)

  return NextResponse.json({ success: true, refundId: stripeRefundId })
}
