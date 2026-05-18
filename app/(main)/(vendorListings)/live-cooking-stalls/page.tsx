import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for live cooking stalls.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Live cooking stalls for weddings across Pakistan",
  description: `Book live cooking stalls on ${SITE_NAME} — tandoor, chaat, BBQ, paan, gol gappay and live tawa stations to elevate your shaadi menu across Pakistani cities.`,
  path: "/live-cooking-stalls",
})

export default function LiveCookingStallsPage() {
  return <VendorSearch vendorType="live-cooking-stalls" />
}
