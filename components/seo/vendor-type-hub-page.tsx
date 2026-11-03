/**
 * Shared component for the `/[vendor-type-plural]` Pakistan-wide hub page.
 * Each per-vendor-type route in app/(main)/<slug>/page.tsx is a thin wrapper
 * that calls this with its own slug. Avoids duplicating ~120 lines per type.
 */

import { safeJsonLd } from "@/lib/seo/jsonld";
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
import { getLocationImagery } from "@/lib/seo/location-imagery"
import { getVendorTypePricing, type VendorTypePricing } from "@/lib/seo/pricing-guide"
import { CategoryHubCityDirectory } from "@/components/seo/category-hub-city-directory"

const WHATSAPP_E164 = "923274811220"

// ── Reusable button styles (matching the city page & master theme) ───
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-[14px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(201,149,106,0.7)] transition-all hover:-translate-y-0.5 hover:bg-bridal-gold-dark"
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-bridal-gold/50 bg-bridal-ivory/60 px-6 py-3 font-bridal text-[14px] font-semibold text-bridal-gold-dark transition-all hover:border-bridal-gold hover:bg-bridal-gold/10"

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-bridal text-[10px] uppercase tracking-[0.16em] text-bridal-text-label">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[17px] italic text-bridal-charcoal">{value}</p>
    </div>
  )
}

function indicativeRange(pricing: VendorTypePricing | null, slug?: string): string | null {
  if (!pricing) return null
  if (slug === "wedding-venues") {
    return "PKR 800–6,500+ / head"
  }
  const perHeadNums: number[] = []
  const flatNums: number[] = []
  let plus = false
  for (const t of pricing.tiers) {
    if (t.band.includes("+")) plus = true
    const isPerHead = t.band.toLowerCase().includes("/head") || t.band.toLowerCase().includes("per head")
    for (const m of t.band.match(/[\d,]+/g) ?? []) {
      const n = Number(m.replace(/,/g, ""))
      if (Number.isFinite(n) && n > 0) {
        if (isPerHead) perHeadNums.push(n)
        else flatNums.push(n)
      }
    }
  }
  const nums = perHeadNums.length > 0 ? perHeadNums : flatNums
  if (nums.length === 0) return null
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  const unit = perHeadNums.length > 0 ? " / head" : ""
  return `PKR ${lo.toLocaleString("en-PK")}–${hi.toLocaleString("en-PK")}${plus ? "+" : ""}${unit}`
}

export function generateVendorTypeHubMetadata(slug: VendorTypeSlug): Metadata {
  const vt = getVendorType(slug)
  if (!vt) return { title: "Not Found" }
  return buildPageMetadata({
    title: `${vt.plural} in Pakistan`,
    description: `Find and book the best ${vt.plural.toLowerCase()} across Pakistan. ${vt.description} Compare prices, read real reviews and book on ${SITE_NAME}.`,
    path: `/${vt.slug}`,
  })
}

