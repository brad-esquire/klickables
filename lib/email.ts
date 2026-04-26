import { Resend } from 'resend'
import type { Order, OrderItem } from '@/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}
const FROM = `Klickables <${process.env.EMAIL_FROM ?? ''}>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? ''

const SITE_URL = process.env.NEXTAUTH_URL ?? ''
const LOGO_URL = process.env.EMAIL_LOGO_URL ?? `${SITE_URL}/logo.png`

export async function sendOrderConfirmation(order: Order & { order_items: OrderItem[] }) {
  const isPickup = order.fulfillment_type === 'pickup'
  const orderNum = order.id.slice(0, 8).toUpperCase()
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const itemRows = order.order_items.map((i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:15px;color:#1B1E4B;">
        ${i.product_name}${i.variant_label ? `<br><span style="font-size:13px;color:#9655C8;">${i.variant_label}</span>` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:15px;color:#1B1E4B;white-space:nowrap;">
        ${i.quantity} × $${i.unit_price.toFixed(2)}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:15px;font-weight:700;color:#1B1E4B;white-space:nowrap;">
        $${(i.unit_price * i.quantity).toFixed(2)}
      </td>
    </tr>`).join('')

  const fulfillmentSection = isPickup
    ? `<tr>
        <td colspan="2" style="padding-top:4px;">
          <strong style="color:#1B1E4B;">Pickup location</strong><br>
          <span style="color:#555;">${order.pickup_location}</span><br>
          <span style="font-size:13px;color:#9655C8;margin-top:4px;display:block;">We'll contact you when your order is ready!</span>
        </td>
       </tr>`
    : `<tr>
        <td colspan="2" style="padding-top:4px;">
          <strong style="color:#1B1E4B;">Ship to</strong><br>
          <span style="color:#555;line-height:1.7;">
            ${order.customer_name}<br>
            ${order.shipping_address.line1}${order.shipping_address.line2 ? '<br>' + order.shipping_address.line2 : ''}<br>
            ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}
          </span>
        </td>
       </tr>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Klickables Order #${orderNum}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f6f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <div style="background-color:#ffffff;border-radius:12px;padding:16px 24px;display:inline-block;">
              <img src="${LOGO_URL}" width="160" alt="Klickables" style="display:block;" />
            </div>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

            <!-- Header band -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:linear-gradient(135deg,#1B1E4B 0%,#9655C8 100%);padding:28px 40px;">
                  <p style="margin:0;color:rgba(255,255,255,0.75);font-size:13px;text-transform:uppercase;letter-spacing:1.5px;">Order confirmed</p>
                  <h1 style="margin:6px 0 0;color:#ffffff;font-size:26px;font-weight:700;">Thanks, ${order.customer_name.split(' ')[0]}! 🎉</h1>
                </td>
              </tr>
            </table>

            <!-- Summary bar -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f0f0f0;">
              <tr>
                <td style="padding:20px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:33%;">
                        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Amount paid</p>
                        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#F06591;">$${order.total?.toFixed(2)}</p>
                      </td>
                      <td style="width:33%;">
                        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Date</p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1B1E4B;">${orderDate}</p>
                      </td>
                      <td style="width:33%;">
                        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Order</p>
                        <p style="margin:4px 0 0;font-size:14px;color:#1B1E4B;font-weight:600;">#${orderNum}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 40px 0;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Summary</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 8px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${itemRows}
                    <!-- Totals -->
                    ${order.discount_amount ? `
                    <tr>
                      <td colspan="2" style="padding:8px 0 2px;font-size:14px;color:#555;">Subtotal</td>
                      <td style="padding:8px 0 2px;text-align:right;font-size:14px;color:#555;">$${order.subtotal?.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:2px 0;font-size:14px;color:#16a34a;">Discount</td>
                      <td style="padding:2px 0;text-align:right;font-size:14px;color:#16a34a;">−$${order.discount_amount.toFixed(2)}</td>
                    </tr>` : ''}
                    ${!isPickup ? `
                    <tr>
                      <td colspan="2" style="padding:${order.discount_amount ? '2px' : '8px'} 0 2px;font-size:14px;color:#555;">Shipping</td>
                      <td style="padding:${order.discount_amount ? '2px' : '8px'} 0 2px;text-align:right;font-size:14px;color:#555;">${order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}</td>
                    </tr>` : ''}
                    <tr>
                      <td colspan="2" style="padding:12px 0 0;font-size:16px;font-weight:700;color:#1B1E4B;border-top:2px solid #f0f0f0;">Total</td>
                      <td style="padding:12px 0 0;text-align:right;font-size:16px;font-weight:700;color:#F06591;border-top:2px solid #f0f0f0;">$${order.total?.toFixed(2)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Fulfillment -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:24px 40px 0;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;">Fulfillment</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${fulfillmentSection}
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 40px;">
            <p style="margin:0;font-size:13px;color:#999;">
              Questions? Email us at
              <a href="mailto:${FROM}" style="color:#9655C8;text-decoration:none;">${FROM}</a>
            </p>
            <p style="margin:8px 0 0;font-size:13px;color:#bbb;">
              You're receiving this because you made a purchase at
              <a href="${SITE_URL}" style="color:#9655C8;text-decoration:none;">Klickables</a>,
              by Kirra, Lorelei &amp; Isla.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Hi ${order.customer_name},\n\nThanks for your Klickables order!\n\nOrder #${orderNum} — ${orderDate}\n\n${
    order.order_items.map((i) => `${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} × ${i.quantity} — $${(i.unit_price * i.quantity).toFixed(2)}`).join('\n')
  }\n\n${order.discount_amount ? `Subtotal: $${order.subtotal?.toFixed(2)}\nDiscount: -$${order.discount_amount.toFixed(2)}\n` : ''}${!isPickup ? `Shipping: ${order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}\n` : ''}Total: $${order.total?.toFixed(2)}\n\n${
    isPickup
      ? `Pickup at: ${order.pickup_location}\nWe'll contact you when your order is ready!`
      : `Ship to:\n${order.customer_name}\n${order.shipping_address.line1}${order.shipping_address.line2 ? '\n' + order.shipping_address.line2 : ''}\n${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}`
  }\n\nQuestions? Email ${FROM}\n\n— Kirra, Lorelei & Isla\nklickables.net`

  await Promise.all([
    getResend().emails.send({
      from: FROM,
      to: order.email,
      subject: `Your Klickables order #${orderNum} is confirmed!`,
      html,
      text,
    }),
    ADMIN_EMAIL
      ? getResend().emails.send({
          from: FROM,
          to: ADMIN_EMAIL,
          subject: `New order from ${order.customer_name} — #${orderNum}`,
          html,
          text,
        })
      : Promise.resolve(),
  ])
}
