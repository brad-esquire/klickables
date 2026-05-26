'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { trackPurchase, type GAItem } from '@/lib/analytics'

interface PendingPurchase {
  value: number
  shipping: number
  discount: number
  coupon: string
  items: Array<GAItem & { price: number; quantity: number }>
}

export default function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart)
  const searchParams = useSearchParams()
  // Stripe appends payment_intent on redirect; use it as transaction_id so GA
  // dedupes any double-fires (e.g. customer refreshes the success page).
  const paymentIntent = searchParams.get('payment_intent') ?? ''

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('klickables.pendingPurchase')
      if (raw && paymentIntent) {
        const p = JSON.parse(raw) as PendingPurchase
        trackPurchase({
          transactionId: paymentIntent,
          value: p.value,
          shipping: p.shipping,
          discount: p.discount,
          coupon: p.coupon || undefined,
          items: p.items,
        })
        sessionStorage.removeItem('klickables.pendingPurchase')
      }
    } catch {}
    clearCart()
  }, [clearCart, paymentIntent])

  return null
}
