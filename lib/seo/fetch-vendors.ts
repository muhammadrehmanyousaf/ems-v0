/**
 * Server-side vendor-listing fetch — used by city × vendor-type pages.
 *
 * Hits the existing backend endpoint `/api/v1/businesses?city=...&vendorTypes=...`
 * which already supports composite filters (BK-050 in the backend
 * controller). Normalizes the response to a flat shape the page templates
 * can render without further transformation.
 *
 * Designed to be called from React Server Components in Next.js 14 App
 * Router. With `revalidate: 3600` on the page, results are cached for 1
 * hour at the edge.
 */

import { BACKEND_URL } from "@/lib/backend-url"
import { slugifyName } from "./fetch-vendor"
import { VENDOR_TYPE_BACKEND_MAP, type VendorTypeSlug } from "./constants"

// Reverse the SEO→backend map so we can derive the SEO slug from the
// backend's `vendorType` string. Used to compute canonical leaf URLs
// for listing cards.
const BACKEND_TO_SEO: Record<string, VendorTypeSlug> = Object.fromEntries(
  Object.entries(VENDOR_TYPE_BACKEND_MAP)
    .filter(([, backend]) => backend != null)
    .map(([seo, backend]) => [backend as string, seo as VendorTypeSlug]),
)

export interface VendorListItem {
  id: number | string
  name: string
  slug?: string
  city: string
  description?: string
  imageUrl?: string
  rating: number
  reviewCount: number
  priceMin?: number | null
  vendorType?: string
  href?: string // pre-computed href for the card
  /** Optional enrichment — populated from backend when available, else omitted. */
  specialties?: string[]
  areaServed?: string
}

interface FetchOptions {
  /** SEO slug like `karachi`. */
  city?: string
  /** Backend vendorType value like `Photographer`. */
  vendorType?: string | null
  limit?: number
  page?: number
}

/**
 * Fetch vendors for a city × type combo. Returns an empty array on any error
 * (network, 500, schema mismatch) — pages render the editorial shell + an
 * "no vendors yet" placeholder, never a 500.
 */
export async function fetchCityVendors(opts: FetchOptions): Promise<VendorListItem[]> {
  if (!opts.vendorType) return [] // no backend mapping (e.g. wedding-planners, wedding-djs)

  const params = new URLSearchParams()
  if (opts.city) params.set("city", opts.city)
  params.set("vendorTypes", opts.vendorType)
  params.set("limit", String(opts.limit ?? 24))
  if (opts.page) params.set("page", String(opts.page))

  const url = `${BACKEND_URL}api/v1/businesses?${params.toString()}`

  try {
    const res = await fetch(url, {
      // ISR: refresh from backend at most once per hour. Tweak if vendor
      // inventory changes faster (e.g. set 600 = 10 min) but keep ≥ 60s
      // to avoid hammering the backend on busy SEO traffic days.
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return []
    const json = (await res.json()) as { data?: any }
    const result = json?.data
    const list: any[] = Array.isArray(result) ? result : result?.data ?? []
    return list.map(normalize)
  } catch {
    // Backend unreachable at build time (e.g. Vercel build can't see local
    // dev API). Render the editorial shell with no listings — sitemap and
    // schema still pre-render correctly.
    return []
  }
}

function normalize(raw: any): VendorListItem {
  const vendor = raw?.vendor ?? {}
  const vendorType: string | undefined = raw?.type || vendor?.vendorType || raw?.subBusinessType

  // First image — backend may store as JSON string or array, handle both.
  let imageUrl: string | undefined
  const imgs = raw?.images
  if (Array.isArray(imgs) && imgs.length > 0) {
    imageUrl = typeof imgs[0] === "string" ? imgs[0] : imgs[0]?.url
  } else if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed) && parsed.length > 0) {
        imageUrl = typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.url
      }
    } catch {
      imageUrl = imgs
    }
  }

  // Pull the cheapest package price as priceMin if minimumPrice not set.
  let priceMin: number | null = null
  if (raw?.minimumPrice) priceMin = Number(raw.minimumPrice)
  else if (Array.isArray(raw?.packages) && raw.packages.length > 0) {
    const prices = raw.packages
      .map((p: any) => Number(p?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)
    if (prices.length > 0) priceMin = Math.min(...prices)
  }

  const id = raw?.id ?? raw?.businessId ?? 0
  const city = raw?.city ?? raw?.location ?? vendor?.city ?? ""
  const name = raw?.name ?? raw?.businessName ?? "Unnamed business"

  // Build the L6-canonical leaf URL when we can resolve city + type.
  // Reference: docs/seo/03-url-conventions-LOCKED.md §L6.
  let href: string | undefined
  if (id && city && vendorType) {
    const seoTypeSlug = BACKEND_TO_SEO[vendorType]
    if (seoTypeSlug) {
      const citySlug = slugifyName(city)
      const nameSlug = slugifyName(name)
      href = `/${seoTypeSlug}/${citySlug}/${nameSlug}-${id}`
    }
  }

  return {
    id,
    name,
    slug: raw?.slug,
    city,
    description: raw?.description ?? "",
    imageUrl,
    rating: Number(raw?.rating ?? 0) || 0,
    reviewCount: Number(raw?.reviewCount ?? 0) || 0,
    priceMin,
    vendorType,
    href,
    specialties: Array.isArray(raw?.specialties)
      ? raw.specialties.filter((s: unknown): s is string => typeof s === "string").slice(0, 4)
      : undefined,
    areaServed: typeof raw?.areaServed === "string" ? raw.areaServed : undefined,
  }
}
