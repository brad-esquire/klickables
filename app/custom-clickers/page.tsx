import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Custom Clickers',
  description:
    'See the custom 3D printed clickers we make for businesses, teams and events — like the "SURF" clickers we created for Girl in the Curl surf school in Dana Point, CA.',
  alternates: { canonical: '/custom-clickers' },
}

// ─────────────────────────────────────────────────────────────────────────────
// Case studies — real custom clicker projects, told as a sequence of steps that
// alternate image side (left, right, left…). A step can hold one or more images
// (shown side by side at equal height). To add one, drop the photos in
// /public/custom-clickers/ and add an entry below (w/h are the pixel dimensions).
// ─────────────────────────────────────────────────────────────────────────────
const CASE_STUDIES: {
  business: string
  website: string
  location: string
  intro: string
  steps: { label: string; body: string; images: { src: string; alt: string; w: number; h: number }[] }[]
}[] = [
  {
    business: 'Girl in the Curl',
    website: 'https://www.girlinthecurl.com/',
    location: 'Dana Point, CA',
    intro:
      'Girl in the Curl is a surf shop and surf school in Dana Point, California, where kids and families learn to ride the waves at their coastal surf camps.',
    steps: [
      {
        label: 'The inspiration',
        body: 'We took our cues straight from their own merch — like the "Just Surf" hoodie they sell online — so the clicker would feel unmistakably Girl in the Curl.',
        images: [
          {
            src: '/custom-clickers/girlinthecurl-store.png',
            alt: "Girl in the Curl's online store showing their Just Surf youth hoodie for sale",
            w: 1128,
            h: 1077,
          },
        ],
      },
      {
        label: 'The result',
        body: 'A custom clicker moulded in their signature pink with a bold "SURF" raised on top. Look closely and the lettering carries the fine layer lines of the 3D print — a hand-made texture you won\'t get on a mass-produced badge.',
        images: [
          {
            src: '/custom-clickers/girlinthecurl-clicker.jpg',
            alt: 'Custom pink "SURF" clicker we made for Girl in the Curl',
            w: 2139,
            h: 3083,
          },
          {
            src: '/custom-clickers/girlinthecurl-clicker-side.jpg',
            alt: 'Side view of the SURF clicker showing the 3D-printed layer lines in the raised lettering',
            w: 2824,
            h: 2126,
          },
        ],
      },
      {
        label: 'For the team',
        body: 'Each finished clicker was mounted on a hand-illustrated, beach-themed thank-you card — a keepsake handed out to their camp instructors.',
        images: [
          {
            src: '/custom-clickers/girlinthecurl-packaging.jpg',
            alt: 'The SURF clicker mounted on its themed Girl in the Curl thank-you card',
            w: 2992,
            h: 3422,
          },
        ],
      },
    ],
  },
]

export default function CustomClickersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-cream py-16 px-4 text-center">
        <p className="text-purple font-bold uppercase tracking-widest text-sm mb-3">Made to order</p>
        <h1 className="text-5xl font-black text-navy mb-4">Custom Clickers</h1>
        <p className="text-navy/70 text-xl max-w-2xl mx-auto">
          We design and 3D print custom clickers for businesses, teams and events — colour-matched to
          your brand and made by hand. Here&apos;s some of our work.
        </p>
      </section>

      {/* Case studies */}
      <section className="max-w-5xl mx-auto px-4 py-16 space-y-10">
        {CASE_STUDIES.map((cs) => (
          <article key={cs.business} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
              <h2 className="text-3xl font-black text-navy">{cs.business}</h2>
              <span className="text-navy/40 font-semibold">{cs.location}</span>
            </div>
            <a
              href={cs.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-purple font-bold hover:text-pink transition-colors mb-4"
            >
              {cs.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              <ExternalLink size={15} />
            </a>
            <p className="text-navy/70 text-lg leading-relaxed max-w-3xl mb-8">{cs.intro}</p>

            <div className="space-y-8 lg:space-y-10">
              {cs.steps.map((step, i) => {
                const imageLeft = i % 2 === 0
                return (
                  <div
                    key={step.label}
                    className={cn(
                      'flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-8',
                      imageLeft ? '' : 'lg:flex-row-reverse'
                    )}
                  >
                    <div className="shrink-0 flex flex-wrap gap-3 justify-center lg:justify-start">
                      {step.images.map((img) => (
                        <Image
                          key={img.src}
                          src={img.src}
                          alt={img.alt}
                          width={img.w}
                          height={img.h}
                          sizes="360px"
                          className="h-[180px] sm:h-[220px] lg:h-[260px] w-auto max-w-full rounded-2xl border border-gray-100 bg-cream shadow-sm"
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-purple font-bold uppercase tracking-wider text-sm mb-2">{step.label}</p>
                      <p className="text-navy text-xl leading-relaxed max-w-xl">{step.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </section>

      {/* CTA */}
      <section className="bg-cream py-16 px-4 text-center">
        <h2 className="text-3xl font-black text-navy mb-3">Want custom clickers for your brand?</h2>
        <p className="text-navy/70 text-lg max-w-xl mx-auto mb-6">
          Pick your colours and send us your logo — we&apos;ll make a custom clicker just for you.
        </p>
        <Link href="/shop/custom">
          <Button size="lg">Order Custom Clickers</Button>
        </Link>
      </section>
    </div>
  )
}
