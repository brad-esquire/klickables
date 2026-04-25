export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { Package, ShoppingBag, DollarSign, AlertTriangle } from 'lucide-react'

async function getDashboardStats() {
  const db = createAdminClient()
  const [{ count: totalOrders }, { count: pendingOrders }, { data: revenue }, { data: lowStock }] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'fulfilled']),
    db.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    db.from('orders').select('total').in('status', ['paid', 'fulfilled']),
    db.from('product_variants').select('id, sku, color, size, stock, products(name)').lte('stock', 3).gt('stock', 0),
  ])

  const totalRevenue = revenue?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0
  return { totalOrders: totalOrders ?? 0, pendingOrders: pendingOrders ?? 0, totalRevenue, lowStock: lowStock ?? [] }
}

export default async function AdminDashboard() {
  const { totalOrders, pendingOrders, totalRevenue, lowStock } = await getDashboardStats()

  const stats = [
    { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-purple' },
    { label: 'Awaiting Fulfillment', value: pendingOrders, icon: Package, color: 'text-pink' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-sky-600' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-navy/60">{s.label}</p>
              <s.icon size={20} className={s.color} />
            </div>
            <p className="text-3xl font-black text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-orange-500" />
            <h2 className="font-bold text-orange-800">Low Stock Alerts</h2>
          </div>
          <ul className="space-y-1">
            {lowStock.map((v) => (
              <li key={v.id} className="text-sm text-orange-700">
                {(v.products as unknown as { name: string })?.name} — {[v.color, v.size].filter(Boolean).join(' / ')} — {v.stock} remaining
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
