export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/shop/ProductCard'
import Button from '@/components/ui/Button'
import type { Product } from '@/types'

async function getFeaturedProducts(): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(4)
  return data ?? []
}

export default async function HomePage() {
  const featured = await getFeaturedProducts()

  return (
    <>
      {/* Hero */}
      <section className="bg-cream py-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <p className="text-purple font-bold uppercase tracking-widest text-sm mb-3">
              3D Printed Clickers
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-navy leading-tight mb-6">
              Click. Collect.<br />
              <span className="text-pink">Love it.</span>
            </h1>
            <p className="text-navy/70 text-lg mb-8 max-w-md">
              Satisfying, colorful 3D printed clickers — handcrafted by three best friends
              who just love to click.
            </p>
            <div className="flex gap-4 justify-center md:justify-start flex-wrap">
              <Link href="/shop">
                <Button size="lg">Shop Now</Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">Our Story</Button>
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center order-1 md:order-2">
            <Image
              src="/logo.png"
              alt="Klickables"
              width={420}
              height={360}
              priority
              className="drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-navy">Featured Clickers</h2>
            <Link href="/shop" className="text-purple font-bold hover:text-pink transition-colors">
              View all →
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">🖱️</p>
              <p className="font-semibold">Products coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* About snippet */}
      <section className="bg-navy text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sky font-bold uppercase tracking-widest text-sm mb-3">Who we are</p>
          <h2 className="text-3xl font-black mb-4">Made by Kirra, Lorelei & Isla</h2>
          <p className="text-white/75 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Klickables was born from three best friends who share a love of satisfying clicks and colorful things.
            Every clicker is 3D printed with care and designed to bring joy.
          </p>
          <Link href="/about">
            <Button variant="secondary">Read Our Story</Button>
          </Link>
        </div>
      </section>

      {/* Shipping banner */}
      <section className="bg-pink/10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚚</span>
            <span className="font-bold text-navy">Free shipping on orders over $50</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-navy">Loads of colors to choose from</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💜</span>
            <span className="font-bold text-navy">Made with love in Orange County</span>
          </div>
        </div>
      </section>
    </>
  )
}
