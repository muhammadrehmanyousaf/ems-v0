/**
 * "Best {vendor} in {city} {year}" listicle page — the GEO/AI-citation weapon.
 *
 * Route: /best/{vendorTypeSlug}-in-{citySlug}  (single dynamic segment `[slug]`)
 *
 * Unlike the directory-style city×category page, this is an answer-first
 * *ranked article*: a lead paragraph that names the top vendors in the first
 * sentence (what AI engines quote), a comparison table (cited ~2.5× more than
 * prose), a numbered ranked list, a how-to-choose guide, transparent PKR
 * pricing, and FAQPage schema. Emits CollectionPage(ItemList) + Article +
 * Service + FAQPage JSON-LD.
 *
 * Gated behind `LISTICLE_PAGES_ENABLED`; only renders when ≥
 * `MIN_VENDORS_FOR_LISTICLE` real vendors exist (else 404 — no thin "best of").
 */

import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  SITE_NAME,
  SITE_URL,
  getBackendVendorType,
  buildPageMetadata,
  collectionPageLD,
  serviceLD,
  articleLD,
  faqLD,
  combineGraph,
  slugifyName,
  VENDOR_TYPE_BACKEND_MAP,
  type VendorTypeSlug,
} from "@/lib/seo"
import { BACKEND_URL } from "@/lib/backend-url"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { fetchCityVendors, type VendorListItem } from "@/lib/seo/fetch-vendors"
import { getCityEditorial, getVendorTypeGuide } from "@/lib/seo/city-editorial"
import {
  LISTICLE_PAGES_ENABLED,
  LISTICLE_VENDOR_TYPES,
  LISTICLE_YEAR,
  LISTICLE_UPDATED_LABEL,
  LISTICLE_DATE_PUBLISHED,
  LISTICLE_DATE_MODIFIED,
  LISTICLE_MAX_RANKED,
  MIN_VENDORS_FOR_LISTICLE,
  buildListicleSlug,
  parseListicleSlug,
  rankVendors,
} from "@/lib/seo/listicle"

// Reverse of the SEO→backend vendor-type map, so we can tally a bulk
// /businesses response by SEO slug at build time. (Mirrors the private map in
// fetch-vendors.ts / sitemap.ts; duplicated here to keep those files untouched.)
const BACKEND_TO_SEO: Record<string, VendorTypeSlug> = Object.fromEntries(
  Object.entries(VENDOR_TYPE_BACKEND_MAP)
    .filter(([, backend]) => backend != null)
    .map(([seo, backend]) => [backend as string, seo as VendorTypeSlug]),
)

/**
 * Build-time static params: fetch the live inventory once, tally vendors per
 * (type, city), and emit a listicle URL only where ≥ MIN_VENDORS exist. On the
 * flag being off — or the backend being unreachable at build — we emit nothing
 * (never ship a thin or empty "best of" page).
 */
export async function generateListicleStaticParams(): Promise<{ slug: string }[]> {
  if (!LISTICLE_PAGES_ENABLED) return []

  const counts = new Map<string, number>()
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/businesses?limit=2000`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: any }
    const raws: any[] = Array.isArray(json?.data) ? json.data : json?.data?.data ?? []
    for (const raw of raws) {
      const vendor = raw?.vendor ?? {}
      const backendType: string | undefined =
        raw?.type || vendor?.vendorType || raw?.subBusinessType
      if (!backendType) continue
      const seoTypeSlug = BACKEND_TO_SEO[backendType]
      if (!seoTypeSlug) continue
      const cityRaw: string = raw?.city ?? raw?.location ?? vendor?.city ?? ""
      if (!cityRaw) continue
      const citySlug = slugifyName(cityRaw)
      if (!CITIES.some((c) => c.slug === citySlug)) continue
      const key = `${seoTypeSlug}|${citySlug}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  } catch {
    return []
  }

  const params: { slug: string }[] = []
  for (const [key, count] of counts) {
    if (count < MIN_VENDORS_FOR_LISTICLE) continue
    const [typeSlug, citySlug] = key.split("|")
    params.push({ slug: buildListicleSlug(typeSlug, citySlug) })
  }
  return params
}

