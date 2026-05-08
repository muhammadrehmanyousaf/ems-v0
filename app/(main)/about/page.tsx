import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Users, Award, Target, Sparkles, Shield, MapPin, Mail, Phone } from "lucide-react"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_TAGLINE,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  CITIES,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: `About ${SITE_NAME}`,
  description: `${SITE_NAME} (weddingwala.pk) — ${SITE_TAGLINE}. Founded in Pakistan to make planning Pakistani weddings simpler, fairer, and more transparent.`,
  path: "/about",
})

const values = [
  {
    icon: Heart,
    title: "Passion for Pakistani weddings",
    desc: "Every shaadi deserves to be celebrated well. We connect you with vendors who feel the same — from Lahore mehndi specialists to Karachi marquees to Islamabad-based planners.",
  },
  {
    icon: Users,
    title: "Vendor community",
    desc: "Pakistani wedding vendors are talented and over-worked. We give them better tooling — booking flow, payments, calendar — so they can focus on craft over admin.",
  },
  {
    icon: Shield,
    title: "Trust & transparency",
    desc: "Real reviews from verified bookings. Secure payments through licensed Pakistani gateways. Transparent PKR pricing before you commit a deposit. No surprises.",
  },
  {
    icon: Award,
    title: "Quality, vetted",
    desc: "Every vendor passes a portfolio + identity + reviews check before going live on Wedding Wala. We don't accept everyone.",
  },
]