export function VendorTypeHubPage({ slug }: { slug: VendorTypeSlug }) {
  const vt = getVendorType(slug)
  if (!vt) notFound()

  const pricing = getVendorTypePricing(vt.slug)
  const imagery = getLocationImagery(vt.slug)
  const range = indicativeRange(pricing, vt.slug)
  const waLink = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
    `Hi Wedding Wala — I'm looking for ${vt.plural.toLowerCase()} across Pakistan. Can you help me find vendors and quotes?`,
  )}`

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
      answer: `Pick your city below to see ${vt.plural.toLowerCase()} reviewed by real Pakistani couples. Filter by budget, style, and availability — then book directly through ${SITE_NAME}.`,
    },
    {
      question: `Are these ${vt.plural.toLowerCase()} verified?`,
      answer: `Some are. A ${vt.singular.toLowerCase()} carries a Verified badge only after we have checked the owner's identity and contact details, and you will see that badge on their card. Most listings are compiled from public business directories and are marked "Unclaimed listing" until their owner takes the profile over and completes verification. Reviews are always real — a couple can only review a vendor after their wedding date has passed.`,
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />

      {/* ── LUXURY PROFESSIONAL HERO HEADER ── */}
      <section className="relative overflow-hidden bg-bridal-hero border-b border-bridal-beige/70">
        <div className="pointer-events-none absolute inset-0 bg-bridal-wash opacity-90" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-8 h-56 w-56 rounded-full bg-bridal-rose/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 -bottom-20 h-64 w-64 rounded-full bg-bridal-gold/15 blur-3xl"
        />

        <div className="container-responsive relative py-12 sm:py-16 lg:py-20">
          <Breadcrumbs
            items={[{ name: vt.plural, href: `/${vt.slug}` }]}
            className="mb-8"
          />

          <div
            className={`grid items-center gap-10 ${
              imagery.hero ? "lg:grid-cols-[1.08fr_0.92fr]" : ""
            }`}
          >
            <div className={imagery.hero ? "" : "max-w-3xl"}>
              <span className="bridal-crown">
                <span className="bridal-label">Pakistan-Wide · Curated Wedding Marketplace</span>
              </span>
              <h1 className="mt-4 font-display text-[40px] leading-[1.04] text-bridal-charcoal sm:text-[52px] lg:text-[58px]">
                {vt.plural} in{" "}
                <span className="italic text-bridal-gold-dark">Pakistan</span>
              </h1>
              <p className="mt-5 max-w-2xl font-bridal text-[16px] leading-relaxed text-bridal-text sm:text-[17px]">
                {vt.description} Explore verified {vt.plural.toLowerCase()} across 85+ Pakistani cities. Compare packages, portfolios, authentic couple reviews, and get transparent quotes before you book.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#city-directory" className={BTN_PRIMARY}>
                  Browse by city ↓
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                  Get free quotes →
                </a>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  "85+ Pakistani cities covered",
                  "Verified portfolios & rates",
                  "Direct vendor-set PKR pricing",
                  "100% authentic reviews",
                ].map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 font-bridal text-[12.5px] text-bridal-text-soft"
                  >
                    <span className="text-bridal-gold-dark font-bold">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {imagery.hero && (
              <div className="relative">
                <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-[28px] border border-bridal-gold/25 shadow-[0_34px_90px_-32px_rgba(176,125,84,0.45)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagery.hero}
                    alt={imagery.heroAlt ?? `${vt.plural} across Pakistan`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/40 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-bridal-beige bg-bridal-ivory/95 px-5 py-3.5 shadow-[0_18px_40px_-18px_rgba(176,125,84,0.5)] backdrop-blur sm:block">
                  <p className="font-bridal text-[10px] uppercase tracking-[0.2em] text-bridal-text-label">
                    Pakistan Wedding Directory
                  </p>
                  <p className="font-display text-[18px] italic text-bridal-charcoal">
                    {CITIES.length} Cities · Curated {vt.plural}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stat Bar */}
        <div className="relative border-t border-bridal-beige/70 bg-bridal-ivory/55 backdrop-blur">
          <div className="container-responsive grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
            <StatItem label="Cities Covered" value={`${CITIES.length}+ Cities`} />
            <StatItem label="Category" value={vt.singular} />
            <StatItem label="Peak Season" value="Oct – March" />
            <StatItem label="Indicative Rates" value={range ?? "On request"} />
          </div>
        </div>
      </section>

      <div className="container-responsive py-12 sm:py-16">
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

        {/* ── INTERACTIVE CITY DIRECTORY WITH SEARCH & BEAUTIFUL CARDS ── */}
        <CategoryHubCityDirectory
          cities={CITIES}
          typeSlug={vt.slug}
          categorySingular={vt.singular}
          categoryPlural={vt.plural}
          waLink={waLink}
        />

        {/* ── FAQ SECTION ── */}
        <section className="mb-16">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-6">
            Frequently asked questions
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((f) => (
              <div
                key={f.question}
                className="p-6 rounded-2xl border border-bridal-beige bg-bridal-cream/30 hover:border-bridal-gold/60 transition-colors"
              >
                <dt className="font-bridal text-[15.5px] font-semibold text-bridal-charcoal">
                  {f.question}
                </dt>
                <dd className="mt-2.5 font-bridal text-[14px] text-bridal-text leading-relaxed">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── OTHER VENDOR CATEGORIES ── */}
        <section className="mb-4">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Other vendor categories
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {VENDOR_TYPES.filter((v) => v.slug !== vt.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="inline-block px-4 py-2 rounded-full border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream font-bridal text-[13px] text-bridal-text hover:text-bridal-charcoal transition-all shadow-2xs"
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
