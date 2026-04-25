import { NextRequest, NextResponse } from 'next/server'
import { getShippingCost } from '@/lib/shipping'

export async function GET(req: NextRequest) {
  const subtotal = parseFloat(req.nextUrl.searchParams.get('subtotal') ?? '0')
  const cost = await getShippingCost(subtotal)
  return NextResponse.json({ cost })
}
