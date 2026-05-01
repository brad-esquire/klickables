import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminClient()
  const { data } = await db.from('expenses').select('*').order('date', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { description, amount, category, date } = await req.json()
  if (!description?.trim() || !amount || amount <= 0 || !date) {
    return NextResponse.json({ error: 'Invalid expense data' }, { status: 400 })
  }
  const db = createAdminClient()
  const { data, error } = await db.from('expenses').insert({ description: description.trim(), amount, category: category || 'Other', date }).select().single()
  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
