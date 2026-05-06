'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { CUSTOM_CLICKER_COLORS } from '@/types'
import Button from '@/components/ui/Button'

const MIN_QTY = 50
const PRICE_PER = 2

export default function CustomClickerForm() {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)

  const [color1, setColor1] = useState<string | null>(null)
  const [color2, setColor2] = useState<string | null>(null)
  const [qty, setQty] = useState(50)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const total = qty * PRICE_PER

  const color1Name = CUSTOM_CLICKER_COLORS.find((c) => c.hex === color1)?.name ?? ''
  const color2Name = CUSTOM_CLICKER_COLORS.find((c) => c.hex === color2)?.name ?? ''

  const canSubmit = color1 && color2 && color1 !== color2 && qty >= MIN_QTY && logoFile

  function handleFileChange(file: File | null) {
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setError('Only PNG, JPG, or SVG files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be under 5 MB.')
      return
    }
    setError(null)
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleAddToCart() {
    if (!canSubmit) return
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('logo', logoFile!)
      const res = await fetch('/api/upload/logo', { method: 'POST', body: formData })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Upload failed')
      }
      const { url: logoUrl } = await res.json()

      addItem({
        variantId: 'custom-clicker',
        productId: 'custom-clicker',
        productName: 'Custom Clicker',
        variantLabel: `${color1Name} / ${color2Name}`,
        price: PRICE_PER,
        quantity: qty,
        image: logoUrl,
        customization: { color1: color1Name, color2: color2Name, logoUrl },
      })
      router.push('/cart')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Color 1 */}
      <div>
        <h2 className="text-lg font-black text-navy mb-3">Color 1 — Primary</h2>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_CLICKER_COLORS.map((c) => {
            const selected = color1 === c.hex
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor1(c.hex)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-purple bg-purple/5 text-navy scale-105 shadow-sm'
                    : 'border-gray-200 hover:border-gray-400 text-navy/70'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Color 2 */}
      <div>
        <h2 className="text-lg font-black text-navy mb-3">Color 2 — Accent</h2>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_CLICKER_COLORS.map((c) => {
            const selected = color2 === c.hex
            const disabled = c.hex === color1
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => !disabled && setColor2(c.hex)}
                disabled={disabled}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-purple bg-purple/5 text-navy scale-105 shadow-sm'
                    : disabled
                    ? 'opacity-30 cursor-not-allowed border-gray-200 text-navy/50'
                    : 'border-gray-200 hover:border-gray-400 text-navy/70'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                {c.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quantity */}
      <div>
        <h2 className="text-lg font-black text-navy mb-3">Quantity</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min={MIN_QTY}
            step={1}
            value={qty}
            onChange={(e) => setQty(Math.max(MIN_QTY, parseInt(e.target.value) || MIN_QTY))}
            className="w-28 border border-gray-200 rounded-xl px-4 py-2.5 text-navy font-semibold text-center focus:outline-none focus:ring-2 focus:ring-purple/30"
          />
          <p className="text-navy/70 text-sm">
            {qty} clickers × $2.00 = <span className="font-black text-navy text-base">${total.toFixed(2)}</span>
          </p>
        </div>
        {qty < MIN_QTY && (
          <p className="text-sm text-red-500 mt-1.5">Minimum order is {MIN_QTY} clickers.</p>
        )}
      </div>

      {/* Logo Upload */}
      <div>
        <h2 className="text-lg font-black text-navy mb-3">Business Logo</h2>
        {logoPreview ? (
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
              <Image src={logoPreview} alt="Logo preview" fill className="object-contain p-1" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-navy">{logoFile?.name}</p>
              <button
                type="button"
                onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-semibold"
              >
                <X size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-purple rounded-2xl p-8 text-center transition-colors group"
          >
            <Upload size={28} className="mx-auto mb-2 text-gray-400 group-hover:text-purple transition-colors" />
            <p className="text-sm font-semibold text-navy/70 group-hover:text-navy transition-colors">
              Click to upload your logo
            </p>
            <p className="text-xs text-navy/40 mt-1">PNG, JPG, or SVG — max 5 MB</p>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 font-semibold">{error}</p>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={!canSubmit || uploading}
        className="w-full py-4 text-base"
      >
        {uploading ? 'Uploading logo…' : `Add to Cart — $${total.toFixed(2)}`}
      </Button>

      <p className="text-xs text-navy/40 text-center">
        Minimum 50 clickers · $2.00 each · Custom colors &amp; your logo printed on every clicker
      </p>
    </div>
  )
}
