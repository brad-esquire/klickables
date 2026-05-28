'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import { PAYMENT_METHODS, SALES_REPS, CASH_HOLDERS } from '@/types'
import type { Order, OrderStatus } from '@/types'

const statusVariant: Record<string, 'green' | 'pink' | 'navy' | 'red'> = {
  paid: 'pink',
  fulfilled: 'green',
  shipped: 'green',
  out_for_delivery: 'green',
  pending: 'navy',
  cancelled: 'red',
}

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pending',          label: 'Pending' },
  { value: 'paid',             label: 'Paid' },
  { value: 'fulfilled',        label: 'Fulfilled' },
  { value: 'shipped',          label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'cancelled',        label: 'Cancelled' },
]

const selectCls = 'border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-navy focus:outline-none focus:border-purple bg-white'

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const [status, setStatus] = useState('')
  const [salesRep, setSalesRep] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [cashHolder, setCashHolder] = useState('')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status && o.status !== status) return false
      if (salesRep && !(o.sales_reps ?? []).includes(salesRep as never)) return false
      if (paymentMethod && o.payment_method !== paymentMethod) return false
      if (cashHolder && o.cash_holder !== cashHolder) return false
      return true
    })
  }, [orders, status, salesRep, paymentMethod, cashHolder])

  const hasFilters = !!(status || salesRep || paymentMethod || cashHolder)

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={salesRep} onChange={(e) => setSalesRep(e.target.value)} className={selectCls}>
          <option value="">All sales reps</option>
          {SALES_REPS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={selectCls}>
          <option value="">All payments</option>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={cashHolder} onChange={(e) => setCashHolder(e.target.value)} className={selectCls}>
          <option value="">All cash holders</option>
          {CASH_HOLDERS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setStatus(''); setSalesRep(''); setPaymentMethod(''); setCashHolder('') }}
            className="text-purple font-bold text-sm hover:text-pink transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="text-sm text-navy/40 ml-auto">{filtered.length} of {orders.length}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">No orders match these filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Payment</th>
                <th className="px-5 py-3 text-left">Cash Holder</th>
                <th className="px-5 py-3 text-left">Sales Rep</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-mono text-sm text-navy/70">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy text-sm">{order.customer_name}</p>
                    <p className="text-xs text-navy/50">{order.email}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-navy">${order.total?.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={statusVariant[order.status] ?? 'navy'}>{order.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-navy/70">
                    {order.payment_method === 'other'
                      ? (order.payment_method_other || 'Other')
                      : order.payment_method
                        ? (PAYMENT_METHODS.find((m) => m.value === order.payment_method)?.label ?? order.payment_method)
                        : <span className="text-navy/30">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-navy/70">
                    {order.cash_holder
                      ? (CASH_HOLDERS.find((h) => h.value === order.cash_holder)?.label ?? order.cash_holder)
                      : <span className="text-navy/30">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-navy/70">
                    {order.sales_reps && order.sales_reps.length > 0
                      ? order.sales_reps.map((r) => SALES_REPS.find((sr) => sr.value === r)?.label ?? r).join(', ')
                      : <span className="text-navy/30">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-navy/60">
                    {new Date(order.created_at).toLocaleDateString('en-US')}
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-purple font-bold text-sm hover:text-pink transition-colors">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
