/**
 * Pillar page: "Wedding Cost in Pakistan 2026" — the most-linkable, highest-
 * intent informational topic in the niche, and a top-of-funnel hub that
 * internal-links into the vendor × city money pages.
 *
 * Built to out-rank the current SERP (shehnai.pk, shaadiplanner, shadiyana
 * blog, hanifrajput) which are individually thin, table-light, calculator-less,
 * schema-less, and uncited. This page is answer-first (for AI Overviews /
 * featured snippets), table-dense, per-event + per-city, and emits
 * Article + FAQPage JSON-LD.
 *
 * Figures are 2026 ranges triangulated across vendor sources (see the
 * methodology note rendered on-page). Honesty guards: jewellery is gold-rate
 * volatile and luxury ceilings are illustrative — both flagged in copy, never
 * presented as precise quotes.
 */

import Link from "next/link"
import type { Metadata } from "next"
import {
  SITE_NAME,
  SITE_URL,
  buildPageMetadata,
  articleLD,
  faqLD,
  combineGraph,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"
import { WeddingBudgetEstimator } from "@/components/tools/wedding-budget-estimator"

const PATH = "/wedding-cost-in-pakistan"
const PUBLISHED = "2026-06-14"
const UPDATED = "2026-06-14"
const UPDATED_LABEL = "June 2026"

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: `Wedding Cost in Pakistan ${"2026"}: Complete PKR Budget Breakdown`,
    description: `How much does a wedding cost in Pakistan in 2026? A complete PKR breakdown by tier, by event (mehndi, barat, walima), by city, and by vendor — with real sample budgets and money-saving tips.`,
    path: PATH,
    ogType: "article",
    article: {
      publishedTime: PUBLISHED,
      modifiedTime: UPDATED,
      author: `${SITE_NAME} Editorial Team`,
      section: "Wedding Planning",
      tags: ["wedding cost", "wedding budget", "pakistan", "shaadi budget"],
    },
  })
}

// ── Data ────────────────────────────────────────────────────────────────
// 2026 PKR ranges, triangulated across vendor sources. Treat as ranges, not
// precise quotes. PKR figures in lakh (L) / crore (Cr) where natural.

const TIER_TOTALS: { tier: string; total: string; catering: string; note: string }[] = [
  { tier: "Budget / modest", total: "PKR 1.5M – 2.5M", catering: "1,000 – 2,500", note: "Smaller guest list, home mehndi, club hall or modest marquee" },
  { tier: "Mid-range", total: "PKR 3.5M – 6M", catering: "2,500 – 4,500", note: "300–500 guests, full 3 events, mid-tier vendors" },
  { tier: "Upper-middle", total: "PKR 6M – 10M", catering: "4,500 – 6,500", note: "Larger guest list, premium venues, designer touches" },
  { tier: "Luxury / elite", total: "PKR 10M – 30M+", catering: "6,500 – 10,000+", note: "Designer everything, hotels/destination — illustrative ceiling" },
]

const LINE_ITEMS: { item: string; budget: string; mid: string; luxury: string }[] = [
  { item: "Catering (per head)", budget: "1,000 – 2,500", mid: "2,500 – 4,500", luxury: "4,500 – 10,000+" },
  { item: "Live-station / BBQ premium (per head)", budget: "—", mid: "+500 – 1,000", luxury: "pushes to 6,500+" },
  { item: "Venue / marquee (per head, with food)", budget: "1,200 – 1,500", mid: "1,500 – 2,050", luxury: "2,000 – 5,000+" },
  { item: "Hall / marquee rental only (per day)", budget: "15k – 35k", mid: "100k – 350k", luxury: "250k – 1M+" },
  { item: "Photography (event + album)", budget: "30k – 90k", mid: "80k – 200k", luxury: "200k – 500k" },
  { item: "Videography (cinematic)", budget: "45k", mid: "85k", luxury: "120k – 300k+" },
  { item: "Bridal makeup (per event)", budget: "15k – 35k", mid: "40k – 75k", luxury: "80k – 250k" },
  { item: "Mehndi artist (henna)", budget: "10k – 25k", mid: "30k – 60k", luxury: "—" },
  { item: "Décor & stage (per event)", budget: "30k – 150k", mid: "150k – 350k", luxury: "800k – 8M" },
  { item: "Bridal dress (barat lehnga)", budget: "80k – 200k", mid: "150k – 400k", luxury: "800k – 1.5M (designer)" },
  { item: "Bride walima outfit", budget: "50k – 100k", mid: "150k – 400k", luxury: "—" },
  { item: "Groom sherwani", budget: "30k – 60k", mid: "50k – 150k", luxury: "200k+" },
  { item: "Jewellery (gold-rate dependent)", budget: "3L – 5L", mid: "~6L (≈10 tola)", luxury: "1M – 5M+" },
  { item: "Wedding car / transport", budget: "30k", mid: "50k – 150k", luxury: "150k+" },
  { item: "Invitation cards", budget: "15k – 50k", mid: "50k – 100k", luxury: "100k+" },
  { item: "DJ / dhol / dholki", budget: "5k – 30k", mid: "50k – 100k", luxury: "100k+" },
  { item: "Hidden costs (overtime, generator, tips)", budget: "+200k", mid: "+350k", luxury: "+500k" },
]

