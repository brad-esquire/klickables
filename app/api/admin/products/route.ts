import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data } = await db.from('products').select('*, product_variants(*)').order('sort_order', { ascending: true })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, slug, description, active, ignore_stock, images, variants } = body

  const db = createAdminClient()
  const { data: product, error } = await db
    .from('products')
    .insert({ name, slug, description, active, ignore_stock: ignore_stock ?? false, images: images ?? [] })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (variants?.length) {
    await db.from('product_variants').insert(
      variants.map((v: { color: string; size: string; price: number; stock: number; sku: string }) => ({
        product_id: product.id,
        color: v.color,
        size: v.size,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
      }))
    )
  }

  return NextResponse.json(product, { status: 201 })
}
