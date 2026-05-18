import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for generator rental.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Generator rental for weddings across Pakistan",
  description: `Rent reliable wedding generators on ${SITE_NAME} — silent diesel sets sized for marquees, home shaadis and outdoor receptions, with load-shedding backup across Pakistan.`,
  path: "/generator-rental",
})

export default function GeneratorRentalPage() {
  return <VendorSearch vendorType="generator-rental" />
}
