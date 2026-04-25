'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

import VariantSelector from './VariantSelector'
import Button from '@/components/ui/Button'
import type { Product, ProductVariant } from '@/types'

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

function isGifUrl(url: string) {
  return /\.gif(\?|$)/i.test(url)
}

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const variants = product.product_variants ?? []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.find((v) => v.stock > 0) ?? variants[0] ?? null
  )
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const addItem = useCartStore((s) => s.addItem)

  const variantLabel = [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(' / ')
  const inStock = (selectedVariant?.stock ?? 0) > 0

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
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream mb-3">
            {product.images?.[activeImage] ? (
              isVideoUrl(product.images[activeImage]) ? (
                <video
                  key={product.images[activeImage]}
                  src={product.images[activeImage]}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              ) : (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  unoptimized={isGifUrl(product.images[activeImage])}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-8xl">
                🖱️
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors bg-black ${
                    i === activeImage ? 'border-purple' : 'border-transparent'
                  }`}
                >
                  {isVideoUrl(img) ? (
                    <>
                      <video src={img} className="w-full h-full object-cover" muted playsInline />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={14} fill="white" className="text-white" />
                      </span>
                    </>
                  ) : (
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" unoptimized={isGifUrl(img)} />
                  )}
                </button>
              ))}
            </div>
          )}
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
                onClick={() => setQty((q) => Math.min(selectedVariant?.stock ?? 99, q + 1))}
                className="w-9 h-9 flex items-center justify-center font-bold text-navy hover:bg-navy/10 transition-colors"
              >
                +
              </button>
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
              <span className="text-orange-500 text-sm font-semibold">
                Only {selectedVariant.stock} left!
              </span>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!inStock || !selectedVariant}
            className="w-full"
          >
            {!inStock ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}
