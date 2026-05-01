'use client'

import { PrinterCheck } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Order, OrderItem } from '@/types'

export default function PrintBothButton({ order }: { order: Order & { order_items: OrderItem[] } }) {
  function handlePrint() {
    const addr = order.shipping_address
    const orderNum = order.id.slice(0, 8).toUpperCase()
    const logoUrl = `${window.location.origin}/klickables_logo.png`
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const itemRows = order.order_items.map((item) => `
      <tr>
        <td style="padding:5px 0;color:#1B1E4B;font-size:12px;">
          ${item.product_name}${item.variant_label ? ` <span style="color:#6b7280">(${item.variant_label})</span>` : ''} × ${item.quantity}
        </td>
        <td style="padding:5px 0;text-align:right;font-weight:700;color:#1B1E4B;font-size:12px;white-space:nowrap;">
          $${(item.unit_price * item.quantity).toFixed(2)}
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Label + Receipt — #${orderNum}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:white; }
    @page { size: letter; margin: 0.3in; }

    .page {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 0;
    }

    /* ── CUT LINE ── */
    .cut-line {
      width: 1px;
      align-self: stretch;
      border-left: 2px dashed #d1d5db;
      margin: 0 0.2in;
      position: relative;
    }
    .cut-line::before, .cut-line::after {
      content: '✂';
      position: absolute;
      left: -10px;
      font-size: 14px;
      color: #9ca3af;
    }
    .cut-line::before { top: 0; }
    .cut-line::after { bottom: 0; }

    /* ── LABEL ── */
    .label {
      width: 3in;
      height: 4in;
      border: 2px solid #1B1E4B;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
    }
    .label-header {
      padding: 10px 14px;
      border-bottom: 1.5px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .label-header img { height:32px;width:auto;object-fit:contain;display:block; }
    .label-section { padding:10px 14px;border-bottom:1.5px solid #e5e7eb; }
    .label-tag { font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px; }
    .label-from { font-size:13px;color:#1B1E4B;line-height:1.6; }
    .label-arrow { text-align:center;font-size:16px;color:#d1d5db;padding:4px 0;border-bottom:1.5px solid #e5e7eb; }
    .label-to { padding:12px 14px;flex:1; }
    .label-to-name { font-size:20px;font-weight:900;color:#1B1E4B;margin-bottom:8px;line-height:1.2; }
    .label-to-addr { font-size:15px;color:#1B1E4B;line-height:1.7; }
    .label-footer { border-top:1.5px solid #e5e7eb;padding:7px 14px;display:flex;justify-content:space-between; }
    .label-footer span { font-size:10px;color:#9ca3af; }

    /* ── RECEIPT ── */
    .receipt { width: 3in; flex-shrink: 0; }
    .receipt-header {
      background:#1B1E4B;padding:14px;text-align:center;border-radius:6px 6px 0 0;
    }
    .receipt-header img { width:36px;height:36px;object-fit:contain;display:block;margin:0 auto 6px; }
    .receipt-header .brand { color:white;font-weight:900;font-size:16px; }
    .receipt-header .tagline { color:rgba(255,255,255,0.6);font-size:11px;margin-top:2px; }
    .receipt-body { border:1.5px solid #e5e7eb;border-top:none;border-radius:0 0 6px 6px;padding:14px; }
    .meta { margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed #e5e7eb; }
    .meta-row { display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:3px; }
    .meta-row strong { color:#1B1E4B; }
    .section-label { font-size:9px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px; }
    .items { width:100%;border-collapse:collapse;margin-bottom:12px; }
    .totals { border-top:1px dashed #e5e7eb;padding-top:8px; }
    .total-row { display:flex;justify-content:space-between;font-size:11px;color:#6b7280;margin-bottom:3px; }
    .total-row.final { font-size:14px;font-weight:900;color:#1B1E4B;margin-top:5px;padding-top:5px;border-top:1.5px solid #1B1E4B; }
    .total-row.discount { color:#16a34a; }
    .receipt-footer { margin-top:14px;text-align:center;border-top:1px dashed #e5e7eb;padding-top:12px; }
    .receipt-footer .hearts { font-size:16px;margin-bottom:4px; }
    .receipt-footer .made-by { font-size:10px;color:#6b7280;line-height:1.6; }
    .receipt-footer .site { font-size:10px;font-weight:700;color:#9655C8;margin-top:3px; }
  </style>
</head>
<body>
  <div class="page">

    <!-- LABEL -->
    <div class="label">
      <div class="label-header">
        <img src="${logoUrl}" alt="Klickables"/>
      </div>
      <div class="label-section">
        <div class="label-tag">From</div>
        <div class="label-from">
          <strong>Klickables</strong><br/>
          11 Galaxy Isle<br/>
          Ladera Ranch, CA 92694<br/>
          United States
        </div>
      </div>
      <div class="label-arrow">↓</div>
      <div class="label-to">
        <div class="label-tag">Ship To</div>
        <div class="label-to-name">${order.customer_name}</div>
        <div class="label-to-addr">
          ${addr.line1}<br/>
          ${addr.line2 ? addr.line2 + '<br/>' : ''}
          ${addr.city}, ${addr.state} ${addr.postal_code}<br/>
          ${addr.country}
        </div>
      </div>
      <div class="label-footer">
        <span>Order #${orderNum}</span>
        <span>klickables.net</span>
      </div>
    </div>

    <!-- CUT LINE -->
    <div class="cut-line"></div>

    <!-- RECEIPT -->
    <div class="receipt">
      <div class="receipt-header">
        <img src="/icon.png" alt="Klickables"/>
        <div class="brand">Klickables</div>
        <div class="tagline">Thank you for your order! 💜</div>
      </div>
      <div class="receipt-body">
        <div class="meta">
          <div class="meta-row"><span>Order</span><strong>#${orderNum}</strong></div>
          <div class="meta-row"><span>Date</span><strong>${orderDate}</strong></div>
          <div class="meta-row"><span>Customer</span><strong>${order.customer_name}</strong></div>
        </div>
        <div class="section-label">Items</div>
        <table class="items"><tbody>${itemRows}</tbody></table>
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
        <div class="receipt-footer">
          <div class="hearts">💜</div>
          <div class="made-by">Made with love by<br/>Kirra, Lorelei, Isla &amp; Ashley</div>
          <div class="site">klickables.net</div>
        </div>
      </div>
    </div>

  </div>
  <script>window.onload = () => { window.focus(); window.print(); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=750,toolbar=0,menubar=0,scrollbars=0')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <PrinterCheck size={14} className="mr-1.5" />Print Both
    </Button>
  )
}
