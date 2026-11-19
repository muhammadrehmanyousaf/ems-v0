/**
 * Which "Best {vendor} in {city}" listicle pages actually exist.
 *
 * /best/[slug] sets `dynamicParams = false`, so a page exists only if its slug was returned by
 * generateStaticParams at build time; any other slug is a 404. A slug is returned only when at least
 * MIN_VENDORS_FOR_LISTICLE real vendors share that (type, city). This module is the ONE place that
 * rule lives, so the build, the sitemap and the sibling links on each listicle cannot disagree.
 *
 * Counting uses fetchAllBusinesses() (every page of /businesses, cached for an hour). The older code
 * asked for `?limit=2000`, but the backend caps `limit` at 200, so only the first 200 vendors were
 * counted and most valid pages were never built.
 *
 * Returns null when the backend could not be reached (nothing counted): callers then link nothing
 * rather than guess.
 */

import { CITIES, VENDOR_TYPE_BACKEND_MAP, slugifyName, type VendorTypeSlug } from "@/lib/seo"
import { fetchAllBusinesses } from "@/lib/seo/vendor-inventory"
import { LISTICLE_PAGES_ENABLED, MIN_VENDORS_FOR_LISTICLE, buildListicleSlug } from "@/lib/seo/listicle"

const BACKEND_TO_SEO: Record<string, VendorTypeSlug> = Object.fromEntries(
  Object.entries(VENDOR_TYPE_BACKEND_MAP)
    .filter(([, backend]) => backend != null)
    .map(([seo, backend]) => [backend as string, seo as VendorTypeSlug]),
)

let countsMemo: { at: number; p: Promise<Map<string, number> | null> } | null = null

/**
 * "type|city" -> number of vendors (null if the backend returned nothing). Memoised per server process for 10 minutes
 * so the many pages that need it (city pages, /best, sitemap) share one walk of the inventory instead of one each.
 */
export function getListicleCounts(): Promise<Map<string, number> | null> {
  if (countsMemo && Date.now() - countsMemo.at < 10 * 60 * 1000) return countsMemo.p
  const p = computeListicleCounts().catch(() => null)
  countsMemo = { at: Date.now(), p }
  // never keep a failed result around: the next caller should retry
  p.then((v) => { if (v === null && countsMemo?.p === p) countsMemo = null })
  return p
}

async function computeListicleCounts(): Promise<Map<string, number> | null> {
  const raws = await fetchAllBusinesses()
  if (raws.length === 0) return null
  const counts = new Map<string, number>()
  for (const raw of raws) {
    const vendor = raw?.vendor ?? {}
    const backendType: string | undefined = raw?.type || vendor?.vendorType || raw?.subBusinessType
    if (!backendType) continue
    const typeSlug = BACKEND_TO_SEO[backendType]
    if (!typeSlug) continue
    const cityRaw: string = raw?.city ?? raw?.location ?? vendor?.city ?? ""
    if (!cityRaw) continue
    const citySlug = slugifyName(cityRaw)
    if (!CITIES.some((c) => c.slug === citySlug)) continue
    const key = `${typeSlug}|${citySlug}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/** The set of listicle slugs that are built (and so render). Empty when the flag is off or the backend is down. */
export async function getExistingListicleSlugs(): Promise<Set<string>> {
  const out = new Set<string>()
  if (!LISTICLE_PAGES_ENABLED) return out
  const counts = await getListicleCounts()
  if (!counts) return out
  for (const [key, n] of counts) {
    if (n < MIN_VENDORS_FOR_LISTICLE) continue
    const [typeSlug, citySlug] = key.split("|")
    out.add(buildListicleSlug(typeSlug, citySlug))
  }
  return out
}
