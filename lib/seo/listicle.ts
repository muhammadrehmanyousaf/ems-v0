/**
 * "Best {vendor} in {city} {year}" listicle — pure helpers shared by the
 * route file, the page component, and the sitemap.
 *
 * URL shape (single segment under /best/):
 *   /best/{vendorTypeSlug}-in-{citySlug}
 *   e.g. /best/wedding-photographers-in-lahore
 *
 * These are GEO-optimized "best of" articles — answer-first intro, a ranked
 * ItemList, a comparison table, and FAQPage schema. That format is what AI
 * search (AI Overviews / ChatGPT / Perplexity) cites, and it's exactly what
 * directory competitors (e.g. shadiyana.pk) lack: they have listings, not
 * citable ranked articles.
 *
 * Rollout is additive + flag-gated (NEXT_PUBLIC_LISTICLE_PAGES). With the flag
 * off, generateStaticParams returns [] (no pages build) and the sitemap emits
 * no listicle URLs — zero production impact until the flag is flipped.
 */

import {
  CITIES,
  VENDOR_TYPES,
  getCity,
  getVendorType,
  getBackendVendorType,
  type VendorTypeSlug,
} from "./constants"
import type { VendorListItem } from "./fetch-vendors"

/** Year shown in titles / H1 / schema. Bump once per year on the annual refresh. */
export const LISTICLE_YEAR = "2026"
/** Article freshness dates (ISO). Bump `MODIFIED` on each content refresh. */
export const LISTICLE_DATE_PUBLISHED = "2026-01-15"
export const LISTICLE_DATE_MODIFIED = "2026-06-01"
/** Human-readable "last updated" label shown on the page (freshness signal). */
export const LISTICLE_UPDATED_LABEL = "June 2026"

/**
 * Feature flag. OFF by default → no listicle pages build, no sitemap entries,
 * the route 404s. Enable in production by setting `NEXT_PUBLIC_LISTICLE_PAGES=true`
 * (Vercel env), or in `.env.local` to preview locally.
 */
export const LISTICLE_PAGES_ENABLED =
  process.env.NEXT_PUBLIC_LISTICLE_PAGES === "true"

/**
 * Minimum real vendors required to publish a listicle. A "best of" list with
 * fewer than this isn't credible — we 404 rather than ship a thin page that
 * drags the site's content-quality signal (same philosophy as the noindex
 * guard on empty city×category pages).
 */
export const MIN_VENDORS_FOR_LISTICLE = 3

/** How many vendors to feature in the ranked list / comparison table. */
export const LISTICLE_MAX_RANKED = 10

/**
 * Only vendor types with a backend mapping can ever have real listings, so
 * only these are eligible for listicles.
 */
export const LISTICLE_VENDOR_TYPES = VENDOR_TYPES.filter(
  (v) => getBackendVendorType(v.slug) != null,
)

/** Build the single-segment slug for a (type, city) pair. */
export function buildListicleSlug(typeSlug: string, citySlug: string): string {
  return `${typeSlug}-in-${citySlug}`
}

export interface ParsedListicle {
  vendorType: (typeof VENDOR_TYPES)[number]
  city: (typeof CITIES)[number]
}

/**
 * Parse `{vendorTypeSlug}-in-{citySlug}` back into its parts. We match the
 * city as a known `-in-<city>` suffix (no Pakistani city slug contains
 * "-in-"), which lets multi-word vendor slugs like `bridal-makeup-artists`
 * parse unambiguously. Returns null for any slug that doesn't resolve to a
 * known vendor type + city.
 */
export function parseListicleSlug(slug: string): ParsedListicle | null {
  if (!slug) return null
  const lower = slug.toLowerCase()
  for (const city of CITIES) {
    const suffix = `-in-${city.slug}`
    if (lower.endsWith(suffix)) {
      const typeSlug = lower.slice(0, -suffix.length)
      const vendorType = getVendorType(typeSlug as VendorTypeSlug)
      if (vendorType) return { vendorType, city }
    }
  }
  return null
}

/** Resolve a city slug → city record (re-export for call sites that have a slug). */
export function getListicleCity(citySlug: string) {
  return getCity(citySlug)
}

/**
 * Rank vendors for a "best of" list: highest-rated first, then most-reviewed,
 * then lowest entry price, then name. New (unrated) vendors sink to the bottom
 * so the list always leads with proven, well-reviewed vendors.
 */
export function rankVendors(vendors: VendorListItem[]): VendorListItem[] {
  return [...vendors].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating
    if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount
    const ap = a.priceMin ?? Number.POSITIVE_INFINITY
    const bp = b.priceMin ?? Number.POSITIVE_INFINITY
    if (ap !== bp) return ap - bp
    return a.name.localeCompare(b.name)
  })
}
