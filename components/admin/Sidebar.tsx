'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, Package, ShoppingBag, Tag, Settings, LogOut, ClipboardList, Receipt, Wallet, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/production', label: 'Production', icon: ClipboardList },
  { href: '/admin/expenses', label: 'Expenses', icon: Receipt },
  { href: '/admin/money', label: 'Money', icon: Wallet },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active ? 'bg-pink text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </>
  )
}

const Brand = () => (
  <div className="flex items-center gap-2">
    <Image src="/icon.png" alt="Klickables" width={32} height={32} unoptimized style={{ height: 'auto' }} />
    <div>
      <p className="font-black text-sm">Klickables</p>
      <p className="text-white/50 text-xs">Admin</p>
    </div>
  </div>
)

export default function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-navy text-white flex-col min-h-screen sticky top-0">
        <div className="p-5 border-b border-white/10">
          <Brand />
        </div>
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-navy text-white px-4 py-3">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[80%] bg-navy text-white flex flex-col shadow-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <NavContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
