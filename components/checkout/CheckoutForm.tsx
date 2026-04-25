'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCartStore, useCartHydrated } from '@/store/cartStore'
import Button from '@/components/ui/Button'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function PaymentForm({ clientSecret, orderData }: { clientSecret: string; orderData: object }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError('')

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setPaying(false)
    } else {
      clearCart()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" size="lg" disabled={!stripe || paying} className="w-full">
        {paying ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  )
}

export default function CheckoutForm() {
  const { items } = useCartStore()
  const hydrated = useCartHydrated()
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const searchParams = useSearchParams()
  const discountCode = searchParams.get('discount') ?? ''

  const [form, setForm] = useState({ name: '', email: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US' })
  const [step, setStep] = useState<'details' | 'payment'>('details')
  const [clientSecret, setClientSecret] = useState('')
  const [shipping, setShipping] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/shipping-cost?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((d) => setShipping(d.cost))
  }, [subtotal])

  async function proceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, shippingAddress: form, discountCode, customerName: form.name, email: form.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not create payment')
      setClientSecret(data.clientSecret)
      setDiscount(data.discountAmount ?? 0)
      setShipping(data.shippingCost ?? 0)
      setStep('payment')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!hydrated) return null

  if (itemCount === 0) {
    return <p className="text-navy/60">Your cart is empty. <a href="/shop" className="text-purple underline">Go shopping!</a></p>
  }

  const total = subtotal - discount + shipping

  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Order summary */}
      <div className="order-2 md:order-1">
        <h2 className="font-black text-navy text-lg mb-4">Order Summary</h2>
        <div className="space-y-2 bg-cream rounded-2xl p-5 text-sm">
          {items.map((item) => (
            <div key={item.variantId} className="flex justify-between">
              <span className="text-navy">{item.productName} {item.variantLabel ? `(${item.variantLabel})` : ''} × {item.quantity}</span>
              <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between"><span className="text-navy/70">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-navy/70">Shipping</span><span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-black text-base border-t pt-1"><span>Total</span><span className="text-pink">${total.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="order-1 md:order-2">
        {step === 'details' ? (
          <form onSubmit={proceedToPayment} className="space-y-4">
            <h2 className="font-black text-navy text-lg mb-2">Your Details</h2>
            <Input label="Full Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
            <h2 className="font-black text-navy text-lg mt-4 mb-2">Shipping Address</h2>
            <Input label="Address line 1" value={form.line1} onChange={(v) => setForm((f) => ({ ...f, line1: v }))} required />
            <Input label="Address line 2 (optional)" value={form.line2} onChange={(v) => setForm((f) => ({ ...f, line2: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City / Suburb" value={form.city} onChange={(v) => setForm((f) => ({ ...f, city: v }))} required />
              <Input label="State" value={form.state} onChange={(v) => setForm((f) => ({ ...f, state: v }))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Postcode" value={form.postal_code} onChange={(v) => setForm((f) => ({ ...f, postal_code: v }))} required />
              <Input label="Country" value={form.country} onChange={(v) => setForm((f) => ({ ...f, country: v }))} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="w-full">
              {loading ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </form>
        ) : clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentForm clientSecret={clientSecret} orderData={{}} />
          </Elements>
        ) : null}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-navy mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple transition-colors"
      />
    </div>
  )
}
