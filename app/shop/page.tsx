export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/shop/ProductCard'
import type { Product } from '@/types'

async function getProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('active', true)
    .order('sort_order', { ascending: true })
  return data ?? []
}

export const metadata = {
  title: 'Shop — Klickables',
}

export default async function ShopPage() {
  const products = await getProducts()

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-navy mb-2">Shop Clickers</h1>
        <p className="text-navy/60">Pick your colors, grab your favorite — all 3D printed just for you.</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-gray-400">
          <p className="text-6xl mb-4">🖱️</p>
          <p className="font-bold text-lg text-navy">Products coming soon!</p>
          <p className="text-sm mt-2">Check back soon — we&apos;re always printing new things.</p>
        </div>
      )}
    </div>
  )
}