const CATERING_TIERS: { tier: string; perHead: string; total300: string }[] = [
  { tier: "Budget (buffet, simple menu)", perHead: "PKR 1,000 – 2,500", total300: "~PKR 500k" },
  { tier: "Mid-range (buffet, fuller menu)", perHead: "PKR 2,500 – 4,500", total300: "~PKR 840k – 1.35M" },
  { tier: "Premium (plated / some live stations)", perHead: "PKR 4,500 – 6,500", total300: "~PKR 1.35M – 2.1M" },
  { tier: "Luxury (live BBQ / handi stations)", perHead: "PKR 6,500 – 10,000+", total300: "~PKR 2.1M – 3.6M" },
]

const PER_EVENT: { event: string; share: string; venue: string; catering: string; standout: string }[] = [
  { event: "Mehndi", share: "~15%", venue: "50k – 5L", catering: "600 – 2,000", standout: "Décor, dholki/DJ, bride's outfit" },
  { event: "Barat (most expensive)", share: "~40%", venue: "1L – 15L", catering: "1,500 – 5,000", standout: "Bridal lehnga + jewellery (the biggest lines)" },
  { event: "Walima", share: "~25%", venue: "1L – 12L", catering: "1,500 – 4,000", standout: "Groom & bride outfits, décor" },
]

const CITY_MATRIX: { city: string; budget: string; mid: string; luxury: string; note: string }[] = [
  { city: "Lahore", budget: "20L – 30L", mid: "40L – 60L", luxury: "80L – 2Cr", note: "Widest vendor range; the 'wedding capital'" },
  { city: "Karachi", budget: "25L – 35L", mid: "50L – 80L", luxury: "1Cr – 3Cr", note: "Highest average; biggest venue supply" },
  { city: "Islamabad / Rawalpindi", budget: "25L – 40L", mid: "50L – 70L", luxury: "1Cr – 2.5Cr", note: "Affluent, diaspora-heavy; over-indexes" },
  { city: "Smaller cities (Faisalabad, Multan…)", budget: "15L – 25L", mid: "30L – 50L", luxury: "60L – 1Cr", note: "Lower vendor and venue rates" },
]

