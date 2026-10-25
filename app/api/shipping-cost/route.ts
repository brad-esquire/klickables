import { NextRequest, NextResponse } from 'next/server'
import { getShippingSettings } from '@/lib/shipping'

export async function GET(req: NextRequest) {
  const subtotal = parseFloat(req.nextUrl.searchParams.get('subtotal') ?? '0')
  const { threshold, cost: flatRate } = await getShippingSettings()
  const cost = subtotal >= threshold ? 0 : flatRate
  return NextResponse.json({ cost, threshold, flatRate })
}
