'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore, useCartHydrated } from '@/store/cartStore'
import Button from '@/components/ui/Button'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'

export default function CartPage() {
  const { items, removeItem, updateQty } = useCartStore()
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const hydrated = useCartHydrated()
  const [discountCode, setDiscountCode] = useState('')
  const [discount, setDiscount] = useState<{ code: string; amount: number; label: string } | null>(null)
  const [discountError, setDiscountError] = useState('')
  const [checkingCode, setCheckingCode] = useState(false)
  const [shipping, setShipping] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/shipping-cost?subtotal=${subtotal}`)
      .then((r) => r.json())
      .then((d) => setShipping(d.cost))
      .catch(() => setShipping(null))
  }, [subtotal])

  async function applyDiscount() {
    if (!discountCode.trim()) return
    setCheckingCode(true)
    setDiscountError('')
    try {
      const res = await fetch(`/api/validate-discount?code=${discountCode}&subtotal=${subtotal}`)
      const data = await res.json()
      if (data.error) {
        setDiscountError(data.error)
        setDiscount(null)
      } else {
        setDiscount({ code: discountCode.toUpperCase(), amount: data.amount, label: data.label })
      }
    } finally {
      setCheckingCode(false)
    }
  }

  const discountedSubtotal = subtotal - (discount?.amount ?? 0)
  const total = discountedSubtotal + (shipping ?? 0)

  if (!hydrated) return null

  if (itemCount === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-3xl font-black text-navy mb-3">Your cart is empty</h1>
        <p className="text-navy/60 mb-8">Add some clickers and come back!</p>
        <Link href="/shop">
          <Button size="lg">Browse the Shop</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-navy mb-8">Your Cart</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🖱️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy">{item.productName}</p>
                {item.variantLabel && <p className="text-sm text-navy/60">{item.variantLabel}</p>}
                <p className="font-bold text-pink">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                  <button onClick={() => updateQty(item.variantId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-navy font-bold hover:bg-gray-50">−</button>
                  <span className="w-6 text-center text-sm font-bold text-navy">{item.quantity}</span>
                  <button onClick={() => updateQty(item.variantId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-navy font-bold hover:bg-gray-50">+</button>
                </div>
                <p className="font-bold text-navy text-sm">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h2 className="font-black text-navy text-lg mb-5">Order Summary</h2>

          {/* Discount code */}
          <div className="mb-5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Discount code"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple"
              />
              <Button size="sm" variant="secondary" onClick={applyDiscount} disabled={checkingCode}>
                Apply
              </Button>
            </div>
            {discountError && <p className="text-red-500 text-xs mt-1 pl-2">{discountError}</p>}
            {discount && <p className="text-green-600 text-xs mt-1 pl-2">✓ {discount.label} applied</p>}
          </div>

          <div className="space-y-2 text-sm mb-5">
            <div className="flex justify-between">
              <span className="text-navy/70">Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discount.code})</span>
                <span>−${discount.amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-navy/70">Shipping</span>
              <span className="font-semibold">
                {shipping === null ? '...' : shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <span className="font-black text-navy">Total</span>
              <span className="font-black text-pink">${total.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href={`/checkout${discount ? `?discount=${discount.code}` : ''}`}
            className="block"
          >
            <Button size="lg" className="w-full">Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
