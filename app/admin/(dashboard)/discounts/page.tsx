export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import AddDiscountForm from '@/components/admin/AddDiscountForm'
import DiscountToggle from '@/components/admin/DiscountToggle'
import type { DiscountCode } from '@/types'

async function getDiscounts(): Promise<DiscountCode[]> {
  const db = createAdminClient()
  const { data } = await db.from('discount_codes').select('*').order('created_at' as keyof DiscountCode, { ascending: false })
  return data ?? []
}

export default async function AdminDiscountsPage() {
  const discounts = await getDiscounts()

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Discount Codes</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-black text-navy mb-4">Active Codes</h2>
          {discounts.length === 0 ? (
            <p className="text-navy/50 text-sm">No discount codes yet.</p>
          ) : (
            <div className="space-y-3">
              {discounts.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-navy">{d.code}</p>
                    <p className="text-sm text-navy/60">
                      {d.type === 'percentage' ? `${d.value}% off` : `$${d.value.toFixed(2)} off`}
                      {d.min_order > 0 ? ` · min $${d.min_order}` : ''}
                      {d.max_uses !== null ? ` · ${d.uses_count}/${d.max_uses} uses` : ` · ${d.uses_count} uses`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={d.active ? 'green' : 'red'}>{d.active ? 'Active' : 'Off'}</Badge>
                    <DiscountToggle id={d.id} active={d.active} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-black text-navy mb-4">Create Code</h2>
          <AddDiscountForm />
        </div>
      </div>
    </div>
  )
}
