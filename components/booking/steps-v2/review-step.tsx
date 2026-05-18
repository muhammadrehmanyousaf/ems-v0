"use client"

import * as React from "react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import {
  Calendar,
  Clock,
  MapPin,
  Package as PackageIcon,
  Users,
  Mail,
  Phone,
  User,
  Sparkles,
  Loader2,
} from "lucide-react"
import {
  WeddingUmbrellasAPI,
  type BundlePreview,
  type WeddingUmbrella,
} from "@/lib/api/weddingUmbrellas"
import {
  BundledServicesAPI,
  BUNDLED_CATEGORY_LABELS,
  type BundledService,
} from "@/lib/api/bundledServices"

interface Props {
  formData: BookingFormData
  selectedPackageObj?: any
  selectedMenuObj?: any
  vendorDetails?: Vendor[]
  venue: EventVenue | null
  // BK-100.2 Layer 2d — optional. When provided, the umbrella picker
  // renders an interactive select; otherwise it's hidden entirely.
  updateFormData?: (data: Partial<BookingFormData>) => void
  isAuthenticated?: boolean
}

const PERIOD_LABEL: Record<string, string> = {
  "09:00": "Morning · 9 AM – 12 PM",
  "14:00": "Afternoon · 2 PM – 6 PM",
  "18:00": "Evening · 6 PM – 11 PM",
}

const TIER_LABEL: Record<number, string> = {
  2: "2 events · 3% bundle",
  3: "3 events · 5% bundle",
  4: "4 events · 7% bundle",
  5: "5+ events · 10% bundle",
}

function umbrellaLabel(u: WeddingUmbrella): string {
  if (u.title?.trim()) return u.title
  if (u.brideName && u.groomName) return `${u.brideName} & ${u.groomName}`
  if (u.weddingDate) return `Wedding · ${u.weddingDate}`
  return `Umbrella #${u.id}`
}

