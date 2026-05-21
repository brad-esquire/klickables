'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export default function BackfillButton() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result,  setResult]  = useState<string | null>(null)

  async function handle() {
    if (running) return
    setRunning(true)
    setResult(null)
    const res = await fetch('/api/admin/money/backfill', { method: 'POST' })
    setRunning(false)
    if (!res.ok) {
      setResult('Failed.')
      return
    }
    const { orders, expenses } = await res.json()
    setResult(`Synced ${orders} orders, ${expenses} expenses.`)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handle}
        disabled={running}
        className="flex items-center gap-1.5 text-xs font-bold text-navy/60 hover:text-navy transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw size={12} className={running ? 'animate-spin' : ''} />
        {running ? 'Syncing…' : 'Resync from sources'}
      </button>
      {result && <span className="text-xs text-navy/50">{result}</span>}
    </div>
  )
}
