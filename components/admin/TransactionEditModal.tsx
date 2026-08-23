'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Pencil } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { MoneyTransaction } from '@/types'

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm'
const labelCls = 'block text-sm font-bold text-navy mb-1.5'

interface Props {
  transaction: MoneyTransaction
}

export default function TransactionEditModal({ transaction }: Props) {
  const router = useRouter()
  // Auto-derived rows (order fees, sales, linked expenses) are re-derived on every
  // sync unless they carry manual_override — which saving here sets.
  const isAuto = !transaction.manual_override

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(Number(transaction.amount).toFixed(2))
  const [date, setDate] = useState(transaction.occurred_at)
  const [description, setDescription] = useState(transaction.description ?? '')
  const [notes, setNotes] = useState(transaction.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setAmount(Number(transaction.amount).toFixed(2))
    setDate(transaction.occurred_at)
    setDescription(transaction.description ?? '')
    setNotes(transaction.notes ?? '')
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    if (!date) { setError('Date is required.'); return }

    setSaving(true)
    const res = await fetch(`/api/admin/money/transactions/${transaction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amt,
        occurred_at: date,
        description: description.trim() || null,
        notes: notes.trim() || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Failed to save.' }))
      setError(msg || 'Failed to save.')
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Edit transaction"
        className="p-1.5 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
      >
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">Edit transaction</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {isAuto && (
              <p className="text-xs text-navy/60 bg-purple/5 border border-purple/15 rounded-xl px-3 py-2.5 mb-4">
                This row was calculated automatically. Saving pins your value so future
                syncs won&apos;t overwrite it.
              </p>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError('') }}
                    placeholder="0.00"
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError('') }} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Venmo fee"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes <span className="font-normal text-navy/40">(optional)</span></label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 4 separate Venmo transactions"
                  className={inputCls}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} size="sm" className="flex-1">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
