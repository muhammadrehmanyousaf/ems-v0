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
  const total = pkgPrice * qty + menuPrice

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
