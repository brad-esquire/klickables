import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/email'
import type Stripe from 'stripe'
import type { CartItem, ShippingAddress } from '@/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true })
  }

  const pi = event.data.object as Stripe.PaymentIntent
  const meta = pi.metadata

  // Reconstruct cart from chunked metadata keys (cart0, cart1, …) with fallback to legacy cartJson
  let cartJson = ''
  for (let i = 0; meta[`cart${i}`]; i++) cartJson += meta[`cart${i}`]
  const items: CartItem[] = JSON.parse(cartJson || meta.cartJson || '[]')
  const shippingAddress: ShippingAddress = JSON.parse(meta.shippingAddressJson ?? '{}')
  const db = createAdminClient()

  // Prevent duplicate processing
  const { data: existing } = await db.from('orders').select('id').eq('stripe_payment_intent_id', pi.id).single()
  if (existing) return NextResponse.json({ received: true })

  // Create order
  const { data: order } = await db.from('orders').insert({
    stripe_payment_intent_id: pi.id,
    email: meta.email,
    customer_name: meta.customerName,
    shipping_address: shippingAddress,
    fulfillment_type: meta.fulfillmentType || 'shipping',
    pickup_location: meta.pickupLocation || null,
    status: 'paid',
    subtotal: parseFloat(meta.subtotal),
    shipping_cost: parseFloat(meta.shippingCost),
    discount_amount: parseFloat(meta.discountAmount),
    total: pi.amount / 100,
    discount_code: meta.discountCode || null,
  }).select().single()

  if (!order) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })

  // Fetch product names for order items
  const variantIds = items.map((i) => i.variantId)
  const { data: variants } = await db
    .from('product_variants')
    .select('id, price, stock, color, size, product_id, products(name, images)')
    .in('id', variantIds)

  // Insert order items and decrement stock
  for (const item of items) {
    const variant = variants?.find((v) => v.id === item.variantId)
    const productName = (variant?.products as unknown as { name: string; images: string[] })?.name ?? item.productName
    const variantLabel = [variant?.color, variant?.size].filter(Boolean).join(' / ')

    await db.from('order_items').insert({
      order_id: order.id,
      product_id: (variant as unknown as { product_id: string } | undefined)?.product_id ?? item.productId,
      variant_id: item.variantId,
      product_name: productName,
      variant_label: variantLabel || null,
      quantity: item.quantity,
      unit_price: variant?.price ?? item.price,
    })

    // Decrement stock atomically
    if (variant) {
      await db
        .from('product_variants')
        .update({ stock: Math.max(0, variant.stock - item.quantity) })
        .eq('id', item.variantId)
    }
  }

  // Record payment event
  await db.from('payment_events').insert({
    order_id: order.id,
    type: 'payment_captured',
    amount: pi.amount / 100,
    stripe_id: pi.id,
    note: null,
  })

  // Record Stripe processing fee from balance transaction
  try {
    if (pi.latest_charge) {
      const charge = await stripe.charges.retrieve(pi.latest_charge as string, {
        expand: ['balance_transaction'],
      })
      const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction
      if (balanceTx && balanceTx.fee > 0) {
        const feePercent = ((balanceTx.fee / balanceTx.amount) * 100).toFixed(2)
        await db.from('payment_events').insert({
          order_id: order.id,
          type: 'stripe_fee',
          amount: balanceTx.fee / 100,
          stripe_id: balanceTx.id,
          note: `${feePercent}% — net $${(balanceTx.net / 100).toFixed(2)}`,
        })
      }
    }
  } catch (feeErr) {
    console.error('Failed to record Stripe fee:', feeErr)
  }

  // Increment discount usage
  if (meta.discountId) {
    const { data: disc } = await db.from('discount_codes').select('uses_count').eq('id', meta.discountId).single()
    if (disc) {
      await db.from('discount_codes').update({ uses_count: disc.uses_count + 1 }).eq('id', meta.discountId)
    }
  }

  // Fetch full order with items for email
  const { data: fullOrder } = await db
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', order.id)
    .single()

  if (fullOrder) {
    try {
      await sendOrderConfirmation(fullOrder as Parameters<typeof sendOrderConfirmation>[0])
    } catch (emailErr) {
      console.error('Email send failed:', emailErr)
    }
  }

  return NextResponse.json({ received: true })
}
