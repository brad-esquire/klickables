'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'

import VariantSelector from './VariantSelector'
import ImageGallery from './ImageGallery'
import Button from '@/components/ui/Button'
import type { Product, ProductVariant } from '@/types'
import { trackViewItem, trackAddToCart } from '@/lib/analytics'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const variants = product.product_variants ?? []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.ignore_stock ? (variants[0] ?? null) : (variants.find((v) => v.stock > 0) ?? variants[0] ?? null)
  )
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const variantLabel = [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(' / ')
  const inStock = product.ignore_stock || (selectedVariant?.stock ?? 0) > 0

  useEffect(() => {
    trackViewItem({
      id: product.id,
      name: product.name,
      price: selectedVariant?.price,
      variantLabel: variantLabel || undefined,
    })
    // Intentionally only fires on product mount, not every variant change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id])

  function handleAddToCart() {
    if (!selectedVariant || !inStock) return
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel,
      price: selectedVariant.price,
      quantity: qty,
      image: product.images?.[0] ?? '',
    })
    trackAddToCart({
      item_id: selectedVariant.id,
      item_name: product.name,
      item_variant: variantLabel || undefined,
      price: selectedVariant.price,
      quantity: qty,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <ImageGallery images={product.images ?? []} alt={product.name} />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-4xl font-black text-navy mb-2">{product.name}</h1>
            {selectedVariant && (
              <p className="text-3xl font-bold text-pink">${selectedVariant.price.toFixed(2)}</p>
            )}
          </div>

          {product.description && (
            <p className="text-navy/70 leading-relaxed">{product.description}</p>
          )}

          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={(v) => { setSelectedVariant(v); setQty(1) }}
              ignoreStock={product.ignore_stock}
            />
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-navy text-sm">Quantity</span>
            <div className="flex items-center border-2 border-navy rounded-full overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center font-bold text-navy hover:bg-navy/10 transition-colors"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-navy">{qty}</span>
              <button
                onClick={() => setQty((q) => product.ignore_stock ? q + 1 : Math.min(selectedVariant?.stock ?? 99, q + 1))}
                className="w-9 h-9 flex items-center justify-center font-bold text-navy hover:bg-navy/10 transition-colors"
              >
                +
              </button>
            </div>
            {!product.ignore_stock && selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <span className="text-orange-500 text-sm font-semibold">
                Only {selectedVariant.stock} left!
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!selectedVariant || !inStock}
            className="w-full"
          >
            {!inStock ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
