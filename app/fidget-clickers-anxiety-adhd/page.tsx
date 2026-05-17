import type { Metadata } from 'next'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import JsonLd from '@/components/seo/JsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const PAGE_PATH = '/fidget-clickers-anxiety-adhd'
const PUBLISHED = '2026-05-17'

const title = 'How Fidget Clickers Help with Stress, Anxiety, ADHD & PTSD'
const description =
  'Why so many people reach for a fidget clicker when they feel anxious, scattered, or overwhelmed — the tactile and auditory feedback, the grounding effect, and what research suggests about ADHD focus.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    type: 'article',
    title: `${title} — Klickables`,
    description,
    url: `${SITE_URL}${PAGE_PATH}`,
    publishedTime: PUBLISHED,
    images: [{ url: '/icon.png', alt: 'Klickables' }],
  },
}

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: title,
  description,
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  image: [`${SITE_URL}/icon.png`],
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${PAGE_PATH}` },
  author: { '@type': 'Organization', name: 'Klickables', url: SITE_URL },
  publisher: {
    '@type': 'Organization',
    name: 'Klickables',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.png` },
  },
}

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
    { '@type': 'ListItem', position: 2, name: 'Why Clickers', item: `${SITE_URL}${PAGE_PATH}` },
  ],
}

export default function FidgetClickersArticlePage() {
  return (
    <>
      <JsonLd data={articleLd} />
      <JsonLd data={breadcrumbLd} />

      {/* Hero */}
      <section className="bg-cream py-20 px-4 text-center">
        <p className="text-purple font-bold uppercase tracking-widest text-sm mb-3">The Science</p>
        <h1 className="text-4xl md:text-5xl font-black text-navy mb-5 max-w-3xl mx-auto leading-tight">
          How Fidget Clickers Help with Stress, Anxiety, ADHD &amp; PTSD
        </h1>
        <p className="text-navy/70 text-xl max-w-2xl mx-auto leading-relaxed">
          A small clicker in your pocket sounds trivial. The reason so many people swear by them isn&apos;t.
        </p>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            Fidget tools used to be treated as a distraction. Today, occupational therapists, ADHD clinicians, and
            anxiety researchers all describe them as something closer to a regulation tool — a small,
            self-directed way of giving the nervous system something predictable to do when the rest of life
            doesn&apos;t feel predictable at all.
          </p>
          <p>
            Fidget clickers in particular do two things at once: they give your hand a repeatable tactile motion,
            and they give your ears a tiny, controlled sound. That combination is what people are really reaching
            for when they say a clicker &quot;just helps.&quot;
          </p>
        </div>
      </section>

      {/* Grounding */}
      <section className="max-w-3xl mx-auto px-4 pb-10">
        <h2 className="text-3xl font-black text-navy mb-5">Grounding in the present moment</h2>
        <div className="text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            When stress takes over, attention tends to drift — into the past (rumination), the future (worry), or
            into the body&apos;s alarm response (a tight chest, a racing heart). Grounding techniques work by
            pulling attention back to something concrete and physical right now. That&apos;s why therapists
            teach exercises like naming five things you can see, or pressing your feet into the floor.
          </p>
          <p>
            A clicker is a portable, deniable version of the same idea. The click is something you can feel and
            hear in the immediate present, on demand. The repetitive motion gives your attention a soft place to
            land — not numb, not distracted, just engaged with something that asks very little of you.
          </p>
        </div>
      </section>

      {/* Anxiety */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-black text-navy mb-5">Anxiety &amp; stress relief</h2>
        <div className="text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            Anxiety has a physical signature — restless hands, a body that wants to do <em>something</em>. One of
            the reasons fidget tools are popular for anxiety is that they give that energy somewhere to go.
            Instead of suppressing it (which rarely works) or escalating it (tapping under the desk, biting nails,
            picking at skin), a clicker channels it into a tidy, repeatable motion.
          </p>
          <p>
            Many people find that the rhythm of clicking — slow, steady, a bit meditative — helps interrupt
            looping thoughts. It&apos;s not a cure for anxiety, and no clicker is going to replace therapy or
            medication when those are needed. But as a tool for the in-between moments — the meeting that ran
            long, the waiting room, the 2am brain — a lot of people find the experience genuinely settling.
          </p>
        </div>
      </section>

      {/* ADHD */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-black text-navy mb-5">ADHD &amp; focus</h2>
        <div className="text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            The intuitive assumption is that fidgeting must be the opposite of focusing. The clinical picture is
            more nuanced. Psychologists who specialise in ADHD — including Dr. Roland Rotz, co-author of
            <em> Fidget to Focus</em> — have described a mechanism in which a small, low-demand sensory input can
            actually <em>support</em> sustained attention rather than compete with it. The brain stays alert
            instead of slipping into under-stimulation, which is one of the things that makes long, monotonous
            tasks so hard with ADHD.
          </p>
          <p>
            The CHADD organisation (Children and Adults with ADHD) makes a similar point: for some people,
            something predictable to do with the hands frees up the main thread of attention for the actual task
            on the desk. It doesn&apos;t work for everyone, and it doesn&apos;t work for every task, but it&apos;s
            a reasonable, low-risk thing to experiment with — especially if you already know you concentrate
            better when you&apos;re walking, doodling, or chewing gum.
          </p>
        </div>
      </section>

      {/* OCD / PTSD */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-black text-navy mb-5">OCD, PTSD &amp; sensory regulation</h2>
        <div className="text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            For people living with OCD or PTSD, intrusive thoughts and hyper-arousal can be activated by very
            little. A small, sensory-rich object that lives in your pocket gives you something to reach for that
            isn&apos;t a compulsion and isn&apos;t avoidance — a deliberate, neutral motion that engages the
            senses without feeding the loop.
          </p>
          <p>
            Clinicians often talk about &quot;sensory regulation&quot; — the idea that the right kind of sensory
            input (steady, predictable, self-controlled) helps a nervous system that&apos;s either too revved up
            or too shut down come back to baseline. A clicker is one of the simpler, cheaper, less-conspicuous
            tools that fits that description.
          </p>
          <p>
            Important note: none of this is medical advice. If anxiety, OCD, ADHD, or PTSD symptoms are
            significantly affecting your life, please talk to a qualified clinician. A fidget tool is a small
            adjunct, not a treatment.
          </p>
        </div>
      </section>

      {/* Tactile vs auditory */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-black text-navy mb-5">Tactile vs auditory feedback</h2>
        <div className="text-navy/80 leading-relaxed text-lg space-y-4">
          <p>
            Most fidget toys are tactile only — putty, spinners, textured rings. That&apos;s fine for some
            situations, and useless for others. If your brain is hunting for a stronger cue, a silent fidget can
            feel unsatisfying, the same way scratching an itch without touching it doesn&apos;t do anything.
          </p>
          <p>
            A clicker adds an auditory layer — a small, crisp, repeatable sound that confirms the motion. For
            many people, that confirmation is the part that actually feels good. It&apos;s why pen-clickers and
            old-fashioned ballpoint pens become unintentional fidget tools in offices and classrooms everywhere.
            A purpose-built clicker just does it better, more quietly, and without annoying everyone within
            earshot.
          </p>
          <p>
            Our clickers are 3D printed by hand, designed for a satisfying, low-volume click — the kind you can
            use in a meeting or a lecture without being the person everyone&apos;s looking at.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center bg-cream">
        <h2 className="text-3xl font-black text-navy mb-4">Find your clicker</h2>
        <p className="text-navy/60 mb-8 max-w-md mx-auto">
          Pick a colour, pick a size, find out which click feels right in your hand.
        </p>
        <Link href="/shop">
          <Button size="lg">Shop Clickers</Button>
        </Link>
      </section>

      {/* Further reading */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-black text-navy mb-4">Further reading</h2>
        <p className="text-navy/60 text-sm mb-4">
          External resources we found useful while writing this page. Klickables isn&apos;t affiliated with any of them.
        </p>
        <ul className="space-y-2 text-navy/80">
          <li>
            <a
              href="https://www.healthcentral.com/condition/adhd/fidgets-anxiety-adhd-ocd"
              target="_blank"
              rel="noopener nofollow"
              className="text-purple font-bold hover:text-pink transition-colors"
            >
              HealthCentral — Fidgets for anxiety, ADHD &amp; OCD
            </a>
          </li>
          <li>
            <a
              href="https://chadd.org/attention-article/how-does-fidgeting-enhance-focus-for-individuals-with-adhd/"
              target="_blank"
              rel="noopener nofollow"
              className="text-purple font-bold hover:text-pink transition-colors"
            >
              CHADD — How fidgeting enhances focus for individuals with ADHD
            </a>
          </li>
          <li>
            <a
              href="https://www.healthline.com/health/fidget-toys-for-anxiety"
              target="_blank"
              rel="noopener nofollow"
              className="text-purple font-bold hover:text-pink transition-colors"
            >
              Healthline — The best fidget toys for anxiety
            </a>
          </li>
        </ul>
      </section>
    </>
  )
}
