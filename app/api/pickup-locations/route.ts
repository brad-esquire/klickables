import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const db = createAdminClient()
  const { data } = await db.from('settings').select('value').eq('key', 'pickup_locations').single()
  try {
    const locations: string[] = JSON.parse(data?.value ?? '[]')
    return NextResponse.json({ locations })
  } catch {
    return NextResponse.json({ locations: [] })
  }
}
