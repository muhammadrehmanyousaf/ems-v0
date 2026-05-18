import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for wedding choreographers.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding choreographers for Mehndi & Sangeet across Pakistan",
  description: `Book professional wedding choreographers on ${SITE_NAME} — Mehndi dance, Sangeet performances and bride-and-groom routines, with rehearsals across major Pakistani cities.`,
  path: "/wedding-choreographers",
})

export default function WeddingChoreographersPage() {
  return <VendorSearch vendorType="wedding-choreographers" />
}
