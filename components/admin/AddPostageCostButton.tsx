'use client'

import { useState } from 'react'
import { Package } from 'lucide-react'

type Carrier = 'USPS' | 'UPS' | 'FedEx'
const CARRIERS: Carrier[] = ['USPS', 'UPS', 'FedEx']

export default function AddPostageCostButton({ orderId, carrier }: { orderId: string; carrier: string | null }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>((carrier as Carrier) ?? 'USPS')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    const cost = parseFloat(amount)
    if (isNaN(cost) || cost <= 0) { setError('Enter a valid amount.'); return }
    setSaving(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_postage', postageCost: cost, shippingCarrier: selectedCarrier }),
    })
    setSaving(false)
    if (res.ok) { window.location.reload() }
    else { setError('Failed to save.') }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-bold text-navy/50 hover:text-purple transition-colors cursor-pointer"
      >
        <Package size={13} />
        Add postage cost
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selectedCarrier}
        onChange={(e) => setSelectedCarrier(e.target.value as Carrier)}
        className="border-2 border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple text-navy"
      >
        {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-navy/40 text-xs font-bold">$</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="0.00"
          autoFocus
          className="border-2 border-gray-200 rounded-lg pl-6 pr-3 py-1 text-xs w-24 focus:outline-none focus:border-purple"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-xs font-bold text-white bg-navy hover:bg-navy/85 px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        onClick={() => { setOpen(false); setError('') }}
        className="text-xs text-navy/40 hover:text-navy cursor-pointer"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