export function generateListicleMetadata(slug: string): Metadata {
  if (!LISTICLE_PAGES_ENABLED) return { title: "Not Found" }
  const parsed = parseListicleSlug(slug)
  if (!parsed) return { title: "Not Found" }
  const { vendorType: vt, city } = parsed

  return buildPageMetadata({
    title: `Best ${vt.plural} in ${city.name} (${LISTICLE_YEAR})`,
    description: `The best ${vt.plural.toLowerCase()} in ${city.name}, ranked by real couples. Compare ratings, packages & PKR prices, then book a verified ${vt.singular.toLowerCase()} in minutes on ${SITE_NAME}.`,
    path: `/best/${slug}`,
    ogType: "article",
  })
}

function formatPriceRange(vendors: VendorListItem[]): string | undefined {
  const prices = vendors
    .map((v) => v.priceMin)
    .filter((p): p is number => Number.isFinite(p ?? NaN) && (p ?? 0) > 0)
  if (prices.length === 0) return undefined
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  if (lo === hi) return `PKR ${lo.toLocaleString("en-PK")}`
  return `PKR ${lo.toLocaleString("en-PK")} – ${hi.toLocaleString("en-PK")}`
}

/** Natural-language join: ["A","B","C"] → "A, B, and C". */
function joinNames(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}

