import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'

function isGifUrl(url: string) {
  return /\.gif(\?|$)/i.test(url)
}

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images?.[0]
  const isCustom = product.slug === 'custom-clicker'
  const href = isCustom ? '/shop/custom' : `/shop/${product.slug}`
  const lowestPrice = product.product_variants?.length
    ? Math.min(...product.product_variants.map((v) => v.price))
    : null

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
    >
      <div className="relative aspect-square bg-cream overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={isGifUrl(image)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
            🖱️
          </div>
        )}
        {isCustom && (
          <span className="absolute top-2.5 left-2.5 bg-purple text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Custom Order
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-navy text-lg leading-tight mb-1">{product.name}</h3>
        {isCustom ? (
          <p className="text-pink font-bold text-base">From $100.00</p>
        ) : lowestPrice !== null ? (
          <p className="text-pink font-bold text-base">
            {product.product_variants && product.product_variants.length > 1 ? 'From ' : ''}
            ${lowestPrice.toFixed(2)}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
