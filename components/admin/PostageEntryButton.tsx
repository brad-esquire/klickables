'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Pencil, Trash2 } from 'lucide-react'
import type { MoneyAccount, PaymentEvent } from '@/types'

type Carrier = 'USPS' | 'UPS' | 'FedEx'
const CARRIERS: Carrier[] = ['USPS', 'UPS', 'FedEx']

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
    if (res.ok) { setOpen(false); router.refresh() }
    else { setError('Failed to save.') }
  }

  async function handleDelete() {
    if (!isEdit) return
    if (!confirm('Delete this postage entry?')) return
    setDeleting(true)
    const res = await fetch(`/api/admin/orders/${orderId}/payment-events/${event!.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { setOpen(false); router.refresh() }
    else { setError('Failed to delete.') }
  }

  if (!open) {
    if (isEdit) {
      return (
        <button
          onClick={() => setOpen(true)}
          className="p-1 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded hover:bg-gray-100"
          title="Edit postage"
        >
          <Pencil size={12} />
        </button>
      )
    }
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
    <div className="flex items-center gap-2 flex-wrap bg-gray-50 rounded-lg p-2 -m-2">
      <select
        value={carrier}
        onChange={(e) => setCarrier(e.target.value as Carrier)}
        className="border-2 border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple text-navy bg-white"
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
          className="border-2 border-gray-200 rounded-lg pl-6 pr-3 py-1 text-xs w-24 focus:outline-none focus:border-purple bg-white"
        />
      </div>
      <select
        value={paidFrom}
        onChange={(e) => setPaidFrom(e.target.value)}
        className="border-2 border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple text-navy bg-white max-w-[180px]"
      >
        <option value="">Paid from… (Stripe)</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>{a.name}{a.holder ? ` — ${a.holder}` : ''}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={saving || deleting}
        className="text-xs font-bold text-white bg-navy hover:bg-navy/85 px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {isEdit && (
        <button
          onClick={handleDelete}
          disabled={saving || deleting}
          className="text-xs text-red-500 hover:text-red-700 cursor-pointer disabled:opacity-50 flex items-center gap-1"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      )}
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
