'use client'

import { useRouter } from 'next/navigation'

export default function DiscountToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/admin/discounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      className={`w-10 h-6 rounded-full transition-colors relative ${active ? 'bg-purple' : 'bg-gray-300'}`}
      title={active ? 'Disable code' : 'Enable code'}
    >
      <span className={`block w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}
