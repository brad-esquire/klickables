'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter()
  const [threshold, setThreshold] = useState(settings.shipping_threshold ?? '50')
  const [cost, setCost] = useState(settings.shipping_cost ?? '8.00')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_threshold: threshold, shipping_cost: cost }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
      <h2 className="font-black text-navy">Shipping</h2>

      <div>
        <label className="block text-sm font-bold text-navy mb-1">
          Free Shipping Threshold ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
        />
        <p className="text-xs text-navy/50 mt-1">Orders above this amount get free shipping.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-navy mb-1">
          Flat Shipping Rate ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
        />
        <p className="text-xs text-navy/50 mt-1">Applied when order total is below the free shipping threshold.</p>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}
