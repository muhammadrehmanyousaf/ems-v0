import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

/**
 * Legacy `/vendors` listing — search + filter across every vendor type.
 * Functionality untouched (existing VendorSearch component owns data
 * fetching and rendering). Adding proper SEO metadata so the page
 * doesn't ship with auto-generated titles.
 *
 * Customers also funnel here from header nav. The new SEO-canonical
 * surfaces (`/wedding-photographers`, `/wedding-venues`, etc.) are
 * preferred for individual categories — see
 * docs/seo/03-url-conventions-LOCKED.md §L6.
 */

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Browse all wedding vendors",
  description: `Search every wedding vendor on ${SITE_NAME} — venues, photographers, planners, caterers, decorators, mehndi artists, bridal makeup, and more across 12 Pakistani cities.`,
  path: "/vendors",
})

export default function VendorsPage() {
  return <VendorSearch vendorType="all" />
}
