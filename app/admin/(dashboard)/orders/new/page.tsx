import type { Metadata } from 'next'
import CreateOrderForm from '@/components/admin/CreateOrderForm'

export const metadata: Metadata = { title: 'New Order — Admin' }

export default function NewOrderPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">New Order</h1>
      <CreateOrderForm />
    </div>
  )
}
