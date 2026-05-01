export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import FulfillButton from '@/components/admin/FulfillButton'
import MarkPaidButton from '@/components/admin/MarkPaidButton'
import RefundPanel from '@/components/admin/RefundPanel'
import { Pencil } from 'lucide-react'
import PrintLabelButton from '@/components/admin/PrintLabelButton'
import PrintReceiptButton from '@/components/admin/PrintReceiptButton'
import PrintBothButton from '@/components/admin/PrintBothButton'
import ShipButton from '@/components/admin/ShipButton'
import OutForDeliveryButton from '@/components/admin/OutForDeliveryButton'
import OrderNotes from '@/components/admin/OrderNotes'
import FetchStripeFeeButton from '@/components/admin/FetchStripeFeeButton'
import { trackingUrl } from '@/lib/tracking'
import type { Order, OrderItem, PaymentEvent } from '@/types'

const statusVariant: Record<string, 'green' | 'pink' | 'navy' | 'red'> = {
  paid: 'pink',
  fulfilled: 'green',
  shipped: 'green',
  out_for_delivery: 'green',
  pending: 'navy',
  cancelled: 'red',
}

const eventLabel: Record<string, { label: string; color: string }> = {
  payment_captured: { label: 'Payment captured', color: 'text-green-600' },
  refund_issued:    { label: 'Refund issued',     color: 'text-red-500' },
  stripe_fee:       { label: 'Stripe processing fee', color: 'text-orange-500' },
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*, order_items(*), payment_events(*)').eq('id', id).single()
  if (!data) notFound()

  const order = data as Order & { order_items: OrderItem[]; payment_events: PaymentEvent[] }
  const events: PaymentEvent[] = (order.payment_events ?? []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const totalRefunded = events.filter((e) => e.type === 'refund_issued').reduce((s, e) => s + e.amount, 0)
  const canRefund = (order.status === 'paid' || order.status === 'fulfilled') && !!order.stripe_payment_intent_id

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-navy">Order #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-navy/50 text-sm">{new Date(order.created_at).toLocaleString('en-US')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[order.status] ?? 'navy'} className="text-sm px-4 py-1">{order.status}</Badge>
          {order.fulfillment_type === 'shipping' && (
            <PrintLabelButton order={order} />
          )}
          <PrintReceiptButton order={order} />
          {order.fulfillment_type === 'shipping' && (
            <PrintBothButton order={order} />
          )}
          <Link href={`/admin/orders/${order.id}/edit`}>
            <Button variant="outline" size="sm"><Pencil size={14} className="mr-1.5" />Edit</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        {/* Customer */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-navy mb-3">Customer</h2>
          <p className="font-semibold text-navy">{order.customer_name}</p>
          <p className="text-navy/60 text-sm">{order.email}</p>
        </div>

        {/* Fulfillment */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          {order.fulfillment_type === 'pickup' ? (
            <>
              <h2 className="font-black text-navy mb-3">Pickup</h2>
              <p className="text-navy/80 text-sm">{order.pickup_location}</p>
            </>
          ) : (
            <>
              <h2 className="font-black text-navy mb-3">Shipping Address</h2>
              <p className="text-navy/80 text-sm leading-relaxed">
                {order.shipping_address.line1}<br />
                {order.shipping_address.line2 && <>{order.shipping_address.line2}<br /></>}
                {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}<br />
                {order.shipping_address.country}
              </p>
            </>
          )}
        </div>

        {/* Notes */}
        <OrderNotes orderId={order.id} initialNotes={order.notes} />

        {/* Items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-black text-navy mb-3">Items</h2>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-navy">{item.product_name} {item.variant_label ? `(${item.variant_label})` : ''} × {item.quantity}</span>
                <span className="font-semibold text-navy">${(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1 text-sm">
              <div className="flex justify-between text-navy/60"><span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between text-navy/60"><span>Shipping</span><span>{order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}</span></div>
              {(order.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount</span><span>−${order.discount_amount?.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-black text-base border-t pt-1">
                <span>Total</span><span className="text-pink">${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment history */}
        {events.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-navy">Payment History</h2>
              {order.stripe_payment_intent_id && !events.some((e) => e.type === 'stripe_fee') && (
                <FetchStripeFeeButton orderId={order.id} />
              )}
            </div>
            <div className="space-y-3">
              {events.map((e) => {
                const meta = eventLabel[e.type] ?? { label: e.type, color: 'text-navy' }
                const isCost = e.type === 'refund_issued' || e.type === 'stripe_fee'
                const sign = isCost ? '−' : '+'
                const dotColor = e.type === 'stripe_fee' ? 'bg-orange-400' : isCost ? 'bg-red-400' : 'bg-green-500'
                return (
                  <div key={e.id} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                      <div>
                        <p className={`text-sm font-semibold ${meta.color}`}>{meta.label}</p>
                        {e.note && <p className="text-xs text-navy/50">{e.note}</p>}
                        {e.stripe_id && (
                          <p className="text-xs text-navy/40 font-mono">{e.stripe_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${e.type === 'stripe_fee' ? 'text-orange-500' : isCost ? 'text-red-500' : 'text-green-600'}`}>
                        {sign}${e.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-navy/40">
                        {new Date(e.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {order.status === 'pending' && (
          <div className="space-y-3">
            <MarkPaidButton orderId={order.id} />
            <FulfillButton orderId={order.id} />
          </div>
        )}
        {order.status === 'paid' && (
          <div className="flex gap-3 flex-wrap">
            <FulfillButton orderId={order.id} />
            {order.fulfillment_type === 'shipping' && <ShipButton orderId={order.id} />}
            {order.fulfillment_type === 'pickup' && <OutForDeliveryButton orderId={order.id} />}
          </div>
        )}

        {order.fulfilled_at && (
          <p className="text-sm text-green-600 font-semibold">
            ✓ Fulfilled on {new Date(order.fulfilled_at).toLocaleString('en-US')}
          </p>
        )}
        {order.shipped_at && (
          <div className="text-sm text-green-600 font-semibold space-y-1">
            <p>✓ Shipped on {new Date(order.shipped_at).toLocaleString('en-US')}</p>
            {order.tracking_number && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-navy/60 font-normal">{order.shipping_carrier ?? 'USPS'}: {order.tracking_number}</span>
                <Link
                  href={trackingUrl(order.shipping_carrier ?? 'USPS', order.tracking_number)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple font-bold hover:underline text-xs"
                >
                  Track →
                </Link>
              </div>
            )}
          </div>
        )}

        {canRefund && (
          <RefundPanel
            orderId={order.id}
            maxAmount={order.total}
            alreadyRefunded={totalRefunded}
          />
        )}
      </div>
    </div>
  )
}
