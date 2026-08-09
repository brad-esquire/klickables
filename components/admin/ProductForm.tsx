'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import { Trash2, Plus, X, ImagePlus, Loader2, Play, Star } from 'lucide-react'
import { parseEmojiList } from '@/lib/personalization'

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

function isGifUrl(url: string) {
  return /\.gif(\?|$)/i.test(url)
}
import type { Product, ProductVariant } from '@/types'

// The priced axis: each option has a name, a price (shared across its colors),
// and an optional personalization cap. `key` is a stable local id.
interface VariantDef {
  key: string
  name: string
  price: string
  personalizationMax: string
}

// Inventory for one (variant option × color) combination.
interface Cell {
  id?: string
  stock: string
  sku: string
  active: boolean
}

const cellKey = (variantKey: string, color: string) => `${variantKey}||${color}`

// Derive the form's variant/color/inventory state from a product's rows.
function buildVariantState(product?: Product & { product_variants?: ProductVariant[] }) {
  const rows = product?.product_variants ?? []
  const names = [...new Set(rows.map((r) => r.variant_name).filter(Boolean))] as string[]
  const colors = [...new Set(rows.map((r) => r.color).filter(Boolean))] as string[]
  const defs: VariantDef[] = names.map((name, idx) => {
    const row = rows.find((r) => r.variant_name === name)!
    return {
      key: `v${idx}`,
      name,
      price: row.price != null ? String(row.price) : '',
      personalizationMax: row.personalization_max_length != null ? String(row.personalization_max_length) : '',
    }
  })
  const baseRow = rows.find((r) => !r.variant_name) ?? rows[0]
  const basePrice = baseRow?.price != null ? String(baseRow.price) : ''
  const cells: Record<string, Cell> = {}
  for (const r of rows) {
    const def = defs.find((d) => d.name === r.variant_name)
    cells[cellKey(def?.key ?? '', r.color ?? '')] = {
      id: r.id,
      stock: r.stock != null ? String(r.stock) : '0',
      sku: r.sku ?? '',
      active: r.active ?? true,
    }
  }
  return { defs, colors, basePrice, cells, nextKey: defs.length }
}

interface ProductFormProps {
  product?: Product & { product_variants?: ProductVariant[] }
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const isEdit = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [active, setActive] = useState(product?.active ?? true)
  const [ignoreStock, setIgnoreStock] = useState(product?.ignore_stock ?? false)
  const [variantLabel, setVariantLabel] = useState(product?.variant_label ?? 'Color')
  const [personalizationEnabled, setPersonalizationEnabled] = useState(product?.personalization_enabled ?? false)
  const [personalizationMaxLength, setPersonalizationMaxLength] = useState((product?.personalization_max_length ?? 20).toString())
  const [personalizationEmojis, setPersonalizationEmojis] = useState<string[]>(product?.personalization_emojis ?? [])
  const [emojiInput, setEmojiInput] = useState('')
  const [emojiHint, setEmojiHint] = useState('')
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // ── Variants (priced axis) × Colors (cosmetic) → per-combination inventory ──
  const [init] = useState(() => buildVariantState(product))
  const [basePrice, setBasePrice] = useState(init.basePrice)
  const [variantDefs, setVariantDefs] = useState<VariantDef[]>(init.defs)
  const [colors, setColors] = useState<string[]>(init.colors)
  const [cells, setCells] = useState<Record<string, Cell>>(init.cells)
  const [colorInput, setColorInput] = useState('')
  const keyCounter = useRef(init.nextKey)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const getCell = (variantKey: string, color: string): Cell =>
    cells[cellKey(variantKey, color)] ?? { stock: '0', sku: '', active: true }
  const patchCell = (variantKey: string, color: string, patch: Partial<Cell>) =>
    setCells((c) => {
      const k = cellKey(variantKey, color)
      return { ...c, [k]: { ...(c[k] ?? { stock: '0', sku: '', active: true }), ...patch } }
    })

