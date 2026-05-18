import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for dhol players.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Dhol players for Dholki, Mehndi & Baraat across Pakistan",
  description: `Book traditional dhol players on ${SITE_NAME} — set the rhythm for Dholki, Mehndi entry, Baraat processions and Walima receptions across Karachi, Lahore, Islamabad and beyond.`,
  path: "/dhol-players",
})

export default function DholPlayersPage() {
  return <VendorSearch vendorType="dhol-players" />
}
