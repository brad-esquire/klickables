'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { DollarSign } from 'lucide-react'

export default function MarkPaidButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleMarkPaid() {
    const note = window.prompt('Payment note (e.g. Cash, Bank transfer):', 'Cash')
    if (note === null) return
    setLoading(true)
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paymentNote: note.trim() || 'Cash' }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button onClick={handleMarkPaid} disabled={loading} variant="outline" size="lg" className="w-full">
      <DollarSign size={18} className="mr-2" />
      {loading ? 'Recording Payment...' : 'Mark as Paid (Cash)'}
    </Button>
  )
}
