"use client"

import { useMemo } from "react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Receipt, ChevronUp, ChevronDown } from "lucide-react"
import { useState } from "react"

interface LivePricingPanelProps {
  formData: BookingFormData
  venue: EventVenue | null
  vendorsDetails: Vendor[]
  selectedPackageObj?: any
  selectedMenuObj?: any
}

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

    // Venue package
    if (selectedPackageObj) {
      items.push({
        label: `${venue?.name || "Venue"} — ${selectedPackageObj.name}`,
        type: "Package",
        amount: Number(selectedPackageObj.price) || 0,
      })
    }

    // Venue menu
    if (selectedMenuObj) {
      items.push({
        label: `${venue?.name || "Venue"} — ${selectedMenuObj.title || selectedMenuObj.name}`,
        type: "Menu",
        amount: Number(selectedMenuObj.price) || 0,
      })
    }

    // If no package/menu, use venue base price
    if (!selectedPackageObj && !selectedMenuObj && venue) {
      items.push({
        label: venue.name,
        type: "Venue",
        amount: Number(venue.minimumPrice) || 0,
      })
    }

    // Vendor packages
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
        }
      })
    }

    // Vendors without packages (base price)
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

    // Down payment calculation
    let downPayment = 0
    if (venue) {
      const dpType = (venue.downPaymentType || "").toLowerCase()
      const dpValue = Number(venue.downPayment) || 0
      if (dpType.includes("percent")) {
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
      {/* Desktop: sidebar-style panel */}
      <div className="hidden lg:block sticky top-4">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-white border-b border-neutral-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-neutral-800">Price Breakdown</span>
          </div>
          <div className="p-4 space-y-2">
            {breakdown.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1">
                  <p className="text-neutral-700 truncate">{item.label}</p>
                  <p className="text-[10px] text-neutral-400">{item.type}</p>
                </div>
                <span className="text-neutral-800 font-medium shrink-0 ml-3">{formatPKR(item.amount)}</span>
              </div>
            ))}
            <div className="border-t border-neutral-100 pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-neutral-800">Subtotal</span>
                <span className="text-neutral-900">{formatPKR(breakdown.subtotal)}</span>
              </div>
              {breakdown.downPayment > 0 && (
                <>
                  <div className="flex justify-between text-xs text-purple-600">
                    <span>Down Payment (due now)</span>
                    <span className="font-medium">{formatPKR(breakdown.downPayment)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Remaining</span>
                    <span>{formatPKR(breakdown.remaining)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: collapsible bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-neutral-800">Total: {formatPKR(breakdown.subtotal)}</span>
          </div>
          {expanded ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronUp className="h-4 w-4 text-neutral-400" />}
        </button>
        {expanded && (
          <div className="px-4 pb-4 space-y-1.5 border-t border-neutral-100 pt-2">
            {breakdown.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 truncate">{item.label}</span>
                <span className="text-neutral-800 font-medium shrink-0 ml-2">{formatPKR(item.amount)}</span>
              </div>
            ))}
            {breakdown.downPayment > 0 && (
              <div className="flex justify-between text-xs text-purple-600 pt-1 border-t border-neutral-100">
                <span>Down Payment</span>
                <span className="font-medium">{formatPKR(breakdown.downPayment)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
