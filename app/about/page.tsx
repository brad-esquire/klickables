import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Button from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'About Us — Klickables',
  description: 'Meet Kirra, Lorelei, Isla and Ashley — the four girls behind Klickables 3D Printed Clickers.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-cream py-20 px-4 text-center">
        <p className="text-purple font-bold uppercase tracking-widest text-sm mb-3">Our Story</p>
        <h1 className="text-5xl font-black text-navy mb-5">Meet the Girls</h1>
        <p className="text-navy/70 text-xl max-w-2xl mx-auto leading-relaxed">
          Klickables was created by best friends who discovered their love of 3D printing
          — and couldn&apos;t stop clicking.
        </p>
      </section>

      {/* Origin story */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <h2 className="text-3xl font-black text-navy mb-6">How It All Started</h2>
          <div className="text-navy/75 leading-relaxed space-y-4 text-lg">
            <p>
              It started with a single 3D printer and a whole lot of curiosity. Kirra, Lorelei, Isla, and Ashley
              discovered the satisfying world of clickers and knew immediately — they had to make their own.
            </p>
            <p>
              What began as a fun project between friends quickly turned into something more. They experimented
              with colors, shapes, and sizes until they found the perfect click. Their friends loved them.
              Their families loved them. And so, Klickables was born.
            </p>
            <p>
              Ashley joined the crew to help spread the word — bringing the energy, creativity, and marketing
              know-how to help Klickables reach clicker fans everywhere.
            </p>
            <p>
              The name itself is a little nod to the four of them — <strong>K</strong>irra, <strong>L</strong>orelei, <strong>I</strong>sla and <strong>A</strong>shley — their initials forming the &quot;Kli&quot; in Klickables,
              with the <strong>A</strong> for Ashley hidden right there in the name too. A business built
              by best friends, for anyone who loves a satisfying click.
            </p>
          </div>
        </div>
      </section>

      {/* The girls */}
      <section className="py-16 px-4 bg-navy text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">The Founders</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                name: 'Kirra',
                image: '/Kirra.jpg',
                scale: 1.4,
                origin: '50% 5%',
                role: 'Design & Colors',
                bio: 'Kirra is the creative eye behind Klickables. She chooses every color combination and makes sure every clicker looks as good as it feels.',
              },
              {
                name: 'Lorelei',
                image: '/Lorelei.jpg',
                bgSize: '200%',
                bgPosition: 'center 16%',
                role: 'CEO',
                bio: 'Lorelei is the driving force behind Klickables. She leads the team, keeps everything on track, and makes sure every decision reflects the values the three of them started with.',
              },
              {
                name: 'Isla',
                image: '/Isla.jpg',
                scale: 1.4,
                origin: '50% 25%',
                role: 'Business & Shipping',
                bio: 'Isla keeps everything running smoothly — from packing orders to making sure your clicker arrives safely and on time.',
              },
              {
                name: 'Ashley',
                image: '/Ashley.jpg',
                bgSize: '170%',
                bgPosition: '52% 42%',
                role: 'CMO',
                bio: 'Ashley is the voice of Klickables. She spreads the word, builds the brand, and makes sure the world knows just how satisfying a good click can be.',
              },
            ].map((girl) => (
              <div key={girl.name} className="text-center">
                {'bgSize' in girl ? (
                  <div
                    className="w-52 h-52 mx-auto mb-4 rounded-full ring-4 ring-white/20 shadow-xl"
                    style={{
                      backgroundImage: `url(${girl.image})`,
                      backgroundSize: girl.bgSize,
                      backgroundPosition: girl.bgPosition,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                ) : (
                  <div className="w-52 h-52 mx-auto mb-4 relative rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl">
                    <Image
                      src={girl.image}
                      alt={girl.name}
                      fill
                      className="object-cover"
                      style={{ transform: `scale(${girl.scale})`, transformOrigin: girl.origin }}
                    />
                  </div>
                )}
                <h3 className="text-xl font-black mb-1">{girl.name}</h3>
                <p className="text-sky text-sm font-bold mb-3">{girl.role}</p>
                <p className="text-white/70 text-sm leading-relaxed">{girl.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-cream">
        <h2 className="text-3xl font-black text-navy mb-4">Ready to find your click?</h2>
        <p className="text-navy/60 mb-8">Browse our range of colorful 3D printed clickers.</p>
        <Link href="/shop">
          <Button size="lg">Shop Now</Button>
        </Link>
      </section>
    </>
  )
}
