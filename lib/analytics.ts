// Thin wrappers around GA4 gtag. All no-op when NEXT_PUBLIC_GA_ID is unset
// or when window.gtag isn't loaded yet (e.g. ad-blocked, SSR, admin pages).

type GtagFn = (command: 'event', name: string, params?: Record<string, unknown>) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? ''

function gtag(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}

// GA4 item shape — minimal subset we populate from cart/order data.
export interface GAItem {
  item_id: string
  item_name: string
  item_variant?: string
  price?: number
  quantity?: number
}

export function trackViewItem(args: {
  id: string
  name: string
  price?: number
  variantLabel?: string
}) {
  gtag('view_item', {
    currency: 'USD',
    value: args.price,
    items: [{
      item_id: args.id,
      item_name: args.name,
      item_variant: args.variantLabel,
      price: args.price,
      quantity: 1,
    }],
  })
}

export function trackAddToCart(item: GAItem & { price?: number; quantity?: number }) {
  gtag('add_to_cart', {
    currency: 'USD',
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [{ ...item, quantity: item.quantity ?? 1 }],
  })
}

export function trackViewCart(items: GAItem[], value: number) {
  gtag('view_cart', { currency: 'USD', value, items })
}

export function trackBeginCheckout(items: GAItem[], value: number) {
  gtag('begin_checkout', { currency: 'USD', value, items })
}

export function trackPurchase(args: {
  transactionId: string
  value: number
  shipping?: number
  discount?: number
  items: GAItem[]
  coupon?: string
}) {
  gtag('purchase', {
    transaction_id: args.transactionId,
    value: args.value,
    currency: 'USD',
    shipping: args.shipping,
    coupon: args.coupon,
    items: args.items,
  })
}
