import type { Metadata } from "next"
import { ListingRoute } from "@/components/listing/listing-route"
import {
  buildPageMetadata,
  SITE_NAME,
  SITE_URL,
  collectionPageLD,
  serviceLD,
  faqLD,
  combineGraph,
  CITIES,
} from "@/lib/seo"
import { safeJsonLd } from "@/lib/seo/jsonld"

/**
 * Legacy `/venues` listing — kept as-is functionally.
 * Emits complete Schema.org JSON-LD (CollectionPage, Service, FAQPage)
 * for rich search results.
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding venues across Pakistan",
  description: `Browse and search wedding venues across Pakistan on ${SITE_NAME} — banquet halls, marquees, lawns, and farmhouses for every shaadi function.`,
  path: "/venues",
})

export default function VenuesPage() {
  const collectionLd = collectionPageLD({
    name: `Wedding Venues across Pakistan — ${SITE_NAME}`,
    description: `Explore top wedding halls, marquees, banquet halls, and outdoor lawns across Pakistan.`,
    url: "/venues",
    items: CITIES.map((c) => ({
      name: `Wedding Venues in ${c.name}`,
      url: `/wedding-venues/${c.slug}`,
      addressLocality: c.name,
      addressRegion: c.region,
    })),
  })

  const serviceLd = serviceLD({
    name: "Wedding Venue Directory & Booking",
    description: "Browse verified wedding venues, marquees, and banquet halls with transparent pricing.",
    url: "/venues",
    serviceType: "Wedding Venue",
    areaServed: "Pakistan",
    priceRange: "PKR 800–6,500+ / head",
  })

  const faqs = [
    {
      question: "How do I choose the best wedding venue in Pakistan?",
      answer: "Consider your total guest count, preferred wedding date, indoor hall vs outdoor lawn setup, in-house catering vs external catering rules, and proximity to major roads with secure parking.",
    },
    {
      question: "What is the typical per-head cost for a wedding venue in Pakistan?",
      answer: "Per-head rates typically range from PKR 1,200 to PKR 5,500+ depending on whether you choose Chicken, Mutton, or Beef menus, number of live food stations, and hall rental inclusions.",
    },
    {
      question: "What is the 10:00 PM marriage hall law in Punjab?",
      answer: "The Punjab Marriage Functions Act mandates a 10:00 PM closing time for all wedding events and adheres to the One-Dish meal rule. Always confirm closing schedules with your hall manager.",
    },
  ]

  const ld = combineGraph(collectionLd, serviceLd, faqLD(faqs))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }}
      />
      <ListingRoute vendorType="venues" omitSchema={true} />
    </>
  )
}
