export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/shop/ProductCard'
import JsonLd from '@/components/seo/JsonLd'
import type { Product, ProductVariant } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

async function getProducts(): Promise<Product[]> {
  const [activeRes, customRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('slug', 'custom-clicker')
      .single(),
  ])
  const products: Product[] = (activeRes.data ?? []) as Product[]
  const custom = customRes.data as Product | null
  if (custom && !products.some((p) => p.slug === 'custom-clicker')) {
    products.push(custom)
  }
  for (const p of products) {
    const variants = (p as Product & { product_variants?: ProductVariant[] }).product_variants
    if (variants) (p as Product & { product_variants?: ProductVariant[] }).product_variants = variants.filter((v) => v.active)
  }
  return products
}

export const metadata: Metadata = {
  title: 'Shop Fidget Clickers',
  description:
    'Shop our handcrafted 3D printed fidget clickers — colorful, satisfying, and made by hand. Free shipping on orders over $50.',
  alternates: { canonical: '/shop' },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
  ],
}

export default async function ShopPage() {
  const products = await getProducts()

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/shop/${p.slug}`,
      name: p.name,
    })),
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={itemListLd} />
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
