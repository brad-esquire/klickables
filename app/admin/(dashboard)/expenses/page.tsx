export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import ExpenseModal from '@/components/admin/ExpenseModal'
import DeleteExpenseButton from '@/components/admin/DeleteExpenseButton'
import type { Expense } from '@/types'

async function getExpenses(): Promise<Expense[]> {
  const db = createAdminClient()
  const { data } = await db.from('expenses').select('*').order('date', { ascending: false })
  return data ?? []
}

const categoryColors: Record<string, string> = {
  Materials:         'bg-purple/10 text-purple',
  Packaging:         'bg-blue-50 text-blue-600',
  'Shipping Supplies': 'bg-sky-50 text-sky-600',
  Marketing:         'bg-pink/10 text-pink',
  Equipment:         'bg-orange-50 text-orange-600',
  Fees:              'bg-red-50 text-red-500',
  Other:             'bg-gray-100 text-gray-500',
}

export default async function ExpensesPage() {
  const expenses = await getExpenses()

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy">Expenses</h1>
          {expenses.length > 0 && (
            <p className="text-navy/50 text-sm mt-1">{expenses.length} entries · total ${total.toFixed(2)}</p>
          )}
        </div>
        <ExpenseModal />
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <p className="text-navy/40 text-sm">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category breakdown */}
          {Object.keys(byCategory).length > 1 && (
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
          )}

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
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 text-sm text-navy/60 whitespace-nowrap">
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-navy">{e.description}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${categoryColors[e.category] ?? 'bg-gray-100 text-gray-500'}`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-navy text-right">${e.amount.toFixed(2)}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <ExpenseModal expense={e} />
                        <DeleteExpenseButton id={e.id} />
                      </div>
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
