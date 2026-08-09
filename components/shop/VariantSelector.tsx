'use client'

import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedColor: string | null
  selectedVariantName: string | null
  onSelectColor: (color: string) => void
  onSelectVariant: (variantName: string) => void
  ignoreStock?: boolean
  // Heading for the cosmetic color axis. Defaults to "Color".
  colorLabel?: string
  // Heading for the priced variant axis (products.variant_label).
  variantAxisLabel?: string
}

const COLOR_MAP: Record<string, string> = {
  purple: '#9655C8',
  pink: '#F06591',
  blue: '#7ED4EE',
  'light blue': '#7ED4EE',
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  white: '#F3F4F6',
  black: '#000000',
  navy: '#1B1E4B',
  strawberry: '#F8B5C7',
  chocolate: '#6F4E37',
  vanilla: '#F3F4F6',
}

const GRADIENT_MAP: Record<string, string> = {
  'titanium black': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 20%, #4a4a4a 35%, #111 50%, #555 65%, #1a1a1a 80%, #0a0a0a 100%)',
  'titanium blue':  'linear-gradient(135deg, #0d1b2a 0%, #1B3A6B 20%, #3a6bc4 35%, #0f2547 50%, #4a7fd4 65%, #1B3A6B 80%, #0d1b2a 100%)',
  gold:    'linear-gradient(135deg, #8a6d1f 0%, #d4af37 20%, #f9e27a 35%, #b8860b 50%, #f9e27a 65%, #d4af37 80%, #8a6d1f 100%)',
  rainbow: 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00cc00 50%, #0080ff 67%, #8000ff 83%, #ff00ff 100%)',
  mystery: 'conic-gradient(from 0deg, #9655C8, #F06591, #7ED4EE, #22C55E, #EAB308, #F97316, #9655C8)',
}

export default function VariantSelector({
  variants,
  selectedColor,
  selectedVariantName,
  onSelectColor,
  onSelectVariant,
  ignoreStock,
  colorLabel = 'Color',
  variantAxisLabel = 'Options',
}: VariantSelectorProps) {
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[]
  const variantNames = [...new Set(variants.map((v) => v.variant_name).filter(Boolean))] as string[]

  // A value on one axis is available if, holding the current selection on the
  // other axis, at least one active combination has stock. If the other axis is
  // absent it simply checks that value's own rows.
  const colorInStock = (color: string) => {
    if (ignoreStock) return true
    return variants.some(
      (v) => v.color === color &&
        (variantNames.length === 0 || v.variant_name === selectedVariantName) &&
        (v.stock ?? 0) > 0
    )
  }
  const variantInStock = (variantName: string) => {
    if (ignoreStock) return true
    return variants.some(
      (v) => v.variant_name === variantName &&
        (colors.length === 0 || v.color === selectedColor) &&
        (v.stock ?? 0) > 0
    )
  }

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-bold text-navy mb-2">{colorLabel}</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isSelected = selectedColor === color
              const outOfStock = !colorInStock(color)
              const key = color.trim().toLowerCase()
              const isMystery = key === 'mystery'
              const isGlow = key.startsWith('glow in the dark')
              const baseKey = isGlow ? key.replace('glow in the dark', '').trim() : key
              const gradient = GRADIENT_MAP[baseKey]
              const hex = COLOR_MAP[baseKey]
              // A label that maps to no known color/gradient and isn't mystery/glow
              // is a bare glyph (emoji, heart) when short — render it in the swatch.
              const isSwatchless = !gradient && !hex && !isMystery && !isGlow
              const isGlyph = isSwatchless && color.trim().length <= 2

              if (isGlyph) {
                return (
                  <button
                    key={color}
                    title={color}
                    onClick={() => onSelectColor(color)}
                    className={cn(
                      'w-9 h-9 rounded-full border-2 bg-gray-100 transition-all flex items-center justify-center leading-none text-lg',
                      isSelected ? 'border-navy scale-110' : 'border-transparent hover:scale-110',
                      outOfStock && 'opacity-40'
                    )}
                  >
                    {color}
                  </button>
                )
              }

              // Text label that isn't a known color → wide pill.
              if (isSwatchless) {
                return (
                  <button
                    key={color}
                    onClick={() => onSelectColor(color)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-bold border-2 whitespace-nowrap transition-all',
                      isSelected ? 'bg-navy text-white border-navy' : 'border-navy text-navy hover:bg-navy hover:text-white',
                      outOfStock && 'opacity-40'
                    )}
                  >
                    {color}
                  </button>
                )
              }

              const dotStyle = {
                ...(gradient ? { background: gradient } : { backgroundColor: hex ?? '#ccc' }),
                ...(isGlow ? { boxShadow: '0 0 8px 2px rgba(132, 255, 153, 0.9)' } : {}),
              }

              return (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border-2 pl-1.5 pr-3.5 py-1 text-sm font-bold transition-colors',
                    isSelected ? 'border-navy bg-navy/5 text-navy' : 'border-gray-200 hover:border-navy text-navy',
                    outOfStock && 'opacity-40'
                  )}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center"
                    style={dotStyle}
                  >
                    {isMystery && <span className="text-white text-[10px] font-black drop-shadow">?</span>}
                  </span>
                  <span>{color}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {variantNames.length > 0 && (
        <div>
          <p className="text-sm font-bold text-navy mb-2">{variantAxisLabel}</p>
          <div className="flex flex-wrap gap-2">
            {variantNames.map((name) => {
              const isSelected = selectedVariantName === name
              const outOfStock = !variantInStock(name)
              return (
                <button
                  key={name}
                  disabled={outOfStock}
                  onClick={() => onSelectVariant(name)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-bold border-2 whitespace-nowrap transition-all',
                    isSelected
                      ? 'bg-navy text-white border-navy'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-navy text-navy hover:bg-navy hover:text-white'
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
