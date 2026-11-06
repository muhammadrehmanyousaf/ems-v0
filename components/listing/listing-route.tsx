import VendorSearch from "@/components/VendorSearch"
import { fetchListingSeed } from "@/lib/seo/fetch-listing-seed"
import {
  SITE_NAME,
  FEATURED_CITIES,
  collectionPageLD,
  serviceLD,
  breadcrumbsLD,
  faqLD,
  combineGraph,
} from "@/lib/seo"
import { safeJsonLd } from "@/lib/seo/jsonld"

/**
 * Friendly display titles for every vendor category route in Pakistan.
 */
function getCategoryTitle(vendorType: string): string {
  if (vendorType === "all") return "Wedding Vendors"
  const map: Record<string, string> = {
    venues: "Wedding Venues",
    photographers: "Wedding Photographers",
    catering: "Wedding Caterers",
    decor: "Wedding Decorators",
    "makeup-artists": "Bridal Makeup Artists",
    "henna-artists": "Mehndi & Henna Artists",
    "car-rental": "Wedding Car Rental",
    "bridal-wear": "Bridal Wear Designers",
    "wedding-stationery": "Wedding Stationery & Invitations",
    "dhol-players": "Dhol Players",
    "wedding-officiants": "Nikahkhwan & Officiants",
    "wedding-choreographers": "Wedding Choreographers",
    "event-hosts": "Event Hosts & Anchors",
    "live-streaming": "Wedding Live Streaming",
    "generator-rental": "Generator Rental",
    "marquee-rental": "Marquee & Canopy Rental",
    "furniture-rental": "Wedding Furniture Rental",
    florists: "Wedding Florists",
    "wedding-cakes": "Wedding Cakes & Desserts",
    mithai: "Mithai & Traditional Sweets",
    "live-cooking-stalls": "Live Cooking Stalls",
    "sound-system-rental": "Sound & Lighting System Rental",
    qawwali: "Qawwali & Sufi Music",
  }
  if (map[vendorType]) return map[vendorType]
  return vendorType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * A vendor listing, with its first screenful already rendered and
 * complete Schema.org JSON-LD emitted into the SSR stream.
 *
 * Automatically provides:
 *   • CollectionPage schema with ItemList of first-page vendors or top cities
 *   • Service schema with areaServed: Pakistan
 *   • BreadcrumbList schema (Home > Category)
 *   • FAQPage schema for the category in Pakistan
 */
export async function ListingRoute({
  vendorType,
  omitSchema = false,
}: {
  vendorType: string
  omitSchema?: boolean
}) {
  const seed = await fetchListingSeed(vendorType)
  const categoryTitle = getCategoryTitle(vendorType)
  const canonicalUrl = vendorType === "all" ? "/vendors" : `/${vendorType}`

  const schemaScript = !omitSchema && (() => {
    const items =
      seed.items && seed.items.length > 0
        ? seed.items.map((v) => ({
            name: v.name || `${categoryTitle} in ${v.city || "Pakistan"}`,
            url: v.id ? `${canonicalUrl}/${v.id}` : canonicalUrl,
            addressLocality: v.city || "Pakistan",
            priceRange: v.price ? `PKR ${Number(v.price).toLocaleString("en-PK")}` : undefined,
            ratingValue: v.rating > 0 ? v.rating : undefined,
            reviewCount: v.reviewCount > 0 ? v.reviewCount : undefined,
          }))
        : FEATURED_CITIES.map((c) => ({
            name: `${categoryTitle} in ${c.name}`,
            url: `${canonicalUrl}?city=${c.slug}`,
            addressLocality: c.name,
            addressRegion: c.region,
          }))

    const collectionLd = collectionPageLD({
      name: `${categoryTitle} across Pakistan — ${SITE_NAME}`,
      description: `Browse and compare verified ${categoryTitle.toLowerCase()} across Pakistan with verified reviews and transparent PKR pricing on ${SITE_NAME}.`,
      url: canonicalUrl,
      items,
    })

    const serviceLd = serviceLD({
      name: `${categoryTitle} Directory & Booking`,
      description: `Find and book verified ${categoryTitle.toLowerCase()} in Pakistan with transparent rates, verified portfolios, and customer ratings.`,
      url: canonicalUrl,
      serviceType: categoryTitle,
      areaServed: "Pakistan",
    })

    const breadcrumbsLd = breadcrumbsLD([
      { name: "Home", url: "/" },
      { name: categoryTitle, url: canonicalUrl },
    ])

    const faqs = [
      {
        question: `How do I book a verified ${categoryTitle.toLowerCase()} in Pakistan?`,
        answer: `Browse verified ${categoryTitle.toLowerCase()} on ${SITE_NAME}, review their real portfolio pictures, transparent PKR packages, and ratings from verified couples, and send an inquiry or message directly.`,
      },
      {
        question: `What are the average rates for ${categoryTitle.toLowerCase()} in Pakistan?`,
        answer: `Rates vary based on city, peak wedding season dates, and package tiers. Every verified profile on ${SITE_NAME} displays starting package rates to help you budget accurately.`,
      },
      {
        question: `Are wedding service providers on ${SITE_NAME} verified?`,
        answer: `Yes, ${SITE_NAME} conducts identity checks, physical premises verification, and past customer reviews screening before awarding verified status.`,
      },
    ]

    const faqLd = faqLD(faqs)
    const combined = combineGraph(collectionLd, serviceLd, breadcrumbsLd, faqLd)

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(combined) }}
      />
    )
  })()

  return (
    <>
      {schemaScript}
      <VendorSearch
        vendorType={vendorType}
        initialVendors={seed.items}
        initialTotal={seed.total}
      />
    </>
  )
}

export default ListingRoute
