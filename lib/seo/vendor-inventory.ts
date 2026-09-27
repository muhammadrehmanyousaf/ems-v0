import { SITE_URL, CITIES, backendToSeoSlug } from "@/lib/seo"
import { slugifyName } from "@/lib/seo/fetch-vendor"
import { BACKEND_URL } from "@/lib/backend-url"

/**
 * The vendor inventory behind the sitemaps.
 *
 * Extracted from app/sitemap.ts so /sitemap.xml and /image-sitemap.xml project
 * the SAME canonical URL for a vendor. Two copies of `projectToCanonical` would
 * be two chances to disagree, and a URL that appears in the image sitemap but
 * not the URL sitemap teaches Google a page that does not exist.
 *
 * Both routes revalidate hourly and the `fetch` below is cached for the same
 * hour, so serving both costs one set of requests.
 */

export interface DynamicVendor {
  url: string
  lastModified: Date
}

/**
 * Fetch the FULL vendor inventory by paginating the backend — the old single
 * `?limit=2000` call silently capped coverage (we have >3k vendors). Dedupes by
 * id, stops on the last/empty page or when an endpoint ignores `page`, and is
 * bounded by MAX_PAGES so a misbehaving backend can't loop forever. Cached 1h
 * via the fetch `revalidate`, so every caller shares one set of requests.
 */
export async function fetchAllBusinesses(): Promise<any[]> {
  // The backend CAPS `limit` at 200 (verified: ?limit=500 returns 200,
  // pagination.totalPages reflects the capped size). The old code requested
  // limit=500 and then `break`ed on `rows.length < PAGE` — so page 1 came back
  // with 200 rows, 200 < 500 tripped the break, and only the FIRST 200 of 3,272
  // vendors ever reached the sitemap. Every other vendor page was invisible to
  // Google. Fix: request the real cap and walk `pagination.totalPages`.
  const PAGE = 200
  const MAX_PAGES = 100 // safety ceiling: 20,000 vendors
  const seen = new Set<string>()
  const all: any[] = []
  let totalPages = 1
  for (let page = 1; page <= MAX_PAGES; page++) {
    let rows: any[] = []
    let pagination: { totalPages?: number } | undefined
    try {
      const res = await fetch(
        `${BACKEND_URL}api/v1/businesses?page=${page}&limit=${PAGE}`,
        { next: { revalidate: 3600 }, headers: { Accept: "application/json" } },
      )
      if (!res.ok) break
      const json = (await res.json()) as { data?: any }
      const result = json?.data
      rows = Array.isArray(result) ? result : result?.data ?? []
      pagination = Array.isArray(result) ? undefined : result?.pagination
    } catch {
      break
    }
    if (!rows.length) break
    let added = 0
    for (const r of rows) {
      const id = String(r?.id ?? r?.businessId ?? "")
      if (id && !seen.has(id)) {
        seen.add(id)
        all.push(r)
        added++
      }
    }
    if (typeof pagination?.totalPages === "number" && pagination.totalPages > 0) {
      totalPages = pagination.totalPages
    }
    if (added === 0) break // endpoint ignored `page`, or no new rows
    if (page >= totalPages) break // walked every page the backend reports
  }
  return all
}

export function projectToCanonical(raw: any): DynamicVendor | null {
  const id = raw?.id ?? raw?.businessId
  if (!id) return null

  const vendor = raw?.vendor ?? {}
  const backendType: string | undefined =
    raw?.type || vendor?.vendorType || raw?.subBusinessType
  if (!backendType) return null

  const seoTypeSlug = backendToSeoSlug(backendType)
  if (!seoTypeSlug) return null

  const cityRaw: string = raw?.city ?? raw?.location ?? vendor?.city ?? ""
  // Fallback so EVERY vendor is indexable: an unknown/unparseable city (null,
  // Urdu that strips to empty, or a value not in CITIES) routes the vendor
  // under the national "pakistan" catch-all instead of being dropped.
  let citySlug = slugifyName(cityRaw)
  if (!citySlug || !CITIES.some((c) => c.slug === citySlug)) citySlug = "pakistan"

  const name: string = raw?.name ?? raw?.businessName ?? ""
  if (!name) return null
  const nameSlug = slugifyName(name)
  if (!nameSlug) return null

  const lastModifiedRaw = raw?.updatedAt ?? raw?.createdAt
  const lastModified = lastModifiedRaw ? new Date(lastModifiedRaw) : new Date()

  return {
    url: `${SITE_URL}/${seoTypeSlug}/${citySlug}/${nameSlug}-${id}`,
    lastModified,
  }
}

/**
 * First usable image URL on a business row. `images` arrives as a real array on
 * most rows and as a JSON string on legacy ones, so both are handled.
 */
export function pickFirstImage(raw: any): string | undefined {
  const imgs = raw?.images
  if (Array.isArray(imgs) && imgs.length > 0) {
    return typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url
  }
  if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url
      }
    } catch {
      return imgs
    }
  }
  return undefined
}
