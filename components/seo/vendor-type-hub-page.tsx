/**
 * Shared component for the `/[vendor-type-plural]` Pakistan-wide hub page.
 * Each per-vendor-type route in app/(main)/<slug>/page.tsx is a thin wrapper
 * that calls this with its own slug. Avoids duplicating ~120 lines per type.
 */

import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  getVendorType,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  serviceLD,
  type VendorTypeSlug,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
// Issue #65 — featured vendors strip on hub pages (when vendors of this
// type are approved). Falls back gracefully when none yet.
import { HubFeaturedVendors } from "@/components/seo/hub-featured-vendors"
import { VENDOR_TYPE_PATHS } from "@/lib/vendor-types"

export function generateVendorTypeHubMetadata(slug: VendorTypeSlug): Metadata {
  const vt = getVendorType(slug)
  if (!vt) return { title: "Not Found" }
  return buildPageMetadata({
    title: `${vt.plural} in Pakistan`,
    description: `Find and book the best ${vt.plural.toLowerCase()} across Pakistan. ${vt.description} Verified, reviewed, and ready to book on ${SITE_NAME}.`,
    path: `/${vt.slug}`,
  })
}

export function VendorTypeHubPage({ slug }: { slug: VendorTypeSlug }) {
  const vt = getVendorType(slug)
  if (!vt) notFound()

  const collectionLd = collectionPageLD({
    name: `${vt.plural} in Pakistan — ${SITE_NAME}`,
    description: `${vt.plural} serving weddings across Pakistani cities.`,
    url: `/${vt.slug}`,
    items: CITIES.map((c) => ({
      name: `${vt.plural} in ${c.name}`,
      url: `/${vt.slug}/${c.slug}`,
    })),
  })

  const svcLd = serviceLD({
    name: `${vt.plural} — Pakistan`,
    description: vt.description,
    url: `/${vt.slug}`,
    serviceType: vt.singular,
    areaServed: "Pakistan",
  })

  const faqs = [
    {
      question: `How do I find the right ${vt.singular.toLowerCase()} in Pakistan?`,
      answer: `Pick your city below to see verified ${vt.plural.toLowerCase()} reviewed by real Pakistani couples. Filter by budget, style, and availability — then book directly through ${SITE_NAME}.`,
    },
    {
      question: `Are these ${vt.plural.toLowerCase()} verified?`,
      answer: `Yes. Every ${vt.singular.toLowerCase()} listed on ${SITE_NAME} passes a portfolio + identity + reviews check before going live.`,
    },
    {
      question: `Can I book a ${vt.singular.toLowerCase()} for any city in Pakistan?`,
      answer: `${SITE_NAME} covers ${CITIES.length} cities including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar, Sialkot, Gujranwala, Hyderabad, Quetta, and Bahawalpur.`,
    },
  ]

  const ld = combineGraph(collectionLd, svcLd, faqLD(faqs))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[{ name: vt.plural, href: `/${vt.slug}` }]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Pakistan-wide
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            {vt.plural} in Pakistan
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {vt.description}
          </p>
        </header>

        {/* Issue #65 — featured approved vendors of this type. Hidden
            when zero so the hub page still works as an SEO directory
            while the category is being seeded. Maps the SEO slug back
            to the canonical backend vendorType string via the same
            VENDOR_TYPE_PATHS table used by the rest of the system. */}
        {(() => {
          const backendType = (VENDOR_TYPE_PATHS as Record<string, string>)[vt.slug]
          if (!backendType) return null
          return (
            <HubFeaturedVendors
              vendorType={backendType}
              slug={vt.slug}
              title={`Featured ${vt.plural}`}
              subtitle={vt.plural}
              blurb={vt.description}
            />
          )
        })()}

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Browse {vt.plural.toLowerCase()} by city
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/${vt.slug}/${c.slug}`}
                  className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
                >
                  <p className="font-display italic text-[18px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                    {vt.plural} in {c.name}
                  </p>
                  <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft">
                    {c.region}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Frequently asked questions
          </h2>
          <dl className="space-y-5 max-w-3xl">
            {faqs.map((f) => (
              <div key={f.question}>
                <dt className="font-bridal text-[15px] font-semibold text-bridal-charcoal">
                  {f.question}
                </dt>
                <dd className="mt-2 font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mb-4">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Other vendor categories
          </h2>
          <ul className="flex flex-wrap gap-2">
            {VENDOR_TYPES.filter((v) => v.slug !== vt.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {other.plural}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
