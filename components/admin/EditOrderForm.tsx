'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import type { Order, OrderItem, Product, ProductVariant } from '@/types'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

interface LineItemRow {
  rowId: string
  productId: string
  variantId: string
  quantity: string
  unitPrice: number
}

function getVariantLabel(v: ProductVariant): string {
  return [v.color, v.size].filter(Boolean).join(' / ')
}

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple'
const labelCls = 'block text-sm font-bold text-navy mb-1'

interface Props {
  order: Order & { order_items: OrderItem[] }
}

export default function EditOrderForm({ order }: Props) {
  const router = useRouter()

  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const addr = order.shipping_address ?? {}

  const [customerName, setCustomerName] = useState(order.customer_name)
  const [email, setEmail] = useState(order.email ?? '')
  const [fulfillmentType, setFulfillmentType] = useState<'shipping' | 'pickup'>(order.fulfillment_type)
  const [line1, setLine1] = useState(addr.line1 ?? '')
  const [line2, setLine2] = useState(addr.line2 ?? '')
  const [city, setCity] = useState(addr.city ?? '')
  const [state, setState] = useState(addr.state ?? '')
  const [postalCode, setPostalCode] = useState(addr.postal_code ?? '')
  const [country, setCountry] = useState(addr.country ?? '')
  const [pickupLocation, setPickupLocation] = useState(order.pickup_location ?? '')
  const [lineItems, setLineItems] = useState<LineItemRow[]>(
    order.order_items.map((item) => ({
      rowId: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: String(item.quantity),
      unitPrice: item.unit_price,
    }))
  )
  const [shippingCost, setShippingCost] = useState(String(order.shipping_cost ?? 0))
  const [discountAmount, setDiscountAmount] = useState(String(order.discount_amount ?? 0))
  const [discountCode, setDiscountCode] = useState(order.discount_code ?? '')
  const [status, setStatus] = useState(order.status)
  const [totalInput, setTotalInput] = useState(String(order.total ?? 0))
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => setProducts(data ?? []))
      .finally(() => setLoadingProducts(false))
  }, [])

  const subtotal = lineItems.reduce((sum, row) => sum + row.unitPrice * (parseInt(row.quantity) || 0), 0)
  const shippingNum = parseFloat(shippingCost) || 0
  const discountNum = parseFloat(discountAmount) || 0
  const computedTotal = Math.max(0, subtotal + shippingNum - discountNum)

  useEffect(() => {
    if (!totalManuallyEdited) setTotalInput(computedTotal.toFixed(2))
  }, [computedTotal, totalManuallyEdited])

  const total = parseFloat(totalInput) || 0

  function addRow() {
    setLineItems((rows) => [...rows, { rowId: crypto.randomUUID(), productId: '', variantId: '', quantity: '1', unitPrice: 0 }])
  }

  function removeRow(rowId: string) {
    setLineItems((rows) => rows.filter((r) => r.rowId !== rowId))
  }

  function updateRow(rowId: string, patch: Partial<LineItemRow>) {
    setLineItems((rows) => rows.map((r) => r.rowId === rowId ? { ...r, ...patch } : r))
  }

  function handleProductChange(rowId: string, productId: string) {
    const product = products.find((p) => p.id === productId)
    const variants = product?.product_variants ?? []
    const autoVariant = variants.length === 1 ? variants[0] : null
    updateRow(rowId, {
      productId,
      variantId: autoVariant?.id ?? '',
      unitPrice: autoVariant?.price ?? 0,
    })
  }

  function handleVariantChange(rowId: string, variantId: string, productId: string) {
    const product = products.find((p) => p.id === productId)
    const variant = product?.product_variants.find((v) => v.id === variantId)
    updateRow(rowId, { variantId, unitPrice: variant?.price ?? 0 })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!customerName.trim()) { setError('Customer name is required'); return }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return }
    const validItems = lineItems.filter((r) => r.productId && r.variantId && parseInt(r.quantity) >= 1)
    if (!validItems.length) { setError('Please add at least one item with a product and variant selected'); return }
    if (fulfillmentType === 'shipping' && (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim())) {
      setError('Please fill in all required shipping address fields'); return
    }
    if (fulfillmentType === 'pickup' && !pickupLocation.trim()) {
      setError('Please enter a pickup location'); return
    }

    setSubmitting(true)

    const shipping_address = fulfillmentType === 'shipping'
      ? { line1: line1.trim(), line2: line2.trim() || undefined, city: city.trim(), state: state.trim(), postal_code: postalCode.trim(), country: country.trim() }
      : { line1: '', city: '', state: '', postal_code: '', country: '' }

    const line_items = validItems.map((row) => {
      const product = products.find((p) => p.id === row.productId)
      const variant = product?.product_variants.find((v) => v.id === row.variantId)
      return {
        product_id: row.productId,
        variant_id: row.variantId,
        product_name: product?.name ?? '',
        variant_label: variant ? (getVariantLabel(variant) || null) : null,
        quantity: parseInt(row.quantity),
        unit_price: row.unitPrice,
      }
    })

    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: customerName.trim(),
        email: email.trim(),
        fulfillment_type: fulfillmentType,
        shipping_address,
        pickup_location: fulfillmentType === 'pickup' ? pickupLocation.trim() : null,
        status,
        subtotal,
        shipping_cost: shippingNum,
        discount_amount: discountNum,
        total,
        discount_code: discountCode.trim() || null,
        line_items,
      }),
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Failed to save order'); setSubmitting(false); return }
    router.push(`/admin/orders/${order.id}`)
  }

  const pillBase = 'px-4 py-2 rounded-full text-sm font-bold transition-colors'
  const pillActive = 'bg-purple text-white'
  const pillInactive = 'bg-gray-100 text-navy/60 hover:bg-gray-200'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Customer */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-navy">Customer</h2>
        <div>
          <label className={labelCls}>Name</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} placeholder="Full name" />
        </div>
        <div>
          <label className={labelCls}>Email <span className="font-normal text-navy/40">(optional)</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="customer@example.com" />
        </div>
      </div>

      {/* Fulfillment */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-navy">Fulfillment</h2>
        <div className="flex gap-2">
          <button type="button" className={`${pillBase} ${fulfillmentType === 'shipping' ? pillActive : pillInactive}`} onClick={() => setFulfillmentType('shipping')}>Shipping</button>
          <button type="button" className={`${pillBase} ${fulfillmentType === 'pickup' ? pillActive : pillInactive}`} onClick={() => setFulfillmentType('pickup')}>Pickup</button>
        </div>

        {fulfillmentType === 'shipping' ? (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Address Line 1</label>
              <input value={line1} onChange={(e) => setLine1(e.target.value)} className={inputCls} placeholder="Street address" />
            </div>
            <div>
              <label className={labelCls}>Address Line 2 <span className="font-normal text-navy/40">(optional)</span></label>
              <input value={line2} onChange={(e) => setLine2(e.target.value)} className={inputCls} placeholder="Apt, suite, unit…" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>State / Region</label>
                <input value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Postal Code</label>
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="e.g. AU" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className={labelCls}>Pickup Location</label>
            <input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className={inputCls} placeholder="e.g. School front office" />
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-navy">Items</h2>
          <button type="button" onClick={addRow} className="flex items-center gap-1 text-sm text-purple font-bold hover:text-pink transition-colors">
            <Plus size={16} /> Add Item
          </button>
        </div>

        {loadingProducts ? (
          <div className="flex items-center gap-2 text-navy/50 text-sm py-4">
            <Loader2 size={16} className="animate-spin" /> Loading products…
          </div>
        ) : (
          <div className="space-y-3">
            {lineItems.map((row) => {
              const product = products.find((p) => p.id === row.productId)
              const variants = product?.product_variants ?? []
              const lineTotal = row.unitPrice * (parseInt(row.quantity) || 0)
              return (
                <div key={row.rowId} className="grid grid-cols-12 gap-2 items-end border border-gray-100 rounded-xl p-3">
                  <div className="col-span-4">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Product</label>
                    <select
                      value={row.productId}
                      onChange={(e) => handleProductChange(row.rowId, e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple"
                    >
                      <option value="">Select…</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Variant</label>
                    <select
                      value={row.variantId}
                      onChange={(e) => handleVariantChange(row.rowId, e.target.value, row.productId)}
                      disabled={!row.productId}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple disabled:opacity-40"
                    >
                      <option value="">Select…</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>{getVariantLabel(v) || `$${v.price.toFixed(2)}`}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Qty</label>
                    <input
                      type="number" min="1"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.rowId, { quantity: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Total</label>
                    <p className="text-sm font-bold text-navy px-3 py-2">${lineTotal.toFixed(2)}</p>
                  </div>
                  <div className="col-span-1 flex justify-end pb-1">
                    <button type="button" onClick={() => removeRow(row.rowId)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Financials */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-black text-navy mb-1">Financials</h2>
        <div className="flex justify-between text-sm text-navy/70">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-navy/70 whitespace-nowrap">Shipping ($)</label>
          <input type="number" step="0.01" min="0" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="w-32 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-purple text-right" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm text-navy/70 whitespace-nowrap">Discount ($)</label>
          <input type="number" step="0.01" min="0" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="w-32 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-purple text-right" />
        </div>
        <div>
          <label className="block text-xs font-bold text-navy/60 mb-1">Discount Code <span className="font-normal">(optional)</span></label>
          <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple font-mono" placeholder="e.g. SAVE10" />
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-4">
          <div>
            <span className="font-black text-navy">Total</span>
            {totalManuallyEdited && (
              <button type="button" onClick={() => setTotalManuallyEdited(false)} className="ml-2 text-xs text-purple hover:text-pink transition-colors">
                reset to calculated
              </button>
            )}
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            value={totalInput}
            onChange={(e) => { setTotalInput(e.target.value); setTotalManuallyEdited(true) }}
            className="w-32 border-2 border-gray-200 rounded-xl px-3 py-1.5 text-right font-black text-pink text-lg focus:outline-none focus:border-purple"
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-black text-navy mb-4">Status</h2>
        <label className={labelCls}>Order Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputCls}>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
