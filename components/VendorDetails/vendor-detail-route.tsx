import React from "react"
import { permanentRedirect } from "next/navigation"
import { BACKEND_URL } from "@/lib/backend-url"
import { vendorCacheTag, slugifyName } from "@/lib/seo/fetch-vendor"
import { backendToSeoSlug } from "@/lib/seo"

/**
 * Legacy vendor profile route handler.
 *
 * Canonical 301 router: redirects all legacy short ID routes (/venues/[id],
 * /photographers/[id], /makeup-artists/[id], etc.) to their canonical
 * L6 slug: /{typeSlug}/{citySlug}/{slug}. If the vendor was deleted or not found,
 * permanently redirects to the main /wedding-venues hub to eliminate 404s.
 */
export const VENDOR_DETAIL_REVALIDATE = 3600

async function fetchVendor(id: string) {
  const numeric = Number(id)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  // Only a definitive 404 means "gone" (-> redirect to the hub). A timeout / 5xx / 429 must NOT be read as "gone":
  // that would cache a permanent redirect for a vendor that exists. Throw instead (see fetchVendorByIdStrict).
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch(`${BACKEND_URL}api/v1/businesses/${numeric}`, {
        next: { revalidate: VENDOR_DETAIL_REVALIDATE, tags: [vendorCacheTag(numeric)] },
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`backend ${res.status} for vendor ${numeric}`)
      const json = await res.json()
      return json?.data ?? null
    } catch (e) {
      lastErr = e
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(`vendor ${numeric}: backend unavailable (${String((lastErr as Error)?.message ?? lastErr)})`)
}

export async function VendorDetailRoute({ id }: { id: string }): Promise<React.JSX.Element | null> {
  const vendor = await fetchVendor(id)
  if (!vendor) {
    permanentRedirect("/wedding-venues")
  }

  const type = typeof vendor.type === "string" && vendor.type.trim() ? vendor.type : vendor.vendor?.vendorType || ""
  const typeSlug = backendToSeoSlug(type) || "wedding-venues"
  const citySlug = slugifyName(vendor.city || "pakistan")
  const slug = `${slugifyName(vendor.name || "vendor")}-${vendor.id}`

  // 301 Permanent Redirect to canonical SEO leaf URL
  permanentRedirect(`/${typeSlug}/${citySlug}/${slug}`)
  return null
}
