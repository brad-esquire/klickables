'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface RefundPanelProps {
  orderId: string
  maxAmount: number
  alreadyRefunded: number
  /** Payment belongs to the previous Stripe account — refundable only in that dashboard. */
  legacyAccount?: boolean
  paymentIntentId?: string | null
}

export default function RefundPanel({ orderId, maxAmount, alreadyRefunded, legacyAccount, paymentIntentId }: RefundPanelProps) {
  const router = useRouter()
  const remaining = maxAmount - alreadyRefunded
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (remaining <= 0) return null

  // Refunds go through the account the current Stripe key belongs to, so a charge
  // taken on the previous account can only be refunded there. Offer the payment
  // id to look up rather than a button that is guaranteed to fail.
  if (legacyAccount) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <div>
              <h2 className="font-black text-navy">Refund — manual only</h2>
              {alreadyRefunded > 0 && (
                <p className="text-sm text-navy/50">${alreadyRefunded.toFixed(2)} already refunded · ${remaining.toFixed(2)} remaining</p>
              )}
            </div>
            <p className="text-sm text-navy/70 leading-relaxed">
              This payment was processed on the previous Stripe account, so it can&rsquo;t be refunded from here.
              Issue the refund in that account&rsquo;s Stripe dashboard, then record it on this order manually.
            </p>
            {paymentIntentId && (
              <p className="text-xs text-navy/50">
                Payment: <span className="font-mono text-navy/70">{paymentIntentId}</span>
              </p>
            )}
            <a
              href={`https://dashboard.stripe.com/payments/${paymentIntentId ?? ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-purple font-bold text-xs hover:text-pink transition-colors"
            >
              Open in Stripe dashboard &rarr;
            </a>
          </div>
        </div>
      </div>
    )
  }

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
