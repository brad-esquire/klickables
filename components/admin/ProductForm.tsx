'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Button from '@/components/ui/Button'
import { slugify } from '@/lib/utils'
import { Trash2, Plus, X, ImagePlus, Loader2, Play, Star } from 'lucide-react'

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

function isGifUrl(url: string) {
  return /\.gif(\?|$)/i.test(url)
}
import type { Product, ProductVariant } from '@/types'

interface Variant {
  id?: string
  color: string
  size: string
  price: string
  stock: string
  sku: string
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
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [variants, setVariants] = useState<Variant[]>(
    product?.product_variants?.map((v) => ({
      id: v.id,
      color: v.color ?? '',
      size: v.size ?? '',
      price: v.price.toString(),
      stock: v.stock.toString(),
      sku: v.sku ?? '',
    })) ?? [{ color: '', size: '', price: '', stock: '0', sku: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      let url: string

      if (process.env.NEXT_PUBLIC_USE_LOCAL_UPLOAD === 'true') {
        // Local dev: send file through the API route (no Netlify size limit)
        const fd = new FormData()
        fd.append('image', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) { setUploadError(data.error ?? 'Upload failed'); return }
        url = data.url
      } else {
        // Production: get a presigned URL then upload directly to Supabase
        // so the file never passes through the Netlify function body limit
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const urlRes = await fetch('/api/admin/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, size: file.size, filename }),
        })
        const urlData = await urlRes.json()
        if (!urlRes.ok) { setUploadError(urlData.error ?? 'Upload failed'); return }

        const uploadRes = await fetch(urlData.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!uploadRes.ok) { setUploadError('Storage upload failed — please try again'); return }

        url = urlData.publicUrl
      }

      setImages((imgs) => [...imgs, url])
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

  function addVariant() {
    setVariants((v) => [...v, { color: '', size: '', price: '', stock: '0', sku: '' }])
  }

  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i))
  }

  function updateVariant(i: number, field: keyof Variant, val: string) {
    setVariants((v) => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      name,
      slug,
      description,
      active,
      images,
      variants: variants.map((v) => ({
        id: v.id,
        color: v.color.trim() || null,
        size: v.size.trim() || null,
        price: parseFloat(v.price),
        stock: parseInt(v.stock),
        sku: v.sku || null,
      })),
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
      </div>

      {/* Media */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-black text-navy">Product Media</h2>
        <p className="text-xs text-navy/50">Hover an image and click the ★ to set it as the main image shown in the shop. Add videos (MP4, WebM, MOV — up to 50 MB) to show the clicker in action. Images up to 5 MB (JPEG, PNG, WebP, GIF).</p>

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

      {/* Variants */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-navy">Variants</h2>
          <button type="button" onClick={addVariant} className="flex items-center gap-1 text-sm text-purple font-bold hover:text-pink transition-colors">
            <Plus size={16} /> Add Variant
          </button>
        </div>

        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-6 gap-2 items-end border border-gray-100 rounded-xl p-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-navy/60 mb-1">Color</label>
              <input value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} placeholder="e.g. Purple" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">Size</label>
              <input value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)} placeholder="e.g. S" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">Price ($)</label>
              <input type="number" step="0.01" min="0" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
            </div>
            <div>
              <label className="block text-xs font-bold text-navy/60 mb-1">Stock</label>
              <input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => removeVariant(i)} disabled={variants.length === 1} className="text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
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
