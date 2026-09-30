/**
 * Where "Back to venue" goes.
 *
 * Detail routes live at `/{slug}/{id}` where the slug comes from the canonical
 * slug→type map, with the same overrides `VendorCard` applies (two SEO browse
 * slugs own `/[city]`, so their numeric-id detail routes live elsewhere).
 * Mirrored here rather than imported because the card keeps it inside a
 * click handler; if that logic moves to a shared helper, this file should be
 * folded into it.
 */

import { VENDOR_TYPE_PATHS } from "@/lib/vendor-types"

const OVERRIDES: Record<string, string> = {
  "Bridal wearing": "bridal-wearing",
  "Wedding Invitations and Stationery": "wedding-invitations",
  Venue: "venues",
  Caterer: "catering",
  "Makeup Artist": "makeup-artists",
  "Henna Artist": "henna-artists",
  "Car Rental": "car-rental",
  "Wedding Stationery": "wedding-invitations",
  "Bridal Wear": "bridal-wearing",
}

export function vendorDetailSlug(vendorType: string | null | undefined): string {
  const reverse: Record<string, string> = {}
  for (const [slug, type] of Object.entries(VENDOR_TYPE_PATHS as Record<string, string>)) reverse[type] = slug
  const clean = (vendorType || "").trim()
  return OVERRIDES[clean] || reverse[clean] || "vendors"
}

export function venueDetailHref(
  venue: { vendor?: { vendorType?: string | null } | null } | null | undefined,
  id: string | number | null | undefined,
): string {
  if (!id) return "/venues"
  const slug = vendorDetailSlug(venue?.vendor?.vendorType)
  return slug === "vendors" ? "/vendors" : `/${slug}/${String(id).trim()}`
}
