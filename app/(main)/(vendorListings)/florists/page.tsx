import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for florists.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding florists across Pakistan",
  description: `Order fresh and imported flowers on ${SITE_NAME} — stage florals, mandap arrangements, car decor, bridal bouquets and gajra-haar across Pakistani wedding cities.`,
  path: "/florists",
})

export default function FloristsPage() {
  return <VendorSearch vendorType="florists" />
}
