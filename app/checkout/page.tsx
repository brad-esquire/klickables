import { Metadata } from 'next'
import { Suspense } from 'react'
import CheckoutForm from '@/components/checkout/CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout — Klickables',
}

export default function CheckoutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy mb-8">Checkout</h1>
      <Suspense fallback={<div className="text-navy/50">Loading checkout...</div>}>
        <CheckoutForm />
      </Suspense>
    </div>
  )
}
