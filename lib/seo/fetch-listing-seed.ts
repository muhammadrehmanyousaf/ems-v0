import "server-only"

import { BACKEND_URL } from "@/lib/backend-url"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { normalizeBusiness } from "@/lib/api/vendors"

/**
 * The first screenful of a vendor listing, fetched on the SERVER.
 *
 * WW-PERF. The listings render a client `<VendorSearch>` that fetches on mount,
 * so the grid — and therefore the largest paint — could not exist until a
 * round-trip had completed in the browser. Measured on production /vendors
 * after every other fix landed: LCP 4.9s of which 3,338ms was Load Delay, with
 * Load Time 0ms. Nothing was slow. Nothing had been ASKED for, because no card
 * existed to ask.
 *
 * Twelve rows of the `?view=card` projection is what a screen shows and about
 * 7kb on the wire, so the server can afford it inside the page render. The
 * client still fetches the whole list for filtering and pagination; this only
 * decides what is painted while that happens.
 *
 * `revalidate` rather than per-request: which vendors appear on page one moves
 * slowly, and the alternative is paying the backend round-trip on every single
 * page view. Five minutes is short enough that a new listing shows up promptly
 * and long enough that the seed is nearly always a cache hit.
 */
export const LISTING_SEED_REVALIDATE = 300

/** One screenful. Matches the twelve the grid paginates by. */
export const LISTING_SEED_SIZE = 12

export type ListingSeed = { items: any[]; total: number }

const EMPTY: ListingSeed = { items: [], total: 0 }

export async function fetchListingSeed(vendorType: string): Promise<ListingSeed> {
  const resolved = getVendorTypeFromPath(vendorType)
  const base = `${BACKEND_URL.replace(/\/$/, "")}/api/v1`
  const url =
    resolved === "all"
      ? `${base}/businesses?view=card&page=1&limit=${LISTING_SEED_SIZE}`
      : `${base}/businesses/businesses-by-vendor?vendorType=${encodeURIComponent(resolved)}` +
        `&view=card&page=1&limit=${LISTING_SEED_SIZE}`

  try {
    const res = await fetch(url, { next: { revalidate: LISTING_SEED_REVALIDATE } })
    if (!res.ok) return EMPTY
    const json = await res.json()
    // The list endpoints nest differently from each other; both shapes appear.
    const d = json?.data?.data ?? json?.data
    const rows: any[] = Array.isArray(d) ? d : d?.data || []
    return {
      items: rows.map(normalizeBusiness),
      total: Number(json?.data?.pagination?.total ?? rows.length) || rows.length,
    }
  } catch {
    // A seed is an optimisation, never a requirement. If the backend is slow or
    // down the page renders exactly as it did before: empty, then client-filled.
    return EMPTY
  }
}
