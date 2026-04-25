import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'
import { getShippingCost } from '@/lib/shipping'
import type { CartItem, ShippingAddress } from '@/types'

export async function POST(req: NextRequest) {
  const { items, shippingAddress, discountCode, customerName, email } = await req.json() as {
    items: CartItem[]
    shippingAddress: ShippingAddress & { name?: string; line2?: string }
    discountCode?: string
    customerName: string
    email: string
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

  let subtotal = 0
  for (const item of items) {
    const dbVariant = variants.find((v) => v.id === item.variantId)
    if (!dbVariant) return NextResponse.json({ error: `Item not found` }, { status: 400 })
    if (dbVariant.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock` }, { status: 400 })
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

  const shippingCost = await getShippingCost(subtotal)
  const total = subtotal - discountAmount + shippingCost

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'usd',
    receipt_email: email,
    metadata: {
      customerName,
      email,
      discountCode: discountCode ?? '',
      discountId: discountId ?? '',
      subtotal: subtotal.toString(),
      shippingCost: shippingCost.toString(),
      discountAmount: discountAmount.toString(),
      cartJson: JSON.stringify(items),
      shippingAddressJson: JSON.stringify(shippingAddress),
    },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    shippingCost,
    discountAmount,
    total,
  })
}
