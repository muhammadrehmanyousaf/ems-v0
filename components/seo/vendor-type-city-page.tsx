/**
 * Shared component for `/[vendor-type-plural]/[city]` programmatic SEO pages
 * (the commercial "money pages"). Each per-vendor-type [city] route file
 * imports this with its own slug.
 *
 * Server component: fetches vendors via `fetchCityVendors` (ISR-cached 1h),
 * emits CollectionPage + Service + FAQPage JSON-LD, and renders the
 * blueprint block order (B0–B13) — see seo-strategy/mega-plan-2yr/12-page-blueprint.md.
 */

import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  SITE_URL,
  getCity,
  getVendorType,
  getBackendVendorType,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  serviceLD,
  type VendorTypeSlug,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { fetchCityVendors, type VendorListItem } from "@/lib/seo/fetch-vendors"
import { getCityEditorial, getVendorTypeGuide } from "@/lib/seo/city-editorial"
import {
  getVendorTypePricing,
  getVendorTypeQuestions,
  getVendorTypeGuidePillar,
  type VendorTypePricing,
} from "@/lib/seo/pricing-guide"
import { getVendorTypeRelatedGuides } from "@/lib/seo/related-guides"
import { getVendorTypeChecklist } from "@/lib/seo/things-to-check"
import { getVendorTypeEventNotes } from "@/lib/seo/event-notes"
import { getPreviewVendors } from "@/lib/seo/preview-vendors"
import { getLocationImagery } from "@/lib/seo/location-imagery"
import { PremiumVendorCard } from "@/components/seo/location/premium-vendor-card"

const WHATSAPP_E164 = "923274811220"

// ── Reusable button styles (kept as consts so every CTA matches) ───────────
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-bridal-gold px-6 py-3 font-bridal text-[14px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(201,149,106,0.7)] transition-all hover:-translate-y-0.5 hover:bg-bridal-gold-dark"
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-bridal-gold/50 bg-bridal-ivory/60 px-6 py-3 font-bridal text-[14px] font-semibold text-bridal-gold-dark transition-all hover:border-bridal-gold hover:bg-bridal-gold/10"
const CHIP =
  "inline-block rounded-full border border-bridal-beige bg-bridal-cream px-3.5 py-1.5 font-bridal text-[13px] text-bridal-text-soft transition-all hover:border-bridal-gold hover:text-bridal-charcoal"

/** Strip obvious seed/demo vendors so production never shows test data. */
function filterRealVendors(vendors: VendorListItem[]): VendorListItem[] {
  return vendors.filter(
    (v) => !/\b(demo|test|sample|lorem|example|dummy)\b/i.test(v.name || ""),
  )
}

/** Indicative headline range from the pricing tiers (e.g. "PKR 30,000–600,000+"). */
function indicativeRange(pricing: VendorTypePricing | null): string | null {
  if (!pricing) return null
  const nums: number[] = []
  let plus = false
  for (const t of pricing.tiers) {
    if (t.band.includes("+")) plus = true
    for (const m of t.band.match(/[\d,]+/g) ?? []) {
      const n = Number(m.replace(/,/g, ""))
      if (Number.isFinite(n) && n > 0) nums.push(n)
    }
  }
  if (nums.length === 0) return null
  const lo = Math.min(...nums)
  const hi = Math.max(...nums)
  return `PKR ${lo.toLocaleString("en-PK")}–${hi.toLocaleString("en-PK")}${plus ? "+" : ""}`
}

const B2_DRIVERS: Record<string, string> = {
  "wedding-photographers":
    "how many functions you cover (a single barat vs. full mehndi–barat–walima) and whether cinematography is bundled with the photography",
  "wedding-venues":
    "guest count, the area, and whether your date falls in peak Decemberistan season",
  "caterers": "the menu depth, number of live BBQ/handi stations, and final guest count",
  "bridal-makeup-artists":
    "the artist's reputation, the number of looks, and whether a trial is included",
  "wedding-decorators":
    "stage size, how much fresh floral you want, and the number of functions",
  "mehndi-artists": "coverage (wrist vs. elbow), the intricacy, and the artist's name",
}

