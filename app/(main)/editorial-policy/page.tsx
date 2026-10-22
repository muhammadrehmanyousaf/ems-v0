import type { Metadata } from "next"
import Link from "next/link"
import {
  buildPageMetadata,
  SITE_NAME,
  SUPPORT_EMAIL,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import {
  Scale,
  BadgeDollarSign,
  CalendarCheck,
  FileQuestion,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

export const metadata: Metadata = buildPageMetadata({
  title: "Editorial & Pricing Transparency Policy",
  description:
    "How Wedding Wala gathers, calculates, and validates wedding venue and vendor pricing in Pakistan. Zero fabricated quotes, single source of truth rules, and date-stamped prices.",
  path: "/editorial-policy",
})

export default function EditorialPolicyPage() {
  const policies = [
    {
      icon: BadgeDollarSign,
      title: "Single Source of Truth Pricing",
      desc: "Every price displayed across Wedding Wala — whether on vendor profile headers, listing cards, sticky quote estimators, or structured schema — is derived from a single canonical calculation engine. We never manually enter standalone numbers into marketing copy.",
    },
    {
      icon: Scale,
      title: "Clear Pricing Models & Disclosures",
      desc: "Wedding venues and services must declare their exact pricing model: per-head (with minimum guest requirement), flat event package, or price on request. We explicitly prohibit misleading per-head figures derived from arbitrary package divisions.",
    },
    {
      icon: CalendarCheck,
      title: "Mandatory Confirmation Timestamps",
      desc: "Prices on Wedding Wala display the date on which they were last confirmed by the vendor or verified by our team. If a quote is older than 12 months, the listing displays an explicit advisory informing couples to re-confirm before booking.",
    },
    {
      icon: FileQuestion,
      title: "Honest Fallback: 'Price on Request'",
      desc: "If a vendor has not supplied verified rates, we display 'Price on request'. We strictly reject placeholder numbers (e.g., Rs 0, Rs 1, or arbitrary test prices). If pricing is not verified, we say so plainly.",
    },
    {
      icon: AlertTriangle,
      title: "Sanity Checks & Quality Gate",
      desc: "All submitted rates are run through automated sanity algorithms. Inordinate rates (e.g. per-head catering under Rs 800 or venue hall rentals below Rs 20,000) are flagged for human audit before being made public.",
    },
    {
      icon: RefreshCw,
      title: "Correction & User Dispute Mechanism",
      desc: "Couples and vendors can report price discrepancies at any time. If a vendor quotes a significantly different price than their published baseline without seasonal justification, their profile is reviewed.",
    },
  ]

  return (
    <div className="container-responsive py-10 sm:py-16">
      <Breadcrumbs
        items={[{ name: "Editorial & Pricing Policy", href: "/editorial-policy" }]}
        className="mb-6"
      />

      <header className="max-w-3xl mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-4 border border-amber-200">
          <Scale className="w-4 h-4 text-amber-700" />
          Transparency & Integrity Standards
        </span>
        <h1 className="font-display italic text-3xl sm:text-5xl text-bridal-charcoal leading-tight">
          Editorial & Pricing Policy
        </h1>
        <p className="mt-4 font-bridal text-base sm:text-lg text-bridal-text leading-relaxed">
          Wedding pricing in Pakistan has traditionally been opaque and stressful. At {SITE_NAME}, we enforce strict data integrity rules so families have authentic, realistic figures to plan their wedding budgets.
        </p>
      </header>

      {/* Principles Grid */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-bridal-beige bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-bridal-cream flex items-center justify-center text-bridal-gold-dark mb-4">
                <p.icon className="w-6 h-6" />
              </div>
              <h2 className="font-display italic text-xl text-bridal-charcoal mb-2">
                {p.title}
              </h2>
              <p className="font-bridal text-sm text-bridal-text leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Content Guidelines */}
      <section className="mb-16 rounded-2xl border border-bridal-beige bg-bridal-cream/40 p-8 sm:p-10">
        <div className="max-w-3xl">
          <h2 className="font-display italic text-2xl text-bridal-charcoal mb-4">
            Our Editorial & Fact-Checking Guidelines
          </h2>
          <div className="space-y-4 text-sm text-bridal-text leading-relaxed">
            <p>
              Every wedding guide, cost analysis, and checklist published on {SITE_NAME} adheres to rigorous editorial standards:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Local Economic Grounding:</strong> All budget figures, per-head costs, and service rates reflect current Pakistani Rupee (PKR) market realities across Tier 1 (Lahore, Karachi, Islamabad, Rawalpindi) and regional cities.
              </li>
              <li>
                <strong>Zero Fabricated Reviews:</strong> Testimonials and reviews are published only from real, verified wedding bookings. We never publish fictional stories or synthetic ratings.
              </li>
              <li>
                <strong>Legal Accuracy:</strong> Guides addressing Islamic marriage laws, Nikahnama clauses, NADRA registration, and provincial curfew regulations (e.g. Punjab Marriage Functions Act) are cross-checked against official legal statutes.
              </li>
              <li>
                <strong>Regular Revalidation:</strong> Flagship cost guides and seasonal checklists are audited ahead of each Pakistani wedding season (October to March) to reflect inflationary shifts in food, fuel, and materials.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feedback & Corrections */}
      <section className="rounded-xl border border-bridal-gold/30 bg-white p-8 text-center max-w-2xl mx-auto">
        <h2 className="font-display italic text-2xl text-bridal-charcoal mb-2">
          Report a Price Discrepancy
        </h2>
        <p className="font-bridal text-sm text-bridal-text mb-4">
          Did a vendor quote you a rate substantially different from what is listed on their profile? Please let us know so our verification desk can investigate.
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=Price%20Discrepancy%20Report`}
          className="inline-flex items-center justify-center rounded-full bg-bridal-gold px-6 py-2.5 font-bridal text-sm font-semibold text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-white transition-colors"
        >
          Email Editorial Desk
        </a>
      </section>
    </div>
  )
}
