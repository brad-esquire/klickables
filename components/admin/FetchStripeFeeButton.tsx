'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'

export default function FetchStripeFeeButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleFetch() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch_stripe_fee' }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      window.location.reload()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to fetch fee')
    }
  }

  if (done) return null

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleFetch}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-bold text-navy/50 hover:text-purple transition-colors cursor-pointer disabled:opacity-50"
      >
        <CreditCard size={13} />
        {loading ? 'Fetching…' : 'Fetch Stripe fee'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
