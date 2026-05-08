import type { Metadata } from "next"
import VendorSearch from "@/components/VendorSearch"
import { buildPageMetadata, SITE_NAME } from "@/lib/seo"

/**
 * Legacy `/venues` listing — kept as-is functionally (existing search
 * component owns the data fetching + rendering, untouched). Adding
 * proper SEO metadata so it doesn't ship with auto-generated titles.
 *
 * The new SEO-canonical surface for venues is `/wedding-venues` +
 * `/wedding-venues/[city]` (per docs/seo/03-url-conventions-LOCKED.md §L6),
 * but `/venues` is still linked from older nav items so we keep it live.
 */

export const dynamic = "force-dynamic"

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding venues across Pakistan",
  description: `Browse and search wedding venues across Pakistan on ${SITE_NAME} — banquet halls, marquees, lawns, and farmhouses for every shaadi function.`,
  path: "/venues",
})

export default function VenuesPage() {
  return <VendorSearch vendorType="venues" />
}