const SAMPLE_LAHORE_MID: { item: string; amount: string }[] = [
  { item: "Venue + catering — barat (400 @ ~2,000/head)", amount: "PKR 800,000" },
  { item: "Venue + catering — walima (350 @ ~1,800/head)", amount: "PKR 630,000" },
  { item: "Mehndi (home + décor + dholki + catering)", amount: "PKR 450,000" },
  { item: "Bridal dress (barat) + walima outfit", amount: "PKR 500,000" },
  { item: "Jewellery (≈10 tola, gold-rate dependent)", amount: "PKR 900,000" },
  { item: "Photography + cinematic video", amount: "PKR 250,000" },
  { item: "Bridal makeup (3 events)", amount: "PKR 180,000" },
  { item: "Décor & stage (barat + walima)", amount: "PKR 350,000" },
  { item: "Cards, car, DJ, misc + hidden costs", amount: "PKR 440,000" },
  { item: "Estimated total", amount: "≈ PKR 4.5 million" },
]

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How much does an average wedding cost in Pakistan in 2026?",
    answer:
      "A complete 3-event wedding (mehndi, barat, walima) in 2026 typically costs PKR 3.5–6 million for a middle-class family, PKR 1.5–2.5 million on a budget, and PKR 10 million to 3 crore at the luxury end. Catering and venue alone consume 50–60% of the total.",
  },
  {
    question: "How much is catering per head for a wedding in Pakistan?",
    answer:
      "Wedding catering runs about PKR 1,000–2,500 per head for a budget buffet, 2,500–4,500 mid-range, and 4,500–10,000+ for premium menus with live BBQ or handi stations. Live/plated service typically adds PKR 500–1,000 per person over a standard buffet.",
  },
  {
    question: "Which event costs the most — mehndi, barat, or walima?",
    answer:
      "The barat is the most expensive function, taking roughly 40% of a full wedding budget, because it carries the bridal lehnga and jewellery. Walima is around 25% and mehndi around 15%.",
  },
  {
    question: "How much does a 400-guest wedding cost in Pakistan?",
    answer:
      "A mid-range 400-guest wedding in a city like Lahore — full three events, mid-tier vendors — comes to roughly PKR 4.5–5 million in 2026, with venue and catering the largest lines.",
  },
  {
    question: "Is PKR 5 lakh enough for a wedding in Pakistan?",
    answer:
      "PKR 500,000 can cover a very small, single-function nikah or a modest mehndi in a smaller city, but it is not enough for a full three-event wedding in 2026 — the realistic floor for a complete budget wedding is around PKR 1.5–2.5 million.",
  },
  {
    question: "How much does a wedding cost in Lahore vs Karachi vs Islamabad?",
    answer:
      "Mid-range totals run about PKR 40–60 lakh in Lahore, 50–80 lakh in Karachi (the most expensive metro), and 50–70 lakh in Islamabad/Rawalpindi. Smaller cities run roughly 30–50 lakh for the same wedding.",
  },
  {
    question: "How much has wedding cost risen due to inflation?",
    answer:
      "Pakistani wedding costs have risen roughly 15–20% per year. A mid-range wedding that cost around PKR 3 million in 2022 now runs closer to PKR 4.5–5 million in 2026.",
  },
]

