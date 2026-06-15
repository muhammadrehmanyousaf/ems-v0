/**
 * Shared component for `/[vendor-type-plural]/[city]` programmatic SEO pages.
 * Each per-vendor-type [city] route file imports this with its own slug.
 *
 * Server-component: fetches vendors via `fetchCityVendors` (ISR-cached 1h),
 * emits CollectionPage + Service + FAQPage JSON-LD, breadcrumbs, real listings.
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
} from "@/lib/seo/pricing-guide"

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
    title: `${vt.plural} in ${city.name}`,
    description: `Find the best ${vt.plural.toLowerCase()} in ${city.name}. ${vt.description} Verified vendors, real reviews, transparent pricing — book in minutes on ${SITE_NAME}.`,
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
  const vendors = await fetchCityVendors({
    city: city.slug,
    vendorType: backendType,
    limit: 24,
  })

  // For pages with zero real listings, we render the page but mark it
  // `noindex,follow` so Google still crawls outbound internal links but
  // doesn't index the empty page itself. Resolves GSC's "Crawled - currently
  // not indexed" warning for combos we haven't onboarded vendors for yet.
  // When at least one vendor is onboarded for the combo, the page becomes
  // indexable automatically without any code change.
  const hasListings = vendors.length > 0
  const editorial = getCityEditorial(city.slug)
  const guide = getVendorTypeGuide(vt.slug)
  const pricing = getVendorTypePricing(vt.slug)
  const questions = getVendorTypeQuestions(vt.slug)
  const guidePillar = getVendorTypeGuidePillar(vt.slug)

  const url = `${SITE_URL}/${vt.slug}/${city.slug}`
  const priceRangeStr = formatPriceRange(vendors)

  const collectionLd = collectionPageLD({
    name: `${vt.plural} in ${city.name} — ${SITE_NAME}`,
    description: `${vt.plural} serving weddings in ${city.name}, Pakistan.`,
    url: `/${vt.slug}/${city.slug}`,
    items: vendors.slice(0, 10).map((v) => ({
      name: v.name,
      url: v.href ? `${SITE_URL}${v.href}` : url,
      imageUrl: v.imageUrl,
    })),
  })

  const svcLd = serviceLD({
    name: `${vt.plural} in ${city.name}`,
    description: `${vt.description} Serving ${city.name}, ${city.region}.`,
    url: `/${vt.slug}/${city.slug}`,
    serviceType: vt.singular,
    areaServed: city.name,
    priceRange: priceRangeStr,
  })

  const faqs = [
    {
      question: `How much do ${vt.plural.toLowerCase()} in ${city.name} cost?`,
      answer: priceRangeStr
        ? `${vt.plural} in ${city.name} on ${SITE_NAME} currently range from ${priceRangeStr}. Browse the listings below to see PKR ranges from each vendor.`
        : `Prices vary by package, season, and vendor experience. Browse the listings below to see PKR ranges from each ${city.name} ${vt.singular.toLowerCase()} — every price on ${SITE_NAME} is transparent before you book.`,
    },
    {
      question: `How far in advance should I book a ${vt.singular.toLowerCase()} in ${city.name}?`,
      answer: editorial.peakSeason
        ? `${city.name}'s peak shaadi season is ${editorial.peakSeason} — for any date in that window, book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out. Popular ${city.name} ${vt.plural.toLowerCase()} fill up faster than less-known ones, so secure the date before locking the vendor.`
        : `For peak shaadi season (October–February), book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out. Popular ${city.name} ${vt.plural.toLowerCase()} fill up faster — book the date before the vendor.`,
    },
    {
      question: `Can I see real reviews for these ${vt.plural.toLowerCase()}?`,
      answer: `Yes. Every review on ${SITE_NAME} is from a verified booking — couples can only review a vendor after the wedding date passes. No fake reviews, no incentivized ratings.`,
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
      {/* Empty-listing pages stay accessible (so vendors can still link to
         them, and Google can still crawl outbound) but are kept out of the
         search index so they don't drag the site's content-quality signal. */}
      {!hasListings && <meta name="robots" content="noindex,follow" />}

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: vt.plural, href: `/${vt.slug}` },
            { name: city.name, href: `/${vt.slug}/${city.slug}` },
          ]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            {city.region} · Pakistan
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            {vt.plural} in {city.name}
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {vt.description} {SITE_NAME} helps you find verified {vt.plural.toLowerCase()} in {city.name} —
            with real reviews, transparent PKR pricing, and a refund-protected booking flow.
          </p>
          {vendors.length > 0 && (
            <p className="mt-3 font-bridal text-[13px] text-bridal-text-soft">
              <strong className="text-bridal-charcoal">{vendors.length}</strong>{" "}
              {vendors.length === 1 ? "vendor" : "vendors"} listed
              {priceRangeStr ? ` · price range ${priceRangeStr}` : ""}
            </p>
          )}
        </header>

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Top {vt.plural.toLowerCase()} in {city.name}
          </h2>

          {vendors.length === 0 ? (
            <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-ivory/40 p-8 text-center">
              <p className="font-bridal text-[14px] text-bridal-text-soft">
                {backendType
                  ? `No ${vt.plural.toLowerCase()} in ${city.name} yet — check back soon, or browse other cities below.`
                  : `${vt.plural} listings coming soon. We're onboarding ${vt.plural.toLowerCase()} across Pakistan now.`}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendors.map((v) => (
                <li key={v.id}>
                  <Link
                    href={v.href ?? "#"}
                    className="group block rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-bridal-cream relative overflow-hidden">
                      {v.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.imageUrl}
                          alt={v.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-bridal text-[12px] text-bridal-text-soft">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-display italic text-[18px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors line-clamp-1">
                        {v.name}
                      </p>
                      <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft">
                        {v.city || city.name}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        {v.rating > 0 ? (
                          <span className="font-bridal text-[12px] text-bridal-charcoal">
                            ★ {v.rating.toFixed(1)}{" "}
                            <span className="text-bridal-text-soft">
                              ({v.reviewCount})
                            </span>
                          </span>
                        ) : (
                          <span className="font-bridal text-[12px] text-bridal-text-soft">
                            New on {SITE_NAME}
                          </span>
                        )}
                        {v.priceMin && (
                          <span className="font-bridal text-[12px] text-bridal-charcoal">
                            from PKR {v.priceMin.toLocaleString("en-PK")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            About {vt.plural.toLowerCase()} in {city.name}
          </h2>
          <div className="prose prose-bridal max-w-3xl font-bridal text-[14.5px] text-bridal-text leading-relaxed space-y-4">
            {editorial.intro ? (
              <p>{editorial.intro}</p>
            ) : (
              <p>
                {city.name} is one of Pakistan&apos;s busiest wedding destinations.
                Whether you&apos;re planning a baraat at a banquet hall, a mehndi
                under string lights at home, or a walima at a marquee,{" "}
                {city.name} offers a {vt.singular.toLowerCase()} for every style
                and budget.
              </p>
            )}
            {editorial.notable && (
              <p>
                <strong className="text-bridal-charcoal font-semibold">
                  Where {vt.plural.toLowerCase()} cluster in {city.name}:
                </strong>{" "}
                {editorial.notable}
              </p>
            )}
            {guide && (
              <p>
                <strong className="text-bridal-charcoal font-semibold">
                  What to look for in a {city.name}{" "}
                  {vt.singular.toLowerCase()}:
                </strong>{" "}
                {guide}
              </p>
            )}
            {editorial.priceContext && (
              <p>
                <strong className="text-bridal-charcoal font-semibold">
                  Pricing context:
                </strong>{" "}
                {editorial.priceContext}
              </p>
            )}
            <p>
              {SITE_NAME} simplifies the {city.name}{" "}
              {vt.singular.toLowerCase()} search. Every vendor is
              identity-verified, every review comes from a real booking, and
              every quote is transparent before you commit a deposit.
              {editorial.peakSeason && (
                <>
                  {" "}
                  Peak season here is{" "}
                  <strong className="text-bridal-charcoal font-semibold">
                    {editorial.peakSeason}
                  </strong>
                  ; book ahead for those months.
                </>
              )}
            </p>
          </div>
        </section>

        {pricing && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              What does a {vt.singular.toLowerCase()} in {city.name} cost?
            </h2>
            <div className="overflow-x-auto max-w-3xl">
              <table className="w-full border-collapse font-bridal text-[14px]">
                <thead>
                  <tr className="border-b border-bridal-beige text-left">
                    <th className="py-2 pr-4 font-semibold text-bridal-charcoal">Tier</th>
                    <th className="py-2 pr-4 font-semibold text-bridal-charcoal whitespace-nowrap">
                      Indicative PKR
                    </th>
                    <th className="py-2 font-semibold text-bridal-charcoal">
                      Typically includes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.tiers.map((t) => (
                    <tr
                      key={t.tier}
                      className="border-b border-bridal-beige/60 align-top"
                    >
                      <td className="py-3 pr-4 font-semibold text-bridal-charcoal whitespace-nowrap">
                        {t.tier}
                      </td>
                      <td className="py-3 pr-4 text-bridal-charcoal whitespace-nowrap">
                        {t.band}
                      </td>
                      <td className="py-3 text-bridal-text leading-relaxed">
                        {t.includes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl font-bridal text-[12.5px] italic text-bridal-text-soft">
              {pricing.note}
            </p>
            {guidePillar && (
              <p className="mt-4 font-bridal text-[14px]">
                <Link
                  href={guidePillar.href}
                  className="text-bridal-gold font-semibold hover:underline"
                >
                  {guidePillar.label} →
                </Link>
              </p>
            )}
          </section>
        )}

        {questions.length > 0 && (
          <section className="mb-12">
            <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
              Questions to ask before booking a {vt.singular.toLowerCase()} in{" "}
              {city.name}
            </h2>
            <ul className="max-w-3xl list-disc space-y-2 pl-5 font-bridal text-[14px] text-bridal-text leading-relaxed">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>
        )}

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

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-4">
          <div>
            <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
              {vt.plural} in other cities
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/${vt.slug}/${c.slug}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
              Other vendors in {city.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherTypes.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/${other.slug}/${city.slug}`}
                    className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                  >
                    {other.plural}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </>
  )
}
