'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, GripVertical } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

interface Variant { price: number }
interface Product {
  id: string
  name: string
  slug: string
  active: boolean
  sort_order: number
  product_variants?: Variant[]
}

export default function ProductSortList({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const orderSaved = useRef(true)

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Delay so the drag ghost renders before we visually dim the row
    setTimeout(() => setDragIndex(index), 0)
  }

  function handleDragEnter(index: number) {
    if (index === dragIndex) return
    setOverIndex(index)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) return

    const reordered = [...products]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    setProducts(reordered)
    setDragIndex(null)
    setOverIndex(null)
    orderSaved.current = false
    saveOrder(reordered)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  async function saveOrder(ordered: Product[]) {
    setSaving(true)
    await fetch('/api/admin/products/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: ordered.map((p, i) => ({ id: p.id, sort_order: i })),
      }),
    })
    setSaving(false)
    orderSaved.current = true
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {saving && (
        <div className="px-5 py-2 bg-purple/10 text-purple text-xs font-semibold text-center">
          Saving order…
        </div>
      )}
      <table className="w-full">
        <thead className="bg-gray-50 text-xs font-bold text-navy/60 uppercase">
          <tr>
            <th className="px-3 py-3 w-8" />
            <th className="px-5 py-3 text-left">Product</th>
            <th className="px-5 py-3 text-left hidden sm:table-cell">Variants</th>
            <th className="px-5 py-3 text-left">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p, i) => {
            const prices = p.product_variants?.map((v) => v.price) ?? []
            const minPrice = prices.length ? Math.min(...prices) : null
            const maxPrice = prices.length ? Math.max(...prices) : null
            const priceLabel =
              minPrice === null
                ? '—'
                : minPrice === maxPrice
                ? `$${minPrice.toFixed(2)}`
                : `$${minPrice.toFixed(2)} – $${maxPrice!.toFixed(2)}`

            const isDragging = dragIndex === i
            const isOver = overIndex === i

            return (
              <tr
                key={p.id}
                draggable
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className={[
                  'transition-colors select-none',
                  isDragging ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50',
                  isOver && !isDragging ? 'border-t-2 border-purple' : '',
                ].join(' ')}
              >
                <td className="pl-3 pr-1 py-4 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
                  <GripVertical size={16} />
                </td>
                <td className="px-5 py-4">
                  <Link href={`/admin/products/${p.id}/edit`} className="font-bold text-navy hover:text-purple transition-colors">
                    {p.name}
                  </Link>
                  <p className="text-sm text-navy/50">/{p.slug}</p>
                </td>
                <td className="px-5 py-4 text-sm text-navy/70 hidden sm:table-cell">
                  {p.product_variants?.length ?? 0} variant
                  {(p.product_variants?.length ?? 0) !== 1 ? 's' : ''} · {priceLabel}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={p.active ? 'green' : 'red'}>{p.active ? 'Active' : 'Hidden'}</Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/products/${p.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
