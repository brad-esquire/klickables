import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { description, amount, category, date } = await req.json()
  if (!description?.trim() || !amount || amount <= 0 || !date) {
    return NextResponse.json({ error: 'Invalid expense data' }, { status: 400 })
  }
  const db = createAdminClient()
  const { data, error } = await db.from('expenses').update({ description: description.trim(), amount, category: category || 'Other', date }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  await db.from('expenses').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
