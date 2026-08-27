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
// The canonical leaf-URL builder moved to ./vendor-href so a second caller
// (compare-vendors) could stop guessing at it. Behaviour is unchanged; this
// file was where it already lived correctly, just privately. The type map,
// city lookup and slugifier went with it, and are no longer used here.
import { vendorLeafHref } from "./vendor-href"

/**
 * Is this image from the seeded stock pool rather than the vendor's own upload?
 *
 * Cloudinary keeps the two apart by path, and the split is clean:
 *   vendor upload → wedding-wala/businesses/<id>/images/...
 *   seeded stock  → wedding-wala/vendors/<type>/...
 *
 * The stock pool is small and heavily reused. Across a 200-listing sample of
 * live data, 199 listings drew on just 86 distinct photos, 173 of them sharing
 * a photo with at least one other business, and one file fronting six different
 * venues. Every duplicate came from the stock pool; not one came from a real
 * upload. Presenting those as photographs of a named venue is the same
 * misrepresentation as the unconditional "Verified" badge — a couple sees the
 * identical hall under six different names, and a payment processor reads it as
 * fabricated listings.
 *
 * So a stock URL is treated as no photo at all. The card falls back to its
 * branded monogram tile, which alongside the "Unclaimed listing" label says
 * something true: we do not have a picture of this business yet. Real uploads
 * are untouched and take over as vendors add them.
 */
export function isStockPoolImage(url: string | undefined): boolean {
  if (!url) return false
  return /\/wedding-wala\/vendors\//.test(url)
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
  /**
   * Real verification signal, straight from the backend.
   *
   * `verificationTier` ladder (utils/vendorVerificationStatus.js):
   *   0 = an account exists and nothing more
   *   1 = email + phone OTP completed
   *   2 = NTN matched against the FBR ATL
   *   3 = CNIC matched to an ID document
   *   4 = ops physically visited the venue
   *
   * These exist because the card used to print "✓ Verified" unconditionally —
   * a hardcoded span with no `if` — across ~3,270 listings, of which a live
   * sample found 199/200 sitting at tier 0 with `status: "submitted"` and not a
   * single NTN, CNIC, address or visit check recorded. Nearly all of those rows
   * are imported public-directory data that no owner has ever claimed. Telling
   * a couple those businesses were verified was simply untrue, and it is the
   * kind of claim a payment processor reads as merchant misrepresentation.
   */
  verificationTier?: number
  /** Backend moderation state: "approved" | "submitted" | "draft". */
  status?: string
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

  // A stock-pool photo is not a photo of this business — see isStockPoolImage.
  if (isStockPoolImage(imageUrl)) imageUrl = undefined

  const id = raw?.id ?? raw?.businessId ?? 0
  const city = raw?.city ?? raw?.location ?? vendor?.city ?? ""
  const name = raw?.name ?? raw?.businessName ?? "Unnamed business"

  // The L6-canonical leaf URL, built by ./vendor-href. Undefined when there is
  // no URL that lands on this vendor (no id, or a vendorType with no SEO slug),
  // which the card renders as a disabled state rather than a dead "#".
  const href = vendorLeafHref({ id, name, city, vendorType })

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
    verificationTier: Number.isFinite(Number(raw?.verificationTier))
      ? Number(raw.verificationTier)
      : 0,
    status: typeof raw?.status === "string" ? raw.status : undefined,
  }
}
