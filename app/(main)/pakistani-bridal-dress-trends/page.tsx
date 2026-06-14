/**
 * Pillar page: "Pakistani Bridal Dress Trends 2026".
 *
 * Skyscraper content targeting a text-winnable SERP (a content farm ranks
 * there; no incumbent has tables, FAQPage schema, a visible update date, or
 * brand-neutral authority). Built to out-structure them: answer-first lead,
 * colour-by-event + fabric + gharara-vs-sharara + cost tables, FAQPage +
 * Article JSON-LD, and internal links into the bridal-wear vendor pages.
 *
 * URL is evergreen (/pakistani-bridal-dress-trends, no year) so it can be
 * updated in place each year — preserving link authority — while the title,
 * H1 and copy carry the "2026" freshness signal.
 *
 * Honesty guards: bridal-dress price figures are indicative market ranges
 * (flagged on-page), not vendor quotes; designer names are factual references,
 * not endorsements.
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

const PATH = "/pakistani-bridal-dress-trends"
const YEAR = "2026"
const PUBLISHED = "2026-06-14"
const UPDATED = "2026-06-14"
const UPDATED_LABEL = "June 2026"

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: `Pakistani Bridal Dress Trends ${YEAR}: Colours, Fabrics & Styles`,
    description: `The complete ${YEAR} guide to Pakistani bridal fashion — trending colours for barat, walima and mehndi, the fabrics in style, the gharara revival, and what a bridal dress costs.`,
    path: PATH,
    ogType: "article",
    article: {
      publishedTime: PUBLISHED,
      modifiedTime: UPDATED,
      author: `${SITE_NAME} Editorial Team`,
      section: "Bridal Fashion",
      tags: ["bridal dress", "pakistani wedding", "bridal trends", "barat", "walima"],
    },
  })
}

// ── Data ──────────────────────────────────────────────────────────────────

const COLOUR_BY_EVENT: { event: string; shades: string; fabric: string; embroidery: string; vibe: string }[] = [
  { event: "Mehndi", shades: "Yellow base, bold green, mustard, saffron, fuchsia", fabric: "Chiffon, organza", embroidery: "Gota, mirror work, floral", vibe: "Festive, playful" },
  { event: "Barat", shades: "Deep red, maroon, wine, rust, antique red, jewel tones", fabric: "Velvet, organza, jamawar", embroidery: "Zardozi, dabka, tilla", vibe: "Regal, traditional" },
  { event: "Nikkah", shades: "Ivory, white, soft pastels, banarsi gold", fabric: "Banarsi, silk, organza", embroidery: "Tonal, sequins", vibe: "Elegant, understated" },
  { event: "Walima", shades: "Champagne, blush, mint, powder blue, lilac, peach", fabric: "Organza, chiffon, silk", embroidery: "3D floral, pearl, tonal", vibe: "Soft, modern" },
]

const FABRICS: { fabric: string; season: string; drape: string; bestFor: string }[] = [
  { fabric: "Organza", season: "Summer / all-season", drape: "Light, structured volume", bestFor: "The leading 2026 fabric — walima, mehndi, modern silhouettes" },
  { fabric: "Velvet", season: "Winter", drape: "Heavy, rich", bestFor: "Barat and winter weddings (UK/Canada diaspora)" },
  { fabric: "Chiffon", season: "Summer", drape: "Flowy, soft", bestFor: "Mehndi and daytime events" },
  { fabric: "Silk / Jamawar", season: "All-season", drape: "Structured, lustrous", bestFor: "Timeless, traditional barat and nikkah looks" },
]

const GHARARA_VS_SHARARA: { attribute: string; gharara: string; sharara: string }[] = [
  { attribute: "Shape", gharara: "Flare starts at the knee (two distinct sections)", sharara: "Flares gradually from the waist/thigh" },
  { attribute: "Structure", gharara: "Stiffer, more structured", sharara: "Softer, flowy" },
  { attribute: "Embellishment", gharara: "Concentrated at the knee joint", sharara: "Along / toward the hem" },
  { attribute: "Typical fabric", gharara: "Brocade, jamawar, velvet", sharara: "Lighter, embellished fabrics" },
  { attribute: "Best event", gharara: "Nikkah, barat", sharara: "Mehndi, walima" },
]

const COST_RANGES: { tier: string; barat: string; walima: string; note: string }[] = [
  { tier: "High-street / ready-to-wear", barat: "PKR 50k – 150k", walima: "PKR 40k – 120k", note: "Brand pret, ready stock" },
  { tier: "Mid designer", barat: "PKR 150k – 500k", walima: "PKR 120k – 400k", note: "Semi-custom, popular labels" },
  { tier: "Couture / luxury", barat: "PKR 500k – 3M+", walima: "PKR 400k – 2M+", note: "Bespoke designer, hand embroidery" },
]

const TRENDS_IN = [
  "Organza everything",
  "Gharara revival (modern tailoring)",
  "Double dupatta",
  "Pastel walima (champagne, mint, lilac)",
  "3D floral & tonal embroidery",
  "Capes, peplums, corset blouses",
]
const TRENDS_OUT = [
  "Heavy all-over zardozi on every event",
  "Single safe red for every function",
  "Stiff, unbreathable fabrics in summer",
  "Matchy-matchy bride-and-groom head to toe",
]

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What colours are trending for Pakistani bridal dresses in 2026?",
    answer:
      "In 2026, brides favour deep reds, maroon and wine for the barat; soft pastels — champagne, blush, mint and lilac — for the walima; and yellow with bold green, mustard and fuchsia for the mehndi. Nikkah leans to ivory, white and banarsi gold.",
  },
  {
    question: "Which colour should a bride wear for the barat?",
    answer:
      "The barat is traditionally the most regal event, so brides choose deep, rich shades — classic red, maroon, wine, rust and jewel tones — symbolising love and prosperity, usually in velvet, organza or jamawar with heavy zardozi work.",
  },
  {
    question: "What colour do Pakistani brides wear for the walima?",
    answer:
      "Walima looks have moved to soft, modern pastels in 2026 — champagne, ivory, blush, mint, powder blue, lilac and peach — typically in flowing organza, chiffon or silk with 3D floral or pearl detailing.",
  },
  {
    question: "What is the difference between a gharara and a sharara?",
    answer:
      "A gharara flares from the knee in two distinct sections, is more structured, and is embellished at the knee joint (often brocade or jamawar). A sharara flares gradually from the waist, is softer and flowy, and is embellished toward the hem.",
  },
  {
    question: "Is the gharara making a comeback in 2026?",
    answer:
      "Yes — the gharara is one of the defining 2026 trends, reworked with modern waist-defining tailoring and lighter embroidery, popular for nikkah and barat looks.",
  },
  {
    question: "Which fabric is best for a winter wedding — velvet or organza?",
    answer:
      "Velvet is the go-to for winter weddings and the barat for its richness and warmth, while organza — the leading 2026 fabric — suits summer, walima and modern, voluminous silhouettes.",
  },
  {
    question: "How much does a Pakistani bridal dress cost in 2026?",
    answer:
      "Indicatively, high-street bridal wear runs about PKR 50,000–150,000, mid designer PKR 150,000–500,000, and couture/luxury PKR 500,000 to 3 million or more. Prices vary widely by label, fabric and embroidery — treat these as ranges, not quotes.",
  },
  {
    question: "What colour should a bride wear for the mehndi?",
    answer:
      "Mehndi is the most playful event, so brides go bold — a yellow base with vivid greens, mustard, saffron orange or fuchsia, usually in light chiffon or organza with gota and mirror work.",
  },
]

const DESIGNERS = [
  "HSY",
  "Maria B",
  "Élan",
  "Nomi Ansari",
  "Faiza Saqlain",
  "Sana Safinaz",
  "Ali Xeeshan",
  "Tena Durrani",
  "Zainab Chottani",
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
                    j === 0 ? "text-bridal-charcoal font-medium" : "text-bridal-text"
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

export default function BridalTrendsPage() {
  const ld = combineGraph(
    articleLD({
      headline: `Pakistani Bridal Dress Trends ${YEAR}: Colours, Fabrics & Styles`,
      description: `The complete ${YEAR} guide to Pakistani bridal fashion — colours, fabrics, silhouettes and costs for barat, walima, mehndi and nikkah.`,
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

      <div className="container-responsive py-10 sm:py-14">
        <Breadcrumbs
          items={[
            { name: "Bridal Wear", href: "/bridal-wear" },
            { name: `Bridal Dress Trends ${YEAR}`, href: PATH },
          ]}
          className="mb-6"
        />

        <header className="mb-8 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Bridal Fashion · {YEAR}
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[46px] leading-tight text-bridal-charcoal">
            Pakistani Bridal Dress Trends {YEAR}
          </h1>
          {/* Answer-first lead — AI-citable. */}
          <p className="mt-4 font-bridal text-[15.5px] text-bridal-text leading-relaxed">
            In {YEAR}, Pakistani bridal fashion centres on{" "}
            <strong className="text-bridal-charcoal">deep reds, maroon and
            wine for the barat</strong>; soft pastels —{" "}
            <strong className="text-bridal-charcoal">champagne, blush, mint and
            lilac — for the walima</strong>; and bold yellows with greens and
            fuchsia for the mehndi.{" "}
            <strong className="text-bridal-charcoal">Organza leads the fabrics,
            velvet rules winter weddings, and the gharara returns</strong> with
            modern, waist-defining tailoring. Here is the complete {YEAR} guide —
            by event, fabric, silhouette and cost.
          </p>
          <p className="mt-3 font-bridal text-[12px] text-bridal-text-soft">
            By {SITE_NAME} Editorial Team · Updated {UPDATED_LABEL}
          </p>
        </header>

        <div className="max-w-3xl">
          {/* At a glance */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-4 mb-3">
            {YEAR} bridal trends at a glance
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Each event calls for its own palette and fabric. Here is the full
            colour-by-event map for {YEAR}.
          </p>
          <DataTable
            caption={`Pakistani bridal colours by event, ${YEAR}`}
            headers={["Event", "Trending shades", "Fabric", "Embroidery", "Vibe"]}
            rows={COLOUR_BY_EVENT.map((r) => [r.event, r.shades, r.fabric, r.embroidery, r.vibe])}
          />

          {/* Colours */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Trending bridal colours for {YEAR}
          </h2>
          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">Barat colours</h3>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            The barat stays regal: classic red, maroon, wine, rust and antique
            red, plus deep jewel tones — symbolising love and prosperity, and
            usually rendered in velvet, organza or jamawar with heavy zardozi.
          </p>
          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">Walima colours</h3>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Walima has moved firmly to soft, modern pastels — champagne, ivory,
            blush, mint, powder blue, lilac and peach — in flowing organza,
            chiffon and silk with 3D floral and pearl detailing.
          </p>
          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">Mehndi colours</h3>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Mehndi is the playful event: a yellow base with vivid greens,
            mustard, saffron orange and fuchsia, in light chiffon or organza
            with gota and mirror work.
          </p>
          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">Nikkah colours</h3>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Nikkah leans elegant and understated — ivory, white, soft pastels
            and banarsi gold, with tonal embroidery and subtle sequins.
          </p>

          {/* Fabrics */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Fabric trends {YEAR}: organza, velvet, chiffon &amp; silk
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Fabric choice follows the season as much as the trend. Organza is
            the breakout of {YEAR}; velvet owns winter.
          </p>
          <DataTable
            caption={`Bridal fabric guide ${YEAR}`}
            headers={["Fabric", "Best season", "Drape", "Best for"]}
            rows={FABRICS.map((f) => [f.fabric, f.season, f.drape, f.bestFor])}
          />

          {/* Silhouettes */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Silhouette &amp; style trends
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            The big {YEAR} shapes: the <strong className="text-bridal-charcoal">
            gharara and sharara revival</strong> with modern tailoring, the
            double dupatta, and structured detailing — capes, peplums and corset
            blouses — alongside the classic lehenga and maxi.
          </p>
          <h3 className="font-display italic text-[20px] text-bridal-charcoal mt-6 mb-2">
            Gharara vs sharara — what&apos;s the difference?
          </h3>
          <DataTable
            caption="Gharara vs sharara"
            headers={["Attribute", "Gharara", "Sharara"]}
            rows={GHARARA_VS_SHARARA.map((r) => [r.attribute, r.gharara, r.sharara])}
          />

          {/* Embroidery */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Embroidery &amp; embellishment trends
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Classic hand techniques stay central — zardozi, dabka, tilla and
            gota — but {YEAR} leans toward <strong className="text-bridal-charcoal">
            3D floral appliqué</strong> and tonal, ivory-on-ivory work for a
            lighter, more contemporary finish.
          </p>

          {/* In / Out */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            What&apos;s in &amp; out for {YEAR}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-4">
            <div className="rounded-md border border-bridal-beige bg-bridal-cream p-5">
              <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold mb-3">In</p>
              <ul className="list-disc pl-5 space-y-1.5 font-bridal text-[14px] text-bridal-text">
                {TRENDS_IN.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
            <div className="rounded-md border border-bridal-beige bg-bridal-ivory/40 p-5">
              <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-text-label mb-3">Out</p>
              <ul className="list-disc pl-5 space-y-1.5 font-bridal text-[14px] text-bridal-text-soft">
                {TRENDS_OUT.map((t) => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>

          {/* Cost */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            How much does a {YEAR} Pakistani bridal dress cost?
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Bridal-dress prices span a huge range by label, fabric and
            embroidery. The figures below are <strong className="text-bridal-charcoal">
            indicative {YEAR} market ranges</strong>, not quotes.
          </p>
          <DataTable
            caption={`Indicative Pakistani bridal dress cost, ${YEAR}`}
            headers={["Tier", "Barat dress", "Walima dress", "Notes"]}
            rows={COST_RANGES.map((c) => [c.tier, c.barat, c.walima, c.note])}
          />
          <p className="font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
            Planning the rest of the budget? See our full{" "}
            <Link href="/wedding-cost-in-pakistan" className="text-bridal-gold hover:underline">
              wedding cost in Pakistan guide
            </Link>
            .
          </p>

          {/* How to choose */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            How to choose your bridal dress
          </h2>
          <ul className="list-disc pl-6 my-4 font-bridal text-[15px] text-bridal-text leading-relaxed space-y-1.5">
            <li><strong className="text-bridal-charcoal">By event:</strong> rich reds for barat, pastels for walima, bold brights for mehndi.</li>
            <li><strong className="text-bridal-charcoal">By season:</strong> velvet for winter; organza and chiffon for summer.</li>
            <li><strong className="text-bridal-charcoal">By silhouette:</strong> gharara for a structured regal look, lehenga for volume, maxi for a sleek line.</li>
            <li><strong className="text-bridal-charcoal">By budget:</strong> high-street pret, mid designer, or bespoke couture — set the tier before you shop.</li>
            <li><strong className="text-bridal-charcoal">Order early:</strong> custom bridals need 3–4 months plus fittings — start before the Oct–Feb season ramp.</li>
          </ul>

          {/* Designers */}
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mt-10 mb-3">
            Pakistani bridal designers to know in {YEAR}
          </h2>
          <p className="font-bridal text-[15px] text-bridal-text leading-relaxed">
            Names that recur across {YEAR} bridal collections (for reference, not
            endorsement):
          </p>
          <ul className="flex flex-wrap gap-2 my-4">
            {DESIGNERS.map((d) => (
              <li key={d} className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige font-bridal text-[13px] text-bridal-text-soft">
                {d}
              </li>
            ))}
          </ul>

          {/* FAQ */}
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

          {/* CTA + internal links */}
          <div className="mt-10 rounded-md border border-bridal-beige bg-bridal-ivory/40 p-6 sm:p-8">
            <p className="font-display italic text-[20px] text-bridal-charcoal">
              Find your {YEAR} bridal look on {SITE_NAME}
            </p>
            <p className="mt-1 font-bridal text-[13px] text-bridal-text-soft">
              Browse verified bridal-wear designers and boutiques by city, with real reviews.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "Bridal wear", href: "/bridal-wear" },
                { label: "Bridal wear in Lahore", href: "/bridal-wear/lahore" },
                { label: "Bridal wear in Karachi", href: "/bridal-wear/karachi" },
                { label: "Bridal makeup artists", href: "/bridal-makeup-artists" },
                { label: "Mehndi artists", href: "/mehndi-artists" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block px-3 py-1.5 rounded-full bg-bridal-charcoal text-bridal-ivory font-bridal text-[12.5px] hover:bg-bridal-gold-dark transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
