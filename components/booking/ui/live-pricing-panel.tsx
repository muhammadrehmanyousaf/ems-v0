"use client"

import { useMemo, useState } from "react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Receipt, ChevronUp, ChevronDown, Lock } from "lucide-react"

interface LivePricingPanelProps {
  formData: BookingFormData
  venue: EventVenue | null
  vendorsDetails: Vendor[]
  selectedPackageObj?: any
  selectedMenuObj?: any
}

/**
 * Stripe Checkout-grade order summary. Clean white card, hairline border,
 * tabular-nums prices, "Due now" pulled into its own block so the user
 * always knows what they're paying right now vs. at the venue.
 */
export default function LivePricingPanel({
  formData,
  venue,
  vendorsDetails,
  selectedPackageObj,
  selectedMenuObj,
}: LivePricingPanelProps) {
  const [expanded, setExpanded] = useState(true)

  const breakdown = useMemo(() => {
    const items: { label: string; type: string; amount: number }[] = []
    const isCarRental = venue?.vendor?.vendorType === "Car rental"
    const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
    const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
    const vehicleQty = (isCarRental || isBridalWear || isWeddingStationery)
      ? (formData.vehicleQuantity || 1) : 1

    if (selectedPackageObj) {
      const unitPrice = Number(selectedPackageObj.price) || 0
      const pkgType = isCarRental ? "Vehicle" : isBridalWear ? "Outfit" : isWeddingStationery ? "Product" : "Package"
      items.push({
        label: vehicleQty > 1
          ? `${venue?.name || "Vendor"} — ${selectedPackageObj.name} ×${vehicleQty}`
          : `${venue?.name || "Vendor"} — ${selectedPackageObj.name}`,
        type: pkgType,
        amount: unitPrice * vehicleQty,
      })
    }

    if (selectedMenuObj) {
      items.push({
        label: `${venue?.name || "Venue"} — ${selectedMenuObj.title || selectedMenuObj.name}`,
        type: "Menu",
        amount: Number(selectedMenuObj.price) || 0,
      })
    }

    if (!selectedPackageObj && !selectedMenuObj && venue) {
      items.push({
        label: venue.name,
        type: "Venue",
        amount: Number(venue.minimumPrice) || 0,
      })
    }

    const vendorIdsWithPackages = new Set<string>()
    if (formData.selectedVendorPackages?.length) {
      formData.selectedVendorPackages.forEach((pkgId) => {
        const owner = vendorsDetails.find((v) =>
          (v.packages || []).some((p: any) => String(p.id) === String(pkgId))
        )
        const pkg = owner?.packages?.find((p: any) => String(p.id) === String(pkgId))
        if (owner && pkg) {
          vendorIdsWithPackages.add(String(owner.id))
          items.push({
            label: `${owner.name} — ${pkg.name}`,
            type: "Vendor Pkg",
            amount: Number(pkg.price) || 0,
          })
        } else {
          const venuePkg = (venue?.packages || []).find(
            (p: any) => String(p.id) === String(pkgId)
          )
          if (venuePkg) {
            items.push({
              label: `${venue?.name || "Vendor"} — ${(venuePkg as any).name}`,
              type: "Service Pkg",
              amount: Number((venuePkg as any).price) || 0,
            })
          }
        }
      })
    }

    if (formData.selectedVendors?.length) {
      formData.selectedVendors.forEach((vendorId) => {
        if (vendorIdsWithPackages.has(String(vendorId))) return
        if (venue && String(vendorId) === String(venue.id)) return
        const v = vendorsDetails.find((d) => String(d.id) === String(vendorId))
        if (v) {
          items.push({
            label: v.name,
            type: "Vendor",
            amount: Number(v.minimumPrice || v.price) || 0,
          })
        }
      })
    }

    const subtotal = items.reduce((sum, i) => sum + i.amount, 0)

    let downPayment = 0
    if (venue) {
      const dpType = (venue.downPaymentType || "").toLowerCase()
      const dpValue = Number(venue.downPayment) || 0
      if (dpType === "percentage" || dpType === "percent") {
        downPayment = Math.round(subtotal * (dpValue / 100))
      } else {
        downPayment = dpValue
      }
    }

    return { items, subtotal, downPayment, remaining: subtotal - downPayment }
  }, [formData, venue, vendorsDetails, selectedPackageObj, selectedMenuObj])

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  if (breakdown.subtotal === 0) return null

  return (
    <>
      {/* Desktop card */}
      <div className="hidden lg:block">
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-zinc-500 mb-1 inline-flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Order summary
            </p>
            <h3 className="text-[18px] font-semibold tracking-tight text-zinc-900 leading-tight">
              Booking total
            </h3>
          </div>

          <div className="p-5 space-y-3.5">
            {breakdown.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-zinc-900 truncate">{item.label}</p>
                  <p className="text-[10.5px] uppercase tracking-[0.12em] text-zinc-500 mt-0.5">{item.type}</p>
                </div>
                <span className="text-[14px] font-semibold text-zinc-900 shrink-0 tabular-nums">
                  {formatPKR(item.amount)}
                </span>
              </div>
            ))}

            <div className="border-t border-zinc-100 pt-4 mt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] font-medium text-zinc-700">Subtotal</span>
                <span className="text-[18px] font-semibold text-zinc-900 leading-none tabular-nums">
                  {formatPKR(breakdown.subtotal)}
                </span>
              </div>

              {breakdown.downPayment > 0 && (
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-zinc-900">
                      Due now
                    </span>
                    <span className="text-[18px] font-semibold text-zinc-900 leading-none tabular-nums">
                      {formatPKR(breakdown.downPayment)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[12px] text-zinc-500">
                    <span>Remaining at venue</span>
                    <span className="tabular-nums">{formatPKR(breakdown.remaining)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 mt-1 border-t border-zinc-100 flex items-center gap-1.5 text-[11.5px] text-zinc-500">
              <Lock className="h-3 w-3" />
              <span>Secured payments via Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-zinc-100 inline-flex items-center justify-center">
              <Receipt className="h-3.5 w-3.5 text-zinc-700" />
            </span>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.14em] font-semibold text-zinc-500 leading-none">Total</p>
              <p className="text-[16px] font-semibold text-zinc-900 leading-tight mt-0.5 tabular-nums">
                {formatPKR(breakdown.subtotal)}
              </p>
            </div>
          </div>
          {expanded ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronUp className="h-4 w-4 text-zinc-500" />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 space-y-2 border-t border-zinc-100 pt-3">
            {breakdown.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[12.5px]">
                <span className="text-zinc-700 truncate">{item.label}</span>
                <span className="text-zinc-900 font-semibold shrink-0 ml-2 tabular-nums">{formatPKR(item.amount)}</span>
              </div>
            ))}
            {breakdown.downPayment > 0 && (
              <div className="flex justify-between text-[12.5px] pt-2 border-t border-zinc-100 font-semibold text-zinc-900">
                <span>Due now</span>
                <span className="tabular-nums">{formatPKR(breakdown.downPayment)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
