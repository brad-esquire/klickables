import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { order } = await req.json() as { order: { id: string; sort_order: number }[] }
  if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const db = createAdminClient()

  // Update each product's sort_order individually — Supabase doesn't support
  // bulk updates with different values per row via the REST API.
  await Promise.all(
    order.map(({ id, sort_order }) =>
      db.from('products').update({ sort_order }).eq('id', id)
    )
  )

  return NextResponse.json({ ok: true })
}
