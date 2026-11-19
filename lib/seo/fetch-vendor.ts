/**
 * Server-side single-vendor fetch — used by L6 leaf detail pages
 * (`/{type-plural}/{city-slug}/{name-slug}-{shortid}`).
 *
 * The leaf URL puts the public id at the END of the slug. We extract it,
 * fetch by id from the existing backend `GET /api/v1/businesses/:id`,
 * and return a normalized shape. The page wrapper is responsible for
 * 301-ing the user to the canonical slug if they typed something stale.
 *
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L6.
 */

import { BACKEND_URL } from "@/lib/backend-url"
import { cancellationLabel } from "@/lib/cancellation-policy"

export interface VendorDetail {
  id: number | string
  name: string
  /** Slugified business name, e.g. "sq-photography". Used to canonicalize URLs. */
  nameSlug: string
  city: string
  vendorType?: string
  description?: string
  imageUrl?: string
  images: string[]
  /** WW-MEDIA — walkthrough clips. Same shape as `images`. */
  videos: string[]
  /** WW-CLAIM — true when this listing is an unclaimed public-directory import. */
  claimable?: boolean
  rating: number
  reviewCount: number
  reviews: any[]
  packages: any[]
  /**
   * WW-OFFERINGS — the venue's catering menus. `GET /businesses/:id` has always
   * returned these (title, price, pricingUnit, data), but nothing on the public
   * side read them, so a venue with three menus at Rs 1,850–3,900 per head
   * showed a couple none of them. A venue whose whole proposition is the food
   * was selling it invisibly.
   */
  menus: any[]
  priceMin?: number | null
  phone?: string
  email?: string
  websiteUrl?: string
  socialLinks?: { instagram?: string; facebook?: string; website?: string }
  amenities?: string[]
  serviceProvided?: string[]
  cancellationPolicy?: string
  /** WP29: the engine's own summary of the governing policy (headline + plain-words detail). */
  cancellationSummary?: { kind: string; headline: string; detail: string; source?: string } | null
  staff?: any[]
  raw: any // escape hatch for fields the page might want
}

/**
 * Slugify — lowercase, ASCII, hyphenated. Same algorithm everywhere so
 * the URL we generate matches the URL we expect on incoming requests.
 * Reference: docs/seo/03-url-conventions-LOCKED.md §L4.
 */
export function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Parse a leaf URL slug `name-slug-1234` into `{ slug: "name-slug", id: 1234 }`.
 * The id is whatever follows the LAST hyphen and is purely numeric (for now;
 * upgrade to Hashids decode later without changing call sites).
 */
export function parseVendorSlugAndId(
  vendorSlug: string,
): { slug: string; id: number | null } {
  const match = vendorSlug.match(/^(.+)-(\d+)$/)
  if (!match) return { slug: vendorSlug, id: null }
  const id = Number(match[2])
  if (!Number.isFinite(id) || id <= 0) return { slug: vendorSlug, id: null }
  return { slug: match[1], id }
}

/**
 * Build the canonical leaf URL for a vendor.
 * `/{type-plural}/{city-slug}/{name-slug}-{id}`
 */
export function buildVendorCanonicalPath(
  typeSlug: string,
  citySlug: string,
  vendor: { id: number | string; name: string; nameSlug?: string },
): string {
  const ns = vendor.nameSlug ?? slugifyName(vendor.name)
  return `/${typeSlug}/${citySlug}/${ns}-${vendor.id}`
}

/**
 * The Next Data Cache tag for one vendor's public data.
 *
 * Every public page reads the backend through a 1-hour ISR window, and Vercel's
 * Data Cache is keyed by fetch URL and shared across deployments — so a vendor
 * who added a photo, a clip or a new price saw nothing change on their own
 * listing for up to an hour, with no way to push it, and a redeploy did not
 * help. Tagging the fetches lets one vendor's data be dropped on demand while
 * leaving the hourly refresh in place for everyone else.
 */
export const vendorCacheTag = (id: number | string) => `vendor-${id}`

/**
 * Fetch by id. Returns null if missing / network error / build-time
 * unreachable backend.
 */
export async function fetchVendorById(id: number): Promise<VendorDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  const url = `${BACKEND_URL}api/v1/businesses/${id}`
  try {
    const res = await fetch(url, {
      // Tagged so a vendor edit can push itself live immediately instead of
      // waiting out the hour — see app/api/revalidate/route.ts.
      next: { revalidate: 3600, tags: [vendorCacheTag(id)] },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: any }
    const raw = json?.data
    if (!raw) return null
    return normalize(raw)
  } catch {
    return null
  }
}

