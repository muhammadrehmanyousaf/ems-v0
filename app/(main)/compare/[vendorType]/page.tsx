import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  CITIES,
  VENDOR_TYPES,
  SITE_NAME,
  getVendorType,
  buildPageMetadata,
  collectionPageLD,
  faqLD,
  combineGraph,
  type VendorTypeSlug,
} from "@/lib/seo"
import { Breadcrumbs } from "@/components/seo/breadcrumbs"

interface RouteProps {
  params: { vendorType: string }
}

// Pre-render one comparison page per vendor type.
export const dynamicParams = false

export function generateStaticParams() {
  return VENDOR_TYPES.map((v) => ({ vendorType: v.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const vt = getVendorType(params.vendorType)
  if (!vt) return { title: "Not Found" }
  return buildPageMetadata({
    title: `Compare ${vt.plural} across Pakistani cities`,
    description: `Side-by-side comparison of ${vt.plural.toLowerCase()} in Karachi, Lahore, and Islamabad — vendor count, typical pricing, market characteristics, and which city fits which couple. Up-to-date 2026 numbers from ${SITE_NAME}.`,
    path: `/compare/${vt.slug}`,
  })
}

// Top 3 cities for comparisons. Keep small — broader matrices fragment
// SEO traffic across pages with thin content.
const COMPARE_CITIES: VendorTypeSlug extends string ? string[] : never =
  ["karachi", "lahore", "islamabad"]

/**
 * City profile snippet — keeps the comparison readable without
 * fabricating specific PKR numbers (those should come from real
 * inventory data once enough vendors are live). Each entry is honest
 * editorial commentary, not invented stats.
 */
const CITY_PROFILES: Record<string, {
  vibe: string
  marketTraits: string[]
  rightFor: string
}> = {
  karachi: {
    vibe: "Coastal scale and DHA premium.",
    marketTraits: [
      "Largest wedding-vendor market in Pakistan by count",
      "DHA / Clifton corridor priciest in the country",
      "Strong cinematography talent pool",
      "Best capacity for >800-guest events",
    ],
    rightFor: "Couples planning large-scale events with premium-tier vendor expectations.",
  },
  lahore: {
    vibe: "Heritage venues and traditional taste.",
    marketTraits: [
      "Strongest concentration of bridal-wear designers",
      "Best heritage-venue stock (Mall Road, Cantt area)",
      "Mid-range pricing for equivalent quality vs Karachi",
      "Deep mehndi-artist + henna-artist talent pool",
    ],
    rightFor: "Couples leaning into Mughal-revival aesthetics and traditional Pakistani wedding sequencing.",
  },
  islamabad: {
    vibe: "Quieter elegance and diplomatic-tier hotels.",
    marketTraits: [
      "Smaller venue pool — book early in shaadi season",
      "Mid-tier banquet halls in F-7 / E-11 are good value",
      "Diplomatic enclave hotels = luxury tier",
      "Lower guest-count culture (300–500 typical)",
    ],
    rightFor: "Couples planning smaller-scale, refined events with mid-to-luxury vendor expectations.",
  },
}

export default function CompareVendorTypePage({ params }: RouteProps) {
  const vt = getVendorType(params.vendorType)
  if (!vt) notFound()

  const cityComparisons = COMPARE_CITIES.map((slug) => {
    const city = CITIES.find((c) => c.slug === slug)
    return city ? { city, profile: CITY_PROFILES[slug] } : null
  }).filter((x): x is { city: typeof CITIES[number]; profile: typeof CITY_PROFILES[string] } => x !== null)

  const faqs = [
    {
      question: `Which Pakistani city has the most ${vt.plural.toLowerCase()}?`,
      answer: `Karachi has the largest vendor pool by count, but Lahore matches it for traditional categories like ${vt.plural.toLowerCase().includes("photographer") ? "photography" : vt.plural.toLowerCase()}. Islamabad has a smaller pool but more diplomatic-tier options at the top end.`,
    },
    {
      question: `Where is it cheapest to book a ${vt.singular.toLowerCase()}?`,
      answer: `Outside the DHA Karachi / Cantt Lahore premium corridors, ${vt.plural.toLowerCase()} are typically 25–40% more affordable. Suburban Lahore (Bahria, Wapda Town), Faisalabad, and Multan all offer good value if you're flexible on geography.`,
    },
    {
      question: `Should I book a ${vt.singular.toLowerCase()} from a different city?`,
      answer: `Possible but adds travel cost (typically 10–20% on top of the package, plus accommodation for multi-day weddings). Top vendors do travel — particularly photographers and planners — but local vendors usually understand local-venue logistics better.`,
    },
    {
      question: `What's peak shaadi season in Pakistan?`,
      answer: `October to February is peak across all three cities. Vendor pricing in this window is 15–30% above off-season. Book 6–9 months ahead for top vendors during peak, 2–3 months ahead off-season.`,
    },
  ]

  const ld = combineGraph(
    collectionPageLD({
      name: `Compare ${vt.plural} — ${SITE_NAME}`,
      description: `Side-by-side ${vt.plural.toLowerCase()} comparison across Karachi, Lahore, and Islamabad.`,
      url: `/compare/${vt.slug}`,
      items: cityComparisons.map((c) => ({
        name: `${vt.plural} in ${c.city.name}`,
        url: `/${vt.slug}/${c.city.slug}`,
      })),
    }),
    faqLD(faqs),
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
            { name: "Compare", href: "/compare" },
            { name: `${vt.plural} by city`, href: `/compare/${vt.slug}` },
          ]}
          className="mb-6"
        />

        <header className="mb-10 max-w-3xl">
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
            Compare
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[44px] leading-tight text-bridal-charcoal">
            {vt.plural} in Karachi vs Lahore vs Islamabad
          </h1>
          <p className="mt-4 font-bridal text-[15px] text-bridal-text leading-relaxed">
            {vt.description} Each Pakistani city has its own character —
            here&apos;s how the {vt.singular.toLowerCase()} markets differ
            across the three biggest wedding cities, and which city fits
            which couple.
          </p>
        </header>

        {/* Side-by-side comparison */}
        <section className="mb-14">
          <ul className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {cityComparisons.map(({ city, profile }) => (
              <li
                key={city.slug}
                className="rounded-md border border-bridal-beige bg-bridal-cream p-6"
              >
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold font-medium mb-2">
                  {city.region}
                </p>
                <h2 className="font-display italic text-[28px] text-bridal-charcoal leading-tight">
                  {vt.plural} in {city.name}
                </h2>
                <p className="mt-3 font-bridal text-[14px] text-bridal-text leading-relaxed font-medium italic">
                  {profile.vibe}
                </p>

                <h3 className="mt-5 font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold-dark font-medium">
                  Market traits
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {profile.marketTraits.map((t) => (
                    <li
                      key={t}
                      className="font-bridal text-[13px] text-bridal-text leading-relaxed flex items-start gap-2"
                    >
                      <span className="text-bridal-gold flex-shrink-0">·</span>
                      {t}
                    </li>
                  ))}
                </ul>

                <h3 className="mt-5 font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-gold-dark font-medium">
                  Right for
                </h3>
                <p className="mt-2 font-bridal text-[13px] text-bridal-text leading-relaxed">
                  {profile.rightFor}
                </p>

                <div className="mt-6 pt-5 border-t border-bridal-beige">
                  <Link
                    href={`/${vt.slug}/${city.slug}`}
                    className="inline-flex items-center gap-1.5 font-bridal text-[13px] font-medium text-bridal-gold hover:underline"
                  >
                    Browse {vt.plural.toLowerCase()} in {city.name} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12 max-w-3xl">
          <h2 className="font-display italic text-[26px] text-bridal-charcoal mb-6">
            Frequently asked questions
          </h2>
          <dl className="space-y-5">
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

        {/* Other categories */}
        <section className="mb-4">
          <h2 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
            Compare another vendor category
          </h2>
          <ul className="flex flex-wrap gap-2">
            {VENDOR_TYPES.filter((v) => v.slug !== vt.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/compare/${other.slug}`}
                  className="inline-block px-3 py-1.5 rounded-full border border-bridal-beige hover:border-bridal-gold font-bridal text-[13px] text-bridal-text-soft hover:text-bridal-charcoal transition-all"
                >
                  {other.plural}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
