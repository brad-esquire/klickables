'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  orderId: string
  customerName: string
  isStripePayment: boolean
}

export default function DeleteOrderButton({ orderId, customerName, isStripePayment }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const stripeWarning = isStripePayment
      ? '\n\nThis order was paid via Stripe — deleting it removes the record but does NOT refund the customer. Issue a refund first if needed.'
      : ''
    if (!confirm(`Delete order from ${customerName}?${stripeWarning}\n\nThis removes the order, items, payment events, and any ledger entries. This cannot be undone.`)) return
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
    if (!res.ok) {
      const detail = await res.json().catch(() => ({} as Record<string, unknown>))
      alert(typeof detail.error === 'string' ? detail.error : `Failed to delete (${res.status}).`)
      setLoading(false)
      return
    }
    router.push('/admin/orders')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50"
    >
      <Trash2 size={14} />
      {loading ? 'Deleting…' : 'Delete order'}
    </button>
  )
}
