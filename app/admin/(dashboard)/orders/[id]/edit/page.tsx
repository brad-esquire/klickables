export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'
import EditOrderForm from '@/components/admin/EditOrderForm'
import type { Order, OrderItem } from '@/types'

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*, order_items(*)').eq('id', id).single()
  if (!data) notFound()

  const order = data as Order & { order_items: OrderItem[] }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-navy">Edit Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <p className="text-navy/50 text-sm mt-1">Changes are saved immediately — payment history is not affected.</p>
      </div>
      <EditOrderForm order={order} />
    </div>
  )
}
