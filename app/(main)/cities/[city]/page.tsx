import { safeJsonLd } from "@/lib/seo/jsonld";
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  SITE_URL,
  getCity,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  serviceLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { getCityVendorTotals } from "@/lib/seo/listicle-inventory"

interface RouteProps {
  params: { city: string }
}

export const revalidate = 3600

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const city = getCity(params.city)
  if (!city) return { title: "Not Found" }

  const meta = buildPageMetadata({
    fullTitle: `Wedding Planning & Venues in ${city.name} (2026 Directory)`,
    description: `Planning your wedding in ${city.name}? Compare top wedding venues, photographers, caterers & makeup artists. View 2026 rates, packages & book on ${SITE_NAME}.`.slice(0, 155),
    path: `/cities/${city.slug}`,
  })
  // A city with no listed vendors has nothing of its own to show (the copy is the same for every city), so it is noindex until
  // vendors join. Same rule as the empty category pages. If the inventory cannot be read the page stays indexable.
  const totals = await getCityVendorTotals().catch(() => null)
  const empty = !!totals && (totals.get(city.slug)?.total ?? 0) === 0
  return empty ? { ...meta, robots: { index: false, follow: true } } : meta
}

export default async function CityHubPage({ params }: RouteProps) {
  const city = getCity(params.city)
  if (!city) notFound()

  const url = `${SITE_URL}/cities/${city.slug}`

  // Real numbers for this city: vendors per category, from the same inventory as the sitemap. Categories without vendors are
  // not linked from here (their pages are noindex). If the inventory is unavailable the page falls back to the full list.
  const totals = await getCityVendorTotals().catch(() => null)
  const row = totals?.get(city.slug)
  const counts: Record<string, number> = row?.byType ?? {}
  const withVendors = VENDOR_TYPES.filter((v) => (counts[v.slug] ?? 0) > 0)
  const typeList = totals && withVendors.length > 0 ? withVendors : VENDOR_TYPES
  const topTypes = [...withVendors].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0)).slice(0, 5)
  const countFaq =
    row && row.total > 0
      ? {
          question: `How many wedding vendors are listed in ${city.name}?`,
          answer: `Wedding Wala currently lists ${row.total} wedding vendor${row.total === 1 ? "" : "s"} in ${city.name} across ${withVendors.length} categor${withVendors.length === 1 ? "y" : "ies"}: ${topTypes.map((v) => `${counts[v.slug]} ${(counts[v.slug] === 1 ? v.singular : v.plural).toLowerCase()}`).join(", ")}. Open a category on this page to compare them.`,
        }
      : null

  // Nearby cities: cities of the same province that have vendors, taken as the neighbours of this one in that list (a ring, so
  // every town gets links from a few others), topped up with the biggest cities. Replaces a list of every city on every page.
  const hasV = (c: { slug: string }) => !totals || (totals.get(c.slug)?.total ?? 0) > 0
  const ringCities = CITIES.filter((c) => (c.region === city.region && c.slug !== "pakistan" && hasV(c)) || c.slug === city.slug)
  const at = ringCities.findIndex((c) => c.slug === city.slug)
  const near = at < 0 ? [] : [1, -1, 2, -2, 3, -3].map((d) => ringCities[(((at + d) % ringCities.length) + ringCities.length) % ringCities.length]).filter((c) => c && c.slug !== city.slug)
  const big = CITIES.filter((c) => c.slug !== city.slug && c.slug !== "pakistan" && hasV(c)).slice(0, 8)
  const nearby = [...new Map([...near, ...big].map((c) => [c.slug, c])).values()].slice(0, 8)

  const collectionLd = collectionPageLD({
    name: `Wedding Services in ${city.name} — ${SITE_NAME}`,
    description: `Vendor categories serving weddings in ${city.name}, Pakistan.`,
    url: `/cities/${city.slug}`,
    items: typeList.map((v) => ({
      name: `${v.plural} in ${city.name}`,
      url: `/${v.slug}/${city.slug}`,
    })),
  })

  const serviceLd = serviceLD({
    name: `Wedding Planning Services in ${city.name}`,
    description: `Marketplace connecting Pakistani couples in ${city.name} with verified wedding vendors.`,
    url: `/cities/${city.slug}`,
    serviceType: "Wedding Planning Marketplace",
    areaServed: city.name,
  })

  const faqs = [
    ...(countFaq ? [countFaq] : []),
    {
      question: `How do I book wedding vendors in ${city.name}?`,
      // "We hold the deposit" removed 2026-08-29 — untrue, and this one
      // answer renders on every city landing page on the site.
      answer: `Browse the vendor categories below — venues, photographers, planners, caterers, decor — pick the vendor that fits your budget and date, and send your booking request through Wedding Wala. Nothing is due until the vendor accepts, and you then pay them directly.`,
    },
    {
      question: `Are vendors in ${city.name} verified?`,
      answer: `Yes — every Wedding Wala vendor in ${city.name} is reviewed by our team for licensing, insurance (where applicable), portfolio quality, and customer reviews before going live.`,
    },
    {
      question: `What does a typical Pakistani wedding cost in ${city.name}?`,
      answer: `Costs vary widely with guest count, vendor mix, and venue choice. Use our Wedding Budget Calculator to get a city-specific estimate.`,
    },
  ]

  const ld = combineGraph(collectionLd, serviceLd, faqLD(faqs))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: "Cities", href: "/cities" },
            { name: city.name, href: `/cities/${city.slug}` },
          ]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold-dark mb-3">
            {city.region} · Pakistan
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Plan your wedding in {city.name}
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            From the first mehndi to the final rukhsati — discover verified wedding
            vendors across {city.name}. Every venue, every photographer, every
            planner reviewed by real couples.
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
            Browse vendors by category
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeList.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/${v.slug}/${city.slug}`}
                  className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
                >
                  <p className="font-display italic text-[18px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                    {v.plural} in {city.name}
                  </p>
                  {counts[v.slug] ? (
                    <p className="mt-0.5 font-bridal text-[12px] font-medium text-bridal-gold-dark">{counts[v.slug]} listed</p>
                  ) : null}
                  <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft leading-relaxed line-clamp-2">
                    {v.description}
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
            Nearby cities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {nearby.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/cities/${other.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {other.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