function buildAnswerLead(
  plural: string,
  singular: string,
  cityName: string,
  slug: string,
  range: string | null,
): string {
  const driver = B2_DRIVERS[slug] ?? "the package, the season, and the vendor's experience"
  const rangePart = range ? `typically range ${range}` : "vary by package and season"
  return `${plural} in ${cityName} ${rangePart}, depending on ${driver}. Below you'll find verified ${cityName} ${plural.toLowerCase()}, real PKR package tiers, exactly what to check before you book, and how to lock your date.`
}

/** Centered crown-rule kicker + serif title — reused by every section. */
function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-9 text-center">
      {kicker && (
        <span className="bridal-crown">
          <span className="bridal-label">{kicker}</span>
        </span>
      )}
      <h2 className="mt-3 font-display text-[27px] italic leading-tight text-bridal-charcoal sm:text-[33px]">
        {title}
      </h2>
    </div>
  )
}

/** Small gold uppercase label — used to head a de-boxed text block. */
function FacetLabel({ children }: { children: string }) {
  return (
    <p className="font-bridal text-[11.5px] font-semibold uppercase tracking-[0.16em] text-bridal-gold-dark">
      {children}
    </p>
  )
}

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

export function generateVendorTypeCityStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }))
}

export function generateVendorTypeCityMetadata(
  typeSlug: VendorTypeSlug,
  citySlug: string,
): Metadata {
  const vt = getVendorType(typeSlug)
  const city = getCity(citySlug)
  if (!vt || !city) return { title: "Not Found" }

  return buildPageMetadata({
    title: `${vt.plural} in ${city.name} — Prices, Packages & FAQs`,
    description: `Compare verified ${vt.plural.toLowerCase()} in ${city.name}. Indicative PKR prices & packages, ratings, what to check before booking & FAQs (2026) — on ${SITE_NAME}.`,
    path: `/${vt.slug}/${city.slug}`,
  })
}

function formatPriceRange(vendors: VendorListItem[]): string | undefined {
  const prices = vendors
    .map((v) => v.priceMin)
    .filter((p): p is number => Number.isFinite(p ?? NaN))
  if (prices.length === 0) return undefined
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  if (lo === hi) return `PKR ${lo.toLocaleString("en-PK")}`
  return `PKR ${lo.toLocaleString("en-PK")} – ${hi.toLocaleString("en-PK")}`
}

