export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import type { Order, OrderItem } from '@/types'

type OrderWithItems = Order & { order_items: OrderItem[] }

async function getUnfulfilledOrders(): Promise<OrderWithItems[]> {
  const db = createAdminClient()
  const { data } = await db
    .from('orders')
    .select('*, order_items(*)')
    .in('status', ['pending', 'paid'])
    .order('created_at', { ascending: true })
  return (data ?? []) as OrderWithItems[]
}

const statusVariant: Record<string, 'green' | 'pink' | 'navy' | 'red'> = {
  paid: 'pink',
  pending: 'navy',
}

type AggItem = { productName: string; variantLabel: string; total: number; confirmed: number }

export default async function ProductionQueuePage() {
  const orders = await getUnfulfilledOrders()

  const map = new Map<string, AggItem>()
  for (const order of orders) {
    for (const item of order.order_items) {
      const key = `${item.product_name}||${item.variant_label ?? ''}`
      const existing = map.get(key) ?? {
        productName: item.product_name,
        variantLabel: item.variant_label ?? '',
        total: 0,
        confirmed: 0,
      }
      existing.total += item.quantity
      if (order.status === 'paid') existing.confirmed += item.quantity
      map.set(key, existing)
    }
  }

  const items = [...map.values()].sort((a, b) => {
    const p = a.productName.localeCompare(b.productName)
    return p !== 0 ? p : a.variantLabel.localeCompare(b.variantLabel)
  })

  const totalClickers = items.reduce((s, i) => s + i.total, 0)
  const confirmedClickers = items.reduce((s, i) => s + i.confirmed, 0)
  const paidOrders = orders.filter((o) => o.status === 'paid').length
  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy">Production Queue</h1>
        <p className="text-navy/50 text-sm mt-1">Clickers needed across all unfulfilled orders</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-pink">{totalClickers}</p>
          <p className="text-sm text-navy/60 mt-1">Total to make</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-navy">{confirmedClickers}</p>
          <p className="text-sm text-navy/60 mt-1">Confirmed (paid)</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-navy">{paidOrders}</p>
          <p className="text-sm text-navy/60 mt-1">Paid orders</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-4xl font-black text-navy">{pendingOrders}</p>
          <p className="text-sm text-navy/60 mt-1">Pending orders</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">✅</p>
          <p className="font-semibold">All caught up! No unfulfilled orders.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-black text-navy">What to Make</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Variant / Color</th>
                  <th className="px-5 py-3 text-right">Paid</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={`${item.productName}||${item.variantLabel}`} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-semibold text-navy">{item.productName}</td>
                    <td className="px-5 py-3.5 text-navy/70 text-sm">{item.variantLabel || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-navy/60">{item.confirmed}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-2xl font-black text-pink">{item.total}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={2} className="px-5 py-3 font-black text-navy text-sm uppercase tracking-wide">Total</td>
                  <td className="px-5 py-3 text-right font-black text-navy">{confirmedClickers}</td>
                  <td className="px-5 py-3 text-right font-black text-pink text-lg">{totalClickers}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-black text-navy">Unfulfilled Orders</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Order</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Items</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const qty = order.order_items.reduce((s, i) => s + i.quantity, 0)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 font-mono text-sm text-navy/70">#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-5 py-4 font-semibold text-navy text-sm">{order.customer_name}</td>
                      <td className="px-5 py-4 font-bold text-navy">{qty} clicker{qty !== 1 ? 's' : ''}</td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant[order.status] ?? 'navy'}>{order.status}</Badge>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
