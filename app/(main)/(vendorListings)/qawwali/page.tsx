import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for Qawwali & Naat groups.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Qawwali groups & Naat-khwan across Pakistan",
  description: `Book Qawwali troupes and Naat-khwan on ${SITE_NAME} — Sufi qawwali nights, Mehfil-e-Naat and Mehndi performances by classical and contemporary groups across Pakistan.`,
  path: "/qawwali",
})

export default function QawwaliPage() {
  return <VendorSearch vendorType="qawwali" />
}
