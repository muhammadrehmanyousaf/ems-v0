/**
 * The one place that turns a vendor row into its canonical profile URL.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * There is exactly one correct shape for a vendor's profile link, and it is
 * not obvious from the outside:
 *
 *     /{seoTypeSlug}/{citySlug}/{nameSlug}-{id}
 *
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L6. Every part of it has a
 * rule that is easy to get wrong, which is why guessing at a call site has
 * already produced two dead links on /compare-vendors:
 *
 *   - The type slug is the SEO slug, not the backend's `vendorType` string.
 *     They are different vocabularies and the map between them folds aliases.
 *   - The city is NOT required, but it cannot be empty either. An unmapped or
 *     missing city routes under the "pakistan" national catch-all, which the
 *     detail route resolves by the trailing id — exactly as the sitemap does.
 *     Anything else 404s, because the page calls notFound() on a city it
 *     cannot resolve.
 *   - The id is load-bearing and the name slug is not: the detail route reads
 *     the trailing id. A wrong name still lands on the right vendor.
 *   - `slug` off the API is NOT usable — it comes back null on live rows.
 *
 * Get any of that wrong and the link still returns 200 while rendering
 * somebody else's venue, which is the worst kind of broken: it looks like it
 * works. That is precisely what the 404 page was doing before fix/ww-404-unstyled,
 * and it is why /compare-vendors was left pointing at a dead `/all-vendors/:id`
 * rather than being given a guess.
 *
 * Extracted from `fetch-vendors.ts`, where this logic already lived correctly
 * but privately. Behaviour is unchanged; it just has a name now, so the next
 * call site imports the answer instead of re-deriving it.
 */

import {
  VENDOR_TYPE_BACKEND_MAP,
  BACKEND_TYPE_ALIASES,
  getCity,
  type VendorTypeSlug,
} from "./constants"
import { slugifyName } from "./fetch-vendor"

/**
 * Reverse the SEO→backend map (primary 1:1 entries + folded aliases) so the
 * SEO slug can be derived from the backend's `vendorType` string.
 */
export const BACKEND_TO_SEO: Record<string, VendorTypeSlug> = {
  ...Object.fromEntries(
    Object.entries(VENDOR_TYPE_BACKEND_MAP)
      .filter(([, backend]) => backend != null)
      .map(([seo, backend]) => [backend as string, seo as VendorTypeSlug]),
  ),
  ...BACKEND_TYPE_ALIASES,
}

export interface VendorHrefInput {
  id: number | string | null | undefined
  name: string | null | undefined
  city: string | null | undefined
  /** The backend's `vendorType` string, not an SEO slug. */
  vendorType: string | null | undefined
}

/**
 * The canonical profile URL for a vendor, or `undefined` when one cannot be
 * built.
 *
 * Returns `undefined` rather than a fallback on purpose. Only `id` and a
 * mappable `vendorType` are load-bearing, and without them there is no URL
 * that lands on this vendor — so the caller must decide what to render
 * instead (hide the link, disable the button). A guessed href that 200s on
 * the wrong venue is worse than no link at all.
 */
export function vendorLeafHref(v: VendorHrefInput): string | undefined {
  const id = v.id
  if (!id) return undefined

  const vendorType = v.vendorType
  if (!vendorType) return undefined

  const seoTypeSlug = BACKEND_TO_SEO[vendorType]
  if (!seoTypeSlug) return undefined

  // Mirror the sitemap exactly: an empty OR unlisted city routes under the
  // "pakistan" national catch-all, which the detail route resolves via
  // getCity().
  const rawCity = slugifyName(v.city ?? "")
  const citySlug = rawCity && getCity(rawCity) ? rawCity : "pakistan"

  return `/${seoTypeSlug}/${citySlug}/${slugifyName(v.name ?? "")}-${id}`
}
