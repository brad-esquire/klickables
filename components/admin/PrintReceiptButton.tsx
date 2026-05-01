'use client'

import { Receipt } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Order, OrderItem } from '@/types'

export default function PrintReceiptButton({ order }: { order: Order & { order_items: OrderItem[] } }) {
  function handlePrint() {
    const orderNum = order.id.slice(0, 8).toUpperCase()
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const itemRows = order.order_items.map((item) => `
      <tr>
        <td style="padding: 6px 0; color: #1B1E4B; font-size: 13px;">
          ${item.product_name}${item.variant_label ? ` <span style="color:#6b7280">(${item.variant_label})</span>` : ''} × ${item.quantity}
        </td>
        <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #1B1E4B; font-size: 13px; white-space: nowrap;">
          $${(item.unit_price * item.quantity).toFixed(2)}
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt — #${orderNum}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    @page { size: 3.5in auto; margin: 0.25in; }
    @media print { body { width: 3.5in; } .no-print { display: none !important; } }

    .receipt {
      width: 3.5in;
      margin: 0 auto;
      padding: 0;
    }
    .header {
      background: #1B1E4B;
      padding: 16px;
      text-align: center;
      border-radius: 6px 6px 0 0;
    }
    .header img { width: 40px; height: 40px; object-fit: contain; display: block; margin: 0 auto 6px; }
    .header .brand { color: white; font-weight: 900; font-size: 18px; letter-spacing: -0.5px; }
    .header .tagline { color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 2px; }

    .body { border: 1.5px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; padding: 16px; }

    .meta { margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px dashed #e5e7eb; }
    .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 3px; }
    .meta-row strong { color: #1B1E4B; }

    .section-label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }

    .items { width: 100%; border-collapse: collapse; margin-bottom: 14px; }

    .totals { border-top: 1px dashed #e5e7eb; padding-top: 10px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .total-row.final { font-size: 15px; font-weight: 900; color: #1B1E4B; margin-top: 6px; padding-top: 6px; border-top: 1.5px solid #1B1E4B; }
    .total-row.discount { color: #16a34a; }

    .footer { margin-top: 16px; text-align: center; border-top: 1px dashed #e5e7eb; padding-top: 14px; }
    .footer .hearts { font-size: 18px; margin-bottom: 4px; }
    .footer .made-by { font-size: 11px; color: #6b7280; line-height: 1.6; }
    .footer .site { font-size: 11px; font-weight: 700; color: #9655C8; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <img src="/icon.png" alt="Klickables" />
      <div class="brand">Klickables</div>
      <div class="tagline">Thank you for your order! 💜</div>
    </div>

    <div class="body">
      <div class="meta">
        <div class="meta-row"><span>Order</span><strong>#${orderNum}</strong></div>
        <div class="meta-row"><span>Date</span><strong>${orderDate}</strong></div>
        <div class="meta-row"><span>Customer</span><strong>${order.customer_name}</strong></div>
      </div>

      <div class="section-label">Items</div>
      <table class="items">
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>$${order.subtotal?.toFixed(2)}</span></div>
        ${order.fulfillment_type === 'pickup'
          ? `<div class="total-row"><span>Fulfillment</span><span>Pickup</span></div>`
          : `<div class="total-row"><span>Shipping</span><span>${order.shipping_cost === 0 ? 'FREE' : '$' + order.shipping_cost?.toFixed(2)}</span></div>`
        }
        ${(order.discount_amount ?? 0) > 0
          ? `<div class="total-row discount"><span>Discount${order.discount_code ? ` (${order.discount_code})` : ''}</span><span>−$${order.discount_amount?.toFixed(2)}</span></div>`
          : ''
        }
        <div class="total-row final"><span>Total</span><span>$${order.total?.toFixed(2)}</span></div>
      </div>

      <div class="footer">
        <div class="hearts">💜</div>
        <div class="made-by">Made with love by<br/>Kirra, Lorelei, Isla &amp; Ashley</div>
        <div class="site">klickables.net</div>
      </div>
    </div>
  </div>
  <script>window.onload = () => { window.focus(); window.print(); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=420,height=680,toolbar=0,menubar=0,scrollbars=0')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Receipt size={14} className="mr-1.5" />Print Receipt
    </Button>
  )
}
