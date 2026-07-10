"use client"

/**
 * VendorBranches — the detail-page surface for a vendor that runs more than one
 * business. A vendor (one User) can own many Business rows; each is its own
 * detail page + its own booking. This renders:
 *   • a "location switcher" for OTHER businesses of the SAME service type
 *     (true branches) — each pill links to that branch's page, so booking
 *     follows the branch you pick;
 *   • a "More from this vendor" card row for the vendor's OTHER services.
 * Self-hides entirely when the vendor has a single business (the common case).
 * Flag-free; driven by GET /businesses/:id/related.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Star, ArrowRight, Store } from "lucide-react"
import { VendorAPI } from "@/lib/api/vendors"
import { VENDOR_TYPE_PATHS, VENDOR_TYPE_DISPLAY_NAMES } from "@/lib/vendor-types"
import type { Vendor } from "@/lib/types"

const slugForType = (type?: string | null): string => {
  const e = Object.entries(VENDOR_TYPE_PATHS).find(([, t]) => t === type)
  return e ? e[0] : "vendors"
}
const hrefFor = (v: Vendor): string => `/${slugForType(v.type)}/${v.id}`
const typeLabel = (type?: string | null): string =>
  (type && (VENDOR_TYPE_DISPLAY_NAMES as Record<string, string>)[type]) || type || "Services"
const fmtPrice = (n?: number): string =>
  n && n > 0 ? "From Rs " + Number(n).toLocaleString("en-PK") : "Price on request"

export function VendorBranches({
  businessId,
  current,
}: {
  businessId: string | number
  current?: { id?: string | number; type?: string | null; city?: string | null; name?: string | null }
}): React.ReactElement | null {
  const { data } = useQuery({
    queryKey: ["vendor-related", String(businessId)],
    queryFn: () => VendorAPI.getRelatedBusinesses(businessId),
    staleTime: 5 * 60_000,
  })

  const branches = data?.branches ?? []
  const otherServices = data?.otherServices ?? []
  if (branches.length === 0 && otherServices.length === 0) return null

  const currentCity = current?.city || "This location"

  return (
    <section className="mt-8 space-y-6 rounded-2xl border border-bridal-beige bg-bridal-cream/40 p-5 sm:p-6">
      {/* ── Location switcher: same service, other branches ── */}
      {branches.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Store className="h-4 w-4 text-bridal-gold-dark" />
            <h3 className="font-display text-lg text-bridal-charcoal">Also available at other locations</h3>
          </div>
          <p className="mb-3 font-bridal text-[13px] text-bridal-text-soft">
            This vendor runs {branches.length + 1} {typeLabel(current?.type).toLowerCase()} branches — pick a location to see its pricing and book there.
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              aria-current="true"
              className="inline-flex items-center gap-1.5 rounded-full border border-bridal-gold bg-bridal-gold/15 px-3.5 py-1.5 font-bridal text-[13px] font-medium text-bridal-charcoal"
            >
              <MapPin className="h-3.5 w-3.5 text-bridal-gold-dark" /> {currentCity}
              <span className="text-[10px] uppercase tracking-wide text-bridal-gold-dark">· viewing</span>
            </span>
            {branches.map((b) => (
              <Link
                key={b.id}
                href={hrefFor(b)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-bridal-beige bg-white px-3.5 py-1.5 font-bridal text-[13px] text-bridal-text transition-colors hover:border-bridal-gold/60 hover:text-bridal-charcoal"
              >
                <MapPin className="h-3.5 w-3.5 text-bridal-mauve" />
                {b.city || b.name}
                {b.rating > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] text-bridal-text-soft">
                    · <Star className="h-3 w-3 fill-bridal-gold text-bridal-gold" /> {b.rating.toFixed(1)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── More from this vendor: other services ── */}
      {otherServices.length > 0 && (
        <div className={branches.length > 0 ? "border-t border-bridal-beige/70 pt-5" : ""}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg text-bridal-charcoal">More from this vendor</h3>
            <span className="font-bridal text-[12px] text-bridal-text-soft">{otherServices.length} other service{otherServices.length === 1 ? "" : "s"}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherServices.slice(0, 6).map((v) => (
              <Link
                key={v.id}
                href={hrefFor(v)}
                className="group flex gap-3 rounded-xl border border-bridal-beige bg-white p-2.5 transition-shadow hover:shadow-md"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-bridal-blush/40">
                  {v.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-bridal-mauve">
                      <Store className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bridal text-[14px] font-medium text-bridal-charcoal">{v.name}</div>
                  <div className="truncate font-bridal text-[12px] text-bridal-text-soft">
                    {typeLabel(v.type)}{v.city ? ` · ${v.city}` : ""}
                  </div>
                  <div className="mt-1 flex items-center gap-2 font-bridal text-[12px] text-bridal-text">
                    <span>{fmtPrice(v.price)}</span>
                    {v.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-bridal-gold text-bridal-gold" /> {v.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 self-center text-bridal-gold opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default VendorBranches
