"use client"

import { useState } from "react"
import { scopeToSpace, isOwnedBySpace } from "@/lib/booking/scope-to-space"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Check, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
// WW-PKG-UNIT — a package can be priced per head; the card must say so and show
// what that comes to at this customer's guest count.
import {
  packageIsPerHead,
  packageBillableHeads,
  packageChargeFor,
  packageIsAtMinGuarantee,
  packageIncludesFood,
} from "@/lib/pricing/package"

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

/**
 * The step renders no heading of its own — the shell's StepFrame carries
 * "STEP 3 OF n · PACKAGES", the title ("Choose your package" / "Choose a
 * vehicle" / …) and the subtitle from lib/booking/step-copy.ts.
 *
 * Layout: one column for a 544px desk or a phone, two columns of ~378px at
 * `xl` (≥1280). Each card is a white 4px-radius tile: name + badge, price +
 * unit at the right, guests line, one row of feature chips with "+N more"
 * expanding the card in place. Selection = cream fill, gold-dark border, a
 * 4px gold rule scaling down the left edge and a ✓ disc top-right.
 */
export default function PackageStep({ formData, updateFormData, venue, vendorDetails }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  /**
   * Only the packages that exist in the space the customer picked.
   *
   * A package now records which hall it is sold in (`subVenueId`, NULL =
   * venue-wide). Without this filter, a couple booking the 120-seat Terrace
   * Lawn was still shown — and could still buy — the Main Hall's 500-guest
   * walima package, which is not a thing the venue can deliver in the room
   * they are paying for.
   *
   * Space-specific packages are shown only when their space is chosen;
   * venue-wide ones are always shown, so nothing disappears for a venue that
   * has not divided its packages up. And if narrowing would leave the customer
   * with NOTHING to choose, the full list stands: an empty package step is a
   * dead end, and a slightly wrong list beats no list at all on a live booking
   * flow.
   */
  const allPackages = venue?.packages || []
  const chosenSpaceId = Number((formData as any).selectedSubVenueId) || null
  /*
   * No space chosen means the WHOLE VENUE, and that is its own answer — not
   * "no filter".
   *
   * This used to fall through to the unfiltered list, so booking the entire
   * venue showed every hall's private package: the 120-seat Terrace Lawn
   * mehndi package offered to someone taking the whole property. Whole-venue
   * is served by the venue-wide packages — the ones the vendor set up at
   * onboarding with no hall attached — so that is what it shows.
   *
   * Same rule, stated once, for both branches: a package is offered here if it
   * is venue-wide, or if it belongs to the space being booked.
   */
  /* The rule now lives in lib/booking/scope-to-space.ts, because the VENDOR's
     offline-booking form needs the identical behaviour and two copies of it
     drifted into the two halves of the product disagreeing about what was on
     sale. `scopeToSpace` filters AND sorts (space-own first), which is what the
     hand-rolled filter plus the sort below did between them. */
  const scopedOrAll = scopeToSpace(allPackages as any[], chosenSpaceId)

  /**
   * The chosen hall's OWN package comes first, and says so.
   *
   * Filtering was already right — a Terrace Lawn booking no longer sees the
   * Main Hall's package — but the result was left in whatever order the API
   * returned. So the package written specifically FOR the hall the customer
   * just picked could sit third, below two generic venue-wide ones, with
   * nothing on it to say it was the one meant for their room. The customer had
   * chosen a hall and the screen did not visibly react to that choice.
   *
   * A stable sort: space-specific before venue-wide, everything else in the
   * order the vendor arranged it. Nothing is hidden and nothing is renamed —
   * the one package that IS the answer is simply first, and badged.
   */
  const venuePackages = scopedOrAll

  /** The name of the hall being booked, for the badge on its own package. */
  const chosenSpaceName: string | null =
    (formData as any).selectedSubVenueName || null

  /** TRUE when this package was written for the hall the customer picked. */
  const isSpaceOwnPackage = (p: any) => isOwnedBySpace(p, chosenSpaceId)
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  const selectedId = formData.selectedPackage ? String(formData.selectedPackage) : ""
  const qty = formData.vehicleQuantity || 1
  // QA #17 — show "guests allowed" on the card. Guest capacity is a BUSINESS
  // property (seated/max), NOT Package.capacity (which is a concurrent-booking
  // cap, not a headcount). Shown only for guest-based venue bookings.
  const venueMaxGuests = Number((venue as any)?.seatedCapacity) || Number(venue?.maxCapacity) || 0
  const venueMinGuests = Number(venue?.minCapacity) || 0
  const guestsLabel =
    isVenueBooking && venueMaxGuests > 0
      ? venueMinGuests > 0
        ? `${venueMinGuests.toLocaleString()}–${venueMaxGuests.toLocaleString()} guests`
        : `Up to ${venueMaxGuests.toLocaleString()} guests`
      : ""

  const hasQuantity = isCarRental || isBridalWear || isWeddingStationery

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
      <div className="rounded-[4px] border border-dashed border-bridal-beige bg-bridal-cream px-6 py-10 text-center">
        <p className="font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
          No packages available yet. Continue to review and contact the vendor.
        </p>
      </div>
    )
  }

  /**
   * Rows, not tiles — the shape the vendors step uses: one line you scan,
   * the price where the eye expects it, one button. A package that needs
   * more words opens under its row; nothing changes size elsewhere.
   */
  return (
    <ul className="space-y-2" aria-label="Packages">
      {venuePackages.map((pkg, idx) => {
        const id = String(pkg.id)
        const isSelected = selectedId === id
        const isExpanded = expanded.has(id)
        const features = flattenFeatures((pkg as any).features)
        const isPopular = idx === 1 && venuePackages.length > 1 && !isCarRental && !isBridalWear
        const isForChosenSpace = isSpaceOwnPackage(pkg)
        const images = Array.isArray((pkg as any).images) ? ((pkg as any).images as string[]).filter(Boolean) : []
        const thumb = images[0]
        const perHead = packageIsPerHead(pkg)
        const heads = packageBillableHeads(pkg, formData.guestCount)
        const atMin = packageIsAtMinGuarantee(pkg, formData.guestCount)
        const unit = perHead ? "per head" : isCarRental ? "per event" : isBridalWear ? "per outfit" : "package"
        const summary = features.slice(0, 3).join(" · ")
        const more = Math.max(0, features.length - 3)

        return (
          <li
            key={id}
            style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
            className={`rounded-[4px] border transition-colors duration-150 motion-safe:animate-stagger-fade-up ${
              isSelected ? "border-bridal-gold-dark bg-bridal-cream" : "border-bridal-beige bg-white hover:bg-bridal-blush/45"
            }`}
          >
            <div className="flex items-center gap-4 px-4 py-3">
              {thumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumb} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-[6px] border border-bridal-beige object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="font-display italic text-[18px] leading-6 text-bridal-charcoal">{pkg.name}</p>
                  {isForChosenSpace ? (
                    <span className="rounded-full border border-bridal-sage/50 bg-bridal-sage/20 px-2 py-0.5 font-bridal text-[9.5px] font-medium uppercase tracking-[0.16em] text-[#3F6B43]">
                      {chosenSpaceName ? `${chosenSpaceName} package` : "This hall's package"}
                    </span>
                  ) : isPopular ? (
                    <span className="rounded-full bg-bridal-gold px-2 py-0.5 font-bridal text-[9.5px] font-medium uppercase tracking-[0.16em] text-bridal-charcoal">
                      Popular
                    </span>
                  ) : null}
                  {packageIncludesFood(pkg) && (
                    <span className="font-bridal text-[10px] font-medium uppercase tracking-[0.16em] text-[#3F6B43]">Food included</span>
                  )}
                </div>
                <p className="mt-0.5 flex min-w-0 items-baseline gap-1.5 font-bridal text-[12.5px] leading-[18px] text-bridal-text-soft">
                  <span className="min-w-0 truncate">{[guestsLabel, summary].filter(Boolean).join(" · ") || pkg.description || ""}</span>
                  {more > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(id)}
                      aria-expanded={isExpanded}
                      className="shrink-0 font-medium text-bridal-gold-dark hover:text-bridal-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark"
                    >
                      {isExpanded ? "less" : `+${more} more`}
                    </button>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bridal text-[16px] font-semibold leading-5 tabular-nums text-bridal-charcoal">
                  Rs {Number(pkg.price)?.toLocaleString()}
                </p>
                <p className="font-bridal text-[10.5px] uppercase leading-[14px] tracking-[0.14em] text-bridal-text-soft">
                  {unit}
                  {perHead && ` · Rs ${packageChargeFor(pkg, formData.guestCount).toLocaleString()} for ${heads}${atMin ? " (min)" : ""}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePkg(id)}
                aria-pressed={isSelected}
                aria-label={`${pkg.name || "Package"}${isSelected ? " (selected)" : ""}`}
                className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[4px] border px-4 font-bridal text-[11px] font-medium uppercase tracking-[0.16em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-bridal-gold-dark bg-bridal-gold-dark text-bridal-ivory motion-safe:animate-pop-select"
                    : "border-bridal-beige bg-white text-bridal-charcoal hover:border-bridal-gold-dark hover:text-bridal-gold-dark"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                {isSelected ? "Selected" : "Select"}
              </button>
            </div>

            {(isExpanded || (pkg.description && summary)) && isExpanded && (
              <div className="border-t border-bridal-beige/70 px-4 py-3">
                {pkg.description && <p className="mb-2 font-bridal text-[12.5px] leading-[18px] text-bridal-text-soft">{pkg.description}</p>}
                <ul className="flex flex-wrap gap-1.5">
                  {features.map((ft, i) => (
                    <li key={i} className="inline-flex items-center gap-1 rounded-full border border-bridal-beige bg-white px-2 py-0.5 font-bridal text-[11px] text-bridal-charcoal/85">
                      <Check className="h-2.5 w-2.5 text-bridal-gold-dark" strokeWidth={3} aria-hidden />
                      {ft}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasQuantity && isSelected && (
              <div className="flex items-center justify-between border-t border-bridal-gold/45 px-4 py-2.5">
                <span className="font-bridal text-[13px] text-bridal-charcoal">
                  {isCarRental ? "Vehicles" : isBridalWear ? "Outfits" : "Sets"}
                </span>
                <div className="flex items-center rounded-full border border-bridal-beige bg-white p-0.5">
                  <button type="button" onClick={() => adjustQty(-1)} aria-label="Decrease" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-bridal-charcoal hover:bg-bridal-blush/45 motion-safe:active:scale-95">
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                  <span className="w-10 text-center font-bridal text-[15px] font-medium tabular-nums text-bridal-charcoal" aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => adjustQty(1)} aria-label="Increase" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-bridal-charcoal hover:bg-bridal-blush/45 motion-safe:active:scale-95">
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
