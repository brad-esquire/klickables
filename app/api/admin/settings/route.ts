import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value')
  return NextResponse.json(Object.fromEntries((data ?? []).map((r) => [r.key, r.value])))
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = createAdminClient()

  for (const [key, value] of Object.entries(body)) {
    await db.from('settings').upsert({ key, value: String(value) })
  }

  return NextResponse.json({ success: true })
}