/**
 * Strict by-id fetch for the PUBLIC SEO pages. Unlike fetchVendorById (null on ANY failure), this tells a definitive
 * "this vendor does not exist" (null) apart from "the backend could not answer right now" (throws).
 *
 * Why it matters: the detail page turns "null" into a permanent redirect to the city hub. If a slow or briefly
 * unavailable backend (it answers in 1-9 s, and sometimes 5xx/429) is read as "not found", ISR caches a 308 for the
 * hour and a healthy, indexed vendor page becomes a redirect in Google's eyes. A thrown error is never cached: Next
 * keeps serving the last good page (or an uncached 500) and retries on the next request.
 */
export async function fetchVendorByIdStrict(id: number): Promise<VendorDetail | null> {
  if (!Number.isFinite(id) || id <= 0) return null
  const url = `${BACKEND_URL}api/v1/businesses/${id}`
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600, tags: [vendorCacheTag(id)] },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      if (res.status === 404) return null // the backend answered: it really is gone
      if (!res.ok) throw new Error(`backend ${res.status} for vendor ${id}`)
      const json = (await res.json()) as { data?: any }
      const raw = json?.data
      if (!raw) return null
      return normalize(raw)
    } catch (e) {
      lastErr = e
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(`vendor ${id}: backend unavailable (${String((lastErr as Error)?.message ?? lastErr)})`)
}

/**
 * Whether a venue has a real multi-space tree (>1 sub-venue). Decided SERVER-SIDE
 * and ISR-cached 1h per vendor, so the public detail page makes zero per-visitor
 * calls to gate the space selector. Returns false on any error / no tree.
 */
export async function fetchVendorHasMultiSpace(id: number): Promise<boolean> {
  if (!Number.isFinite(id) || id <= 0) return false
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/venue-spaces/public/business/${id}/tree`, {
      next: { revalidate: 3600, tags: [vendorCacheTag(id)] },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return false
    const json = (await res.json()) as { data?: { tree?: any[] } }
    let count = 0
    const walk = (ns: any[] | undefined) => (ns || []).forEach((n) => { count += 1; walk(n.children) })
    walk(json?.data?.tree)
    return count > 1
  } catch {
    return false
  }
}

function pickFirstImage(raw: any): string | undefined {
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

/**
 * WW-MEDIA — videos arrive exactly like images (a Postgres text[] that some
 * callers hand back as a JSON string), so it reuses the same normaliser rather
 * than growing a second, subtly different one.
 */
function normalizeVideos(raw: any): string[] {
  return normalizeImages({ images: raw?.videos })
}

function normalizeImages(raw: any): string[] {
  const imgs = raw?.images
  if (Array.isArray(imgs)) {
    return imgs.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean)
  }
  if (typeof imgs === "string") {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed)) {
        return parsed.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean)
      }
      return [imgs]
    } catch {
      return [imgs]
    }
  }
  return []
}

function normalize(raw: any): VendorDetail {
  const vendor = raw?.vendor ?? {}
  const id = raw?.id ?? raw?.businessId ?? 0
  const name = raw?.name ?? raw?.businessName ?? "Unnamed business"
  const city = raw?.city ?? raw?.location ?? vendor?.city ?? ""

  let priceMin: number | null = null
  if (raw?.minimumPrice) priceMin = Number(raw.minimumPrice)
  else if (Array.isArray(raw?.packages) && raw.packages.length > 0) {
    const prices = raw.packages
      .map((p: any) => Number(p?.price))
      .filter((p: number) => Number.isFinite(p) && p > 0)
    if (prices.length > 0) priceMin = Math.min(...prices)
  }

  return {
    id,
    name,
    nameSlug: slugifyName(name),
    city,
    vendorType: raw?.type || vendor?.vendorType || raw?.subBusinessType,
    description: raw?.description ?? "",
    imageUrl: pickFirstImage(raw),
    images: normalizeImages(raw),
    videos: normalizeVideos(raw),
    claimable: raw?.claimable === true,
    rating: Number(raw?.rating ?? 0) || 0,
    reviewCount: Number(raw?.reviewCount ?? 0) || 0,
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
    packages: Array.isArray(raw?.packages) ? raw.packages : [],
    menus: Array.isArray(raw?.menus) ? raw.menus : [],
    priceMin,
    phone: raw?.phoneNumber ?? raw?.bookingPhone ?? vendor?.phoneNumber,
    email: raw?.bookingEmail ?? vendor?.email,
    websiteUrl: raw?.website ?? vendor?.website,
    socialLinks: {
      instagram: raw?.instagram,
      facebook: raw?.facebook,
      website: raw?.website,
    },
    amenities: Array.isArray(raw?.amenities) ? raw.amenities : [],
    serviceProvided: Array.isArray(raw?.serviceProvided) ? raw.serviceProvided : [],
    cancellationPolicy: cancellationLabel(raw?.cancellationPolicy ?? raw?.cancelationPolicy ?? ""),
    cancellationSummary: raw?.cancellationSummary ?? null,
    staff: Array.isArray(raw?.staff) ? raw.staff : [],
    raw,
  }
}
