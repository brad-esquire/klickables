'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface RefundPanelProps {
  orderId: string
  maxAmount: number
  alreadyRefunded: number
}

export default function RefundPanel({ orderId, maxAmount, alreadyRefunded }: RefundPanelProps) {
  const router = useRouter()
  const remaining = maxAmount - alreadyRefunded
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (remaining <= 0) return null

  async function handleRefund() {
    setError('')
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0 || parsed > remaining) {
      setError(`Amount must be between $0.01 and $${remaining.toFixed(2)}`)
      return
    }
    setLoading(true)
    const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parsed, note }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Refund failed'); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-navy">Refund</h2>
          {alreadyRefunded > 0 && (
            <p className="text-sm text-navy/50">${alreadyRefunded.toFixed(2)} already refunded · ${remaining.toFixed(2)} remaining</p>
          )}
        </div>
        {!open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Issue Refund
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-navy/60 uppercase tracking-wide block mb-1">
              Amount (max ${remaining.toFixed(2)})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-purple"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-navy/60 uppercase tracking-wide block mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Customer requested refund"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleRefund} disabled={loading} size="sm">
              {loading ? 'Processing…' : 'Confirm Refund'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setError('') }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
