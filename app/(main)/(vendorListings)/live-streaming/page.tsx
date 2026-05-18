import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for live-streaming teams.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding live streaming teams across Pakistan",
  description: `Stream your shaadi live to overseas family on ${SITE_NAME} — HD multi-camera teams covering Nikah, Mehndi, Baraat and Walima, with private links for relatives abroad.`,
  path: "/live-streaming",
})

export default function LiveStreamingPage() {
  return <VendorSearch vendorType="live-streaming" />
}
