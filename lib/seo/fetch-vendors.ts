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
import {
  VENDOR_TYPE_BACKEND_MAP,
  BACKEND_TYPE_ALIASES,
  getCity,
  type VendorTypeSlug,
} from "./constants"

// Reverse the SEO→backend map (primary 1:1 entries + fold aliases) so we can
// derive the SEO slug from the backend's `vendorType` string. Used to compute
// canonical leaf URLs for listing cards.
const BACKEND_TO_SEO: Record<string, VendorTypeSlug> = {
  ...Object.fromEntries(
    Object.entries(VENDOR_TYPE_BACKEND_MAP)
      .filter(([, backend]) => backend != null)
      .map(([seo, backend]) => [backend as string, seo as VendorTypeSlug]),
  ),
  ...BACKEND_TYPE_ALIASES,
}

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
/**
 * Hard ceiling on one listings call. Generous enough for a cold Railway
 * container to answer, short enough that ~90 city pages cannot serialise into a
 * build timeout. A page that gives up renders its editorial shell and refreshes
 * on the next ISR pass an hour later — a far better outcome than a failed deploy.
 */
const FETCH_TIMEOUT_MS = 12000

/** One retry, because a cold Railway container answers the second call. */
const RETRY_DELAY_MS = 700

/**
 * The outcome of a listings fetch, with the one distinction that matters:
 * did we ASK and get nothing, or did we never manage to ask?
 *
 * `[]` was returned for both, and the city pages read that as "this city has no
 * vendors" — printing "Coming soon" and, worse, stamping the page
 * `noindex,follow`. Observed on production: /wedding-venues/lahore,
 * /karachi and /islamabad all served "We're onboarding verified wedding venues
 * now" and were noindexed, while the very same query returned 24 venues. A
 * transient failure during one Vercel build had removed the highest-intent
 * commercial pages on the site from Google, and nothing anywhere said so.
 */
export interface VendorFetchResult {
  vendors: VendorListItem[]
  /** True only when the backend actually answered. False = we never got data. */
  ok: boolean
}

/**
 * Back-compatible wrapper: the array only. Callers that cannot act on the
 * difference between "empty" and "failed" keep using this.
 */
export async function fetchCityVendors(opts: FetchOptions): Promise<VendorListItem[]> {
  return (await fetchCityVendorsResult(opts)).vendors
}

/**
 * The same fetch, reporting whether the backend actually answered.
 *
 * Retries once: the single most common failure here is a cold Railway
 * container during a Vercel build, and the second call almost always
 * succeeds. Two attempts inside the same page render is far cheaper than a
 * page that lies for an hour until ISR next runs.
 */
export async function fetchCityVendorsResult(opts: FetchOptions): Promise<VendorFetchResult> {
  // No backend mapping for this type (wedding-planners, wedding-djs). That is a
  // genuine, permanent "we have none", not a failure — `ok: true` is correct.
  if (!opts.vendorType) return { vendors: [], ok: true }

  const params = new URLSearchParams()
  if (opts.city) params.set("city", opts.city)
  params.set("vendorTypes", opts.vendorType)
  params.set("limit", String(opts.limit ?? 24))
  if (opts.page) params.set("page", String(opts.page))

  const url = `${BACKEND_URL}api/v1/businesses?${params.toString()}`

  // A bare fetch() has NO timeout. If the backend is merely slow rather than
  // down — Railway restarting mid-deploy, a cold container, a hung connection —
  // this call waits forever, static generation for the page never finishes, and
  // the whole Vercel build fails with "Static page generation is still timing
  // out after 3 attempts". One unreachable page takes down a deploy carrying
  // unrelated work. Observed exactly that on a local build with the backend
  // stopped (/wedding-venues/farooqabad).
  //
  // The catch below already treats "no backend" as "render the editorial shell
  // with no listings", which is the right answer for a slow backend too — it
  // just never got the chance to run. An abort signal gives it that chance.
  const attempt = async (): Promise<VendorFetchResult> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        // ISR: refresh from backend at most once per hour. Tweak if vendor
        // inventory changes faster (e.g. set 600 = 10 min) but keep ≥ 60s
        // to avoid hammering the backend on busy SEO traffic days.
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      // A non-2xx is the backend refusing to answer — 429 from the build's own
      // burst, 502 mid-deploy. Not evidence that the city is empty.
      if (!res.ok) return { vendors: [], ok: false }
      const json = (await res.json()) as { data?: any }
      const result = json?.data
      const list: any[] = Array.isArray(result) ? result : result?.data ?? []
      return { vendors: list.map(normalize), ok: true }
    } catch {
      // Unreachable, too slow, or aborted by the timeout above.
      return { vendors: [], ok: false }
    } finally {
      clearTimeout(timer)
    }
  }

  const first = await attempt()
  if (first.ok) return first
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
  return attempt()
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

  // Build the L6-canonical leaf URL. Reference: docs/seo/03-url-conventions-LOCKED.md §L6.
  // City is NOT required: a null/unmapped city routes under the "pakistan"
  // national catch-all, which the detail route resolves by the trailing id (the
  // same fallback the sitemap uses). Only id + a mapped type are load-bearing —
  // without them the card would otherwise render a dead `href="#"`.
  let href: string | undefined
  if (id && vendorType) {
    const seoTypeSlug = BACKEND_TO_SEO[vendorType]
    if (seoTypeSlug) {
      // Mirror the sitemap exactly: an empty OR unlisted city routes under the
      // "pakistan" national catch-all, which the detail route resolves via
      // getCity(). Anything else would 404 (the page does notFound() on an
      // unresolvable city), which is worse than the old dead "#".
      const raw = slugifyName(city)
      const citySlug = raw && getCity(raw) ? raw : "pakistan"
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
