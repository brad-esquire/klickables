'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { MoneyAccount, MoneyTransactionKind } from '@/types'

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm'
const labelCls = 'block text-sm font-bold text-navy mb-1.5'

const MANUAL_KINDS: { value: MoneyTransactionKind; label: string; help: string }[] = [
  { value: 'transfer',      label: 'Transfer',      help: 'Move money between two accounts (e.g. cash hand-off, bank deposit).' },
  { value: 'reimbursement', label: 'Reimbursement', help: 'Pay back a personal account that fronted business expenses.' },
  { value: 'expense',       label: 'Expense',       help: 'Money leaving an account to pay something external.' },
  { value: 'adjustment',    label: 'Adjustment',    help: 'Correction or one-off entry to reconcile a balance.' },
  { value: 'sale',          label: 'Sale',          help: 'Money received that is not tied to an order in the system.' },
]

interface Props {
  accounts: MoneyAccount[]
}

export default function MoneyMovementModal({ accounts }: Props) {
  const router = useRouter()

  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<MoneyTransactionKind>('transfer')
  const [from, setFrom] = useState<string>('')
  const [to,   setTo]   = useState<string>('')
  const [amount, setAmount] = useState('')
  const [date,   setDate]   = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const needsFrom = kind === 'expense' || kind === 'transfer' || kind === 'reimbursement'
  const needsTo   = kind === 'sale'    || kind === 'transfer' || kind === 'reimbursement'

  function handleOpen() {
    setKind('transfer')
    setFrom('')
    setTo('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setDescription('')
    setNotes('')
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return }
    if (needsFrom && !from)     { setError('Choose a "from" account.'); return }
    if (needsTo   && !to)       { setError('Choose a "to" account.'); return }
    if (kind === 'adjustment' && !from && !to) { setError('Adjustment needs either a from or to account.'); return }
    if (from && to && from === to) { setError('From and to accounts must differ.'); return }

    setSaving(true)
    const res = await fetch('/api/admin/money/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        from_account_id: from || null,
        to_account_id:   to   || null,
        amount: amt,
        occurred_at: date,
        description,
        notes,
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

  const help = MANUAL_KINDS.find((k) => k.value === kind)?.help

  return (
    <>
      <Button onClick={handleOpen}>
        <Plus size={16} className="mr-1.5" />Record movement
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">Record movement</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Kind</label>
                <select value={kind} onChange={(e) => setKind(e.target.value as MoneyTransactionKind)} className={inputCls}>
                  {MANUAL_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
                {help && <p className="text-xs text-navy/50 mt-1">{help}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>From{needsFrom && ' *'}</label>
                  <select value={from} onChange={(e) => { setFrom(e.target.value); setError('') }} className={inputCls}>
                    <option value="">—</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>To{needsTo && ' *'}</label>
                  <select value={to} onChange={(e) => { setTo(e.target.value); setError('') }} className={inputCls}>
                    <option value="">—</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
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
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Deposited Kirra's cash to bank"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra context"
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
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
