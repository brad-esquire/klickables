import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('products').select('*, product_variants(*)').eq('id', id).single()
  return data ? NextResponse.json(data) : NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { name, slug, description, active, images, variants } = await req.json()
  const db = createAdminClient()

  const { error } = await db.from('products').update({ name, slug, description, active, images: images ?? [], updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Upsert variants: update existing (by id), insert new (no id), delete removed
  const incoming = (variants ?? []) as { id?: string; color: string | null; size: string | null; price: number; stock: number; sku: string | null }[]
  const incomingIds = incoming.map((v) => v.id).filter(Boolean) as string[]

  // Delete variants that were removed (only those with no order references)
  const { data: existing } = await db.from('product_variants').select('id').eq('product_id', id)
  const removedIds = (existing ?? []).map((v: { id: string }) => v.id).filter((vid: string) => !incomingIds.includes(vid))
  for (const vid of removedIds) {
    await db.from('product_variants').delete().eq('id', vid)
  }

  // Update existing or insert new
  for (const v of incoming) {
    const payload = { product_id: id, color: v.color, size: v.size, price: v.price, stock: v.stock, sku: v.sku }
    if (v.id) {
      await db.from('product_variants').update(payload).eq('id', v.id)
    } else {
      await db.from('product_variants').insert(payload)
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const db = createAdminClient()
  await db.from('products').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
