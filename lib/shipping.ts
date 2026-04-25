import { createAdminClient } from './supabase'

export async function getShippingCost(subtotal: number): Promise<number> {
  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value').in('key', ['shipping_threshold', 'shipping_cost'])

  const threshold = parseFloat(data?.find((r) => r.key === 'shipping_threshold')?.value ?? '50')
  const cost = parseFloat(data?.find((r) => r.key === 'shipping_cost')?.value ?? '8.00')

  return subtotal >= threshold ? 0 : cost
}
