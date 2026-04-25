'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function AddDiscountForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [maxUses, setMaxUses] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        min_order: parseFloat(minOrder),
        max_uses: maxUses ? parseInt(maxUses) : null,
      }),
    })
    if (res.ok) {
      setCode(''); setValue(''); setMinOrder('0'); setMaxUses('')
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to create code')
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      <div>
        <label className="block text-sm font-bold text-navy mb-1">Code</label>
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder="e.g. WELCOME10"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-mono uppercase focus:outline-none focus:border-purple" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-navy mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-navy mb-1">Value</label>
          <input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} required
            placeholder={type === 'percentage' ? '10' : '5.00'}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-navy mb-1">Min Order ($)</label>
          <input type="number" step="0.01" min="0" value={minOrder} onChange={(e) => setMinOrder(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple" />
        </div>
        <div>
          <label className="block text-sm font-bold text-navy mb-1">Max Uses (blank = unlimited)</label>
          <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="∞"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple" />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Creating...' : 'Create Code'}
      </Button>
    </form>
  )
}
