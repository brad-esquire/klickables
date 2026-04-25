'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/store/cartStore'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const items = useCartStore((s) => s.items)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const links = [
    { href: '/shop', label: 'Shop' },
    { href: '/about', label: 'About Us' },
  ]

  return (
    <header className="bg-navy text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Klickables" width={36} height={36} />
          <span className="font-black text-xl tracking-tight">Klickables</span>
        </Link>

        {/* Desktop nav + cart */}
        <div className="flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hidden md:block font-semibold hover:text-pink transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/cart" className="relative hover:text-pink transition-colors">
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
          <button
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-navy border-t border-white/10 px-4 pb-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-3 font-semibold hover:text-pink transition-colors border-b border-white/10 last:border-0"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
