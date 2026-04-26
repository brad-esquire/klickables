'use client'

import { cn } from '@/lib/utils'
import type { ProductVariant } from '@/types'

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedId: string | null
  onSelect: (variant: ProductVariant) => void
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
}

export default function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
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
              const key = color.toLowerCase()
              const gradient = GRADIENT_MAP[key]
              const hex = COLOR_MAP[key] ?? '#ccc'

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
                    'w-8 h-8 rounded-full border-2 transition-all',
                    isSelected ? 'border-navy scale-110' : 'border-transparent hover:scale-110'
                  )}
                  style={gradient ? { background: gradient } : { backgroundColor: hex }}
                />
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
              const outOfStock = variant?.stock === 0

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
