'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Pencil } from 'lucide-react'
import Button from '@/components/ui/Button'
import { EXPENSE_CATEGORIES } from '@/types'
import type { Expense } from '@/types'

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm'
const labelCls = 'block text-sm font-bold text-navy mb-1.5'

interface Props {
  expense?: Expense
}

export default function ExpenseModal({ expense }: Props) {
  const router = useRouter()
  const isEdit = !!expense

  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState(expense?.description ?? '')
  const [amount, setAmount] = useState(expense?.amount.toFixed(2) ?? '')
  const [category, setCategory] = useState(expense?.category ?? 'Materials')
  const [date, setDate] = useState(expense?.date ?? new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleOpen() {
    setDescription(expense?.description ?? '')
    setAmount(expense?.amount.toFixed(2) ?? '')
    setCategory(expense?.category ?? 'Materials')
    setDate(expense?.date ?? new Date().toISOString().slice(0, 10))
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    const amt = parseFloat(amount)
    if (!description.trim()) { setError('Description is required.'); return }
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    if (!date) { setError('Date is required.'); return }

    setSaving(true)
    const url = isEdit ? `/api/admin/expenses/${expense.id}` : '/api/admin/expenses'
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: description.trim(), amount: amt, category, date }),
    })
    setSaving(false)
    if (!res.ok) { setError('Failed to save. Please try again.'); return }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={handleOpen}
          className="p-1.5 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
        >
          <Pencil size={14} />
        </button>
      ) : (
        <Button onClick={handleOpen}>
          <Plus size={16} className="mr-1.5" />Add Expense
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError('') }}
                  placeholder="e.g. PLA filament spools"
                  className={inputCls}
                  autoFocus
                />
              </div>

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
                  />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} size="sm" className="flex-1">
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