export async function VendorTypeCityPage({
  typeSlug,
  citySlug,
}: {
  typeSlug: VendorTypeSlug
  citySlug: string
}) {
  const vt = getVendorType(typeSlug)
  const city = getCity(citySlug)
  if (!vt || !city) notFound()

  const backendType = getBackendVendorType(vt.slug)
  const fetched = await fetchCityVendors({
    city: city.slug,
    vendorType: backendType,
    limit: 24,
  })
  // Strip seed/demo vendors so production never shows test data. In local
  // UI-preview mode (NEXT_PUBLIC_UI_PREVIEW=1) — where the dev box can't reach
  // the backend — fall back to curated sample vendors so the card grid can be
  // designed/screenshotted. Production has the flag OFF, so it only ever
  // renders real vendors.
  const realVendors = filterRealVendors(fetched)
  const vendors =
    realVendors.length > 0 ? realVendors : getPreviewVendors(vt.slug, city.slug)

  // For pages with zero real listings, we render the page but mark it
  // `noindex,follow` so Google still crawls outbound internal links but
  // doesn't index the empty page itself. When at least one vendor is onboarded
  // the page becomes indexable automatically. (Content-led indexing gate is a
  // follow-up — see the SEO design backlog.)
  const hasListings = vendors.length > 0
  const editorial = getCityEditorial(city.slug)
  const guide = getVendorTypeGuide(vt.slug)
  const pricing = getVendorTypePricing(vt.slug)
  const questions = getVendorTypeQuestions(vt.slug)
  const guidePillar = getVendorTypeGuidePillar(vt.slug)
  const relatedGuides = getVendorTypeRelatedGuides(vt.slug)
  const checklist = getVendorTypeChecklist(vt.slug)
  const eventNotes = getVendorTypeEventNotes(vt.slug)
  const imagery = getLocationImagery(vt.slug)
  const editorialFacets: { label: string; body: string }[] = [
    editorial.notable
      ? { label: `Where they cluster in ${city.name}`, body: editorial.notable }
      : null,
    guide ? { label: "What to look for", body: guide } : null,
    editorial.priceContext ? { label: "Pricing context", body: editorial.priceContext } : null,
  ].filter((f): f is { label: string; body: string } => f !== null)
  const range = indicativeRange(pricing)
  const answerLead = buildAnswerLead(vt.plural, vt.singular, city.name, vt.slug, range)
  const waLink = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
    `Hi Wedding Wala — I'm looking for ${vt.plural.toLowerCase()} in ${city.name}. Can you help me get quotes?`,
  )}`

  const url = `${SITE_URL}/${vt.slug}/${city.slug}`
  const priceRangeStr = formatPriceRange(vendors)

  const collectionLd = collectionPageLD({
    name: `${vt.plural} in ${city.name} — ${SITE_NAME}`,
    description: `${vt.plural} serving weddings in ${city.name}, Pakistan.`,
    url: `/${vt.slug}/${city.slug}`,
    items: vendors.slice(0, 10).map((v) => ({
      name: v.name,
      url: v.href && v.href !== "#" ? `${SITE_URL}${v.href}` : url,
      imageUrl: v.imageUrl,
    })),
  })

  const svcLd = serviceLD({
    name: `${vt.plural} in ${city.name}`,
    description: `${vt.description} Serving ${city.name}, ${city.region}.`,
    url: `/${vt.slug}/${city.slug}`,
    serviceType: vt.singular,
    areaServed: city.name,
    priceRange: priceRangeStr ?? range ?? undefined,
  })

  const faqs = [
    {
      question: `How much do ${vt.plural.toLowerCase()} in ${city.name} cost?`,
      answer: range
        ? `${vt.plural} in ${city.name} typically range ${range}, depending on the package, season, and experience level. See the indicative PKR tiers above and each vendor's transparent pricing below.`
        : `Prices vary by package, season, and vendor experience. Browse the listings below to see PKR ranges — every price on ${SITE_NAME} is transparent before you book.`,
    },
    {
      question: `How far in advance should I book a ${vt.singular.toLowerCase()} in ${city.name}?`,
      answer: editorial.peakSeason
        ? `${city.name}'s peak shaadi season is ${editorial.peakSeason} — for any date in that window, book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out. Popular ${city.name} ${vt.plural.toLowerCase()} fill up faster, so secure the date before locking the vendor.`
        : `For peak shaadi season (October–February), book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out — popular ${city.name} ${vt.plural.toLowerCase()} fill up faster.`,
    },
    {
      question: `Can I see real reviews for these ${vt.plural.toLowerCase()}?`,
      answer: `Yes. Every review on ${SITE_NAME} is from a verified booking — couples can only review a vendor after the wedding date passes. No fake reviews, no incentivised ratings.`,
    },
    {
      question: `What if my ${vt.singular.toLowerCase()} cancels?`,
      answer: `${SITE_NAME} holds the deposit until the vendor confirms. If a vendor cancels last-minute, we help you find a replacement and refund per our cancellation policy.`,
    },
    ...(pricing
      ? [
          {
            question: `What's included at different ${vt.singular.toLowerCase()} price points in ${city.name}?`,
            answer: `${pricing.tiers
              .map((t) => `${t.tier} (${t.band}): ${t.includes}`)
              .join(" ")} ${pricing.note}`,
          },
        ]
      : []),
  ]

  const ld = combineGraph(collectionLd, svcLd, faqLD(faqs))

  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 6)
  const otherTypes = VENDOR_TYPES.filter((v) => v.slug !== vt.slug).slice(0, 6)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      {!hasListings && <meta name="robots" content="noindex,follow" />}

      {/* ─────────── HERO (B0 · B1 · B2) ─────────── */}
      <section className="relative overflow-hidden bg-bridal-hero">
        <div className="pointer-events-none absolute inset-0 bg-bridal-wash opacity-90" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 top-8 h-44 w-44 rounded-full bg-bridal-rose/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/4 -bottom-20 h-52 w-52 rounded-full bg-bridal-gold/15 blur-3xl"
        />

        <div className="container-responsive relative py-12 sm:py-16 lg:py-20">
          <Breadcrumbs
            items={[
              { name: vt.plural, href: `/${vt.slug}` },
              { name: city.name, href: `/${vt.slug}/${city.slug}` },
            ]}
            className="mb-8"
          />
          <div
            className={`grid items-center gap-10 ${
              imagery.hero ? "lg:grid-cols-[1.04fr_0.96fr]" : ""
            }`}
          >
            <div className={imagery.hero ? "" : "max-w-3xl"}>
              <span className="bridal-crown">
                <span className="bridal-label">{city.region} · Pakistan</span>
              </span>
              <h1 className="mt-4 font-display text-[40px] leading-[1.04] text-bridal-charcoal sm:text-[52px] lg:text-[58px]">
                {vt.plural} in{" "}
                <span className="italic text-bridal-gold-dark">{city.name}</span>
              </h1>
              <p className="mt-5 max-w-2xl font-bridal text-[16px] leading-relaxed text-bridal-text sm:text-[17px]">
                {answerLead}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#vendors" className={BTN_PRIMARY}>
                  Browse {vt.plural.toLowerCase()}
                </a>
                <a href={waLink} target="_blank" rel="noopener noreferrer" className={BTN_SECONDARY}>
                  Get free quotes →
                </a>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {[
                  "Verified vendors",
                  "Transparent PKR pricing",
                  "Refund-protected booking",
                  "Real reviews only",
                ].map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-1.5 font-bridal text-[12.5px] text-bridal-text-soft"
                  >
                    <span className="text-bridal-gold-dark">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            {imagery.hero && (
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-bridal-gold/20 shadow-[0_34px_90px_-32px_rgba(176,125,84,0.55)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagery.hero}
                    alt={imagery.heroAlt ?? `${vt.singular} in ${city.name}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/35 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-bridal-beige bg-bridal-ivory/95 px-4 py-3 shadow-[0_18px_40px_-18px_rgba(176,125,84,0.5)] backdrop-blur sm:block">
                  <p className="font-bridal text-[9.5px] uppercase tracking-[0.18em] text-bridal-text-label">
                    Real {city.name} weddings
                  </p>
                  <p className="font-display text-[17px] italic text-bridal-charcoal">
                    Verified vendors only
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative border-t border-bridal-beige/70 bg-bridal-ivory/55 backdrop-blur">
          <div className="container-responsive grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
            <StatItem label="Indicative range" value={range ?? "On request"} />
            <StatItem
              label="Verified vendors"
              value={hasListings ? String(vendors.length) : "Adding weekly"}
            />
            <StatItem label="Peak season" value={editorial.peakSeason ?? "Nov–Feb"} />
            <StatItem label="Last updated" value="June 2026" />
          </div>
        </div>
      </section>

      <div className="container-responsive py-12 pb-28 sm:py-16 sm:pb-16">
        {/* ─────────── B4 VENDOR GRID ─────────── */}
        <section id="vendors" className="mb-16 scroll-mt-24">
          <SectionHeading
            kicker={hasListings ? `${vendors.length} verified` : "Coming soon"}
            title={`Top ${vt.plural.toLowerCase()} in ${city.name}`}
          />
          {vendors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bridal-gold/30 bg-bridal-cream/40 p-10 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bridal-gold/10 font-display text-[22px] italic text-bridal-gold-dark">
                ✦
              </span>
              <p className="mx-auto mt-4 max-w-md font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
                We&apos;re onboarding verified {vt.plural.toLowerCase()} in {city.name} now.
                Tell us what you need and we&apos;ll send you matched quotes — usually within a
                day.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-5 ${BTN_PRIMARY}`}
              >
                Get free quotes
              </a>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((v) => (
                <li key={v.id}>
                  <PremiumVendorCard vendor={v} categoryLabel={vt.singular} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ─────────── B3 CITY EDITORIAL ─────────── */}
        <section className="mb-16">
          <SectionHeading
            kicker="Local guide"
            title={`About ${vt.plural.toLowerCase()} in ${city.name}`}
          />
          <div className="mx-auto max-w-3xl space-y-4 font-bridal text-[15.5px] leading-relaxed text-bridal-text">
            <p>
              {editorial.intro ??
                `${city.name} is one of Pakistan's busiest wedding destinations — whether you're planning a baraat at a banquet hall, a mehndi under string lights, or a walima at a marquee, there's a ${vt.singular.toLowerCase()} here for every style and budget.`}
            </p>
            <p>
              {SITE_NAME} makes the {city.name} {vt.singular.toLowerCase()} search simple: every
              vendor is identity-verified, every review comes from a real booking, and every quote
              is transparent before you commit a deposit.
              {editorial.peakSeason
                ? ` Peak season here is ${editorial.peakSeason} — book ahead for those dates.`
                : ""}
            </p>
          </div>
          {editorialFacets.length > 0 && (
            <div className="mx-auto mt-10 grid max-w-5xl gap-x-12 gap-y-8 border-t border-bridal-beige/60 pt-9 sm:grid-cols-3">
              {editorialFacets.map((f) => (
                <div key={f.label}>
                  <FacetLabel>{f.label}</FacetLabel>
                  <p className="mt-2.5 font-bridal text-[13.5px] leading-relaxed text-bridal-text-soft">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─────────── INSPIRATION GALLERY ─────────── */}
        {imagery.gallery && imagery.gallery.length > 0 && (
          <section className="mb-16">
            <SectionHeading kicker="Inspiration" title={`A glimpse of ${city.name} weddings`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {imagery.gallery.map((g) => (
                <div key={g.src} className="group relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.src}
                      alt={g.alt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bridal-charcoal/15 to-transparent" />
                </div>
              ))}
            </div>
            <p className="mt-3 font-bridal text-[12px] italic text-bridal-text-soft">
              Real Pakistani wedding photography for inspiration — each vendor&apos;s own
              portfolio appears on their profile.
            </p>
          </section>
        )}

        {/* ─────────── B5 PRICE TIERS ─────────── */}
        {pricing && (
          <section className="mb-16">
            <SectionHeading
              kicker="Transparent pricing"
              title={`What does a ${vt.singular.toLowerCase()} in ${city.name} cost?`}
            />
            <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {pricing.tiers.map((t) => (
                <div key={t.tier} className="border-t-2 border-bridal-gold/40 pt-4">
                  <FacetLabel>{t.tier}</FacetLabel>
                  <p className="mt-1.5 font-display text-[19px] italic leading-snug text-bridal-gold-dark">
                    {t.band}
                  </p>
                  <p className="mt-3 font-bridal text-[12.5px] leading-relaxed text-bridal-text-soft">
                    {t.includes}
                  </p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-8 max-w-3xl text-center font-bridal text-[12px] italic text-bridal-text-soft">
              {pricing.note}
            </p>
            {guidePillar && (
              <p className="mt-5 text-center">
                <Link
                  href={guidePillar.href}
                  className="font-bridal text-[14px] font-semibold text-bridal-gold-dark hover:underline"
                >
                  {guidePillar.label} →
                </Link>
              </p>
            )}
          </section>
        )}

        {/* ─────────── B6 THINGS TO CHECK ─────────── */}
        {checklist.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Buyer's checklist"
              title={`${checklist.length} things to check before you book`}
            />
            <ol className="mx-auto grid max-w-5xl gap-x-12 gap-y-7 sm:grid-cols-2">
              {checklist.map((item, i) => (
                <li key={i} className="flex gap-5 border-b border-bridal-beige/50 pb-6">
                  <span className="font-display text-[30px] italic leading-none text-bridal-gold/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bridal text-[13.5px] leading-relaxed text-bridal-text">
                    {item}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* ─────────── B8 EVENT-BY-EVENT ─────────── */}
        {eventNotes.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Every function"
              title={`${vt.singular} coverage by event in ${city.name}`}
            />
            <div className="mx-auto grid max-w-5xl gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
              {eventNotes.map((e) => (
                <div key={e.event} className="border-t-2 border-bridal-gold/40 pt-4">
                  <FacetLabel>{e.event}</FacetLabel>
                  <p className="mt-2 font-bridal text-[13px] leading-relaxed text-bridal-text-soft">
                    {e.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─────────── B7 QUESTIONS ─────────── */}
        {questions.length > 0 && (
          <section className="mb-16">
            <SectionHeading
              kicker="Pre-qualify the vendor"
              title={`Questions to ask before booking in ${city.name}`}
            />
            <ul className="mx-auto grid max-w-5xl gap-x-12 gap-y-4 sm:grid-cols-2">
              {questions.map((q) => (
                <li
                  key={q}
                  className="flex gap-3 border-b border-bridal-beige/40 pb-4 font-bridal text-[13.5px] leading-relaxed text-bridal-text"
                >
                  <span className="mt-0.5 text-bridal-gold-dark">✓</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ─────────── B11 FAQ ─────────── */}
        <section className="mb-16">
          <SectionHeading
            kicker="FAQ"
            title={`${vt.singular} in ${city.name} — frequently asked`}
          />
          <div className="mx-auto max-w-3xl border-t border-bridal-beige/60">
            {faqs.map((f) => (
              <details key={f.question} className="group border-b border-bridal-beige/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bridal text-[14.5px] font-semibold text-bridal-charcoal">
                  {f.question}
                  <span className="shrink-0 text-[18px] text-bridal-gold-dark transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-5 font-bridal text-[13.5px] leading-relaxed text-bridal-text">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ─────────── B12 GUIDES + CROSS-LINKS ─────────── */}
        {relatedGuides.length > 0 && (
          <section className="mb-12">
            <SectionHeading kicker="Helpful guides" title={`For your ${vt.singular.toLowerCase()} search`} />
            <ul className="flex flex-wrap justify-center gap-2">
              {relatedGuides.map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className={CHIP}>
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-16 grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div className="text-center">
            <FacetLabel>{`${vt.plural} in other cities`}</FacetLabel>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${vt.slug}/${c.slug}`} className={CHIP}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center">
            <FacetLabel>{`Other vendors in ${city.name}`}</FacetLabel>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {otherTypes.map((other) => (
                <li key={other.slug}>
                  <Link href={`/${other.slug}/${city.slug}`} className={CHIP}>
                    {other.plural}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─────────── B13 FINAL CTA ─────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-bridal-gold/30">
          {imagery.cta ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagery.cta}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-bridal-charcoal/78" />
            </>
          ) : (
            <div className="absolute inset-0 bg-bridal-wash" />
          )}
          <div className="relative p-8 text-center sm:p-14">
            <span className="bridal-crown">
              <span className="bridal-label">Wedding Wala</span>
            </span>
            <h2
              className={`mx-auto mt-3 max-w-2xl font-display text-[28px] italic leading-tight sm:text-[34px] ${
                imagery.cta ? "text-bridal-ivory" : "text-bridal-charcoal"
              }`}
            >
              Find your {city.name} {vt.singular.toLowerCase()} today
            </h2>
            <p
              className={`mx-auto mt-3 max-w-xl font-bridal text-[14.5px] leading-relaxed ${
                imagery.cta ? "text-bridal-ivory/85" : "text-bridal-text-soft"
              }`}
            >
              Compare verified {vt.plural.toLowerCase()}, see transparent PKR pricing, and get
              free quotes — every booking is protected by a refund-backed deposit.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#vendors" className={BTN_PRIMARY}>
                Browse {vt.plural.toLowerCase()}
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  imagery.cta
                    ? "inline-flex items-center justify-center gap-2 rounded-full border border-bridal-ivory/60 px-6 py-3 font-bridal text-[14px] font-semibold text-bridal-ivory transition-all hover:bg-bridal-ivory/10"
                    : BTN_SECONDARY
                }
              >
                Get free quotes on WhatsApp
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────── STICKY MOBILE CTA (B13) ─────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bridal-beige bg-bridal-ivory/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bridal text-[11px] text-bridal-text-soft">
              {vt.plural} in {city.name}
            </p>
            <p className="truncate font-bridal text-[13px] font-semibold text-bridal-charcoal">
              {range ?? "Get free quotes"}
            </p>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-bridal-gold px-5 py-2.5 font-bridal text-[13px] font-semibold text-white"
          >
            Get quotes
          </a>
        </div>
      </div>
    </>
  )
}
