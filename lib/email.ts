import { Resend } from 'resend'
import type { Order, OrderItem } from '@/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}
const FROM = process.env.EMAIL_FROM ?? ''
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

export async function sendOrderConfirmation(order: Order & { order_items: OrderItem[] }) {
  const itemsList = order.order_items
    .map((i) => `${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} × ${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`)
    .join('\n')

  const body = `
Hi ${order.customer_name},

Thanks for your Klickables order! 🎉

Order #${order.id.slice(0, 8).toUpperCase()}
---
${itemsList}
---
Subtotal:  $${order.subtotal?.toFixed(2)}
Shipping:  $${order.shipping_cost?.toFixed(2)}
${order.discount_amount ? `Discount:  -$${order.discount_amount.toFixed(2)}\n` : ''}Total:     $${order.total?.toFixed(2)}

Shipping to:
${order.customer_name}
${order.shipping_address.line1}${order.shipping_address.line2 ? '\n' + order.shipping_address.line2 : ''}
${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}

We'll be in touch once your order is on its way!

— Kirra, Lorelei & Isla
  `.trim()

  await Promise.all([
    getResend().emails.send({
      from: FROM,
      to: order.email,
      subject: `Your Klickables order #${order.id.slice(0, 8).toUpperCase()} is confirmed!`,
      text: body,
    }),
    ADMIN_EMAIL
      ? getResend().emails.send({
          from: FROM,
          to: ADMIN_EMAIL,
          subject: `New Klickables order from ${order.customer_name}`,
          text: `New order received!\n\n${body}`,
        })
      : Promise.resolve(),
  ])
}
