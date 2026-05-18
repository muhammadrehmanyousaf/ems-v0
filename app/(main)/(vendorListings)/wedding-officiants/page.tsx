import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for Nikahkhwan / wedding officiants.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding officiants & Nikahkhwan across Pakistan",
  description: `Find certified Nikahkhwan and wedding officiants on ${SITE_NAME} — book a qualified Maulana or Qazi for your Nikah ceremony across Karachi, Lahore, Islamabad and beyond.`,
  path: "/wedding-officiants",
})

export default function WeddingOfficiantsPage() {
  return <VendorSearch vendorType="wedding-officiants" />
}
