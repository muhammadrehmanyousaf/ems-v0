"use client"

import { useState } from "react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Check, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"

interface Props {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
  venue?: EventVenue | null
  vendorDetails?: Vendor[]
}

function flattenFeatures(features: any): string[] {
  if (!features) return []
  if (Array.isArray(features)) return features.filter(Boolean) as string[]
  if (typeof features === "object") {
    const out: string[] = []
    for (const k of Object.keys(features)) {
      const v = features[k]
      if (Array.isArray(v)) v.forEach((x) => x && out.push(String(x)))
      else if (typeof v === "string" && v) out.push(v)
    }
    return out
  }
  return []
}

export default function PackageStep({ formData, updateFormData, venue, vendorDetails }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const venuePackages = venue?.packages || []
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  const selectedId = formData.selectedPackage ? String(formData.selectedPackage) : ""
  const qty = formData.vehicleQuantity || 1

  const heading = isCarRental
    ? "Choose a vehicle"
    : isBridalWear
    ? "Choose your outfit"
    : isWeddingStationery
    ? "Choose a product"
    : "Choose your package"

  const subheading = isCarRental
    ? "Pick the car. Add service packages on the next step if needed."
    : isVenueBooking
    ? "These packages set the base for your venue booking."
    : "All packages include the vendor's full attention for your event."

  const togglePkg = (id: string) =>
    updateFormData({ selectedPackage: selectedId === id ? "" : id })

  const adjustQty = (n: number) => {
    const next = Math.max(1, qty + n)
    updateFormData({ vehicleQuantity: next })
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (venuePackages.length === 0) {
    return (
      <div className="w-full space-y-5">
        <div>
          <h2 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">
            {heading}
          </h2>
          <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">{subheading}</p>
        </div>
        <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream p-10 text-center">
          <p className="font-bridal text-[12.5px] text-bridal-text-soft">No packages available yet. Continue to review and contact the vendor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      <div>
        <h2 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">
          {heading}
        </h2>
        <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">{subheading}</p>
      </div>

      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {venuePackages.map((pkg, idx) => {
          const id = String(pkg.id)
          const isSelected = selectedId === id
          const isExpanded = expanded.has(id)
          const features = flattenFeatures((pkg as any).features)
          const preview = isExpanded ? features : features.slice(0, 4)
          const isPopular = idx === 1 && venuePackages.length > 1 && !isCarRental && !isBridalWear

          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => togglePkg(id)}
                className={`relative w-full text-left rounded-md bg-bridal-ivory border transition-all overflow-hidden
                  ${isSelected
                    ? "border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_32px_-18px_rgba(176,125,84,0.5)]"
                    : "border-bridal-beige hover:border-bridal-gold/55 hover:bg-bridal-cream"
                  }`}
              >
                {/* Top row: name (+ pill), price */}
                <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display italic text-[19px] text-bridal-charcoal leading-tight">
                        {pkg.name}
                      </h3>
                      {isPopular && (
                        <span className="px-2 py-0.5 rounded-full font-bridal text-[9.5px] uppercase tracking-[0.18em] font-medium bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark">
                          Popular
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex items-start gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-display italic text-[22px] text-bridal-gold-dark leading-none tabular-nums">
                        Rs. {Number(pkg.price)?.toLocaleString()}
                      </p>
                      <p className="font-bridal text-[10px] uppercase tracking-[0.18em] text-bridal-text-soft mt-1">
                        {isCarRental ? "per event" : isBridalWear ? "per outfit" : "package"}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className={`inline-flex w-6 h-6 rounded-full items-center justify-center mt-1 transition-all
                        ${isSelected
                          ? "bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark shadow-[0_4px_12px_-6px_rgba(176,125,84,0.55)]"
                          : "bg-bridal-blush/55 text-transparent border border-bridal-beige"
                        }`}
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </span>
                  </div>
                </div>

                {/* Features */}
                {features.length > 0 && (
                  <div className="px-5 pb-4 pt-2 border-t border-bridal-beige/70">
                    <ul className="flex flex-wrap gap-1.5">
                      {preview.map((f, i) => (
                        <li
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bridal text-[11px] text-bridal-charcoal/85 bg-bridal-cream border border-bridal-beige"
                        >
                          <Check className="w-2.5 h-2.5 text-bridal-gold-dark" strokeWidth={3} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {features.length > 4 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(id)
                        }}
                        className="mt-2 inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-gold-dark hover:text-bridal-mauve"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {isExpanded ? "Show less" : `+${features.length - 4} more`}
                      </button>
                    )}
                  </div>
                )}

                {/* Quantity stepper */}
                {(isCarRental || isBridalWear || isWeddingStationery) && isSelected && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-5 py-3 border-t border-bridal-gold/45 bg-bridal-cream flex items-center justify-between"
                  >
                    <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
                      {isCarRental ? "Vehicles" : isBridalWear ? "Outfits" : "Sets"}
                    </span>
                    <div className="inline-flex items-center gap-0.5 rounded-md border border-bridal-beige bg-bridal-ivory p-0.5">
                      <button
                        type="button"
                        onClick={() => adjustQty(-1)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-bridal-charcoal hover:bg-bridal-blush/55 active:scale-95 transition-all"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-display italic text-[15px] tabular-nums text-bridal-charcoal">{qty}</span>
                      <button
                        type="button"
                        onClick={() => adjustQty(1)}
                        className="w-7 h-7 inline-flex items-center justify-center rounded text-bridal-charcoal hover:bg-bridal-blush/55 active:scale-95 transition-all"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
