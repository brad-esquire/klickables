'use client'

import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-400 hover:text-red-600">
      <Trash2 size={14} />
    </Button>
  )
}
