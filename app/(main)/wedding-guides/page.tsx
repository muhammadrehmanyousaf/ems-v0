/**
 * /wedding-guides — hub linking to every content pillar.
 *
 * Funnels internal link equity into the 32 data-driven pillars (+ the two
 * flagship pages) and gives Google a single crawlable index of the cluster.
 * Registry-driven, so new pillars appear here automatically. Emits
 * CollectionPage(ItemList) JSON-LD.
 */

import Link from "next/link"
import type { Metadata } from "next"
import {
  SITE_NAME,
  SITE_URL,
  buildPageMetadata,
  collectionPageLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CONTENT_PILLARS } from "@/lib/content/pillars"

const PATH = "/wedding-guides"

interface GuideItem {
  slug: string
  title: string
  eyebrow: string
}

// Flagship long-form pages that aren't in the data-driven registry.
const FLAGSHIPS: GuideItem[] = [
  { slug: "wedding-cost-in-pakistan", title: "Wedding Cost in Pakistan (with budget calculator)", eyebrow: "Budget" },
  { slug: "pakistani-bridal-dress-trends", title: "Pakistani Bridal Dress Trends", eyebrow: "Fashion" },
]

const GROUP_ORDER = [
  "Planning & logistics",
  "Choosing your vendors",
  "Budget & money",
  "Events & traditions",
  "Legal & registration",
  "Fashion & style",
  "More guides",
]

function groupFor(slug: string): string {
  if (slug.includes("how-to-choose")) return "Choosing your vendors"
  if (/(nikah|court-marriage|nikahnama|dowry|jahez|nadra|second-marriage|one-dish|haq-mehr)/.test(slug)) return "Legal & registration"
  if (/(mehndi|mayun|dholki|barat|walima|events-order|rukhsati|haldi)/.test(slug)) return "Events & traditions"
  if (/(cost|save-money|who-pays|gift|salami|catering-menu)/.test(slug)) return "Budget & money"
  if (/(bridal-dress|sherwani|what-to-wear|jewellery)/.test(slug)) return "Fashion & style"
  if (/(plan-a-wedding|best-time|checklist|timeline|destination|invitation|wedding-car|groom-wedding-prep|photoshoot)/.test(slug)) return "Planning & logistics"
  return "More guides"
}

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding Guides for Pakistan",
  description: `Free expert wedding planning guides for Pakistan — costs, choosing vendors, events, legal steps, fashion and more from ${SITE_NAME}.`,
  path: PATH,
})

export default function WeddingGuidesPage() {
  const all: GuideItem[] = [
    ...FLAGSHIPS,
    ...CONTENT_PILLARS.map((p) => ({ slug: p.slug, title: p.h1, eyebrow: p.eyebrow })),
  ]

  const groups = new Map<string, GuideItem[]>()
  for (const g of GROUP_ORDER) groups.set(g, [])
  for (const item of all) {
    const g = groupFor(item.slug)
    const bucket = groups.get(g)
    if (bucket) bucket.push(item)
  }

  const ld = combineGraph(
    collectionPageLD({
      name: `Wedding Guides — ${SITE_NAME}`,
      description: "Expert wedding planning guides for Pakistan.",
      url: PATH,
      items: all.map((a) => ({ name: a.title, url: `/${a.slug}` })),
    }),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Wedding Guides", href: PATH }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Wedding Guides · Pakistan
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[46px] leading-tight text-bridal-charcoal">
            Wedding planning guides for Pakistan
          </h1>
          <p className="mt-4 font-bridal text-[15.5px] text-bridal-text leading-relaxed">
            Everything you need to plan a Pakistani wedding — what it costs, how
            to choose every vendor, the events explained, the legal steps, and
            more. {all.length} expert, regularly-updated guides from {SITE_NAME}.
          </p>
        </header>

        <div className="space-y-12">
          {GROUP_ORDER.map((g) => {
            const items = groups.get(g) ?? []
            if (items.length === 0) return null
            return (
              <section key={g}>
                <h2 className="font-display italic text-[24px] text-bridal-charcoal mb-5">
                  {g}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${item.slug}`}
                        className="group block h-full rounded-md border border-bridal-beige p-5 hover:border-bridal-gold hover:shadow-md transition-all"
                      >
                        <p className="font-bridal text-[10px] uppercase tracking-[0.18em] text-bridal-gold mb-2">
                          {item.eyebrow}
                        </p>
                        <p className="font-display italic text-[17px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors leading-snug">
                          {item.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}
