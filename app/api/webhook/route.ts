import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/email'
import type Stripe from 'stripe'
import type { CartItem, ShippingAddress } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 25

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

  const regularVariantIds = items
    .map((i) => i.variantId)
    .filter((id) => id !== 'custom-clicker')

  // Parallel: duplicate check + variant fetch (independent of each other)
  const [{ data: existing }, { data: variants }] = await Promise.all([
    db.from('orders').select('id').eq('stripe_payment_intent_id', pi.id).maybeSingle(),
    regularVariantIds.length > 0
      ? db.from('product_variants').select('id, price, stock, color, size, product_id, products(name, images)').in('id', regularVariantIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ])
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

  // Insert order items + decrement stock in parallel (one promise per item)
  await Promise.all(items.map(async (item) => {
    if (item.variantId === 'custom-clicker') {
      const c = item.customization
      await db.from('order_items').insert({
        order_id: order.id,
        product_id: null,
        variant_id: null,
        product_name: 'Custom Clicker',
        variant_label: c ? `${c.color1} / ${c.color2}` : null,
        quantity: item.quantity,
        unit_price: item.price,
        customization: c ?? null,
      })
      return
    }

    const variant = (variants as unknown as Array<{ id: string; price: number; stock: number; color: string; size: string; product_id: string; products: { name: string; images: string[] } }> | null)?.find((v) => v.id === item.variantId)
    const productName = variant?.products?.name ?? item.productName
    const variantLabel = [variant?.color, variant?.size].filter(Boolean).join(' / ')

    await db.from('order_items').insert({
      order_id: order.id,
      product_id: variant?.product_id ?? item.productId,
      variant_id: item.variantId,
      product_name: productName,
      variant_label: variantLabel || null,
      quantity: item.quantity,
      unit_price: variant?.price ?? item.price,
    })

    if (variant) {
      await db
        .from('product_variants')
        .update({ stock: Math.max(0, variant.stock - item.quantity) })
        .eq('id', item.variantId)
    }
  }))

  // Parallel: record payment event + fetch Stripe fee + update discount usage
  await Promise.all([
    db.from('payment_events').insert({
      order_id: order.id,
      type: 'payment_captured',
      amount: pi.amount / 100,
      stripe_id: pi.id,
      note: null,
    }),
    (async () => {
      try {
        if (!pi.latest_charge) return
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
            created_at: new Date(balanceTx.created * 1000).toISOString(),
          })
        }
      } catch (feeErr) {
        console.error('Failed to record Stripe fee:', feeErr)
      }
    })(),
    meta.discountId ? (async () => {
      const { data: disc } = await db.from('discount_codes').select('uses_count').eq('id', meta.discountId).single()
      if (disc) {
        await db.from('discount_codes').update({ uses_count: disc.uses_count + 1 }).eq('id', meta.discountId)
      }
    })() : Promise.resolve(),
  ])

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
