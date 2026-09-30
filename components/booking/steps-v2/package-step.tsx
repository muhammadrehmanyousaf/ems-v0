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

  return (
    <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-label="Packages">
      {venuePackages.map((pkg, idx) => {
        const id = String(pkg.id)
        const isSelected = selectedId === id
        const isExpanded = expanded.has(id)
        const features = flattenFeatures((pkg as any).features)
        const preview = isExpanded ? features : features.slice(0, 4)
        const isPopular = idx === 1 && venuePackages.length > 1 && !isCarRental && !isBridalWear
        /* Written for the hall the customer picked, rather than for the
           venue generally. Sorted to the front above; badged here so the
           reason it is first is visible and not just felt. */
        const isForChosenSpace = isSpaceOwnPackage(pkg)
        const perHead = packageIsPerHead(pkg)
        const images = Array.isArray((pkg as any).images) ? ((pkg as any).images as string[]).filter(Boolean) : []
        const heroImage = images[0]
        const unit = perHead
          ? "per head"
          : isCarRental ? "per event" : isBridalWear ? "per outfit" : "package"

        /*
         * Card anatomy: the visual tile (`div`) first, then a transparent
         * <button aria-pressed> laid over the whole tile as the select
         * target, so the "+N more" and quantity controls inside the tile are
         * real buttons sitting ABOVE the overlay (`relative z-10`) instead of
         * buttons nested inside a button — which the HTML parser rejects and
         * which made keyboard order inside the card unpredictable.
         */
        return (
          <li
            key={id}
            className="group relative min-w-0 motion-safe:animate-stagger-fade-up"
            style={{ animationDelay: `${Math.min(idx, 8) * 30}ms` }}
          >
            <div
              className={`relative flex h-full flex-col rounded-[4px] border transition-[border-color,background-color] duration-150 ${
                isSelected
                  ? "border-bridal-gold-dark bg-bridal-cream"
                  : "border-bridal-beige bg-white group-hover:border-bridal-gold/60 group-hover:bg-bridal-blush/45"
              }`}
            >
              {/* The 4px gold rule down the left edge — scales in from the top
                  when the card is chosen and ends fully visible. It carries no
                  text, so its collapsed state is a transform, not hidden copy. */}
              <span
                aria-hidden
                className={`absolute bottom-0 left-0 top-0 w-1 origin-top rounded-l-[3px] bg-bridal-gold motion-safe:transition-transform motion-safe:duration-[180ms] motion-safe:ease-out ${
                  isSelected ? "scale-y-100" : "scale-y-0"
                }`}
              />

              {/* QA #8 — package images the vendor uploaded. The card never
                  rendered them, so "all package details" were not visible.
                  Additive + guarded: shows only when images exist. The first
                  image is a 120px header; the rest are named in the alt so
                  nothing the vendor uploaded is silently dropped. */}
              {heroImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={`${pkg.name || "Package"}${images.length > 1 ? ` (1 of ${images.length} photos)` : ""}`}
                  loading="lazy"
                  className="h-[120px] w-full shrink-0 rounded-t-[3px] border-b border-bridal-beige object-cover"
                />
              )}

              <div className="flex flex-1 flex-col p-4 pr-12">
                {/* Top row: name (+ badge) at left, price + unit at right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="font-display italic text-[19px] leading-[24px] text-bridal-charcoal">
                        {pkg.name}
                      </h3>
                      {/* The hall's own package wins the badge slot. Showing
                          "Popular" next to "This hall's package" would put two
                          competing reasons to pick it on one line, and only one
                          of them is a fact about this customer's choice. */}
                      {isForChosenSpace ? (
                        <span className="inline-flex h-[18px] items-center rounded-full border border-bridal-sage/50 bg-bridal-sage/20 px-2 font-bridal text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#3F6B43]">
                          {chosenSpaceName ? `${chosenSpaceName} package` : "This hall's package"}
                        </span>
                      ) : isPopular ? (
                        <span className="inline-flex h-[18px] items-center rounded-full bg-bridal-gold px-2 font-bridal text-[9.5px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal">
                          Popular
                        </span>
                      ) : null}
                    </div>
                    {pkg.description && (
                      <p
                        className={`mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft ${
                          isExpanded ? "" : "line-clamp-1"
                        }`}
                      >
                        {pkg.description}
                      </p>
                    )}
                    {guestsLabel && (
                      <p className="mt-1 font-bridal text-[11px] uppercase leading-[16px] tracking-[0.14em] text-bridal-gold-dark tabular-nums">
                        {guestsLabel}
                      </p>
                    )}
                  </div>

                  {/* WW-PKG-UNIT — the unit NEVER leaves the number.
                      "Rs 2,500" next to "package" told a customer nothing
                      about whether that was the whole event or one plate, and
                      it is the same ambiguity that let vendors enter a
                      per-head rate as a flat one. For a per-head package we
                      also show what it comes to at THEIR guest count, because
                      that is the figure they are actually deciding on. */}
                  <div className="shrink-0 text-right">
                    <p className="font-display italic text-[22px] leading-[26px] text-bridal-gold-dark tabular-nums">
                      Rs. {Number(pkg.price)?.toLocaleString()}
                    </p>
                    <p className="font-bridal text-[10px] uppercase leading-[12px] tracking-[0.18em] text-bridal-text-soft">
                      {unit}
                    </p>
                    {perHead && (
                      <p className="mt-1 font-bridal text-[11px] leading-[16px] text-bridal-text-soft tabular-nums">
                        {(() => {
                          const heads = packageBillableHeads(pkg, formData.guestCount)
                          const atMin = packageIsAtMinGuarantee(pkg, formData.guestCount)
                          return `Rs. ${packageChargeFor(pkg, formData.guestCount).toLocaleString()} for ${heads} ${heads === 1 ? "guest" : "guests"}${atMin ? " (min)" : ""}`
                        })()}
                      </p>
                    )}
                    {packageIncludesFood(pkg) && (
                      <p className="mt-1 font-bridal text-[10px] uppercase leading-[12px] tracking-[0.16em] text-[#3F6B43]">
                        Food included
                      </p>
                    )}
                  </div>
                </div>

                {/* Features: one row of chips and a "+N more" that grows the
                    card in place. Chips wrap only when a name is long. */}
                {features.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {preview.map((f, i) => (
                      <span
                        key={i}
                        className="inline-flex h-6 items-center gap-1 rounded-full border border-bridal-beige bg-bridal-ivory px-2 font-bridal text-[11px] leading-[14px] text-bridal-charcoal/85"
                      >
                        <Check className="h-2.5 w-2.5 shrink-0 text-bridal-gold-dark" strokeWidth={3} aria-hidden />
                        {f}
                      </span>
                    ))}
                    {features.length > 4 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(id)
                        }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Show fewer features of ${pkg.name || "package"}` : `Show ${features.length - 4} more features of ${pkg.name || "package"}`}
                        className="relative z-10 -my-[9px] inline-flex h-11 items-center gap-1 rounded-full px-2 font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold-dark transition-colors duration-150 hover:text-bridal-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory xl:-my-[3px] xl:h-[30px]"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
                        {isExpanded ? "Show less" : `+${features.length - 4} more`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quantity stepper — a 48px footer inside the chosen card.
                  Sits above the select overlay so its buttons are the target. */}
              {hasQuantity && isSelected && (
                <div className="relative z-10 flex h-12 shrink-0 items-center justify-between border-t border-bridal-gold/45 bg-bridal-cream px-4">
                  <span className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
                    {isCarRental ? "Vehicles" : isBridalWear ? "Outfits" : "Sets"}
                  </span>
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustQty(-1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bridal-beige bg-white text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory xl:h-9 xl:w-9"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <span className="w-8 text-center font-display italic text-[15px] leading-[20px] text-bridal-charcoal tabular-nums" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustQty(1)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bridal-beige bg-white text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory xl:h-9 xl:w-9"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              )}

              {/* ✓ disc top-right: an empty ring until chosen, then a gold-dark
                  disc that pops in. Pinned to the tile, not the image. */}
              <span
                aria-hidden
                className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border transition-colors duration-150 ${
                  isSelected
                    ? "border-bridal-gold-dark bg-bridal-gold-dark text-bridal-ivory motion-safe:animate-scale-in"
                    : "border-bridal-beige bg-white text-bridal-ivory"
                }`}
                style={heroImage ? { top: 132 } : undefined}
              >
                {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </div>

            {/* The select target: covers the tile, carries the accessible
                name and the pressed state. Same hooks as before — BUG-024
                closed the "state carried by border colour alone" gap on the
                event step, and this keeps it closed here: a screen-reader user
                can confirm which package they are about to pay for. */}
            <button
              type="button"
              onClick={() => togglePkg(id)}
              aria-pressed={isSelected}
              aria-label={`${pkg.name || "Package"}${isSelected ? " (selected)" : ""}`}
              className="absolute inset-0 rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-ivory"
            />
          </li>
        )
      })}
    </ul>
  )
}
