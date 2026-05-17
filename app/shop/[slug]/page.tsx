export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ProductDetail from '@/components/shop/ProductDetail'
import JsonLd from '@/components/seo/JsonLd'
import type { Product, ProductVariant } from '@/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type ProductWithVariants = Product & { product_variants: ProductVariant[] }

async function getProduct(slug: string): Promise<ProductWithVariants | null> {
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  return data as ProductWithVariants | null
}

function absoluteUrl(src: string): string {
  if (!src) return ''
  if (src.startsWith('http')) return src
  return src.startsWith('/') ? `${SITE_URL}${src}` : `${SITE_URL}/${src}`
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}
  const firstImage = product.images?.[0] ? absoluteUrl(product.images[0]) : undefined
  const description =
    product.description?.slice(0, 200) ??
    `Buy the ${product.name} from Klickables — handcrafted 3D printed fidget clickers.`
  return {
    title: product.name,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      type: 'website',
      title: `${product.name} — Klickables`,
      description,
      url: `${SITE_URL}/shop/${product.slug}`,
      images: firstImage ? [{ url: firstImage, alt: product.name }] : undefined,
    },
  }
}

function buildProductLd(product: ProductWithVariants) {
  const variants = product.product_variants ?? []
  const prices = variants.map((v) => v.price).filter((p): p is number => typeof p === 'number')
  const inStock = product.ignore_stock || variants.some((v) => (v.stock ?? 0) > 0)
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'

  const lowPrice = prices.length ? Math.min(...prices) : 0
  const highPrice = prices.length ? Math.max(...prices) : 0
  const sku = variants.find((v) => v.sku)?.sku ?? product.slug

  const offers = lowPrice === highPrice
    ? {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: lowPrice.toFixed(2),
        availability,
        url: `${SITE_URL}/shop/${product.slug}`,
      }
    : {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: lowPrice.toFixed(2),
        highPrice: highPrice.toFixed(2),
        offerCount: variants.length,
        availability,
        url: `${SITE_URL}/shop/${product.slug}`,
      }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    sku,
    image: (product.images ?? []).map(absoluteUrl).filter(Boolean),
    brand: { '@type': 'Brand', name: 'Klickables' },
    offers,
  }
}

function buildBreadcrumbLd(product: ProductWithVariants) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}/shop/${product.slug}` },
    ],
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  return (
    <>
      <JsonLd data={buildProductLd(product)} />
      <JsonLd data={buildBreadcrumbLd(product)} />
      <ProductDetail product={product} />
    </>
  )
}
