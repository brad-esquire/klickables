'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { CheckCircle } from 'lucide-react'

export default function FulfillButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleFulfill() {
    if (!confirm('Mark this order as fulfilled?')) return
    setLoading(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'fulfilled' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button onClick={handleFulfill} disabled={loading} variant="secondary" size="lg" className="w-full">
      <CheckCircle size={18} className="mr-2" />
      {loading ? 'Marking Fulfilled...' : 'Mark as Fulfilled'}
    </Button>
  )
}
