'use client'

import { Printer } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Order } from '@/types'

export default function PrintLabelButton({ order }: { order: Order }) {
  function handlePrint() {
    const addr = order.shipping_address
    const orderNum = order.id.slice(0, 8).toUpperCase()

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Shipping Label — #${orderNum}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: white; }
    @page { size: 4in 6in; margin: 0; }
    @media print { body { width: 4in; height: 6in; } }

    .label {
      width: 4in;
      height: 6in;
      border: 2px solid #1B1E4B;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin: 0 auto;
    }
    .header {
      background: #1B1E4B;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header img { width: 36px; height: 36px; object-fit: contain; display: block; flex-shrink: 0; }
    .header span { color: white; font-weight: 900; font-size: 20px; letter-spacing: -0.5px; }
    .section { padding: 14px 18px; border-bottom: 1.5px solid #e5e7eb; }
    .label-text {
      font-size: 10px;
      font-weight: 700;
      color: #9ca3af;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .from-body { font-size: 13px; color: #1B1E4B; line-height: 1.6; }
    .from-body strong { font-weight: 700; }
    .arrow { text-align: center; font-size: 18px; color: #d1d5db; padding: 6px 0; border-bottom: 1.5px solid #e5e7eb; }
    .to-section { padding: 18px 18px; flex: 1; }
    .to-name { font-size: 20px; font-weight: 900; color: #1B1E4B; margin-bottom: 10px; line-height: 1.2; }
    .to-addr { font-size: 15px; color: #1B1E4B; line-height: 1.7; }
    .footer {
      border-top: 1.5px solid #e5e7eb;
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer span { font-size: 10px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <img src="/icon.png" alt="Klickables" />
      <span>Klickables</span>
    </div>

    <div class="section">
      <div class="label-text">From</div>
      <div class="from-body">
        <strong>Klickables</strong><br/>
        11 Galaxy Isle<br/>
        Ladera Ranch, CA 92694<br/>
        United States
      </div>
    </div>

    <div class="arrow">↓</div>

    <div class="to-section">
      <div class="label-text">Ship To</div>
      <div class="to-name">${order.customer_name}</div>
      <div class="to-addr">
        ${addr.line1}<br/>
        ${addr.line2 ? addr.line2 + '<br/>' : ''}
        ${addr.city}, ${addr.state} ${addr.postal_code}<br/>
        ${addr.country}
      </div>
    </div>

    <div class="footer">
      <span>Order #${orderNum}</span>
      <span>klickables.net</span>
    </div>
  </div>
  <script>window.onload = () => { window.focus(); window.print(); }</script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=500,height=720,toolbar=0,menubar=0,scrollbars=0')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer size={14} className="mr-1.5" />Print Label
    </Button>
  )
}
