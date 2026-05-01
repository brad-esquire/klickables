'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this expense?')) return
    setLoading(true)
    await fetch(`/api/admin/expenses/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 text-navy/40 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  )
}
