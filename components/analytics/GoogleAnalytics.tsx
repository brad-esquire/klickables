'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { GA_ID } from '@/lib/analytics'

// Loads the GA4 gtag script and fires page_view on each route change.
// Renders nothing when GA_ID is unset (dev) or on /admin pages.
export default function GoogleAnalytics() {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin') ?? false

  // GA's built-in page_view fires on the initial gtag('config'). For SPA-style
  // route changes, we send page_view manually whenever the path changes.
  useEffect(() => {
    if (!GA_ID || isAdmin) return
    if (typeof window === 'undefined' || !window.gtag) return
    window.gtag('event', 'page_view', { page_path: pathname })
  }, [pathname, isAdmin])

  if (!GA_ID || isAdmin) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { send_page_view: true });
      `}</Script>
    </>
  )
}
