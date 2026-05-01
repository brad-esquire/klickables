'use client'

import { useState } from 'react'
import { Truck, X } from 'lucide-react'
import Button from '@/components/ui/Button'

type Carrier = 'USPS' | 'UPS' | 'FedEx'
const CARRIERS: Carrier[] = ['USPS', 'UPS', 'FedEx']

export default function ShipButton({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false)
  const [carrier, setCarrier] = useState<Carrier>('USPS')
  const [tracking, setTracking] = useState('')
  const [postage, setPostage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setTracking('')
    setPostage('')
    setError('')
    setCarrier('USPS')
    setOpen(true)
  }

  async function handleSubmit() {
    if (!tracking.trim()) {
      setError('Tracking number is required.')
      return
    }
    const postageCost = postage ? parseFloat(postage) : null
    if (postage && (isNaN(postageCost!) || postageCost! <= 0)) {
      setError('Enter a valid postage amount.')
      return
    }
    setLoading(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shipped', trackingNumber: tracking.trim(), shippingCarrier: carrier, postageCost }),
    })
    window.location.reload()
  }

  return (
    <>
      <Button onClick={handleOpen} size="sm">
        <Truck size={14} className="mr-1.5" />Mark as Shipped
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">Mark as Shipped</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-navy mb-2">Carrier</label>
                <div className="flex gap-2">
                  {CARRIERS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCarrier(c)}
                      className={`flex-1 py-2 rounded-xl border-2 text-sm font-bold transition-colors cursor-pointer ${
                        carrier === c
                          ? 'border-purple bg-purple/10 text-purple'
                          : 'border-gray-200 text-navy/60 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-navy mb-2">Tracking Number</label>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => { setTracking(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="e.g. 9400111899223397210292"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple font-mono text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-navy mb-2">
                  Actual Postage Cost <span className="text-navy/40 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40 text-sm font-bold">$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={postage}
                    onChange={(e) => { setPostage(e.target.value); setError('') }}
                    placeholder="0.00"
                    className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-purple text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading} size="sm" className="flex-1">
                <Truck size={14} className="mr-1.5" />
                {loading ? 'Marking...' : 'Mark as Shipped'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
