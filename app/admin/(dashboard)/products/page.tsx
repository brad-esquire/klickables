export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import ProductSortList from '@/components/admin/ProductSortList'

async function getProducts() {
  const db = createAdminClient()
  const { data } = await db
    .from('products')
    .select('*, product_variants(*)')
    .order('sort_order', { ascending: true })
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
        <>
          <p className="text-sm text-navy/50 mb-3">Drag the <span className="font-semibold">⠿</span> handle to reorder. Order is reflected on the shop page.</p>
          <ProductSortList initialProducts={products} />
        </>
      )}
    </div>
  )
}
