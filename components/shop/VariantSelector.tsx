'use client'

import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedId: string | null
  onSelect: (variant: ProductVariant) => void
  ignoreStock?: boolean
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
}

const GRADIENT_MAP: Record<string, string> = {
  'titanium black': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 20%, #4a4a4a 35%, #111 50%, #555 65%, #1a1a1a 80%, #0a0a0a 100%)',
  'titanium blue':  'linear-gradient(135deg, #0d1b2a 0%, #1B3A6B 20%, #3a6bc4 35%, #0f2547 50%, #4a7fd4 65%, #1B3A6B 80%, #0d1b2a 100%)',
  gold:    'linear-gradient(135deg, #8a6d1f 0%, #d4af37 20%, #f9e27a 35%, #b8860b 50%, #f9e27a 65%, #d4af37 80%, #8a6d1f 100%)',
  rainbow: 'linear-gradient(135deg, #ff0000 0%, #ff8000 17%, #ffff00 33%, #00cc00 50%, #0080ff 67%, #8000ff 83%, #ff00ff 100%)',
  mystery: 'conic-gradient(from 0deg, #9655C8, #F06591, #7ED4EE, #22C55E, #EAB308, #F97316, #9655C8)',
}

export default function VariantSelector({ variants, selectedId, onSelect, ignoreStock }: VariantSelectorProps) {
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[]
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[]

  return (
    <div className="space-y-4">
      {colors.length > 0 && (
        <div>
          <p className="text-sm font-bold text-navy mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color && (selectedId ? v.id === selectedId || variants.find(x => x.id === selectedId)?.size === v.size : true))
              const isSelected = variant && selectedId === variant?.id
              const key = color.trim().toLowerCase()
              const isMystery = key === 'mystery'
              const isGlow = key.startsWith('glow in the dark')
              const baseKey = isGlow ? key.replace('glow in the dark', '').trim() : key
              const gradient = GRADIENT_MAP[baseKey]
              const hex = COLOR_MAP[baseKey]
              // If the label doesn't map to a known color/gradient and isn't mystery/glow,
              // treat it as a glyph (emoji, heart, star, letter) and render the text itself.
              const isGlyph = !gradient && !hex && !isMystery && !isGlow

              const swatchStyle = isGlyph
                ? { backgroundColor: '#F3F4F6' }
                : {
                    ...(gradient ? { background: gradient } : { backgroundColor: hex ?? '#ccc' }),
                    ...(isGlow ? { boxShadow: '0 0 10px 3px rgba(132, 255, 153, 0.9)' } : {}),
                  }

              return (
                <button
                  key={color}
                  title={color}
                  onClick={() => {
                    const match = variants.find(
                      (v) => v.color === color &&
                        (sizes.length === 0 || v.size === variants.find(x => x.id === selectedId)?.size)
                    ) ?? variants.find((v) => v.color === color)
                    if (match) onSelect(match)
                  }}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center leading-none',
                    isSelected ? 'border-navy scale-110' : 'border-transparent hover:scale-110'
                  )}
                  style={swatchStyle}
                >
                  {isMystery && <span className="text-white text-sm font-black drop-shadow">?</span>}
                  {isGlyph && <span className="text-base text-navy font-bold">{color}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-bold text-navy mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = variants.find((v) => v.size === size && (selectedId ? v.color === variants.find(x => x.id === selectedId)?.color : true))
              const isSelected = variant && selectedId === variant?.id
              const outOfStock = !ignoreStock && variant?.stock === 0

              return (
                <button
                  key={size}
                  disabled={outOfStock}
                  onClick={() => {
                    const match = variants.find(
                      (v) => v.size === size &&
                        (colors.length === 0 || v.color === variants.find(x => x.id === selectedId)?.color)
                    ) ?? variants.find((v) => v.size === size)
                    if (match && !outOfStock) onSelect(match)
                  }}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-all',
                    isSelected
                      ? 'bg-navy text-white border-navy'
                      : outOfStock
                        ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                        : 'border-navy text-navy hover:bg-navy hover:text-white'
                  )}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