export default function ReviewStep({
  formData,
  selectedPackageObj,
  selectedMenuObj,
  venue,
  updateFormData,
  isAuthenticated,
}: Props) {
  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  const eventDate = formData.bookingDate ? new Date(formData.bookingDate) : null
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "—"
  const timeLabel = formData.timeSlot ? PERIOD_LABEL[formData.timeSlot] || formData.timeSlot : "—"

  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const showGuests = !isCarRental && !isBridalWear && !isWeddingStationery && (venue?.maxCapacity || venue?.minCapacity)

  const pkgPrice = Number(selectedPackageObj?.price) || 0
  const qty = isCarRental || isBridalWear || isWeddingStationery ? formData.vehicleQuantity || 1 : 1
  const menuPrice = Number(selectedMenuObj?.price) || 0
  const baseTotal = pkgPrice * qty + menuPrice

  // BK-100.52 Layer 2c — fetch the venue's optional bundled add-ons.
  // Filter to active + non-mandatory + non-included rows (those baked
  // into the package price aren't pickable). Anonymous flows also see
  // this — the picker doesn't need auth, only the API call. The
  // venue's businessId is the picker key.
  const venueBusinessId = venue?.vendor?.id || venue?.id
  const [bundledServices, setBundledServices] = React.useState<BundledService[]>([])
  const [loadingBundled, setLoadingBundled] = React.useState(false)
  const showBundledPicker = !!updateFormData && !!venueBusinessId

  React.useEffect(() => {
    if (!showBundledPicker || !venueBusinessId) return
    let cancelled = false
    setLoadingBundled(true)
    BundledServicesAPI.list(Number(venueBusinessId))
      .then((res) => {
        if (cancelled) return
        const optional = (res?.services || []).filter(
          (s) => !s.included && !s.mandatory && s.isActive,
        )
        // Sort by displayOrder then by name, mirroring backend list order.
        optional.sort((a, b) => {
          const oA = Number(a.displayOrder) || 0
          const oB = Number(b.displayOrder) || 0
          if (oA !== oB) return oA - oB
          return String(a.name).localeCompare(String(b.name))
        })
        setBundledServices(optional)
      })
      .catch(() => {
        if (!cancelled) setBundledServices([])
      })
      .finally(() => {
        if (!cancelled) setLoadingBundled(false)
      })
    return () => {
      cancelled = true
    }
  }, [showBundledPicker, venueBusinessId])

  // Customer's current picks for THIS venue's businessId.
  const myPicks: Array<{ serviceId: number }> = venueBusinessId
    ? formData.selectedBundledServices?.[Number(venueBusinessId)] || []
    : []
  const isPicked = (id: number) => myPicks.some((p) => Number(p.serviceId) === id)

  const togglePick = (svc: BundledService) => {
    if (!updateFormData || !venueBusinessId) return
    const bid = Number(venueBusinessId)
    const cur = formData.selectedBundledServices || {}
    const list = (cur[bid] || []).filter((p) => Number(p.serviceId) !== svc.id)
    const isCurrentlyPicked = (cur[bid] || []).some((p) => Number(p.serviceId) === svc.id)
    const nextList = isCurrentlyPicked ? list : [...list, { serviceId: svc.id }]
    const next = { ...cur }
    if (nextList.length === 0) delete next[bid]
    else next[bid] = nextList
    updateFormData({ selectedBundledServices: next })
  }

  // Compute add-on cost client-side for the live preview. Backend
  // recomputes authoritatively in the create transaction; a client/
  // server drift can only make the customer's preview slightly off,
  // never overcharge.
  const guestCount = Math.max(1, Number(formData.guestCount) || 1)
  const computeAddOnCost = (svc: BundledService): number => {
    const amt = Number(svc.priceAmount) || 0
    switch (svc.priceModel) {
      case "free":
        return 0
      case "flat":
        return Math.round(amt)
      case "per_plate":
        return Math.round(amt * guestCount)
      case "percentage_of_total":
        return Math.round((baseTotal * amt) / 100)
      default:
        return 0
    }
  }
  const pickedServices = bundledServices.filter((s) => isPicked(s.id))
  const addOnTotal = pickedServices.reduce(
    (sum, svc) => sum + computeAddOnCost(svc),
    0,
  )

  // `total` is now base + add-ons. Umbrella discount applies on top.
  const total = baseTotal + addOnTotal

  let downPayment = 0
  if (venue) {
    const dpType = (venue.downPaymentType || "").toLowerCase()
    const dpValue = Number(venue.downPayment) || 0
    downPayment = dpType === "percentage" || dpType === "percent" ? Math.round(total * (dpValue / 100)) : dpValue
  }

  // BK-100.2 Layer 2d — umbrella picker state. Only fetched when the
  // customer is authenticated (anonymous bookings can't own umbrellas).
  // Eligible umbrellas = the customer's planning/active umbrellas;
  // completed/cancelled are filtered out (backend rejects them anyway).
  const [umbrellas, setUmbrellas] = React.useState<WeddingUmbrella[]>([])
  const [loadingUmbrellas, setLoadingUmbrellas] = React.useState(false)
  const [bundlePreview, setBundlePreview] = React.useState<BundlePreview | null>(null)
  const [previewLoading, setPreviewLoading] = React.useState(false)
  const showPicker = !!updateFormData && !!isAuthenticated

  React.useEffect(() => {
    if (!showPicker) return
    let cancelled = false
    setLoadingUmbrellas(true)
    WeddingUmbrellasAPI.listMine()
      .then((rows) => {
        if (cancelled) return
        const eligible = (rows || []).filter(
          (u) => u.status === "planning" || u.status === "active",
        )
        setUmbrellas(eligible)
      })
      .catch(() => {
        if (!cancelled) setUmbrellas([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUmbrellas(false)
      })
    return () => {
      cancelled = true
    }
  }, [showPicker])

  // Refresh the bundle preview whenever the selection changes. This
  // is "soft" — the authoritative discount is computed by the backend
  // at create-time. We surface a friendly estimate here so the
  // customer can decide whether attaching is worth it.
  React.useEffect(() => {
    if (!formData.umbrellaId) {
      setBundlePreview(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    WeddingUmbrellasAPI.previewBundle(Number(formData.umbrellaId))
      .then((res) => {
        if (cancelled) return
        setBundlePreview(res?.bundle ?? null)
      })
      .catch(() => {
        if (!cancelled) setBundlePreview(null)
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [formData.umbrellaId])

  // Estimated discount: the existing preview shows the tier the
  // umbrella ALREADY qualifies for; we additionally compute the
  // tier-AFTER-attach by adding this booking's projected total to the
  // count.
  const estimatedNewCount = bundlePreview ? bundlePreview.eligibleCount + 1 : 0
  const projectedPercent = (() => {
    if (estimatedNewCount >= 5) return 10
    if (estimatedNewCount === 4) return 7
    if (estimatedNewCount === 3) return 5
    if (estimatedNewCount === 2) return 3
    return 0
  })()
  const projectedSavings = projectedPercent > 0 ? Math.round((total * projectedPercent) / 100) : 0
  const discountedTotal = total - projectedSavings
  const discountedDown = projectedPercent > 0 ? Math.round(downPayment * (1 - projectedPercent / 100)) : downPayment

  const contactRows: { icon: any; label: string; value: string }[] = [
    { icon: User,  label: "Full name", value: formData.username || "—" },
    { icon: Mail,  label: "Email",     value: formData.email || "—" },
    { icon: Phone, label: "Phone",     value: formData.phoneNumber || "—" },
  ]

  const bookingRows: { icon: any; label: string; value: string }[] = [
    { icon: MapPin,   label: "Vendor",      value: venue?.name || "—" },
    { icon: Calendar, label: "Event date",  value: dateLabel },
    { icon: Clock,    label: "Time of day", value: timeLabel },
  ]
  if (showGuests) bookingRows.push({ icon: Users, label: "Guests", value: formData.guestCount ? `${formData.guestCount} guests` : "—" })
  if (selectedPackageObj) bookingRows.push({ icon: PackageIcon, label: isCarRental ? "Vehicle" : isBridalWear ? "Outfit" : "Package", value: qty > 1 ? `${selectedPackageObj.name} × ${qty}` : selectedPackageObj.name })
  if (selectedMenuObj) bookingRows.push({ icon: PackageIcon, label: "Menu", value: selectedMenuObj.title || selectedMenuObj.name })

  const SectionRow = ({ row }: { row: { icon: any; label: string; value: string } }) => {
    const Icon = row.icon
    return (
      <div className="px-4 py-3 grid grid-cols-[20px_1fr_1.6fr] gap-3 items-center border-b border-bridal-beige/70 last:border-b-0">
        <Icon className="w-4 h-4 text-bridal-gold-dark" />
        <span className="font-bridal text-[10.5px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">{row.label}</span>
        <span className="font-display italic text-[14px] text-bridal-charcoal break-all">{row.value}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      {/* Heading — homepage typography */}
      <div className="text-center">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Final Step · Confirm
        </p>
        <h2 className="font-display italic text-[26px] sm:text-[30px] text-bridal-charcoal leading-tight">
          Review your booking
        </h2>
        <p className="mt-1.5 font-bridal text-[12.5px] text-bridal-text-soft max-w-xl mx-auto">
          Double-check the details. The down payment is charged on confirm — the rest is due at the venue.
        </p>
      </div>

      {/* Two-column section grid — Contact + Booking side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact */}
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-beige bg-bridal-cream/60">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">Contact</p>
          </div>
          <div>
            {contactRows.map((row, i) => <SectionRow key={i} row={row} />)}
          </div>
        </section>

        {/* Booking */}
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-beige bg-bridal-cream/60">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">Booking</p>
          </div>
          <div>
            {bookingRows.map((row, i) => <SectionRow key={i} row={row} />)}
          </div>
        </section>
      </div>

      {/* BK-100.52 Layer 2c — bundled add-on picker. Surfaces this
           vendor's optional in-house services (catering upgrades,
           valet, generator backup, etc.) so the customer can stack
           extras into the booking with one tap each. Hidden entirely
           when the vendor has zero optional bundled services — most
           non-venue vendors fall into this category and see no extra
           UI. */}
      {showBundledPicker && (loadingBundled || bundledServices.length > 0) && (
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-beige bg-bridal-cream/60 flex items-center justify-between gap-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Optional add-ons
            </p>
            {pickedServices.length > 0 && (
              <span className="font-bridal text-[11px] text-bridal-charcoal tabular-nums">
                +{formatPKR(addOnTotal)} · {pickedServices.length} selected
              </span>
            )}
          </div>
          <div className="px-4 py-3 space-y-2">
            {loadingBundled ? (
              <div className="flex items-center gap-2 text-xs text-bridal-text-soft">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading available add-ons…
              </div>
            ) : (
              bundledServices.map((svc) => {
                const picked = isPicked(svc.id)
                const cost = computeAddOnCost(svc)
                const priceLabel =
                  svc.priceModel === "free"
                    ? "Included free"
                    : svc.priceModel === "per_plate"
                      ? `${formatPKR(Number(svc.priceAmount) || 0)} per guest`
                      : svc.priceModel === "percentage_of_total"
                        ? `${Number(svc.priceAmount) || 0}% of booking total`
                        : formatPKR(Number(svc.priceAmount) || 0)
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => togglePick(svc)}
                    className={`w-full text-left rounded-md border px-3 py-2.5 transition-colors ${
                      picked
                        ? "border-bridal-gold-dark bg-bridal-gold/10"
                        : "border-bridal-beige bg-white hover:border-bridal-gold/50 hover:bg-bridal-cream/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display italic text-[14px] text-bridal-charcoal">
                            {svc.name}
                          </span>
                          <span className="font-bridal text-[9.5px] uppercase tracking-[0.18em] text-bridal-text-label">
                            {BUNDLED_CATEGORY_LABELS[svc.category] || svc.category}
                          </span>
                        </div>
                        {svc.description && (
                          <p className="text-[12px] text-bridal-text-soft mt-1 leading-relaxed line-clamp-2">
                            {svc.description}
                          </p>
                        )}
                        <p className="text-[11px] text-bridal-text-soft mt-1.5 tabular-nums">
                          {priceLabel}
                          {svc.priceModel !== "flat" && svc.priceModel !== "free" && cost > 0 && (
                            <span className="text-bridal-charcoal">
                              {" "}
                              · {formatPKR(cost)} for this booking
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        aria-hidden
                        className={`shrink-0 mt-1 inline-flex items-center justify-center w-5 h-5 rounded-full border-2 ${
                          picked
                            ? "border-bridal-gold-dark bg-bridal-gold-dark text-white"
                            : "border-bridal-beige bg-white"
                        }`}
                      >
                        {picked && <span className="text-[10px] leading-none">✓</span>}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
            <p className="text-[10.5px] text-bridal-text-soft italic mt-2 leading-relaxed">
              Your vendor confirms availability for each add-on; final total is set when the vendor accepts. Required / always-included services aren&apos;t shown here.
            </p>
          </div>
        </section>
      )}

      {/* BK-100.2 Layer 2d — umbrella picker. Renders only when the
           customer is authenticated AND has at least one active
           umbrella. Anonymous bookings + customers without umbrellas
           see no extra UI — preserves the legacy review-step layout
           for the vast majority of flows. */}
      {showPicker && (loadingUmbrellas || umbrellas.length > 0) && (
        <section className="rounded-md border border-bridal-gold/30 bg-bridal-cream/40 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-gold/25 bg-bridal-cream/70 flex items-center justify-between gap-2">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Wedding-week umbrella (optional)
            </p>
            <span className="text-[10px] text-bridal-text-soft">
              Group multiple events → multi-event bundle discount
            </span>
          </div>
          <div className="px-4 py-3 space-y-3">
            {loadingUmbrellas ? (
              <div className="flex items-center gap-2 text-xs text-bridal-text-soft">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading your umbrellas…
              </div>
            ) : (
              <>
                <label
                  htmlFor="umbrella-picker"
                  className="block font-bridal text-[10.5px] uppercase tracking-[0.18em] font-medium text-bridal-text-label"
                >
                  Link this booking to one of your weddings
                </label>
                <select
                  id="umbrella-picker"
                  value={formData.umbrellaId ?? ""}
                  onChange={(e) =>
                    updateFormData?.({
                      umbrellaId: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-md border border-bridal-beige bg-white px-3 py-2 text-[14px] text-bridal-charcoal focus:border-bridal-gold-dark focus:outline-none focus:ring-2 focus:ring-bridal-gold/30"
                >
                  <option value="">— Don&apos;t link (standalone booking) —</option>
                  {umbrellas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {umbrellaLabel(u)}
                      {u.weddingDate ? ` · ${u.weddingDate}` : ""}
                    </option>
                  ))}
                </select>

                {/* Discount preview — soft estimate. Authoritative
                     pricing is recomputed by the backend on submit. */}
                {formData.umbrellaId && bundlePreview && (
                  <div className="mt-2 rounded-md border border-bridal-gold/45 bg-white p-3">
                    {previewLoading ? (
                      <div className="flex items-center gap-2 text-xs text-bridal-text-soft">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Calculating your bundle…
                      </div>
                    ) : projectedPercent > 0 ? (
                      <>
                        <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark mb-1.5">
                          Estimated bundle discount
                        </p>
                        <p className="font-display italic text-[20px] text-bridal-gold-dark leading-none tabular-nums">
                          {formatPKR(projectedSavings)} off
                        </p>
                        <p className="text-[11px] text-bridal-text-soft mt-1.5 leading-relaxed">
                          At <strong>{projectedPercent}%</strong> off — you&apos;ll have{" "}
                          {estimatedNewCount} active event{estimatedNewCount === 1 ? "" : "s"} in this
                          umbrella once this booking confirms.{" "}
                          {TIER_LABEL[Math.min(estimatedNewCount, 5)] && (
                            <span className="italic">
                              ({TIER_LABEL[Math.min(estimatedNewCount, 5)]})
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11.5px] text-bridal-text-soft leading-relaxed">
                        This booking will be linked to your umbrella but won&apos;t qualify for a
                        bundle discount yet — bundles kick in at 2+ active events.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Total — bridal-charcoal hero block with gold accents */}
      <section className="relative rounded-md overflow-hidden bg-bridal-charcoal text-bridal-ivory border border-bridal-charcoal">
        {/* Gold accent strips top + bottom — matches homepage hero treatment */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />

        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-1">Total</p>
            {projectedSavings > 0 ? (
              <>
                <p className="font-display italic text-[18px] sm:text-[20px] text-bridal-ivory/55 leading-none tabular-nums line-through decoration-1">
                  {formatPKR(total)}
                </p>
                <p className="font-display italic text-[28px] sm:text-[32px] text-bridal-ivory leading-none tabular-nums mt-0.5">
                  {formatPKR(discountedTotal)}
                </p>
                <p className="font-bridal text-[10.5px] text-bridal-gold mt-1.5">
                  {formatPKR(projectedSavings)} off · bundle estimate
                </p>
              </>
            ) : (
              <p className="font-display italic text-[28px] sm:text-[32px] text-bridal-ivory leading-none tabular-nums">
                {formatPKR(total)}
              </p>
            )}
          </div>

          {downPayment > 0 ? (
            <>
              <div className="sm:border-l sm:border-bridal-ivory/15 sm:pl-4">
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-1">Due now</p>
                <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-gold leading-none tabular-nums">
                  {formatPKR(discountedDown)}
                </p>
              </div>
              <div className="sm:border-l sm:border-bridal-ivory/15 sm:pl-4">
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-ivory/65 mb-1">Remaining at venue</p>
                <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-ivory/85 leading-none tabular-nums">
                  {formatPKR(discountedTotal - discountedDown)}
                </p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <p className="font-bridal text-[12.5px] text-bridal-ivory/70">Full amount payable at confirmation.</p>
            </div>
          )}
        </div>
      </section>

      <p className="text-center font-bridal text-[11.5px] text-bridal-text-soft">
        By confirming, you agree to the vendor&apos;s terms. Payments are Stripe-secured.
      </p>
    </div>
  )
}
