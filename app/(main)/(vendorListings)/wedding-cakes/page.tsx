import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for wedding cakes.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding cakes across Pakistan",
  description: `Order custom wedding cakes on ${SITE_NAME} — tiered, themed, fondant, fresh-cream and engagement cakes baked and delivered across Karachi, Lahore, Islamabad and beyond.`,
  path: "/wedding-cakes",
})

export default function WeddingCakesPage() {
  return <VendorSearch vendorType="wedding-cakes" />
}
