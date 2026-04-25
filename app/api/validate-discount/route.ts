import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()
  const subtotal = parseFloat(req.nextUrl.searchParams.get('subtotal') ?? '0')

  if (!code) return NextResponse.json({ error: 'No code provided' }, { status: 400 })

  const db = createAdminClient()
  const { data } = await db.from('discount_codes').select('*').eq('code', code).single()

  if (!data) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
  if (!data.active) return NextResponse.json({ error: 'This code is no longer active' }, { status: 400 })
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This code has expired' }, { status: 400 })
  }
  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return NextResponse.json({ error: 'This code has reached its usage limit' }, { status: 400 })
  }
  if (subtotal < data.min_order) {
    return NextResponse.json({ error: `Minimum order of $${data.min_order.toFixed(2)} required` }, { status: 400 })
  }

  const amount = data.type === 'percentage'
    ? Math.round(subtotal * (data.value / 100) * 100) / 100
    : Math.min(data.value, subtotal)

  const label = data.type === 'percentage'
    ? `${data.value}% off`
    : `$${data.value.toFixed(2)} off`

  return NextResponse.json({ amount, label, discountId: data.id })
}