// ── Presentational helper ─────────────────────────────────────────────────
function DataTable({
  caption,
  headers,
  rows,
}: {
  caption?: string
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-md border border-bridal-beige">
      <table className="w-full text-left border-collapse">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="bg-bridal-ivory/60 font-bridal text-[11px] uppercase tracking-[0.1em] text-bridal-text-label">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-bridal-beige align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 font-bridal text-[13.5px] ${
                    j === 0
                      ? "text-bridal-charcoal font-medium"
                      : "text-bridal-text"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WeddingCostPakistanPage() {
  const url = `${SITE_URL}${PATH}`

  const ld = combineGraph(
    articleLD({
      headline: "Wedding Cost in Pakistan 2026: Complete PKR Budget Breakdown",
      description:
        "A complete 2026 PKR breakdown of Pakistani wedding costs by tier, event, city and vendor, with real sample budgets and money-saving tips.",
      url: PATH,
      imageUrl: `${SITE_URL}/og-default.jpg`,
      datePublished: PUBLISHED,
      dateModified: UPDATED,
      authorName: `${SITE_NAME} Editorial Team`,
    }),
    faqLD(FAQS),
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <div className="container-responsive max-w-5xl [&>*]:mx-auto py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: "Planning Tools", href: "/planning-tools" },
            { name: "Wedding Cost in Pakistan", href: PATH },
          ]}
          className="mb-6"
        />

        <header className="mb-8 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Wedding Budget Guide · 2026
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[46px] leading-tight text-bridal-charcoal">
            Wedding Cost in Pakistan 2026: The Complete PKR Breakdown
          </h1>
          {/* Answer-first lead — the passage AI Overviews & snippets lift. */}
          <p className="mt-4 font-bridal text-[15.5px] text-bridal-text leading-relaxed">
            A complete Pakistani wedding — mehndi, barat and walima — costs
            roughly <strong className="text-bridal-charcoal">PKR 2.5 million
            on a budget</strong> to <strong className="text-bridal-charcoal">
            PKR 1 crore or more at the luxury end</strong> in 2026, with most
            middle-class families spending <strong className="text-bridal-charcoal">
            PKR 4.5–6 million</strong>. Catering and venue alone eat 50–60% of
            the budget. Below is the full breakdown — by tier, by event, by
            city, and by vendor — plus real sample budgets and ways to spend
            less.
          </p>
          <p className="mt-3 font-bridal text-[12px] text-bridal-text-soft">
            By {SITE_NAME} Editorial Team · Updated {UPDATED_LABEL} · figures in PKR
          </p>
        </header>

        <div className="max-w-3xl">
          {/* Quick-answer table */}
          <DataTable
            caption="Average wedding cost in Pakistan by tier, 2026"
            headers={["Tier", "Full wedding (3 events)", "Catering/head", "What it covers"]}
            rows={TIER_TOTALS.map((t) => [t.tier, t.total, `PKR ${t.catering}`, t.note])}
          />

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            How much does a wedding cost in Pakistan?
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            The honest answer depends on one question most guides skip:{" "}
            <strong className="text-bridal-charcoal">are you pricing one
            function, or the full three-event wedding?</strong> A single nikah
            or a home mehndi can be done for a few lakh; a complete mehndi +
            barat + walima is a different number entirely. The figures in this
            guide are for the <em>full wedding</em> unless stated otherwise.
          </p>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            Costs have climbed roughly{" "}
            <strong className="text-bridal-charcoal">15–20% per year</strong>.
            A mid-range wedding that cost about PKR 3 million in 2022 now runs
            closer to PKR 4.5–5 million in 2026 — so treat any older budget
            guide with caution.
          </p>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Full wedding budget breakdown by category
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Here is every major line item at budget, mid-range and luxury tiers.
            Catering and venue are the two that move your total the most.
          </p>
          <DataTable
            caption="Pakistani wedding cost by category, 2026 (PKR)"
            headers={["Line item", "Budget", "Mid-range", "Luxury"]}
            rows={LINE_ITEMS.map((l) => [l.item, l.budget, l.mid, l.luxury])}
          />

          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-8 mb-2">
            Catering cost per head in Pakistan
          </h3>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Catering is the single most-searched figure — and the biggest line
            in most budgets. The rate per head depends on menu and service style;
            live BBQ and handi stations are what push you into the top tiers.
          </p>
          <DataTable
            caption="Wedding catering cost per head in Pakistan, 2026"
            headers={["Catering tier", "Per head", "300-guest function"]}
            rows={CATERING_TIERS.map((c) => [c.tier, c.perHead, c.total300])}
          />
          <p className="font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
            Need real quotes?{" "}
            <Link href="/caterers" className="text-bridal-gold hover:underline">
              Compare verified caterers
            </Link>{" "}
            with transparent PKR pricing by city.
          </p>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Cost by event: mehndi vs barat vs walima
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            A Pakistani wedding is several events, and they are not priced
            equally. The <strong className="text-bridal-charcoal">barat is the
            most expensive function</strong> — it carries the bridal lehnga and
            jewellery — followed by walima, then mehndi.
          </p>
          <DataTable
            caption="Pakistani wedding cost by event, 2026"
            headers={["Event", "Share of budget", "Venue+décor (PKR)", "Catering/head", "Biggest line"]}
            rows={PER_EVENT.map((e) => [e.event, e.share, e.venue, `PKR ${e.catering}`, e.standout])}
          />
          <p className="font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
            Roughly: <strong className="text-bridal-charcoal">Barat 40% ·
            Walima 25% · Mehndi 15% · Jewellery 12% · Everything else 8%</strong>{" "}
            of a full budget.
          </p>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Wedding cost by city: Lahore vs Karachi vs Islamabad
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            The same wedding costs noticeably more in Karachi than in a smaller
            city. These are full-wedding totals (1L = 1 lakh, 1Cr = 1 crore).
          </p>
          <DataTable
            caption="Wedding cost by city in Pakistan, 2026"
            headers={["City", "Budget", "Mid-range", "Luxury", "Notes"]}
            rows={CITY_MATRIX.map((c) => [c.city, c.budget, c.mid, c.luxury, c.note])}
          />
          <p className="font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
            Planning in a specific city? Browse{" "}
            <Link href="/wedding-venues/lahore" className="text-bridal-gold hover:underline">venues in Lahore</Link>,{" "}
            <Link href="/caterers/karachi" className="text-bridal-gold hover:underline">caterers in Karachi</Link>, or{" "}
            <Link href="/wedding-photographers/islamabad" className="text-bridal-gold hover:underline">photographers in Islamabad</Link>{" "}
            with live PKR pricing.
          </p>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            A real sample budget: 400-guest mid-range Lahore wedding
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Numbers feel abstract until you see a full one. Here is a realistic
            2026 budget for a complete three-event, 400-guest mid-range wedding
            in Lahore.
          </p>
          <DataTable
            caption="Sample budget: 400-guest mid-range Lahore wedding, 2026"
            headers={["Item", "Estimated cost"]}
            rows={SAMPLE_LAHORE_MID.map((s) => [s.item, s.amount])}
          />

          <h2
            id="wedding-budget-calculator"
            className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3 scroll-mt-24"
          >
            Free wedding budget calculator (Pakistan)
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed mb-5">
            Get an instant 2026 estimate for your own wedding. Set your guest
            count, city, style and events, and watch the full PKR breakdown
            update live — then refine it line by line in our{" "}
            <Link href="/planning-tools/budget" className="text-bridal-gold hover:underline">
              detailed budget planner
            </Link>
            .
          </p>
          <div className="mb-2">
            <WeddingBudgetEstimator />
          </div>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            How to save money on your wedding (without it looking cheap)
          </h2>
          <ul className="list-disc pl-6 my-4 font-bridal text-[15px] text-bridal-text leading-relaxed space-y-1.5">
            <li>
              <strong className="text-bridal-charcoal">Trim the guest list.</strong>{" "}
              Cutting 50 guests saves roughly PKR 1–2 lakh in catering alone — the
              fastest lever you have.
            </li>
            <li>
              <strong className="text-bridal-charcoal">Host the mehndi at home.</strong>{" "}
              Skipping a venue for one event saves PKR 1–2 lakh.
            </li>
            <li>
              <strong className="text-bridal-charcoal">Choose buffet over live stations.</strong>{" "}
              That alone drops PKR 500–1,000 per head.
            </li>
            <li>
              <strong className="text-bridal-charcoal">Book off-season or on a weekday,</strong>{" "}
              and book early — peak shaadi season (Oct–Feb) carries premium rates.
            </li>
            <li>
              <strong className="text-bridal-charcoal">Rent the bridal dress</strong>{" "}
              or buy from a boutique rather than full couture.
            </li>
          </ul>
          <p className="font-bridal text-[14px] text-bridal-text leading-relaxed">
            Want to plan it line by line? Use our free{" "}
            <Link href="/planning-tools/budget" className="text-bridal-gold hover:underline">
              wedding budget calculator
            </Link>{" "}
            to allocate every rupee.
          </p>

          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Frequently asked questions
          </h2>
          <dl className="space-y-5">
            {FAQS.map((f) => (
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

          {/* Methodology / trust box — E-E-A-T signal competitors lack. */}
          <aside className="mt-10 rounded-md border border-bridal-beige bg-bridal-cream p-6">
            <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold mb-2">
              How we calculated this
            </p>
            <p className="font-bridal text-[13.5px] text-bridal-text leading-relaxed">
              Figures are 2026 ranges triangulated from verified vendor quotes
              and current market rates across Lahore, Karachi and Islamabad, and
              are updated quarterly (last updated {UPDATED_LABEL}). Treat them as
              planning ranges, not fixed quotes. Two lines move fastest:{" "}
              <strong className="text-bridal-charcoal">jewellery</strong> tracks
              the live gold/tola rate, and{" "}
              <strong className="text-bridal-charcoal">luxury ceilings</strong>{" "}
              are illustrative (celebrity and destination weddings run higher).
              For exact pricing, every vendor on {SITE_NAME} shows a transparent
              PKR quote before you book.
            </p>
          </aside>

          {/* CTA */}
          <div className="mt-10 rounded-md border border-bridal-beige bg-bridal-ivory/40 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-display italic text-[20px] text-bridal-charcoal">
                Turn this budget into real bookings
              </p>
              <p className="mt-1 font-bridal text-[13px] text-bridal-text-soft">
                Compare verified vendors by city with transparent PKR pricing and real reviews.
              </p>
            </div>
            <Link
              href="/vendors"
              className="inline-block shrink-0 px-5 py-2.5 rounded-full bg-bridal-charcoal text-bridal-ivory font-bridal text-[13px] hover:bg-bridal-gold-dark transition-colors"
            >
              Browse vendors
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