const stats = [
  { value: `${CITIES.length}`, label: "Pakistani cities" },
  { value: "11", label: "Vendor categories" },
  // Stats below are placeholders until live numbers stabilize. Avoid
  // over-claiming on About — card networks read this page during PayFast
  // underwriting. [LEGAL REVIEW]
  { value: "Verified", label: "Identity-checked vendors" },
  { value: "PKR", label: "Always priced locally" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="container-responsive pt-6">
        <Breadcrumbs items={[{ name: "About", href: "/about" }]} />
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-bridal-gold via-bridal-gold-dark to-bridal-gold-dark text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">{SITE_TAGLINE}</span>
          </div>
          <h1 className="font-display italic text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6">
            Pakistani weddings,<br />done well.
          </h1>
          <p className="font-bridal text-lg sm:text-xl text-bridal-cream max-w-2xl mx-auto leading-relaxed">
            {SITE_NAME} is the Pakistani wedding marketplace. We help couples find,
            compare, and book the right vendors — venues, photographers, caterers,
            decorators, mehndi artists, planners — across every major city.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white border-b border-bridal-beige">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display italic text-3xl sm:text-4xl text-bridal-gold-dark">
                {stat.value}
              </p>
              <p className="font-bridal text-sm text-bridal-text-soft mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-bridal-gold-dark" />
            <h2 className="font-bridal text-sm font-semibold text-bridal-gold-dark uppercase tracking-wider">
              Our mission
            </h2>
          </div>
          <h3 className="font-display italic text-3xl sm:text-4xl text-bridal-charcoal mb-6 leading-tight">
            Make Pakistani wedding planning fairer, simpler, and warmer.
          </h3>
          <div className="prose prose-bridal max-w-none font-bridal text-[15px] text-bridal-text leading-relaxed space-y-4">
            <p>
              Planning a Pakistani wedding involves dozens of decisions across
              months of effort — venue, food, photography, decor, outfits,
              transportation. The default experience is fragmented: WhatsApp
              groups, phone calls, paper invoices, no transparency on price.
            </p>
            <p>
              {SITE_NAME} brings every decision into one place. Real reviews from
              verified bookings. Transparent PKR pricing. A booking flow that
              actually holds your deposit until the vendor confirms. A team you
              can call when something goes wrong.
            </p>
            <p>
              We&apos;re a marketplace, not a single vendor. Wedding services are
              delivered by independent vendors across Pakistan — we just make it
              dramatically easier to find the right ones.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display italic text-3xl text-bridal-charcoal text-center mb-12">
            What we stand for
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="border border-bridal-beige shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 bg-bridal-gold/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <v.icon className="w-6 h-6 text-bridal-gold-dark" />
                  </div>
                  <div>
                    <h3 className="font-display italic text-[18px] text-bridal-charcoal mb-1">
                      {v.title}
                    </h3>
                    <p className="font-bridal text-sm text-bridal-text leading-relaxed">
                      {v.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cities served */}
      <section className="py-16 px-4 bg-bridal-cream/30 border-t border-bridal-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display italic text-3xl text-bridal-charcoal mb-3">
            Where we operate
          </h2>
          <p className="font-bridal text-[14.5px] text-bridal-text-soft mb-6">
            {SITE_NAME} serves wedding bookings across {CITIES.length} Pakistani cities.
          </p>
          <ul className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/cities/${c.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige bg-white hover:border-bridal-gold hover:bg-bridal-cream font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Team — E-E-A-T signal, founder bio populates from env-controlled flag */}
      <section className="py-16 px-4 bg-white border-t border-bridal-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display italic text-3xl text-bridal-charcoal mb-3">
            The team behind Wedding Wala
          </h2>
          <p className="font-bridal text-[14.5px] text-bridal-text-soft mb-8 max-w-2xl">
            Wedding Wala is built by a small Pakistan-based team. We answer
            customer support, vet vendors, and write every editorial piece
            ourselves.
          </p>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
            {/*
              Founder card — shows minimal public info today (name + role).
              Once Waheed approves a public bio, photo, and LinkedIn handle,
              fill `bio` and uncomment the avatar + social link. Pending
              fields tracked in docs/company-info.md. Reference:
              docs/seo/00-master-seo-playbook.md §8 items 349-353 (E-E-A-T).
            */}
            <article>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-bridal-cream border border-bridal-gold/45 flex items-center justify-center flex-shrink-0">
                  <span className="font-display italic text-[24px] text-bridal-gold">W</span>
                </div>
                <div>
                  <p className="font-display italic text-[20px] text-bridal-charcoal">
                    Waheed
                  </p>
                  <p className="font-bridal text-[12.5px] uppercase tracking-[0.18em] text-bridal-gold mt-0.5">
                    Founder
                  </p>
                  <p className="mt-3 font-bridal text-[13.5px] text-bridal-text leading-relaxed">
                    Wedding Wala&apos;s founder. Based in Pakistan, leads the
                    product, vendor onboarding, and customer-success work
                    end-to-end. Reachable directly at{" "}
                    <a
                      href="mailto:waheed@weddingwala.pk"
                      className="text-bridal-gold hover:underline"
                    >
                      waheed@weddingwala.pk
                    </a>
                    .
                  </p>
                </div>
              </div>
            </article>

            <article>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-bridal-cream border border-bridal-gold/45 flex items-center justify-center flex-shrink-0">
                  <span className="font-display italic text-[24px] text-bridal-gold">E</span>
                </div>
                <div>
                  <p className="font-display italic text-[20px] text-bridal-charcoal">
                    Editorial team
                  </p>
                  <p className="font-bridal text-[12.5px] uppercase tracking-[0.18em] text-bridal-gold mt-0.5">
                    Editorial
                  </p>
                  <p className="mt-3 font-bridal text-[13.5px] text-bridal-text leading-relaxed">
                    Writes every blog post, real-wedding recap, and vendor
                    spotlight. Pakistani wedding planning is what we cover —
                    no generic copy, no AI fill. Pitch a story to{" "}
                    <a
                      href="mailto:info@weddingwala.pk"
                      className="text-bridal-gold hover:underline"
                    >
                      info@weddingwala.pk
                    </a>
                    .
                  </p>
                </div>
              </div>
            </article>
          </div>

          <p className="mt-10 font-bridal text-[12.5px] text-bridal-text-soft max-w-2xl">
            Hiring across Pakistan — see{" "}
            <Link href="/careers" className="text-bridal-gold hover:underline">
              Careers
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Business identity — required for PayFast underwriting */}
      <section className="py-16 px-4 bg-white border-t border-bridal-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display italic text-3xl text-bridal-charcoal mb-6">
            About the business
          </h2>
          <dl className="grid sm:grid-cols-2 gap-y-4 gap-x-8 max-w-2xl">
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Brand
              </dt>
              <dd className="font-bridal text-[14.5px] text-bridal-charcoal">
                {SITE_NAME}
              </dd>
            </div>
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Domain
              </dt>
              <dd className="font-bridal text-[14.5px] text-bridal-charcoal">
                weddingwala.pk
              </dd>
            </div>
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Country
              </dt>
              <dd className="font-bridal text-[14.5px] text-bridal-charcoal">
                Islamic Republic of Pakistan
              </dd>
            </div>
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Languages
              </dt>
              <dd className="font-bridal text-[14.5px] text-bridal-charcoal">
                English &middot; اردو
              </dd>
            </div>
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Customer support
              </dt>
              <dd className="font-bridal text-[14.5px]">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-bridal-charcoal hover:text-bridal-gold inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {SUPPORT_EMAIL}
                </a>
                <br />
                <a
                  href={SUPPORT_PHONE_TEL}
                  className="text-bridal-charcoal hover:text-bridal-gold inline-flex items-center gap-1.5 mt-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {SUPPORT_PHONE_DISPLAY}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-1">
                Vendor onboarding
              </dt>
              <dd className="font-bridal text-[14.5px]">
                <a
                  href="mailto:onboarding@weddingwala.pk"
                  className="text-bridal-charcoal hover:text-bridal-gold inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  onboarding@weddingwala.pk
                </a>
              </dd>
            </div>
          </dl>

          {/*
            TODO: append the registered legal entity name, SECP incorporation
            number, NTN, registered office address, and director name(s) once
            the founder confirms them. These fields are tracked in
            docs/company-info.md "Pending fields" and are required before the
            site can be submitted for PayFast underwriting.
          */}
          <p className="mt-6 font-bridal text-[12.5px] text-bridal-text-soft max-w-2xl leading-relaxed">
            Wedding Wala is a marketplace. Wedding services on this platform
            are delivered by independent vendors. Payments are processed
            through licensed Pakistani payment gateways. Read{" "}
            <Link href="/how-it-works" className="text-bridal-gold hover:underline">
              How it works
            </Link>
            ,{" "}
            <Link href="/terms" className="text-bridal-gold hover:underline">
              Terms
            </Link>
            , and our{" "}
            <Link href="/privacy" className="text-bridal-gold hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
