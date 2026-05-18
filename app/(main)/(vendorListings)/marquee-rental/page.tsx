import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for marquee & tent rental.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Marquee & tent rental across Pakistan",
  description: `Book custom marquees and shamianas on ${SITE_NAME} — open-side tents for home weddings, plot weddings and outdoor receptions across all major Pakistani cities.`,
  path: "/marquee-rental",
})

export default function MarqueeRentalPage() {
  return <VendorSearch vendorType="marquee-rental" />
}
