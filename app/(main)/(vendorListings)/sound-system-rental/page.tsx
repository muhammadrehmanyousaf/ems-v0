import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

// BK-100.55 Layer 3 — SEO landing for sound system rental.

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Sound system & DJ equipment rental across Pakistan",
  description: `Rent professional sound on ${SITE_NAME} — speakers, mixers, wireless mics, stage lighting and DJ rigs for Nikah, Mehndi, Baraat and Walima across Pakistan.`,
  path: "/sound-system-rental",
})

export default function SoundSystemRentalPage() {
  return <VendorSearch vendorType="sound-system-rental" />
}
