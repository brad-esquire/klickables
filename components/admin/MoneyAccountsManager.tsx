'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, X, Archive, ArchiveRestore } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { MoneyAccount, MoneyAccountKind } from '@/types'

const inputCls = 'w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple text-sm'
const labelCls = 'block text-sm font-bold text-navy mb-1.5'

interface Props {
  accounts: MoneyAccount[]
}

interface FormState {
  open: boolean
  editing: MoneyAccount | null
  name: string
  kind: MoneyAccountKind
  holder: string
  feeRate: string
  feeFixed: string
}

const blankForm = (): FormState => ({
  open: false,
  editing: null,
  name: '',
  kind: 'external',
  holder: '',
  feeRate: '0',
  feeFixed: '0',
})

export default function MoneyAccountsManager({ accounts }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(blankForm())
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function openCreate() {
    setForm({ ...blankForm(), open: true })
    setError('')
  }

  function openEdit(a: MoneyAccount) {
    setForm({
      open:    true,
      editing: a,
      name:    a.name,
      kind:    a.kind,
      holder:  a.holder ?? '',
      feeRate: String(a.default_fee_rate),
      feeFixed: String(a.default_fee_fixed),
    })
    setError('')
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    if ((form.kind === 'cash' || form.kind === 'external') && !form.holder.trim()) {
      setError('Holder name is required for cash and external accounts.')
      return
    }
    setSaving(true)
    const body = {
      name:              form.name.trim(),
      kind:              form.kind,
      holder:            form.holder.trim() || null,
      default_fee_rate:  parseFloat(form.feeRate)  || 0,
      default_fee_fixed: parseFloat(form.feeFixed) || 0,
    }
    const url = form.editing ? `/api/admin/money/accounts/${form.editing.id}` : '/api/admin/money/accounts'
    const res = await fetch(url, {
      method: form.editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Failed to save.' }))
      setError(msg || 'Failed to save.')
      return
    }
    setForm(blankForm())
    router.refresh()
  }

  async function toggleArchive(a: MoneyAccount) {
    await fetch(`/api/admin/money/accounts/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: !a.archived }),
    })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-black text-navy text-sm uppercase tracking-wide">Accounts</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} className="mr-1" />New account
        </Button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Name</th>
            <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Kind</th>
            <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Holder</th>
            <th className="text-right px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Fee rate</th>
            <th className="text-right px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Fee fixed</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {accounts.map((a) => (
            <tr key={a.id} className={a.archived ? 'opacity-40 hover:bg-gray-50/50' : 'hover:bg-gray-50/50'}>
              <td className="px-5 py-3 text-sm font-semibold text-navy">{a.name}</td>
              <td className="px-3 py-3 text-sm text-navy/60 capitalize">{a.kind}</td>
              <td className="px-3 py-3 text-sm text-navy/60">{a.holder ?? '—'}</td>
              <td className="px-3 py-3 text-sm text-navy/60 text-right">{(Number(a.default_fee_rate) * 100).toFixed(2)}%</td>
              <td className="px-3 py-3 text-sm text-navy/60 text-right">${Number(a.default_fee_fixed).toFixed(2)}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => openEdit(a)} className="p-1.5 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-gray-100">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleArchive(a)} title={a.archived ? 'Restore' : 'Archive'} className="p-1.5 text-navy/40 hover:text-navy transition-colors cursor-pointer rounded-lg hover:bg-gray-100">
                    {a.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setForm(blankForm())} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-navy">{form.editing ? 'Edit account' : 'New account'}</h2>
              <button onClick={() => setForm(blankForm())} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Brad personal credit card"
                  className={inputCls}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Kind</label>
                  <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as MoneyAccountKind })} className={inputCls}>
                    <option value="external">External (personal)</option>
                    <option value="cash">Cash (held by a person)</option>
                    <option value="digital">Digital (Stripe / bank)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Holder</label>
                  <input
                    type="text"
                    value={form.holder}
                    onChange={(e) => setForm({ ...form, holder: e.target.value })}
                    placeholder="Name"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fee rate</label>
                  <input
                    type="number"
                    min="0"
                    step="0.0001"
                    value={form.feeRate}
                    onChange={(e) => setForm({ ...form, feeRate: e.target.value })}
                    placeholder="0.019"
                    className={inputCls}
                  />
                  <p className="text-xs text-navy/40 mt-1">Decimal — 0.019 = 1.9%</p>
                </div>
                <div>
                  <label className={labelCls}>Fee fixed ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.feeFixed}
                    onChange={(e) => setForm({ ...form, feeFixed: e.target.value })}
                    placeholder="0.10"
                    className={inputCls}
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setForm(blankForm())} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} size="sm" className="flex-1">
                {saving ? 'Saving…' : form.editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
