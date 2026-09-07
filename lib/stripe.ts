import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

// Proxy so existing code can call `stripe.paymentIntents.create(...)` without changes
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string]
  },
})

/**
 * Stripe embeds an account-specific suffix in the ids of the objects an account
 * owns — acct_1UCtlzI2HKSeMmMh produces pi_3UCuN0I2HKSeMmMh1R4ySyA5. Comparing
 * that suffix against STRIPE_ACCOUNT_ID tells us whether a stored PaymentIntent
 * belongs to the account the current STRIPE_SECRET_KEY can act on.
 *
 * Payments taken on the previous Stripe account can't be refunded through the
 * API any more (Stripe answers `resource_missing`), so those are steered to a
 * manual refund in the old dashboard instead.
 *
 * Returns false when STRIPE_ACCOUNT_ID is unset, so nothing changes until the
 * cutover is actually configured.
 */
export function isLegacyStripePayment(paymentIntentId: string | null | undefined): boolean {
  if (!paymentIntentId?.startsWith('pi_')) return false
  const account = process.env.STRIPE_ACCOUNT_ID
  if (!account) return false
  return !paymentIntentId.includes(account.slice(-10))
}

/** Shown wherever a legacy-account payment can't be refunded in-app. */
export const LEGACY_REFUND_MESSAGE =
  'This payment was processed on the previous Stripe account, so it can no longer be refunded from here. Issue the refund in that account’s Stripe dashboard, then record it on this order manually.'
