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
  const { name, slug, description, active, ignore_stock, images, variants, variant_label, personalization_enabled, personalization_max_length, personalization_emojis } = body

  const db = createAdminClient()
  const { data: product, error } = await db
    .from('products')
    .insert({
      name, slug, description, active,
      ignore_stock: ignore_stock ?? false,
      variant_label: variant_label?.trim() || 'Color',
      personalization_enabled: personalization_enabled ?? false,
      personalization_max_length: personalization_max_length ?? 20,
      personalization_emojis: Array.isArray(personalization_emojis) ? personalization_emojis : [],
      images: images ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (variants?.length) {
    await db.from('product_variants').insert(
      variants.map((v: { color: string | null; variant_name?: string | null; price: number; stock: number; sku: string | null; active?: boolean; sort_order?: number; personalization_max_length?: number | null }) => ({
        product_id: product.id,
        color: v.color ?? null,
        variant_name: v.variant_name ?? null,
        price: v.price,
        stock: v.stock,
        sku: v.sku,
        active: v.active ?? true,
        sort_order: v.sort_order ?? 0,
        personalization_max_length: v.personalization_max_length ?? null,
      }))
    )
  }

  return NextResponse.json(product, { status: 201 })
}
