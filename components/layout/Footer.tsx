import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image src="/icon.png" alt="Klickables" width={32} height={32} />
            <span className="font-black text-lg">Klickables</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            3D printed clickers handcrafted with love by Kirra, Lorelei & Isla.
          </p>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-pink">Quick Links</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/cart" className="hover:text-white transition-colors">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold mb-3 text-pink">Get in Touch</h3>
          <p className="text-sm text-white/70">
            Questions about your order?<br />
            <a href="mailto:hello@klickables.net" className="hover:text-white transition-colors">
              hello@klickables.net
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 text-center py-4 text-xs text-white/40">
        © {new Date().getFullYear()} Klickables. Made with 💜 by Kirra, Lorelei & Isla.
      </div>
    </footer>
  )
}
