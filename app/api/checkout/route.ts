import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { getShippingCost } from '@/lib/shipping'
import type { CartItem, ShippingAddress } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { items, shippingAddress, discountCode, customerName, email, fulfillmentType, pickupLocation } = await req.json() as {
      items: CartItem[]
      shippingAddress: ShippingAddress & { name?: string; line2?: string }
      discountCode?: string
      customerName: string
      email: string
      fulfillmentType: 'shipping' | 'pickup'
      pickupLocation?: string
    }

    if (!items?.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const db = createAdminClient()

    // Validate items and fetch current prices from DB
    const variantIds = items.map((i) => i.variantId)
    const { data: variants } = await db
      .from('product_variants')
      .select('id, price, stock, product_id')
      .in('id', variantIds)

    if (!variants) return NextResponse.json({ error: 'Could not verify items' }, { status: 400 })

    const productIds = [...new Set(variants.map((v) => v.product_id))]
    const { data: products } = await db.from('products').select('id, ignore_stock').in('id', productIds)
    const ignoreStockMap = new Map((products ?? []).map((p) => [p.id, p.ignore_stock]))

    let subtotal = 0
    for (const item of items) {
      const dbVariant = variants.find((v) => v.id === item.variantId)
      if (!dbVariant) return NextResponse.json({ error: `Item not found` }, { status: 400 })
      if (!ignoreStockMap.get(dbVariant.product_id) && dbVariant.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock` }, { status: 400 })
      }
      subtotal += dbVariant.price * item.quantity
    }

    // Validate discount
    let discountAmount = 0
    let discountId: string | null = null
    if (discountCode) {
      const { data: discount } = await db.from('discount_codes').select('*').eq('code', discountCode.toUpperCase()).single()
      if (discount?.active && subtotal >= discount.min_order) {
        discountAmount = discount.type === 'percentage'
          ? Math.round(subtotal * (discount.value / 100) * 100) / 100
          : Math.min(discount.value, subtotal)
        discountId = discount.id
      }
    }

    const shippingCost = fulfillmentType === 'pickup' ? 0 : await getShippingCost(subtotal)
    const total = subtotal - discountAmount + shippingCost

    // Strip cart down to only what the webhook needs (image/variantLabel not used server-side)
    // and chunk across multiple metadata keys — Stripe limits each value to 500 chars
    const compactCart = items.map(({ variantId, productName, price, quantity }) => ({
      variantId, productName, price, quantity,
    }))
    const cartJson = JSON.stringify(compactCart)
    const CHUNK = 490
    const cartChunks: Record<string, string> = {}
    for (let i = 0; i * CHUNK < cartJson.length; i++) {
      cartChunks[`cart${i}`] = cartJson.slice(i * CHUNK, (i + 1) * CHUNK)
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: {
        customerName,
        email,
        discountCode: discountCode ?? '',
        discountId: discountId ?? '',
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        discountAmount: discountAmount.toString(),
        ...cartChunks,
        shippingAddressJson: JSON.stringify(shippingAddress ?? {}),
        fulfillmentType: fulfillmentType ?? 'shipping',
        pickupLocation: pickupLocation ?? '',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      shippingCost,
      discountAmount,
      total,
    })
  } catch (err: unknown) {
    console.error('Checkout error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
