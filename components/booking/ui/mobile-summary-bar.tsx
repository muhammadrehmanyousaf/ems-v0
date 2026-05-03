"use client"

import { useMemo, useState } from "react"
import { Receipt, ChevronUp, ChevronDown } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"

interface MobileSummaryBarProps {
  formData: BookingFormData
  venue: EventVenue | null
  vendorsDetails: Vendor[]
  selectedPackageObj?: any
  selectedMenuObj?: any
}

export default function MobileSummaryBar({
  formData,
  venue,
  vendorsDetails,
  selectedPackageObj,
  selectedMenuObj,
}: MobileSummaryBarProps) {
  const [expanded, setExpanded] = useState(false)

  const breakdown = useMemo(() => {
    const items: { label: string; amount: number }[] = []
    const isCarRental = venue?.vendor?.vendorType === "Car rental"
    const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
    const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
    const vehicleQty =
      isCarRental || isBridalWear || isWeddingStationery ? formData.vehicleQuantity || 1 : 1

    if (selectedPackageObj) {
      items.push({
        label:
          vehicleQty > 1
            ? `${selectedPackageObj.name} ×${vehicleQty}`
            : selectedPackageObj.name,
        amount: (Number(selectedPackageObj.price) || 0) * vehicleQty,
      })
    }
    if (selectedMenuObj) {
      items.push({
        label: selectedMenuObj.title || selectedMenuObj.name,
        amount: Number(selectedMenuObj.price) || 0,
      })
    }
    if (formData.selectedVendorPackages?.length) {
      formData.selectedVendorPackages.forEach((pkgId) => {
        const owner = vendorsDetails.find((v) =>
          (v.packages || []).some((p: any) => String(p.id) === String(pkgId)),
        )
        const pkg = owner?.packages?.find((p: any) => String(p.id) === String(pkgId))
        if (owner && pkg) items.push({ label: `${owner.name} — ${pkg.name}`, amount: Number(pkg.price) || 0 })
      })
    }
    const subtotal = items.reduce((s, i) => s + i.amount, 0)
    let downPayment = 0
    if (venue) {
      const dpType = (venue.downPaymentType || "").toLowerCase()
      const dpValue = Number(venue.downPayment) || 0
      downPayment =
        dpType === "percentage" || dpType === "percent"
          ? Math.round(subtotal * (dpValue / 100))
          : dpValue
    }
    return { items, subtotal, downPayment }
  }, [formData, venue, vendorsDetails, selectedPackageObj, selectedMenuObj])

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  if (breakdown.subtotal === 0) return null

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-zinc-200 shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.12)]">
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
            <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-zinc-500 leading-none">
              {breakdown.downPayment > 0 ? "Due now" : "Total"}
            </p>
            <p className="text-[15px] font-semibold text-zinc-900 leading-tight mt-0.5 tabular-nums">
              {formatPKR(breakdown.downPayment > 0 ? breakdown.downPayment : breakdown.subtotal)}
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
          <div className="flex justify-between text-[12.5px] pt-2 border-t border-zinc-100 font-semibold text-zinc-900">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPKR(breakdown.subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
