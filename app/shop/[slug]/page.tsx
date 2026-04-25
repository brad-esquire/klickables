export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductDetail from '@/components/shop/ProductDetail'
import type { Product } from '@/types'

async function getProduct(slug: string): Promise<Product | null> {
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  return { title: `${product.name} — Klickables` }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
