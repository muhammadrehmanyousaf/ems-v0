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

interface RouteProps {
  params: { city: string }
}

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }))
}

export function generateMetadata({ params }: RouteProps): Metadata {
  const city = getCity(params.city)
  if (!city) return { title: "Not Found" }

  return buildPageMetadata({
    title: `Wedding Services in ${city.name}`,
    description: `Plan your wedding in ${city.name}. Browse verified venues, photographers, planners, caterers, and every shaadi vendor — all reviewed by real Pakistani couples.`,
    path: `/cities/${city.slug}`,
  })
}

export default function CityHubPage({ params }: RouteProps) {
  const city = getCity(params.city)
  if (!city) notFound()

  const url = `${SITE_URL}/cities/${city.slug}`

  const collectionLd = collectionPageLD({
    name: `Wedding Services in ${city.name} — ${SITE_NAME}`,
    description: `Vendor categories serving weddings in ${city.name}, Pakistan.`,
    url: `/cities/${city.slug}`,
    items: VENDOR_TYPES.map((v) => ({
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
    {
      question: `How do I book wedding vendors in ${city.name}?`,
      answer: `Browse the vendor categories below — venues, photographers, planners, caterers, decor — pick the vendor that fits your budget and date, and book through Wedding Wala. We hold the deposit until the vendor confirms the booking.`,
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
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
          <p className="font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-3">
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
            {VENDOR_TYPES.map((v) => (
              <li key={v.slug}>
                <Link
                  href={`/${v.slug}/${city.slug}`}
                  className="group block p-5 rounded-md border border-bridal-beige hover:border-bridal-gold hover:bg-bridal-cream transition-all"
                >
                  <p className="font-display italic text-[18px] text-bridal-charcoal group-hover:text-bridal-gold transition-colors">
                    {v.plural} in {city.name}
                  </p>
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
            Other cities
          </h2>
          <ul className="flex flex-wrap gap-2">
            {CITIES.filter((c) => c.slug !== city.slug).map((other) => (
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
