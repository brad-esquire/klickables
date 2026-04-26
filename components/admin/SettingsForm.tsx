'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter()

  // ── Shipping ──────────────────────────────────────────────────────────────
  const [threshold, setThreshold] = useState(settings.shipping_threshold ?? '50')
  const [cost, setCost] = useState(settings.shipping_cost ?? '8.00')
  const [savingShipping, setSavingShipping] = useState(false)
  const [savedShipping, setSavedShipping] = useState(false)

  async function handleSaveShipping(e: React.FormEvent) {
    e.preventDefault()
    setSavingShipping(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_threshold: threshold, shipping_cost: cost }),
    })
    setSavingShipping(false)
    setSavedShipping(true)
    setTimeout(() => setSavedShipping(false), 2000)
    router.refresh()
  }

  // ── Pickup locations ──────────────────────────────────────────────────────
  const [locations, setLocations] = useState<string[]>(() => {
    try { return JSON.parse(settings.pickup_locations ?? '[]') } catch { return [] }
  })
  const [savingLocations, setSavingLocations] = useState(false)
  const [savedLocations, setSavedLocations] = useState(false)
  const dragIndex = { current: -1 }
  const overIndex  = { current: -1 }

  function addLocation() {
    setLocations((l) => [...l, ''])
  }

  function updateLocation(i: number, val: string) {
    setLocations((l) => l.map((x, idx) => idx === i ? val : x))
  }

  function removeLocation(i: number) {
    setLocations((l) => l.filter((_, idx) => idx !== i))
  }

  function handleDragStart(i: number) { dragIndex.current = i }
  function handleDragEnter(i: number) { overIndex.current = i }
  function handleDrop(dropIdx: number) {
    const from = dragIndex.current
    if (from === dropIdx || from < 0) return
    const reordered = [...locations]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(dropIdx, 0, moved)
    setLocations(reordered)
    dragIndex.current = -1
    overIndex.current = -1
  }

  async function handleSaveLocations(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = locations.map((l) => l.trim()).filter(Boolean)
    setSavingLocations(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup_locations: JSON.stringify(trimmed) }),
    })
    setLocations(trimmed)
    setSavingLocations(false)
    setSavedLocations(true)
    setTimeout(() => setSavedLocations(false), 2000)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Shipping */}
      <form onSubmit={handleSaveShipping} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="font-black text-navy">Shipping</h2>

        <div>
          <label className="block text-sm font-bold text-navy mb-1">Free Shipping Threshold ($)</label>
          <input
            type="number" step="0.01" min="0" value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
          />
          <p className="text-xs text-navy/50 mt-1">Orders above this amount get free shipping.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-navy mb-1">Flat Shipping Rate ($)</label>
          <input
            type="number" step="0.01" min="0" value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
          />
          <p className="text-xs text-navy/50 mt-1">Applied when order total is below the free shipping threshold.</p>
        </div>

        <Button type="submit" disabled={savingShipping} className="w-full">
          {savedShipping ? '✓ Saved!' : savingShipping ? 'Saving...' : 'Save Shipping Settings'}
        </Button>
      </form>

      {/* Pickup locations */}
      <form onSubmit={handleSaveLocations} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-navy">Pickup Locations</h2>
          <button
            type="button"
            onClick={addLocation}
            className="flex items-center gap-1 text-sm text-purple font-bold hover:text-pink transition-colors"
          >
            <Plus size={16} /> Add Location
          </button>
        </div>

        <p className="text-xs text-navy/50">These appear as options when a customer chooses pickup at checkout. Drag to reorder.</p>

        {locations.length === 0 && (
          <p className="text-sm text-navy/40 text-center py-4">No pickup locations yet. Add one above.</p>
        )}

        <div className="space-y-2">
          {locations.map((loc, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              className="flex items-center gap-2 group"
            >
              <span className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} />
              </span>
              <input
                type="text"
                value={loc}
                onChange={(e) => updateLocation(i, e.target.value)}
                placeholder="e.g. LRMS Fairmont"
                className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple"
              />
              <button
                type="button"
                onClick={() => removeLocation(i)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={savingLocations} className="w-full">
          {savedLocations ? '✓ Saved!' : savingLocations ? 'Saving...' : 'Save Pickup Locations'}
        </Button>
      </form>
    </div>
  )
}
