export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import { Package, ShoppingBag, AlertTriangle, TrendingUp, Wallet, Users, Trophy, BarChart3, MousePointerClick } from 'lucide-react'
import { PAYMENT_METHODS, SALES_REPS } from '@/types'
import { variantLabel } from '@/lib/variants'

// Orders that count as an actual sale (excludes pending/cancelled).
const SALE_STATUSES = ['paid', 'fulfilled', 'shipped', 'out_for_delivery']

type RevenueOrder = {
  total: number | null
  payment_method: string | null
  payment_method_other: string | null
  sales_reps: string[] | null
}

async function getDashboardStats() {
  const db = createAdminClient()
  const [
    { count: totalOrders },
    { count: pendingOrders },
    { data: revenue },
    { data: lowStock },
    { data: feeEvents },
    { data: expenses },
    { data: soldItems },
    { data: products },
  ] = await Promise.all([
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'fulfilled', 'shipped', 'out_for_delivery']),
    db.from('orders').select('*', { count: 'exact', head: true }).in('status', ['paid', 'shipped', 'out_for_delivery']),
    db.from('orders').select('total, payment_method, payment_method_other, sales_reps').in('status', ['paid', 'fulfilled', 'shipped', 'out_for_delivery']),
    db.from('product_variants').select('id, sku, color, size, variant_name, stock, products(name)').lte('stock', 3).gt('stock', 0),
    db.from('payment_events').select('amount, type').in('type', ['stripe_fee', 'postage_cost']),
    db.from('expenses').select('amount'),
    db.from('order_items').select('order_id, product_id, product_name, quantity, orders(status, created_at)'),
    db.from('products').select('id, name'),
  ])

  const revenueOrders = (revenue ?? []) as RevenueOrder[]
  const totalRevenue = revenueOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const totalExpenses =
    (expenses?.reduce((s, e) => s + e.amount, 0) ?? 0) +
    (feeEvents?.reduce((s, e) => s + e.amount, 0) ?? 0)
  const netIncome = totalRevenue - totalExpenses

  // Aggregate by payment method
  const methodTotals = new Map<string, number>()
  for (const o of revenueOrders) {
    const key = o.payment_method === 'other'
      ? `other:${o.payment_method_other ?? 'Other'}`
      : (o.payment_method ?? '__none__')
    methodTotals.set(key, (methodTotals.get(key) ?? 0) + (o.total ?? 0))
  }
  const byPaymentMethod = [...methodTotals.entries()].map(([key, amount]) => {
    if (key === '__none__') return { label: 'Unattributed', amount }
    if (key.startsWith('other:')) return { label: key.slice('other:'.length), amount }
    return { label: PAYMENT_METHODS.find((m) => m.value === key)?.label ?? key, amount }
  }).sort((a, b) => b.amount - a.amount)

  // Aggregate by sales rep with even split
  const repTotals = new Map<string, number>()
  let unattributedRep = 0
  for (const o of revenueOrders) {
    const reps = (o.sales_reps ?? []).filter(Boolean)
    if (reps.length === 0) {
      unattributedRep += o.total ?? 0
      continue
    }
    const share = (o.total ?? 0) / reps.length
    for (const rep of reps) {
      repTotals.set(rep, (repTotals.get(rep) ?? 0) + share)
    }
  }
  const bySalesRep = [...repTotals.entries()].map(([rep, amount]) => ({
    label: SALES_REPS.find((sr) => sr.value === rep)?.label ?? rep,
    amount,
  })).sort((a, b) => b.amount - a.amount)
  if (unattributedRep > 0) bySalesRep.push({ label: 'Unattributed', amount: unattributedRep })

  // Top products by lifetime units sold (completed orders only). Aggregate by
  // product_id where available (so renames merge), else by the frozen name.
  type SoldItem = { product_id: string | null; product_name: string | null; quantity: number | null; orders: { status: string | null; created_at: string | null } | null }
  const currentName = new Map((products ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))
  const unitsByProduct = new Map<string, { name: string; units: number }>()
  const unitsByMonth = new Map<string, number>()
  let lifetimeUnits = 0
  for (const it of (soldItems ?? []) as unknown as SoldItem[]) {
    if (!SALE_STATUSES.includes(it.orders?.status ?? '')) continue
    const qty = it.quantity ?? 0
    lifetimeUnits += qty
    const key = it.product_id ?? `name:${it.product_name ?? 'unknown'}`
    const name = (it.product_id && currentName.get(it.product_id)) || it.product_name || 'Unknown product'
    const prev = unitsByProduct.get(key)
    unitsByProduct.set(key, { name, units: (prev?.units ?? 0) + qty })

    const month = it.orders?.created_at?.slice(0, 7) // "YYYY-MM"
    if (month) unitsByMonth.set(month, (unitsByMonth.get(month) ?? 0) + qty)
  }
  const topProducts = [...unitsByProduct.values()]
    .filter((p) => p.units > 0)
    .sort((a, b) => b.units - a.units)
    .slice(0, 10)

  // Units sold per month for the trailing 12 months (including the current month).
  const now = new Date()
  const monthlySales: { key: string; label: string; units: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlySales.push({
      key,
      label: d.toLocaleString('en-US', { month: 'short' }),
      units: unitsByMonth.get(key) ?? 0,
    })
  }

  return {
    totalOrders: totalOrders ?? 0,
    pendingOrders: pendingOrders ?? 0,
    lifetimeUnits,
    totalRevenue,
    totalExpenses,
    netIncome,
    lowStock: lowStock ?? [],
    byPaymentMethod,
    bySalesRep,
    topProducts,
    monthlySales,
  }
}

