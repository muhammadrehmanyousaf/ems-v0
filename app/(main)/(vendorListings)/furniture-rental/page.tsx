import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for furniture rental.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding furniture rental across Pakistan",
  description: `Rent wedding furniture on ${SITE_NAME} — chairs, round tables, sofa sets, low seating and mandap pieces for any-scale shaadi, delivered and set up across Pakistan.`,
  path: "/furniture-rental",
})

export default function FurnitureRentalPage() {
  return <VendorSearch vendorType="furniture-rental" />
}
