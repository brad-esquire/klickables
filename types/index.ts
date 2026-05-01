export interface ProductVariant {
  id: string
  product_id: string
  color: string | null
  size: string | null
  price: number
  stock: number
  sku: string | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  images: string[]
  active: boolean
  ignore_stock: boolean
  created_at: string
  product_variants?: ProductVariant[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  product_name: string
  variant_label: string | null
  quantity: number
  unit_price: number
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'shipped' | 'out_for_delivery'
export type FulfillmentType = 'shipping' | 'pickup'


export interface Order {
  id: string
  stripe_payment_intent_id: string | null
  email: string
  customer_name: string
  shipping_address: ShippingAddress
  fulfillment_type: FulfillmentType
  pickup_location: string | null
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total: number
  discount_code: string | null
  created_at: string
  notes: string | null
  fulfilled_at: string | null
  tracking_number: string | null
  shipping_carrier: string | null
  shipped_at: string | null
  order_items?: OrderItem[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  created_at: string
}

export const EXPENSE_CATEGORIES = [
  'Materials',
  'Packaging',
  'Shipping Supplies',
  'Marketing',
  'Equipment',
  'Fees',
  'Other',
] as const

export type DiscountType = 'percentage' | 'fixed'

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  min_order: number
  max_uses: number | null
  uses_count: number
  active: boolean
  expires_at: string | null
}

export interface CartItem {
  variantId: string
  productId: string
  productName: string
  variantLabel: string
  price: number
  quantity: number
  image: string
}

export interface SiteSettings {
  shipping_threshold: string
  shipping_cost: string
}

export type PaymentEventType = 'payment_captured' | 'refund_issued' | 'stripe_fee'

export interface PaymentEvent {
  id: string
  order_id: string
  type: PaymentEventType
  amount: number
  stripe_id: string | null
  note: string | null
  created_at: string
}
