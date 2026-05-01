export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase'
import PrintTrigger from '@/components/admin/PrintTrigger'
import type { Order } from '@/types'

export default async function ShippingLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('orders').select('*').eq('id', id).single()
  if (!data) notFound()

  const order = data as Order
  if (order.fulfillment_type !== 'shipping') notFound()

  const addr = order.shipping_address

  return (
    <>
      <PrintTrigger />

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        @media print {
          @page { size: 4in 6in; margin: 0; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print flex items-center justify-between px-6 py-3 bg-navy text-white">
        <span className="text-sm font-bold">Shipping Label — #{order.id.slice(0, 8).toUpperCase()}</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-pink text-white text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-pink/80 transition-colors"
          >
            Print
          </button>
          <button
            onClick={() => window.close()}
            className="bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-white/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Label */}
      <div style={{
        width: '4in',
        height: '6in',
        margin: '20px auto',
        border: '2px solid #1B1E4B',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: '#1B1E4B',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <Image src="/icon.png" alt="Klickables" width={36} height={36} unoptimized />
          <span style={{ color: 'white', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>
            Klickables
          </span>
        </div>

        {/* FROM */}
        <div style={{ padding: '14px 18px', borderBottom: '1.5px solid #e5e7eb' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            From
          </div>
          <div style={{ fontSize: '13px', color: '#1B1E4B', lineHeight: '1.5' }}>
            <div style={{ fontWeight: 700 }}>Klickables</div>
            <div>11 Galaxy Isle</div>
            <div>Ladera Ranch, CA 92694</div>
            <div>United States</div>
          </div>
        </div>

        {/* Divider arrow */}
        <div style={{ textAlign: 'center', fontSize: '20px', color: '#d1d5db', padding: '6px 0', borderBottom: '1.5px solid #e5e7eb' }}>
          ↓
        </div>

        {/* TO */}
        <div style={{ padding: '18px 18px', flex: 1 }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Ship To
          </div>
          <div style={{ fontSize: '18px', fontWeight: 900, color: '#1B1E4B', marginBottom: '8px', lineHeight: '1.2' }}>
            {order.customer_name}
          </div>
          <div style={{ fontSize: '15px', color: '#1B1E4B', lineHeight: '1.7' }}>
            <div>{addr.line1}</div>
            {addr.line2 && <div>{addr.line2}</div>}
            <div>{addr.city}, {addr.state} {addr.postal_code}</div>
            <div>{addr.country}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1.5px solid #e5e7eb',
          padding: '10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>
            Order #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>
            klickables.net
          </span>
        </div>
      </div>
    </>
  )
}