export default async function AdminDashboard() {
  const { totalOrders, pendingOrders, lifetimeUnits, totalRevenue, totalExpenses, netIncome, lowStock, byPaymentMethod, bySalesRep, topProducts, monthlySales } = await getDashboardStats()

  const isProfit = netIncome >= 0
  const maxMethodAmount = Math.max(1, ...byPaymentMethod.map((x) => x.amount))
  const maxRepAmount = Math.max(1, ...bySalesRep.map((x) => x.amount))
  const maxUnits = Math.max(1, ...topProducts.map((x) => x.units))
  const maxMonthUnits = Math.max(1, ...monthlySales.map((x) => x.units))
  const totalMonthlyUnits = monthlySales.reduce((s, m) => s + m.units, 0)

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-navy/60">Total Orders</p>
            <ShoppingBag size={20} className="text-purple" />
          </div>
          <p className="text-3xl font-black text-navy">{totalOrders}</p>
        </div>

        {/* Clickers Sold */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-navy/60">Clickers Sold</p>
            <MousePointerClick size={20} className="text-sky" />
          </div>
          <p className="text-3xl font-black text-navy">{lifetimeUnits}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Revenue by Payment Method */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-navy/60">Revenue by Payment Method</p>
            <Wallet size={20} className="text-purple" />
          </div>
          {byPaymentMethod.length === 0 ? (
            <p className="text-sm text-navy/40">No paid orders yet.</p>
          ) : (
            <div className="space-y-3">
              {byPaymentMethod.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-navy">{row.label}</span>
                    <span className="font-bold text-navy">${row.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple rounded-full" style={{ width: `${(row.amount / maxMethodAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Sales Rep */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-navy/60">Sales by Sales Rep</p>
            <Users size={20} className="text-pink" />
          </div>
          {bySalesRep.length === 0 ? (
            <p className="text-sm text-navy/40">No paid orders yet.</p>
          ) : (
            <div className="space-y-3">
              {bySalesRep.map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-navy">{row.label}</span>
                    <span className="font-bold text-navy">${row.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-pink rounded-full" style={{ width: `${(row.amount / maxRepAmount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-navy/40 mt-3">Joint sales are split evenly between assigned reps.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Top 10 Products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-navy/60">Top 10 Products</p>
            <Trophy size={20} className="text-purple" />
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-navy/40">No sales yet.</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((row, i) => (
                <div key={`${row.name}-${i}`}>
                  <div className="flex justify-between text-sm mb-1 gap-2">
                    <span className="font-semibold text-navy truncate">
                      <span className="text-navy/40 tabular-nums mr-1.5">{i + 1}.</span>{row.name}
                    </span>
                    <span className="font-bold text-navy whitespace-nowrap">{row.units}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple rounded-full" style={{ width: `${(row.units / maxUnits) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-navy/40 mt-3">Lifetime units sold.</p>
        </div>

        {/* Clickers Sold by Month */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-navy/60">Clickers Sold by Month</p>
            <BarChart3 size={20} className="text-pink" />
          </div>
          {totalMonthlyUnits === 0 ? (
            <p className="text-sm text-navy/40">No sales in the last 12 months.</p>
          ) : (
            <>
              <div className="flex items-end gap-2 h-48">
                {monthlySales.map((m) => (
                  <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full" title={`${m.label}: ${m.units} sold`}>
                    <span className="text-[11px] font-bold text-navy/50 mb-1 h-4">{m.units > 0 ? m.units : ''}</span>
                    <div
                      className="w-full bg-pink rounded-t-md transition-all"
                      style={{ height: `${(m.units / maxMonthUnits) * 100}%`, minHeight: m.units > 0 ? '4px' : '0px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1.5">
                {monthlySales.map((m) => (
                  <span key={m.key} className="flex-1 text-center text-[11px] font-semibold text-navy/40">{m.label}</span>
                ))}
              </div>
            </>
          )}
          <p className="text-xs text-navy/40 mt-3">Units sold per month across completed orders (last 12 months).</p>
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
                {(v.products as unknown as { name: string })?.name} — {variantLabel(v)} — {v.stock} remaining
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
