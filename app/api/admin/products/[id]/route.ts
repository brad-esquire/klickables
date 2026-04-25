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

  // Replace variants: delete old, insert new
  await db.from('product_variants').delete().eq('product_id', id)
  if (variants?.length) {
    await db.from('product_variants').insert(
      variants.map((v: { id?: string; color: string | null; size: string | null; price: number; stock: number; sku: string | null }) => ({
        product_id: id,
        color: v.color,
        size: v.size,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      }))
    )
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
