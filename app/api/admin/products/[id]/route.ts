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
  const { name, slug, description, active, ignore_stock, images, variants, variant_label, personalization_enabled, personalization_max_length, personalization_emojis } = await req.json()
  const db = createAdminClient()

  const { error } = await db.from('products').update({
    name, slug, description, active,
    ignore_stock: ignore_stock ?? false,
    variant_label: variant_label?.trim() || 'Color',
    personalization_enabled: personalization_enabled ?? false,
    personalization_max_length: personalization_max_length ?? 20,
    personalization_emojis: Array.isArray(personalization_emojis) ? personalization_emojis : [],
    images: images ?? [],
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Reconcile combination rows. Each incoming row is matched to an existing row by its
  // id, or — when the grid regenerated rows without ids after a structural change —
  // adopted by natural key (variant_name × color), so an ordered combination is reused
  // rather than duplicated.
  const incoming = (variants ?? []) as { id?: string; color: string | null; variant_name?: string | null; price: number; stock: number; sku: string | null; active?: boolean; personalization_max_length?: number | null }[]
  const naturalKey = (r: { variant_name?: string | null; color?: string | null }) => `${r.variant_name ?? ''}||${r.color ?? ''}`

  const { data: existing } = await db.from('product_variants').select('id, color, variant_name').eq('product_id', id)
  const existingRows = (existing ?? []) as { id: string; color: string | null; variant_name: string | null }[]
  const idByKey = new Map<string, string>()
  for (const r of existingRows) if (!idByKey.has(naturalKey(r))) idByKey.set(naturalKey(r), r.id)

  const claimed = new Set<string>()
  const resolved = incoming.map((v) => {
    let vid = v.id
    if (!vid) {
      const adopt = idByKey.get(naturalKey(v))
      if (adopt && !claimed.has(adopt)) vid = adopt
    }
    if (vid) claimed.add(vid)
    return { ...v, id: vid }
  })

  // Rows no incoming combination claimed are removed. Ordered ones can't be hard-deleted
  // without losing history, so deactivate them instead (kept, hidden from the shop);
  // hard-delete the rest.
  for (const r of existingRows) {
    if (claimed.has(r.id)) continue
    const { count } = await db.from('order_items').select('id', { count: 'exact', head: true }).eq('variant_id', r.id)
    if ((count ?? 0) > 0) {
      const { error: deactErr } = await db.from('product_variants').update({ active: false }).eq('id', r.id)
      if (deactErr) return NextResponse.json({ error: deactErr.message }, { status: 400 })
    } else {
      const { error: delErr } = await db.from('product_variants').delete().eq('id', r.id)
      if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 })
    }
  }

  // Update matched/adopted rows; insert genuinely new combinations.
  for (const v of resolved) {
    const payload = { product_id: id, color: v.color ?? null, variant_name: v.variant_name ?? null, price: v.price, stock: v.stock, sku: v.sku, active: v.active ?? true, personalization_max_length: v.personalization_max_length ?? null }
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
