export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import OrdersTable from '@/components/admin/OrdersTable'
import type { Order } from '@/types'

async function getOrders(): Promise<Order[]> {
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminOrdersPage() {
  const orders = await getOrders()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-navy">Orders</h1>
        <Link href="/admin/orders/new">
          <Button><Plus size={16} className="mr-1.5 inline" /> New Order</Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold">No orders yet.</p>
        </div>
      ) : (
        <OrdersTable orders={orders} />
      )}
    </div>
  )
}