  function addVariantDef() {
    setVariantDefs((d) => [...d, { key: `v${keyCounter.current++}`, name: '', price: basePrice, personalizationMax: '' }])
  }
  function removeVariantDef(key: string) {
    setVariantDefs((d) => d.filter((x) => x.key !== key))
    setCells((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith(`${key}||`))))
  }
  function updateVariantDef(key: string, field: keyof VariantDef, val: string) {
    setVariantDefs((d) => d.map((x) => (x.key === key ? { ...x, [field]: val } : x)))
  }

  function addColor(raw: string) {
    const name = raw.trim()
    if (!name || colors.some((c) => c.toLowerCase() === name.toLowerCase())) return
    setColors((c) => [...c, name])
    setColorInput('')
  }
  function removeColor(name: string) {
    setColors((c) => c.filter((x) => x !== name))
  }

  // The combinations that become product_variants rows: variants × colors, with
  // a single base row when an axis is empty.
  const defList: (VariantDef | null)[] = variantDefs.length ? variantDefs : [null]
  const colorList: (string | null)[] = colors.length ? colors : [null]

  function autoSlug(n: string) {
    setName(n)
    if (!isEdit) setSlug(slugify(n))
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploadError('')
    setUploading(true)

    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return }
      setImages((imgs) => [...imgs, data.url])
    } catch {
      setUploadError('Upload failed — please check your connection and try again')
    } finally {
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((imgs) => imgs.filter((_, i) => i !== index))
  }

  function setMainImage(index: number) {
    setImages((imgs) => [imgs[index], ...imgs.filter((_, i) => i !== index)])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Expand variants × colors into one row per combination.
    const rows = []
    for (const def of defList) {
      const price = def ? parseFloat(def.price) : parseFloat(basePrice)
      if (!Number.isFinite(price)) {
        setError(def ? `Set a price for the "${def.name || 'unnamed'}" variant.` : 'Set a product price.')
        return
      }
      for (const color of colorList) {
        const cell = getCell(def?.key ?? '', color ?? '')
        rows.push({
          id: cell.id,
          color: color ?? null,
          variant_name: def ? (def.name.trim() || null) : null,
          price,
          stock: parseInt(cell.stock) || 0,
          sku: cell.sku.trim() || null,
          active: cell.active,
          personalization_max_length:
            def && def.personalizationMax.trim() ? Math.max(1, parseInt(def.personalizationMax)) : null,
        })
      }
    }
    if (variantDefs.some((d) => !d.name.trim())) {
      setError('Every variant option needs a name.')
      return
    }

    setSaving(true)
    const body = {
      name,
      slug,
      description,
      active,
      ignore_stock: ignoreStock,
      variant_label: variantLabel.trim() || 'Options',
      personalization_enabled: personalizationEnabled,
      personalization_max_length: Math.max(1, parseInt(personalizationMaxLength) || 20),
      personalization_emojis: personalizationEmojis,
      images,
      variants: rows,
    }

    const res = await fetch(
      isEdit ? `/api/admin/products/${product!.id}` : '/api/admin/products',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const d = await res.json()
      setError(d.error ?? 'Save failed')
      setSaving(false)
      return
    }
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Product details */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-navy">Product Details</h2>

        <div>
          <label className="block text-sm font-bold text-navy mb-1">Product Name</label>
          <input
            value={name}
            onChange={(e) => autoSlug(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-navy mb-1">Slug (URL)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-navy mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 accent-purple" />
          <span className="font-semibold text-navy text-sm">Active (visible in shop)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={ignoreStock} onChange={(e) => setIgnoreStock(e.target.checked)} className="w-4 h-4 accent-purple" />
          <div>
            <span className="font-semibold text-navy text-sm">Allow purchase when out of stock</span>
            <p className="text-xs text-navy/50 mt-0.5">Customers can still buy this product even if stock reaches zero</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={personalizationEnabled} onChange={(e) => setPersonalizationEnabled(e.target.checked)} className="w-4 h-4 accent-purple" />
          <div>
            <span className="font-semibold text-navy text-sm">Allow personalization text</span>
            <p className="text-xs text-navy/50 mt-0.5">Customers can enter letters/initials at checkout (e.g. for the letter clicker)</p>
          </div>
        </label>

        {personalizationEnabled && (
          <div className="ml-7 space-y-4">
            <div>
              <label className="block text-sm font-bold text-navy mb-1">Max characters</label>
              <input
                type="number"
                min={1}
                max={100}
                value={personalizationMaxLength}
                onChange={(e) => setPersonalizationMaxLength(e.target.value)}
                className="w-24 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-navy mb-1">
                Available emojis <span className="font-normal text-navy/40">(optional — buyers can pick from these)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emojiInput}
                  onChange={(e) => { setEmojiInput(e.target.value); if (emojiHint) setEmojiHint('') }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const parsed = parseEmojiList(emojiInput)
                      if (parsed.length > 0) {
                        setPersonalizationEmojis((prev) => {
                          const seen = new Set(prev)
                          const next = [...prev]
                          for (const p of parsed) if (!seen.has(p)) { next.push(p); seen.add(p) }
                          return next
                        })
                        setEmojiInput('')
                        setEmojiHint('')
                      } else if (emojiInput.trim()) {
                        setEmojiHint(`"${emojiInput.trim()}" isn't a recognized name — try a common word like "heart" or paste the emoji itself (❤️).`)
                      }
                    }
                  }}
                  placeholder="Type a name (heart, star, moon) or paste an emoji, then press Enter"
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple"
                />
              </div>
              {emojiHint && <p className="text-xs text-orange-500 mt-1.5">{emojiHint}</p>}
              {personalizationEmojis.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {personalizationEmojis.map((e, i) => (
                    <button
                      key={`${e}-${i}`}
                      type="button"
                      onClick={() => setPersonalizationEmojis((prev) => prev.filter((_, idx) => idx !== i))}
                      className="group flex items-center gap-1 border-2 border-gray-200 hover:border-red-400 rounded-full pl-3 pr-2 py-1 text-lg"
                      title="Click to remove"
                    >
                      <span>{e}</span>
                      <X size={14} className="text-gray-400 group-hover:text-red-500" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-navy/40 mt-2">No emojis yet — buyers will only see the text input.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Media */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-navy">Product Media</h2>
        <p className="text-xs text-navy/50">Hover an image and click the ★ to set it as the main image shown in the shop. Add short clips (MP4, WebM, MOV) or animated GIFs to show the clicker in action. All files up to 5.5 MB — compress longer videos first.</p>

        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group bg-black">
              {isVideoUrl(url) ? (
                <>
                  <video
                    src={url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    autoPlay
                    playsInline
                  />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center pointer-events-none">
                    <Play size={10} fill="white" />
                  </span>
                </>
              ) : (
                <Image
                  src={url}
                  alt={`Product media ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                  unoptimized={url.startsWith('/uploads/') || isGifUrl(url)}
                />
              )}
              {i === 0 ? (
                <span className="absolute bottom-1 left-1 bg-purple text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={8} fill="white" /> Main
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setMainImage(i)}
                  className="absolute bottom-1 left-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple"
                  title="Set as main image"
                >
                  <Star size={10} />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {images.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-purple hover:text-purple transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <ImagePlus size={24} />
                  <span className="text-xs font-semibold">Add Photo/Video</span>
                </>
              )}
            </button>
          )}
        </div>

        {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          onChange={handleImagePick}
          className="hidden"
        />
      </div>

      {/* Variants & pricing */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="font-black text-navy">Variants &amp; Pricing</h2>

        {/* Base price — only when there is no priced variant axis */}
        {variantDefs.length === 0 && (
          <div>
            <label className="block text-sm font-bold text-navy mb-1">Price ($)</label>
            <input
              type="number" step="0.01" min="0"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-32 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple"
            />
            <p className="text-xs text-navy/50 mt-1">The product price. Add variant options below if different variants (sizes, letter counts, ball types…) have different prices.</p>
          </div>
        )}

        {/* Variant options (priced axis) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-navy">Variant options</span>
              <span className="text-navy/40 text-xs font-normal"> — optional priced axis</span>
            </div>
            <button type="button" onClick={addVariantDef} className="flex items-center gap-1 text-sm text-purple font-bold hover:text-pink transition-colors">
              <Plus size={16} /> Add option
            </button>
          </div>

          {variantDefs.length > 0 && (
            <>
              <div>
                <label className="block text-xs font-bold text-navy/60 mb-1">Heading shown to shoppers</label>
                <input
                  value={variantLabel}
                  onChange={(e) => setVariantLabel(e.target.value)}
                  placeholder="e.g. Size, Ball type, Number of letters"
                  className="w-64 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple"
                />
              </div>
              {variantDefs.map((def) => (
                <div key={def.key} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Name</label>
                    <input value={def.name} onChange={(e) => updateVariantDef(def.key, 'name', e.target.value)} placeholder="e.g. 3 letter" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-navy/60 mb-1">Price ($)</label>
                    <input type="number" step="0.01" min="0" value={def.price} onChange={(e) => updateVariantDef(def.key, 'price', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                  </div>
                  {personalizationEnabled && (
                    <div className="w-28">
                      <label className="block text-xs font-bold text-navy/60 mb-1" title={`Blank = product max (${personalizationMaxLength || 20})`}>Max letters</label>
                      <input type="number" min={1} max={100} value={def.personalizationMax} onChange={(e) => updateVariantDef(def.key, 'personalizationMax', e.target.value)} placeholder={`${personalizationMaxLength || 20}`} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
                    </div>
                  )}
                  <button type="button" onClick={() => removeVariantDef(def.key)} className="text-gray-300 hover:text-red-500 transition-colors mb-2.5" title="Remove option">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-navy/50">Price is set per variant and applies to all of its colors.</p>
            </>
          )}
        </div>

        {/* Colors (cosmetic axis) */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-sm font-bold text-navy">
            Colors <span className="text-navy/40 text-xs font-normal">— optional, same price across colors</span>
          </label>
          <input
            type="text"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(colorInput) } }}
            placeholder="Type a color (e.g. Purple) then press Enter"
            className="w-64 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple"
          />
          {colors.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => removeColor(c)}
                  className="group flex items-center gap-1 border-2 border-gray-200 hover:border-red-400 rounded-full pl-3 pr-2 py-1 text-sm font-semibold text-navy"
                  title="Click to remove"
                >
                  <span>{c}</span>
                  <X size={14} className="text-gray-400 group-hover:text-red-500" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-navy/40">No colors — the product has no color choice.</p>
          )}
        </div>

        {/* Inventory grid: one row per combination */}
        <div className="space-y-2 border-t border-gray-100 pt-4">
          <label className="block text-sm font-bold text-navy">
            Inventory {ignoreStock && <span className="text-navy/40 text-xs font-normal">— stock not enforced for this product</span>}
          </label>
          <div className="space-y-1.5">
            {defList.map((def) =>
              colorList.map((color) => {
                const vk = def?.key ?? ''
                const ck = color ?? ''
                const cell = getCell(vk, ck)
                const comboLabel = [def?.name, color].filter(Boolean).join(' / ') || 'Default'
                return (
                  <div key={`${vk}||${ck}`} className={`grid grid-cols-12 gap-2 items-center border border-gray-100 rounded-xl px-3 py-2 ${cell.active ? '' : 'bg-gray-50 opacity-70'}`}>
                    <span className="col-span-5 text-sm font-semibold text-navy truncate" title={comboLabel}>{comboLabel}</span>
                    <div className="col-span-3">
                      <input type="number" min="0" value={cell.stock} onChange={(e) => patchCell(vk, ck, { stock: e.target.value })} placeholder="Stock" title="Stock" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple" />
                    </div>
                    <div className="col-span-3">
                      <input value={cell.sku} onChange={(e) => patchCell(vk, ck, { sku: e.target.value })} placeholder="SKU" title="SKU" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-purple" />
                    </div>
                    <label className="col-span-1 flex items-center justify-end cursor-pointer" title="Sell on website">
                      <input type="checkbox" checked={cell.active} onChange={(e) => patchCell(vk, ck, { active: e.target.checked })} className="w-4 h-4 accent-purple" />
                    </label>
                  </div>
                )
              })
            )}
          </div>
          <p className="text-xs text-navy/50">Untick a combination to stop selling it without losing order history. A combination that has already been ordered is kept (and hidden) rather than deleted when you remove its variant or color, so history is preserved.</p>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} size="lg">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}
