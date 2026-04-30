import { Metadata } from 'next'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ClearCartOnSuccess from '@/components/checkout/ClearCartOnSuccess'

export const metadata: Metadata = {
  title: 'Order Confirmed — Klickables',
}

export default function SuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <ClearCartOnSuccess />
      <div className="text-7xl mb-6">🎉</div>
      <h1 className="text-4xl font-black text-navy mb-4">Order Confirmed!</h1>
      <p className="text-navy/70 text-lg leading-relaxed mb-3">
        Thanks for your Klickables order! We&apos;ve sent a confirmation to your email.
      </p>
      <p className="text-navy/60 text-base mb-10">
        Kirra, Lorelei, Isla & Ashley will get your clicker ready and ship it out soon. 💜
      </p>
      <Link href="/shop">
        <Button size="lg">Keep Shopping</Button>
      </Link>
    </div>
  )
}
