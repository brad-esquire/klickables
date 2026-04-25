export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import type { Order } from '@/types'

async function getOrders(): Promise<Order[]> {
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*').order('created_at', { ascending: false })
  return data ?? []
}

const statusVariant: Record<string, 'green' | 'pink' | 'navy' | 'red'> = {
  paid: 'pink',
  fulfilled: 'green',
  pending: 'navy',
  cancelled: 'red',
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold">No orders yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Order</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Total</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
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
    </div>
  )
}
