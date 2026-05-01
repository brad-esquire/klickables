'use client'

import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function OutForDeliveryButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleMark() {
    if (!confirm('Mark this order as out for delivery?')) return
    setLoading(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'out_for_delivery' }),
    })
    window.location.reload()
  }

  return (
    <Button onClick={handleMark} disabled={loading} size="sm">
      <PackageCheck size={14} className="mr-1.5" />
      {loading ? 'Marking...' : 'Out for Delivery'}
    </Button>
  )
}
