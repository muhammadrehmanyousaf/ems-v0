import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for event hosts / MCs.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding event hosts & MCs across Pakistan",
  description: `Hire polished wedding hosts and MCs on ${SITE_NAME} — bilingual Urdu/English anchors to run your Nikah, Mehndi and Walima timelines smoothly.`,
  path: "/event-hosts",
})

export default function EventHostsPage() {
  return <VendorSearch vendorType="event-hosts" />
}
