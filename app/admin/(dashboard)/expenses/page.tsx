export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import ExpenseModal from '@/components/admin/ExpenseModal'
import DeleteExpenseButton from '@/components/admin/DeleteExpenseButton'
import type { Expense } from '@/types'

interface ExpenseRow {
  id: string
  description: string
  amount: number
  category: string
  date: string
  source: 'manual' | 'order'
  orderId?: string
  expense?: Expense
}

async function getAllExpenses(): Promise<ExpenseRow[]> {
  const db = createAdminClient()
  const [{ data: manual }, { data: events }] = await Promise.all([
    db.from('expenses').select('*'),
    db.from('payment_events')
      .select('id, type, amount, note, created_at, order_id, orders(id)')
      .in('type', ['stripe_fee', 'postage_cost']),
  ])

  const manualRows: ExpenseRow[] = (manual ?? []).map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    category: e.category,
    date: e.date,
    source: 'manual',
    expense: e,
  }))

  const orderRows: ExpenseRow[] = (events ?? []).map((e) => {
    const order = (Array.isArray(e.orders) ? e.orders[0] : e.orders) as { id: string } | null
    const orderNum = order?.id?.slice(0, 8).toUpperCase() ?? ''
    const isPostage = e.type === 'postage_cost'
    return {
      id: e.id,
      description: isPostage
        ? `${e.note ?? 'Postage'} postage — Order #${orderNum}`
        : `Stripe fee — Order #${orderNum}`,
      amount: e.amount,
      category: isPostage ? 'Postage' : 'Stripe Fee',
      date: e.created_at.slice(0, 10),
      source: 'order',
      orderId: order?.id,
    }
  })

  return [...manualRows, ...orderRows].sort((a, b) => b.date.localeCompare(a.date))
}

const categoryColors: Record<string, string> = {
  Materials:           'bg-purple/10 text-purple',
  Packaging:           'bg-blue-50 text-blue-600',
  'Shipping Supplies': 'bg-sky-50 text-sky-600',
  Marketing:           'bg-pink/10 text-pink',
  Equipment:           'bg-orange-50 text-orange-600',
  Fees:                'bg-red-50 text-red-500',
  Other:               'bg-gray-100 text-gray-500',
  Postage:             'bg-sky-50 text-sky-600',
  'Stripe Fee':        'bg-red-50 text-red-500',
}

export default async function ExpensesPage() {
  const rows = await getAllExpenses()

  const total = rows.reduce((s, e) => s + e.amount, 0)

  const byCategory = rows.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy">Expenses</h1>
          {rows.length > 0 && (
            <p className="text-navy/50 text-sm mt-1">{rows.length} entries · total ${total.toFixed(2)}</p>
          )}
        </div>
        <ExpenseModal />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <p className="text-navy/40 text-sm">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category breakdown */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-navy mb-4 text-sm uppercase tracking-wide">By Category</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[cat] ?? 'bg-gray-100 text-gray-500'}`}>
                      {cat}
                    </span>
                    <span className="text-sm font-bold text-navy">${amt.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Expense list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Category</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-navy/50 uppercase tracking-wide">Amount</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 text-sm text-navy/60 whitespace-nowrap">
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-navy">
                      {e.source === 'order' && e.orderId ? (
                        <Link href={`/admin/orders/${e.orderId}`} className="hover:text-purple transition-colors">
                          {e.description}
                        </Link>
                      ) : (
                        e.description
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[e.category] ?? 'bg-gray-100 text-gray-500'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-navy text-right">${e.amount.toFixed(2)}</td>
                    <td className="px-3 py-3.5">
                      {e.source === 'manual' && e.expense && (
                        <div className="flex items-center gap-1">
                          <ExpenseModal expense={e.expense} />
                          <DeleteExpenseButton id={e.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                  <td colSpan={3} className="px-5 py-3 text-sm font-black text-navy">Total</td>
                  <td className="px-5 py-3 text-sm font-black text-navy text-right">${total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
