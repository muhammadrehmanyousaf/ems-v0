import Link from "next/link"
import type { Metadata } from "next"
import {
  CITIES,
  SITE_NAME,
  buildPageMetadata,
  collectionPageLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: `Wedding Services in ${CITIES.length} Pakistani Cities`,
  description: `Browse wedding venues, photographers, planners, and every shaadi vendor across ${CITIES.length} cities in Pakistan — Karachi, Lahore, Islamabad, and beyond.`,
  path: "/cities",
})

export default function CitiesIndexPage() {
  const ld = collectionPageLD({
    name: `Cities — ${SITE_NAME}`,
    description: "Cities served by Wedding Wala across Pakistan.",
    url: "/cities",
    items: CITIES.map((c) => ({
      name: c.name,
      url: `/cities/${c.slug}`,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Cities", href: "/cities" }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Pakistan-wide
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[44px] leading-tight text-bridal-charcoal">
            Wedding services across {CITIES.length} Pakistani cities
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            From the marquees of DHA Karachi to the heritage venues of Lahore and the
            valley views of Islamabad — Wedding Wala connects every Pakistani couple
            with verified vendors in their city.
          </p>
        </header>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CITIES.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/cities/${city.slug}`}
                className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
              >
                <p className="font-display italic text-[20px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                  {city.name}
                </p>
                <p className="font-bridal text-[12px] text-bridal-text-soft mt-1">
                  {city.region}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
