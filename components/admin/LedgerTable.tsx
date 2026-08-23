'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { MoneyAccount, MoneyTransaction, MoneyTransactionKind } from '@/types'
import { MONEY_TRANSACTION_KINDS } from '@/types'
import TransactionEditModal from './TransactionEditModal'

interface Props {
  transactions: MoneyTransaction[]
  accounts: MoneyAccount[]
}

const inputCls = 'border-2 border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-purple text-sm bg-white'

const kindBadge: Record<MoneyTransactionKind, string> = {
  sale:          'bg-emerald-50 text-emerald-700',
  expense:       'bg-red-50 text-red-600',
  transfer:      'bg-blue-50 text-blue-600',
  reimbursement: 'bg-purple/10 text-purple',
  adjustment:    'bg-gray-100 text-gray-600',
}

export default function LedgerTable({ transactions, accounts }: Props) {
  const accountMap = useMemo(() => {
    const m = new Map<string, MoneyAccount>()
    for (const a of accounts) m.set(a.id, a)
    return m
  }, [accounts])

  const [accountFilter, setAccountFilter] = useState<string>('')
  const [kindFilter,    setKindFilter]    = useState<MoneyTransactionKind | ''>('')
  const [fromDate,      setFromDate]      = useState('')
  const [toDate,        setToDate]        = useState('')

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (accountFilter && t.from_account_id !== accountFilter && t.to_account_id !== accountFilter) return false
      if (kindFilter && t.kind !== kindFilter) return false
      if (fromDate && t.occurred_at < fromDate) return false
      if (toDate   && t.occurred_at > toDate)   return false
      return true
    })
  }, [transactions, accountFilter, kindFilter, fromDate, toDate])

  function clearFilters() {
    setAccountFilter('')
    setKindFilter('')
    setFromDate('')
    setToDate('')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
        <h2 className="font-black text-navy text-sm uppercase tracking-wide mr-2">Ledger</h2>
        <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className={inputCls}>
          <option value="">All accounts</option>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as MoneyTransactionKind | '')} className={inputCls}>
          <option value="">All kinds</option>
          {MONEY_TRANSACTION_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
        <span className="text-navy/40 text-sm">to</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
        {(accountFilter || kindFilter || fromDate || toDate) && (
          <button onClick={clearFilters} className="text-xs font-bold text-purple hover:underline cursor-pointer">Clear</button>
        )}
        <span className="ml-auto text-xs text-navy/40">{filtered.length} of {transactions.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-navy/40 text-sm">
          {transactions.length === 0 ? 'No transactions yet.' : 'No transactions match the filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Date</th>
              <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Kind</th>
              <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">From</th>
              <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">To</th>
              <th className="text-right px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Amount</th>
              <th className="text-left px-3 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Description</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((t) => {
              const fromAcc = t.from_account_id ? accountMap.get(t.from_account_id) : null
              const toAcc   = t.to_account_id   ? accountMap.get(t.to_account_id)   : null
              const isOutflow = !toAcc && fromAcc
              return (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm text-navy/60 whitespace-nowrap">
                    {new Date(t.occurred_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${kindBadge[t.kind]}`}>
                      {t.kind}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm text-navy/70">{fromAcc?.name ?? <span className="text-navy/30">—</span>}</td>
                  <td className="px-3 py-3 text-sm text-navy/70">{toAcc?.name ?? <span className="text-navy/30">—</span>}</td>
                  <td className={`px-3 py-3 text-sm font-bold text-right whitespace-nowrap ${isOutflow ? 'text-red-500' : 'text-navy'}`}>
                    {isOutflow ? '−' : '+'}${Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-sm text-navy/70">
                    {t.order_id ? (
                      <Link href={`/admin/orders/${t.order_id}`} className="hover:text-purple transition-colors">
                        {t.description ?? `Order ${t.order_id.slice(0, 8).toUpperCase()}`}
                      </Link>
                    ) : (
                      t.description ?? <span className="text-navy/30">—</span>
                    )}
                    {t.notes && <span className="block text-xs text-navy/40 italic">{t.notes}</span>}
                    {t.manual_override && <span className="ml-1 text-xs text-purple/70">[manual]</span>}
                  </td>
                  <td className="px-3 py-3">
                    <TransactionEditModal transaction={t} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table></div>
      )}
    </div>
  )
}
