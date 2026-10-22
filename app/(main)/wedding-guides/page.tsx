/**
 * /wedding-guides — hub linking to every content pillar.
 *
 * Funnels internal link equity into the data-driven pillars (+ flagship pages)
 * and gives search engines and AI crawlers a comprehensive, structured knowledge base.
 * Emits combined CollectionPage(ItemList) and FAQPage JSON-LD.
 */

import { safeJsonLd } from "@/lib/seo/jsonld"
import Link from "next/link"
import type { Metadata } from "next"
import {
  SITE_NAME,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  VENDOR_TYPES,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { CONTENT_PILLARS } from "@/lib/content/pillars"
import { ArrowRight, BookOpen, CheckCircle2, HelpCircle } from "lucide-react"

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

const FAQS = [
  {
    question: "When should couples start planning a wedding in Pakistan?",
    answer: "For winter weddings in Pakistan (November through February), couples should ideally start planning 9 to 12 months in advance to secure top banquet halls, marquees, and in-demand photographers. For summer or off-peak weddings, 4 to 6 months is generally sufficient.",
  },
  {
    question: "What is the typical sequence of Pakistani wedding events?",
    answer: "A traditional Pakistani wedding follows a distinct sequence: Baat Pakki / Engagement, followed by pre-wedding festivities including Dholki and Mayun, then Mehndi (henna celebration), the Nikah ceremony (marriage contract), Barat (reception hosted by the bride's family with rukhsati), and finally Walima (reception hosted by the groom's family).",
  },
  {
    question: "What legal documents are required for a Pakistani Nikah?",
    answer: "A valid Pakistani Nikah requires original CNICs (Computerized National Identity Cards) of bride and groom, original CNICs of two adult male Muslim witnesses, the registered Nikah Khwan, the official government Nikahnama form (with all columns including Haq Mehr, talaq-e-tafweez, and conditions agreed upon), and subsequent registration with the local Union Council to receive the NADRA Marriage Registration Certificate (MRC).",
  },
  {
    question: "How are wedding expenses traditionally divided in Pakistan?",
    answer: "In Pakistani custom and Islamic practice, the groom and his family host and pay for the Walima banquet, the bride's Haq Mehr, and the groom's wedding attire. The bride's family traditionally hosts the Barat ceremony and dinner. Mehndi events are either hosted separately by each family or combined with costs split 50/50.",
  },
  {
    question: "What are the rules regarding the One-Dish wedding law in Pakistan?",
    answer: "In Punjab and Islamabad, the Punjab Marriage Functions Act enforces the one-dish rule: one main rice or meat dish, one sweet dessert, plus roti/naan and salad. In Sindh, wedding functions are permitted multiple dishes but must adhere to municipal curfew timings (typically 11:00 PM). Adhering to these rules prevents hefty municipal fines and venue shutdowns.",
  },
]

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding Guides for Pakistan (2026)",
  description: `Free expert wedding planning guides for Pakistan — costs, choosing vendors, event sequence, legal steps, and fashion advice from ${SITE_NAME}.`,
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
    faqLD(FAQS),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "Wedding Guides", href: PATH }]} className="mb-6" />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold-dark mb-3">
            Wedding Guides · Pakistan 2026
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[46px] leading-tight text-bridal-charcoal">
            Pakistani Wedding Planning & Advice Guides
          </h1>
          <p className="mt-4 font-bridal text-[15.5px] text-bridal-text leading-relaxed">
            Everything you need to navigate a Pakistani wedding from Baat Pakki to Walima.
            Explore authentic cost breakdowns, vendor selection strategies, event traditions,
            legal requirements, and bridal trends backed by local data.
          </p>
        </header>

        {/* Quick Strategy Blueprint */}
        <section className="mb-12 rounded-xl bg-bridal-cream/60 border border-bridal-gold/30 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-bridal-gold-dark" />
            <h2 className="font-display italic text-2xl text-bridal-charcoal">
              How to Plan a Pakistani Wedding: Key Milestones
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-bridal-text">
            <div className="space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-bridal-gold/15 text-bridal-gold-dark font-medium text-xs">
                Stage 1: 9–12 Months
              </span>
              <h3 className="font-semibold text-bridal-charcoal">Budget & Dates</h3>
              <p>Agree on seasonal dates (winter peak vs summer off-peak), estimate guest count, and allocate 40–50% of budget to venues and catering.</p>
            </div>
            <div className="space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-bridal-gold/15 text-bridal-gold-dark font-medium text-xs">
                Stage 2: 6–9 Months
              </span>
              <h3 className="font-semibold text-bridal-charcoal">Lock Venues & Media</h3>
              <p>Book the marquee or banquet hall early. Secure top photographers and videographers before their wedding season dates fill up.</p>
            </div>
            <div className="space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-bridal-gold/15 text-bridal-gold-dark font-medium text-xs">
                Stage 3: 3–6 Months
              </span>
              <h3 className="font-semibold text-bridal-charcoal">Catering, Decor & Outfits</h3>
              <p>Finalize stage themes, caterer menus complying with one-dish regulations, and place orders for bridal lehengas and groom sherwanis.</p>
            </div>
            <div className="space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-bridal-gold/15 text-bridal-gold-dark font-medium text-xs">
                Stage 4: 1–2 Months
              </span>
              <h3 className="font-semibold text-bridal-charcoal">Nikahnama & Logistics</h3>
              <p>Review Nikahnama clauses, confirm registered Nikah Khwan, arrange wedding cars, guest gifts/mithai, and sound systems.</p>
            </div>
          </div>
        </section>

        {/* Guides Grid by Topic */}
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
                        className="group block h-full rounded-md border border-bridal-beige bg-white p-5 hover:border-bridal-gold hover:shadow-md transition-all"
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

        {/* Vendor Services Cross-Linking (Resolves orphan links & N1) */}
        <section className="mt-16 pt-12 border-t border-bridal-beige">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-4">
            Browse Verified Wedding Vendors Across Pakistan
          </h2>
          <p className="text-sm text-bridal-text mb-6">
            Find vetted, verified professionals for every service category and Pakistani city.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {VENDOR_TYPES.map((vt) => (
              <Link
                key={vt.slug}
                href={`/${vt.slug}`}
                className="p-3 rounded-lg border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream/30 text-xs font-medium text-bridal-charcoal transition-all flex items-center justify-between group"
              >
                <span>{vt.plural}</span>
                <ArrowRight className="w-3.5 h-3.5 text-bridal-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>

        {/* Structured FAQ Section (AI Search Optimization) */}
        <section className="mt-16 pt-12 border-t border-bridal-beige">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-bridal-gold-dark" />
            <h2 className="font-display italic text-[26px] text-bridal-charcoal">
              Frequently Asked Questions About Planning a Pakistani Wedding
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-lg border border-bridal-beige bg-white p-5 space-y-2">
                <h3 className="font-semibold text-bridal-charcoal text-base flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-bridal-gold shrink-0 mt-1" />
                  <span>{faq.question}</span>
                </h3>
                <p className="text-sm text-bridal-text leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
