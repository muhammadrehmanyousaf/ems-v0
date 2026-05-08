import Link from "next/link"
import type { Metadata } from "next"
import {
  buildPageMetadata,
  SITE_NAME,
  VENDOR_TYPES,
  collectionPageLD,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

export const metadata: Metadata = buildPageMetadata({
  title: "Compare wedding vendors across Pakistani cities",
  description: `Side-by-side comparisons of every wedding vendor category across Karachi, Lahore, and Islamabad — pricing tiers, market characteristics, which city fits which couple. ${SITE_NAME} comparisons.`,
  path: "/compare",
})

export default function CompareIndexPage() {
  const ld = collectionPageLD({
    name: `Wedding vendor comparisons — ${SITE_NAME}`,
    description: "Compare wedding vendors across Pakistani cities.",
    url: "/compare",
    items: VENDOR_TYPES.map((v) => ({
      name: `Compare ${v.plural}`,
      url: `/compare/${v.slug}`,
    })),
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Compare", href: "/compare" }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Compare
          </p>
          <h1 className="font-display italic text-[38px] sm:text-[48px] leading-tight text-bridal-charcoal">
            Compare wedding vendors across Pakistani cities
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            Karachi, Lahore, Islamabad — each city has its own market
            character. Pick a vendor category to see where to book what
            kind of event for which budget.
          </p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VENDOR_TYPES.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/compare/${v.slug}`}
                className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
              >
                <p className="font-display italic text-[20px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                  {v.plural}
                </p>
                <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft leading-relaxed line-clamp-2">
                  Karachi vs Lahore vs Islamabad — {v.description.toLowerCase()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
