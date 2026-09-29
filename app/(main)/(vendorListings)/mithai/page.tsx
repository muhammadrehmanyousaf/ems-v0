import type { Metadata } from "next"
import { ListingRoute } from "@/components/listing/listing-route"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for mithai & sweets.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Mithai & wedding sweets across Pakistan",
  description: `Order traditional mithai and dessert boxes on ${SITE_NAME} — laddoo, barfi, jalebi, kheer, chocolate boxes and Mangni mithai for guest distribution across Pakistan.`,
  path: "/mithai",
})

export default function MithaiPage() {
  return <ListingRoute vendorType="mithai" />
}
