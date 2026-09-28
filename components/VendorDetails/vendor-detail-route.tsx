import { notFound } from "next/navigation"
import VendorDetailsMobile from "@/components/VendorDetails/VendorDetailsMobile"
import { BACKEND_URL } from "@/lib/backend-url"
import { vendorCacheTag } from "@/lib/seo/fetch-vendor"

/**
 * The vendor profile page, server-rendered.
 *
 * WW-PERF. The seven `(vendorListings)/<type>/[id]/page.tsx` routes — venues,
 * photographers, catering, decor, makeup-artists, henna-artists, car-rental —
 * were seven near-identical 139-line CLIENT components. Each shipped an empty
 * shell, then fetched its vendor in a `useEffect`, so a visitor arriving from
 * search or the homepage got a spinner while a round-trip completed, and a
 * crawler got a page with no content in the HTML.
 *
 * The canonical SEO route next door (`/wedding-venues/[city]/[vendorSlug]`)
 * has always been `revalidate = 3600` and server-rendered. These never got the
 * same treatment. Now they do: one shared server component, fetched with the
 * same 1-hour ISR cache and the same `vendor-<id>` revalidation tag the SEO
 * pages use, so an on-demand revalidate clears both.
 *
 * Dropped on the way: a `localStorage.getItem('all_vendors')` fallback. It read
 * a client-side copy of the entire catalogue that the homepage used to
 * download — 3,272 vendors — and that download is gone, so the fallback could
 * only ever return nothing.
 */
export const VENDOR_DETAIL_REVALIDATE = 3600

async function fetchVendor(id: string) {
  const numeric = Number(id)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  try {
    const res = await fetch(`${BACKEND_URL}api/v1/businesses/${numeric}`, {
      next: { revalidate: VENDOR_DETAIL_REVALIDATE, tags: [vendorCacheTag(numeric)] },
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? null
  } catch {
    // Backend unreachable. Returning null renders the 404 page rather than a
    // spinner that never resolves — the old client version sat on "Loading
    // venue details..." forever in this case.
    return null
  }
}

export async function VendorDetailRoute({ id }: { id: string }) {
  const vendor = await fetchVendor(id)
  if (!vendor) notFound()
  return <VendorDetailsMobile vendor={vendor} />
}
