'use client'

import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'

import VariantSelector from './VariantSelector'
import MysteryColorInfo from './MysteryColorInfo'
import ImageGallery from './ImageGallery'
import Button from '@/components/ui/Button'
import type { Product, ProductVariant } from '@/types'
import { trackViewItem, trackAddToCart } from '@/lib/analytics'
import { tokenizePersonalization } from '@/lib/personalization'

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
  const [personalization, setPersonalization] = useState('')
  const addItem = useCartStore((s) => s.addItem)

  const variantLabel = [selectedVariant?.color, selectedVariant?.size].filter(Boolean).join(' / ')
  const inStock = product.ignore_stock || (selectedVariant?.stock ?? 0) > 0
  const isMystery = selectedVariant?.color?.trim().toLowerCase() === 'mystery'

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
    const cleanPersonalization = product.personalization_enabled
      ? tokenizePersonalization(personalization, product.personalization_emojis ?? [], product.personalization_max_length).join('').trim()
      : ''
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productName: product.name,
      variantLabel,
      price: selectedVariant.price,
      quantity: qty,
      image: product.images?.[0] ?? '',
      ...(cleanPersonalization ? { personalization: cleanPersonalization } : {}),
    })
    setPersonalization('')
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
          {isMystery && <MysteryColorInfo />}
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
            <p className="text-navy/70 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}

          {variants.length > 0 && (
            <VariantSelector
              variants={variants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={(v) => { setSelectedVariant(v); setQty(1) }}
              ignoreStock={product.ignore_stock}
            />
          )}

          {product.personalization_enabled && (() => {
            const max = product.personalization_max_length
            const emojis = product.personalization_emojis ?? []
            const tokens = tokenizePersonalization(personalization, emojis, max)
            const remaining = max - tokens.length
            const sanitize = (raw: string) => tokenizePersonalization(raw, emojis, max).join('')
            return (
              <div>
                <label className="block text-sm font-bold text-navy mb-2">
                  Customize your clicker <span className="font-normal text-navy/50">(up to {max} {max === 1 ? 'key' : 'keys'}{emojis.length > 0 ? ' — letters or emojis' : ''})</span>
                </label>
                <input
                  type="text"
                  value={personalization}
                  onChange={(e) => setPersonalization(sanitize(e.target.value))}
                  placeholder={emojis.length > 0 ? `e.g. BW${emojis[0]}` : 'e.g. BW'}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
                />
                {emojis.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-navy/60 mr-1">Add emoji:</span>
                    {emojis.map((e) => (
                      <button
                        key={e}
                        type="button"
                        disabled={remaining <= 0}
                        onClick={() => setPersonalization((prev) => sanitize(prev + e))}
                        className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-purple disabled:opacity-30 disabled:hover:border-gray-200 flex items-center justify-center text-lg"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-navy/40 mt-2">{tokens.length}/{max}</p>
              </div>
            )
          })()}

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