export async function BestVendorListiclePage({ slug }: { slug: string }) {
  if (!LISTICLE_PAGES_ENABLED) notFound()
  const parsed = parseListicleSlug(slug)
  if (!parsed) notFound()
  const { vendorType: vt, city } = parsed

  const backendType = getBackendVendorType(vt.slug)
  const all = rankVendors(
    await fetchCityVendors({ city: city.slug, vendorType: backendType, limit: 50 }),
  )

  // Never publish a thin "best of" list.
  if (all.length < MIN_VENDORS_FOR_LISTICLE) notFound()

  const ranked = all.slice(0, LISTICLE_MAX_RANKED)
  const priceRangeStr = formatPriceRange(all)
  const editorial = getCityEditorial(city.slug)
  const guide = getVendorTypeGuide(vt.slug)
  const path = `/best/${slug}`
  const url = `${SITE_URL}${path}`

  const topNames = ranked.slice(0, Math.min(3, ranked.length)).map((v) => v.name)
  const pageTitle = `Best ${vt.plural} in ${city.name} (${LISTICLE_YEAR})`

  const faqs = [
    {
      question: `Who are the best ${vt.plural.toLowerCase()} in ${city.name}?`,
      answer: `Ranked by real couple reviews and transparent pricing on ${SITE_NAME}, the top ${vt.plural.toLowerCase()} in ${city.name} for ${LISTICLE_YEAR} are ${joinNames(topNames)}. See the full ranked list and comparison table above.`,
    },
    {
      question: `How much does a ${vt.singular.toLowerCase()} cost in ${city.name}?`,
      answer: priceRangeStr
        ? `${vt.plural} in ${city.name} on ${SITE_NAME} currently start from ${priceRangeStr}, depending on package, experience, and season. Every quote is shown in PKR before you book.`
        : `Prices vary by package, experience, and season. Browse the listings above to see transparent PKR pricing from each ${city.name} ${vt.singular.toLowerCase()}.`,
    },
    {
      question: `How do I book a ${vt.singular.toLowerCase()} in ${city.name}?`,
      answer: `Open any vendor below, compare packages and real reviews, then request a date on ${SITE_NAME}. Your deposit is held until the vendor confirms — refund-protected if they cancel.`,
    },
    {
      question: `How many ${vt.plural.toLowerCase()} are listed in ${city.name}?`,
      answer: `${SITE_NAME} currently lists ${all.length} verified ${vt.plural.toLowerCase()} in ${city.name}${priceRangeStr ? `, priced from ${priceRangeStr}` : ""}. This guide ranks the top ${ranked.length}.`,
    },
    {
      question: `When should I book a ${vt.singular.toLowerCase()} in ${city.name}?`,
      answer: editorial.peakSeason
        ? `${city.name}'s peak shaadi season is ${editorial.peakSeason} — book 6–9 months ahead for those dates. Off-season weddings can often be booked 2–3 months out.`
        : `For peak shaadi season (October–February), book 6–9 months ahead. Off-season weddings can often be booked 2–3 months out.`,
    },
  ]

  const collectionLd = collectionPageLD({
    name: pageTitle,
    description: `The best ${vt.plural.toLowerCase()} in ${city.name}, ranked by real reviews and transparent PKR pricing.`,
    url: path,
    items: ranked.map((v) => ({
      name: v.name,
      url: v.href ? `${SITE_URL}${v.href}` : url,
      imageUrl: v.imageUrl,
    })),
  })

  const articleLd = articleLD({
    headline: pageTitle,
    description: `Ranked guide to the best ${vt.plural.toLowerCase()} in ${city.name} for ${LISTICLE_YEAR} — ratings, packages, and PKR prices compared.`,
    url: path,
    imageUrl: ranked.find((v) => v.imageUrl)?.imageUrl ?? `${SITE_URL}/og-default.jpg`,
    datePublished: LISTICLE_DATE_PUBLISHED,
    dateModified: LISTICLE_DATE_MODIFIED,
    authorName: `${SITE_NAME} Editorial`,
  })

  const svcLd = serviceLD({
    name: `${vt.plural} in ${city.name}`,
    description: `${vt.description} Serving ${city.name}, ${city.region}.`,
    url: path,
    serviceType: vt.singular,
    areaServed: city.name,
    priceRange: priceRangeStr,
  })

  const ld = combineGraph(collectionLd, articleLd, svcLd, faqLD(faqs))

  // Cross-links that build the listicle cluster: same vendor in other cities,
  // other vendors in this city — all pointing at sibling "best of" pages.
  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 6)
  const otherTypes = LISTICLE_VENDOR_TYPES.filter((v) => v.slug !== vt.slug).slice(0, 6)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: vt.plural, href: `/${vt.slug}` },
            { name: city.name, href: `/${vt.slug}/${city.slug}` },
            { name: `Best in ${city.name}`, href: path },
          ]}
          className="mb-6"
        />

        <header className="mb-8 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Best of {city.name} · {LISTICLE_YEAR}
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[46px] leading-tight text-bridal-charcoal">
            Best {vt.plural} in {city.name}
          </h1>
          {/* Answer-first lead — names the top vendors in the first sentence so
             AI engines can quote it directly. */}
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            The best {vt.plural.toLowerCase()} in {city.name} right now are{" "}
            <strong className="text-bridal-charcoal font-semibold">
              {joinNames(topNames)}
            </strong>
            , ranked from real couple reviews and transparent PKR pricing on{" "}
            {SITE_NAME}. Below we compare the top {ranked.length} —{" "}
            ratings, packages, and starting prices — so you can shortlist and
            book in minutes.
          </p>
          <p className="mt-3 font-bridal text-[12px] text-bridal-text-soft">
            Updated {LISTICLE_UPDATED_LABEL} · {all.length} verified{" "}
            {vt.plural.toLowerCase()} compared
            {priceRangeStr ? ` · from ${priceRangeStr}` : ""}
          </p>
        </header>

        {/* Comparison table — cited far more than prose by AI search. */}
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Top {ranked.length} {vt.plural.toLowerCase()} in {city.name} compared
          </h2>
          <div className="overflow-x-auto rounded-md border border-bridal-beige">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bridal-ivory/60 font-bridal text-[11px] uppercase tracking-[0.12em] text-bridal-text-label">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">{vt.singular}</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium" aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {ranked.map((v, i) => (
                  <tr
                    key={v.id}
                    className="border-t border-bridal-beige align-middle"
                  >
                    <td className="px-4 py-3 font-bridal text-[13px] text-bridal-text-soft">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={v.href ?? "#"}
                        className="font-display italic text-[16px] text-bridal-charcoal hover:text-bridal-gold transition-colors"
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-bridal text-[13px] text-bridal-charcoal whitespace-nowrap">
                      {v.rating > 0 ? (
                        <>
                          ★ {v.rating.toFixed(1)}{" "}
                          <span className="text-bridal-text-soft">
                            ({v.reviewCount})
                          </span>
                        </>
                      ) : (
                        <span className="text-bridal-text-soft">New</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bridal text-[13px] text-bridal-charcoal whitespace-nowrap">
                      {v.priceMin
                        ? `PKR ${v.priceMin.toLocaleString("en-PK")}`
                        : "On request"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={v.href ?? "#"}
                        className="font-bridal text-[12px] text-bridal-gold hover:text-bridal-gold-dark whitespace-nowrap"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Ranked editorial list. */}
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-6">
            The {ranked.length} best {vt.plural.toLowerCase()} in {city.name}
          </h2>
          <ol className="space-y-5">
            {ranked.map((v, i) => (
              <li key={v.id}>
                <Link
                  href={v.href ?? "#"}
                  className="group flex gap-4 rounded-md border border-bridal-beige overflow-hidden hover:border-bridal-gold hover:shadow-md transition-all"
                >
                  <div className="relative w-28 sm:w-40 shrink-0 bg-bridal-cream self-stretch min-h-[112px]">
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
                      <div className="absolute inset-0 flex items-center justify-center font-bridal text-[11px] text-bridal-text-soft">
                        No image
                      </div>
                    )}
                    <span className="absolute top-2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-bridal-charcoal/85 text-bridal-ivory font-bridal text-[13px]">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 py-3 pr-4 min-w-0">
                    <p className="font-display italic text-[19px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors line-clamp-1">
                      {v.name}
                    </p>
                    <div className="mt-1 flex items-center gap-3 flex-wrap">
                      {v.rating > 0 ? (
                        <span className="font-bridal text-[12px] text-bridal-charcoal">
                          ★ {v.rating.toFixed(1)}{" "}
                          <span className="text-bridal-text-soft">
                            ({v.reviewCount} reviews)
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
                      <span className="font-bridal text-[12px] text-bridal-text-soft">
                        {v.city || city.name}
                      </span>
                    </div>
                    {v.description && (
                      <p className="mt-2 font-bridal text-[13px] text-bridal-text leading-relaxed line-clamp-2">
                        {v.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* How to choose. */}
        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            How to choose a {vt.singular.toLowerCase()} in {city.name}
          </h2>
          <div className="prose prose-bridal max-w-3xl font-bridal text-[14.5px] text-bridal-text leading-relaxed space-y-4">
            {guide && <p>{guide}</p>}
            {editorial.notable && (
              <p>
                <strong className="text-bridal-charcoal font-semibold">
                  Where {vt.plural.toLowerCase()} cluster in {city.name}:
                </strong>{" "}
                {editorial.notable}
              </p>
            )}
            {priceRangeStr && (
              <p>
                <strong className="text-bridal-charcoal font-semibold">
                  What you&apos;ll pay:
                </strong>{" "}
                {vt.plural} in {city.name} on {SITE_NAME} range {priceRangeStr}.{" "}
                {editorial.priceContext}
              </p>
            )}
            <p>
              Every vendor in this guide is identity-verified, every review
              comes from a real booking, and every quote is transparent before
              you commit a deposit — so you can compare {city.name}{" "}
              {vt.plural.toLowerCase()} with confidence.
            </p>
          </div>
        </section>

        {/* FAQ — FAQPage schema above. */}
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

        {/* CTA into the full directory page. */}
        <section className="mb-12">
          <div className="rounded-md border border-bridal-beige bg-bridal-ivory/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-display italic text-[20px] text-bridal-charcoal">
                See every {vt.singular.toLowerCase()} in {city.name}
              </p>
              <p className="mt-1 font-bridal text-[13px] text-bridal-text-soft">
                Filter all {all.length} verified {vt.plural.toLowerCase()} by
                budget, rating, and availability.
              </p>
            </div>
            <Link
              href={`/${vt.slug}/${city.slug}`}
              className="inline-block shrink-0 px-5 py-2.5 rounded-full bg-bridal-charcoal text-bridal-ivory font-bridal text-[13px] hover:bg-bridal-gold-dark transition-colors"
            >
              Browse all {vt.plural}
            </Link>
          </div>
        </section>

        {/* Sibling "best of" cross-links — builds the cluster. */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-4">
          <div>
            <h2 className="font-display italic text-[20px] text-bridal-charcoal mb-3">
              Best {vt.plural.toLowerCase()} in other cities
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/best/${buildListicleSlug(vt.slug, c.slug)}`}
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
              Best vendors in {city.name}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {otherTypes.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/best/${buildListicleSlug(other.slug, city.slug)}`}
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
