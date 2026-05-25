'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Pencil, X, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { MoneyAccount, PaymentEvent } from '@/types'

type Carrier = 'USPS' | 'UPS' | 'FedEx'
const CARRIERS: Carrier[] = ['USPS', 'UPS', 'FedEx']

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm'
const labelCls = 'block text-sm font-bold text-navy mb-1.5'

interface Props {
  orderId: string
  // When provided, the button shows in edit mode for an existing postage_cost event.
  // When omitted, it shows the "Add postage cost" CTA.
  event?: PaymentEvent
  // Default carrier when creating a new entry; ignored when editing.
  defaultCarrier?: string | null
}

export default function PostageEntryButton({ orderId, event, defaultCarrier }: Props) {
  const router = useRouter()
  const isEdit = !!event

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(event ? event.amount.toFixed(2) : '')
  const [carrier, setCarrier] = useState<Carrier>(((event?.note ?? defaultCarrier) as Carrier) ?? 'USPS')
  const [paidFrom, setPaidFrom] = useState(event?.paid_from_account_id ?? '')
  const [accounts, setAccounts] = useState<MoneyAccount[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    fetch('/api/admin/money/accounts')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAccounts((data ?? []).filter((a: MoneyAccount) => !a.archived)))
      .catch(() => setAccounts([]))
  }, [open])

  function handleOpen() {
    setAmount(event ? event.amount.toFixed(2) : '')
    setCarrier(((event?.note ?? defaultCarrier) as Carrier) ?? 'USPS')
    setPaidFrom(event?.paid_from_account_id ?? '')
    setError('')
    setOpen(true)
  }

  async function handleSave() {
    const cost = parseFloat(amount)
    if (isNaN(cost) || cost <= 0) { setError('Enter a valid amount.'); return }
    setSaving(true)
    const res = isEdit
      ? await fetch(`/api/admin/orders/${orderId}/payment-events/${event!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cost, note: carrier, paid_from_account_id: paidFrom || null }),
        })
      : await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_postage',
            postageCost: cost,
            shippingCarrier: carrier,
            paidFromAccountId: paidFrom || null,
          }),
        })
    setSaving(false)
    if (res.ok) { setOpen(false); router.refresh(); return }
    const detail = await res.json().catch(() => ({} as Record<string, unknown>))
    setError(typeof detail.error === 'string' ? detail.error : `Failed to save (${res.status}).`)
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Delete this postage entry?')) return
    setDeleting(true)
    const res = await fetch(`/api/admin/orders/${orderId}/payment-events/${event!.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setOpen(false); router.refresh(); return }
    const detail = await res.json().catch(() => ({} as Record<string, unknown>))
    setError(typeof detail.error === 'string' ? detail.error : `Failed to delete (${res.status}).`)
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={handleOpen}
          className="p-1.5 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-gray-100"
          title="Edit postage"
        >
          <Pencil size={14} />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 text-xs font-bold text-navy/50 hover:text-purple transition-colors cursor-pointer"
        >
          <Package size={13} />
          Add postage cost
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">{isEdit ? 'Edit postage' : 'Add postage cost'}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Carrier</label>
                  <select value={carrier} onChange={(e) => setCarrier(e.target.value as Carrier)} className={inputCls}>
                    {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Amount ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="0.00"
                    autoFocus={!isEdit}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Paid from <span className="font-normal text-navy/40">(which account covered the postage)</span></label>
                <select value={paidFrom} onChange={(e) => setPaidFrom(e.target.value)} className={inputCls}>
                  <option value="">— Unassigned —</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}{a.holder ? ` — ${a.holder}` : ''}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              {isEdit && (
                <button
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="flex items-center gap-1 text-sm font-bold text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50 px-3"
                  title="Delete"
                >
                  <Trash2 size={14} />
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting} size="sm" className="flex-1">
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
