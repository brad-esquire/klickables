export interface ProductVariant {
  id: string
  product_id: string
  color: string | null
  size: string | null
  // Priced variant axis value (e.g. "1 letter", "Baseball"). Null when the
  // product has no variant axis. A variant row is one (color × variant_name)
  // combination with its own stock/sku; price is set per variant_name and is
  // equal across that variant's colors.
  variant_name: string | null
  price: number
  stock: number
  sku: string | null
  active: boolean
  // Admin-controlled order of the variant option (shared by all its colors).
  sort_order: number
  // Overrides the product's personalization_max_length for this variant when
  // set (e.g. a "Three Letter" nameplate caps personalization at 3). Null =
  // use the product-level max.
  personalization_max_length: number | null
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  images: string[]
  active: boolean
  ignore_stock: boolean
  // Heading shown for the primary variant axis (variants.color). Defaults to
  // "Color"; products like Name Plates override it (e.g. "Number of letters").
  variant_label: string
  personalization_enabled: boolean
  personalization_max_length: number
  personalization_emojis: string[]
  created_at: string
  product_variants?: ProductVariant[]
}

export interface CartItemCustomization {
  color1: string
  color2: string
  logoUrl: string
}

export const CUSTOM_CLICKER_COLORS = [
  { name: 'Red',            hex: '#ef4444' },
  { name: 'Orange',         hex: '#f97316' },
  { name: 'Yellow',         hex: '#facc15' },
  { name: 'Green',          hex: '#22c55e' },
  { name: 'Blue',           hex: '#3b82f6' },
  { name: 'Black',          hex: '#1a1a1a' },
  { name: 'White',          hex: '#FFFFFF' },
  { name: 'Titanium Blue',  hex: '#1B3A6B' },
  { name: 'Titanium Black', hex: '#2a2a2a' },
] as const

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_label: string | null
  quantity: number
  unit_price: number
  customization?: CartItemCustomization | null
  personalization_text?: string | null
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

export type PaymentMethod = 'stripe' | 'cash' | 'venmo' | 'paypal' | 'zelle' | 'other'

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'stripe', label: 'Credit Card (Stripe)' },
  { value: 'cash',   label: 'Cash' },
  { value: 'venmo',  label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'zelle',  label: 'Zelle' },
  { value: 'other',  label: 'Other' },
]

export type SalesRep = 'kirra' | 'lorelei' | 'isla' | 'ashley' | 'website'

export const SALES_REPS: { value: SalesRep; label: string }[] = [
  { value: 'kirra',   label: 'Kirra' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'isla',    label: 'Isla' },
  { value: 'ashley',  label: 'Ashley' },
  { value: 'website', label: 'Website' },
]

export type CashHolder = 'kirra' | 'ashley' | 'lorelei' | 'isla'

export const CASH_HOLDERS: { value: CashHolder; label: string }[] = [
  { value: 'kirra',   label: 'Kirra' },
  { value: 'ashley',  label: 'Ashley' },
  { value: 'lorelei', label: 'Lorelei' },
  { value: 'isla',    label: 'Isla' },
]

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
  payment_method: PaymentMethod | null
  payment_method_other: string | null
  sales_reps: SalesRep[]
  cash_holder: CashHolder | null
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
  paid_from_account_id: string | null
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
  customization?: CartItemCustomization
  personalization?: string
}

export interface SiteSettings {
  shipping_threshold: string
  shipping_cost: string
}

export type PaymentEventType = 'payment_captured' | 'refund_issued' | 'stripe_fee' | 'postage_cost'

export interface PaymentEvent {
  id: string
  order_id: string
  type: PaymentEventType
  amount: number
  stripe_id: string | null
  note: string | null
  paid_from_account_id: string | null
  created_at: string
}

// Money tracker: accounts where money sits and the ledger of every movement between them.

export type MoneyAccountKind = 'digital' | 'cash' | 'external'

export interface MoneyAccount {
  id: string
  name: string
  kind: MoneyAccountKind
  holder: string | null
  default_fee_rate: number
  default_fee_fixed: number
  archived: boolean
  sort_order: number
  created_at: string
}

export type MoneyTransactionKind = 'sale' | 'expense' | 'transfer' | 'reimbursement' | 'adjustment'

export interface MoneyTransaction {
  id: string
  occurred_at: string
  kind: MoneyTransactionKind
  from_account_id: string | null
  to_account_id: string | null
  amount: number
  order_id: string | null
  expense_id: string | null
  payment_event_id: string | null
  description: string | null
  notes: string | null
  manual_override: boolean
  created_at: string
}

export const MONEY_TRANSACTION_KINDS: { value: MoneyTransactionKind; label: string }[] = [
  { value: 'sale',          label: 'Sale' },
  { value: 'expense',       label: 'Expense' },
  { value: 'transfer',      label: 'Transfer' },
  { value: 'reimbursement', label: 'Reimbursement' },
  { value: 'adjustment',    label: 'Adjustment' },
]

export interface AccountBalance {
  account: MoneyAccount
  balance: number
  inflow: number
  outflow: number
  transaction_count: number
}
