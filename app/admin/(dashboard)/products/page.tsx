export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Pencil } from 'lucide-react'
import DeleteProductButton from '@/components/admin/DeleteProductButton'

async function getProducts() {
  const db = createAdminClient()
  const { data } = await db
    .from('products')
    .select('*, product_variants(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black text-navy">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold">No products yet. Add your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-5 py-3 text-left">Variants</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const prices = p.product_variants?.map((v: { price: number }) => v.price) ?? []
                const minPrice = prices.length ? Math.min(...prices) : null
                const maxPrice = prices.length ? Math.max(...prices) : null
                const priceLabel = minPrice === null ? '—' : minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} – $${maxPrice!.toFixed(2)}`

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy">{p.name}</p>
                      <p className="text-sm text-navy/50">/{p.slug}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-navy/70">
                      {p.product_variants?.length ?? 0} variant{(p.product_variants?.length ?? 0) !== 1 ? 's' : ''} · {priceLabel}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={p.active ? 'green' : 'red'}>{p.active ? 'Active' : 'Hidden'}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${p.id}/edit`}>
                          <Button variant="ghost" size="sm"><Pencil size={14} /></Button>
                        </Link>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
