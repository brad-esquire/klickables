export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { Package, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react'

async function getDashboardStats() {
  const db = createAdminClient()
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { data: revenue },
    { data: lowStock },
    { data: feeEvents },
    { data: expenses },
  ] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'fulfilled', 'shipped', 'out_for_delivery']),
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'shipped', 'out_for_delivery']),
    db.from('orders').select('total').in('status', ['paid', 'fulfilled', 'shipped', 'out_for_delivery']),
    db.from('product_variants').select('id, sku, color, size, stock, products(name)').lte('stock', 3).gt('stock', 0),
    db.from('payment_events').select('amount, type').in('type', ['stripe_fee', 'postage_cost']),
    db.from('expenses').select('amount'),
  ])

  const totalRevenue = revenue?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0
  const totalExpenses =
    (expenses?.reduce((s, e) => s + e.amount, 0) ?? 0) +
    (feeEvents?.reduce((s, e) => s + e.amount, 0) ?? 0)
  const netIncome = totalRevenue - totalExpenses

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    totalExpenses,
    netIncome,
    lowStock: lowStock ?? [],
  }
}

export default async function AdminDashboard() {
  const { totalOrders, pendingOrders, totalRevenue, totalExpenses, netIncome, lowStock } = await getDashboardStats()

  const isProfit = netIncome >= 0

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-navy/60">Total Orders</p>
            <ShoppingBag size={20} className="text-purple" />
          </div>
          <p className="text-3xl font-black text-navy">{totalOrders}</p>
        </div>

        {/* Awaiting Fulfillment */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-navy/60">Awaiting Fulfillment</p>
            <Package size={20} className="text-pink" />
          </div>
          <p className="text-3xl font-black text-navy">{pendingOrders}</p>
        </div>

        {/* P&L */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-navy/60">Profit &amp; Loss</p>
            <TrendingUp size={20} className={isProfit ? 'text-green-600' : 'text-red-500'} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-navy/60">
              <span>Revenue</span>
              <span className="font-semibold text-navy">${totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-navy/60">
              <span>Expenses</span>
              <span className="font-semibold text-navy">− ${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-black border-t border-gray-100 pt-1.5 mt-1">
              <span className="text-navy">Net Income</span>
              <span className={isProfit ? 'text-green-600' : 'text-red-500'}>${netIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>
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
