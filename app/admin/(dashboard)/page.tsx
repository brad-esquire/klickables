export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { Package, ShoppingBag, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
  const totalStripeFees = feeEvents?.filter((e) => e.type === 'stripe_fee').reduce((s, e) => s + e.amount, 0) ?? 0
  const totalPostage = feeEvents?.filter((e) => e.type === 'postage_cost').reduce((s, e) => s + e.amount, 0) ?? 0
  const totalExpenses = (expenses?.reduce((s, e) => s + e.amount, 0) ?? 0) + totalPostage
  const netIncome = totalRevenue - totalStripeFees - totalExpenses

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    totalStripeFees,
    totalExpenses,
    netIncome,
    lowStock: lowStock ?? [],
  }
}

export default async function AdminDashboard() {
  const { totalOrders, pendingOrders, totalRevenue, totalStripeFees, totalExpenses, netIncome, lowStock } = await getDashboardStats()

  const topStats = [
    { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-purple' },
    { label: 'Awaiting Fulfillment', value: pendingOrders, icon: Package, color: 'text-pink' },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
  ]

  const plStats = [
    { label: 'Expenses', value: `$${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: 'text-orange-500', sub: 'Operating costs' },
    { label: 'Stripe Fees', value: `$${totalStripeFees.toFixed(2)}`, icon: Minus, color: 'text-red-400', sub: 'Processing fees' },
    {
      label: 'Net Income',
      value: `$${netIncome.toFixed(2)}`,
      icon: TrendingUp,
      color: netIncome >= 0 ? 'text-green-600' : 'text-red-500',
      sub: 'Revenue − expenses − fees',
      highlight: true,
      negative: netIncome < 0,
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-5 mb-5">
        {topStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-navy/60">{s.label}</p>
              <s.icon size={20} className={s.color} />
            </div>
            <p className="text-3xl font-black text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {/* P&L row */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {plStats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-6 shadow-sm border ${
              s.highlight
                ? s.negative
                  ? 'bg-red-50 border-red-100'
                  : 'bg-green-50 border-green-100'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-navy/60">{s.label}</p>
              <s.icon size={20} className={s.color} />
            </div>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            {s.sub && <p className="text-xs text-navy/40 mt-1">{s.sub}</p>}
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
