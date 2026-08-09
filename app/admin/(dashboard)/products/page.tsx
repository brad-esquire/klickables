export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import ProductSortList from '@/components/admin/ProductSortList'

// Orders that count as an actual sale (excludes pending/cancelled).
const SALE_STATUSES = ['paid', 'fulfilled', 'shipped', 'out_for_delivery']

async function getProducts() {
  const db = createAdminClient()
  const [{ data }, { data: soldItems }] = await Promise.all([
    db.from('products').select('*, product_variants(*)').order('sort_order', { ascending: true }),
    db.from('order_items').select('order_id, product_id, quantity, orders(status)'),
  ])

  // Lifetime units sold per product across completed orders.
  type SoldItem = { product_id: string | null; quantity: number | null; orders: { status: string | null } | null }
  const soldByProduct = new Map<string, number>()
  for (const it of (soldItems ?? []) as unknown as SoldItem[]) {
    if (!it.product_id || !SALE_STATUSES.includes(it.orders?.status ?? '')) continue
    soldByProduct.set(it.product_id, (soldByProduct.get(it.product_id) ?? 0) + (it.quantity ?? 0))
  }

  return (data ?? []).map((p) => ({ ...p, sold: soldByProduct.get(p.id) ?? 0 }))
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
        <>
          <p className="text-sm text-navy/50 mb-3">Drag the <span className="font-semibold">⠿</span> handle to reorder. Order is reflected on the shop page.</p>
          <ProductSortList initialProducts={products} />
        </>
      )}
    </div>
  )
}
