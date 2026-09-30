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
  Loader2,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
// Marquee Stage — the shell owns headings, money, Back/Continue and scrolling.
// `onJump` is the fallback for the row "Edit" links when the form does not
// pass `onEdit`.
import { useBookingShell } from "@/components/booking/shell/booking-shell-context"
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
// SLOTS step 10 — the single slot vocabulary.
import { slotText } from "@/lib/booking/slot-vocabulary"
// WW-RATECARD 10.7 — a vendor whose rate card IS a unit (cars, chairs, cards).
import { readUnitConfig, sellsByTheUnit, unitLineFor, describeUnitQty } from "@/lib/pricing/per-unit"
// WW-PRICING-OVERHAUL — single source for per-head menu math (must match server).
import {
  menuChargeFor,
  menuIsPerHead,
  menuBillableHeads,
  menuIsAtMinGuarantee,
} from "@/lib/pricing/menu"
// A17 — the deposit sentences, mirrored from the server and parity-guarded.
import { describeDepositTerms } from "@/lib/booking/deposit-terms"
// WW-PKG-UNIT — per-head packages + the includesFood rule. `composeLineTotal`
// is the ONE place package and menu are added together, so this surface cannot
// reintroduce the double-charge by adding them itself.
import {
  composeLineTotal,
  packageIsPerHead,
  packageBillableHeads,
  packageIsAtMinGuarantee,
  packagePriceBasisLabel,
  serviceStyleLabel,
} from "@/lib/pricing/package"

import { REQUIREMENT_TAG_LABELS, type RequirementTag, type RequirementSetup } from "@/lib/api/requirements"

/** Mirrors SETUP_LABELS on the vendor's card, so both name the same thing. */
const SETUP_REVIEW_LABELS: Record<string, string> = {
  roundTables: "round tables",
  vipSofas: "VIP sofa sets",
  foodStalls: "food stalls",
  chairs: "chairs",
  rectTables: "long tables",
  stageSize: "ft stage",
  heaters: "patio heaters",
  acUnits: "extra cooling units",
  generators: "backup generators",
  parkingSlots: "reserved parking slots",
}

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
  /**
   * WW-SETUP-COUNTS — what the customer asked for on the previous step.
   *
   * Review is the last screen before the request is sent, and it listed the
   * date, the package and the menu but nothing the customer had written or
   * counted. So the one step where they typed in their own words vanished
   * before the confirmation, and they had no way to check it registered.
   */
  requirements?: {
    tags: RequirementTag[]
    setup?: RequirementSetup
    freeText: string
  }
  /**
   * Marquee Stage — the money left this screen. The Stage's money block and
   * the Continue label carry it now, so the figures this component already
   * computes (base + add-ons, the umbrella estimate, the deposit — A17, still
   * outside the total) are reported upward instead of drawn here.
   */
  onTotalsChange?: (t: ReviewTotals) => void
  /** Row "Edit ›" links: the step key that owns the row (`datetime`, `packages`, `menu`, `unit`, `event`). */
  onEdit?: (stepKey: string) => void
  /** Request mode (venue accepts first) vs instant — picks the legal sentence. */
  requiresApproval?: boolean
  /** Signed-out customers: the "Sign in so the venue can reach you" line becomes a button. */
  onSignIn?: () => void
}

export type ReviewTotals = {
  total: number
  discountedTotal: number
  discountedDown: number
  projectedSavings: number
  depositAmount: number
  depositTerms: string[]
  addOnTotal: number
}

/** Mirrors the titles in `service-location-picker.tsx` (MODES), so the Location row names the same thing. */
const LOCATION_MODE_LABELS: Record<string, string> = {
  at_vendor: "At the venue",
  at_customer_home: "At our home",
  at_customer_plot: "At our plot / farmhouse",
  at_third_party: "At another venue",
}

type ReviewRow = { icon: any; label: string; value: string; stepKey?: string }

// SLOTS step 10 — one vocabulary, shared with the picker the customer just
// used. This was a local three-entry map that could not name a vendor's own
// slot, so a booking made against "Dinner event" reviewed as a bare "19:00".

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
  requirements,
  onTotalsChange,
  onEdit,
  requiresApproval,
  onSignIn,
}: Props) {
  const shell = useBookingShell()
  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  const eventDate = formData.bookingDate ? new Date(formData.bookingDate) : null
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "—"
  const timeLabel = slotText({
    bookingTime: formData.timeSlot,
    slotLabel: formData.slotLabel,
    slotStartTime: formData.slotStartTime,
    slotEndTime: formData.slotEndTime,
  }) || "—"

  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  // Issue #62 — same allowlist as date-time-step. Only vendor types
  // that price per-guest see the headcount row on the review summary;
  // a photographer's review screen shouldn't surface "guests" at all.
  const GUEST_COUNT_VENDOR_TYPES = new Set<string>([
    "Wedding venue", "Catering", "Mithai and sweets",
    "Wedding cakes", "Live cooking stall",
  ])
  const showGuests = GUEST_COUNT_VENDOR_TYPES.has(venue?.vendor?.vendorType || "") && (venue?.maxCapacity || venue?.minCapacity)

  // WW-PKG-UNIT — kept for the "Rs X per head/event" caption below; the money
  // itself now comes from `composeLineTotal`, never from this raw figure.
  const pkgPrice = Number(selectedPackageObj?.price) || 0
  const qty = isCarRental || isBridalWear || isWeddingStationery ? formData.vehicleQuantity || 1 : 1
  // WW-PRICING-OVERHAUL — a per-head menu bills price × max(guests, min-pax);
  // a flat/per_event menu is its price, unchanged. menuChargeFor is the shared
  // helper the server mirrors, so this preview always equals the charge.
  // WW-PKG-UNIT — the line total, composed by the shared rule.
  //
  // Was: `pkgPrice * qty + menuPrice`. Two defects lived in that one expression.
  //
  //   1. `qty` is 1 for every venue, so a package was ALWAYS a flat per-event
  //      amount. A venue selling "Gold Rs 2,500 per head" had no way to say so:
  //      typing 2500 billed a 500-guest wedding Rs 2,500, and pre-multiplying to
  //      12,50,000 froze the figure when the guest count changed.
  //
  //   2. The package and the menu were unconditionally ADDED. A venue whose
  //      package price already covers catering — which is most Pakistani
  //      marquees — had no way to say so either, so a customer picking "Gold
  //      Rs 2,500/head (food included)" and then the "Gold Menu Rs 2,500/head"
  //      was billed Rs 5,000/head with nothing warning either party.
  //
  // `composeLineTotal` applies both rules once, in the same order the server's
  // `computeVendorPrice` does, so this preview always equals the charge.
  const menuPriceRaw = menuChargeFor(selectedMenuObj, formData.guestCount)
  const {
    packageCharge,
    menuCharge: menuPrice,
    menuIncluded,
    baseTotal: composedBase,
  } = composeLineTotal({
    pkg: selectedPackageObj,
    guestCount: formData.guestCount,
    qty,
    menuCharge: menuPriceRaw,
  })

  /**
   * WW-RATECARD 10.7 — a vendor whose rate card IS a unit.
   *
   * They have no package and no menu, so `composeLineTotal` returns 0 and this
   * screen would have shown a booking that costs nothing. The unit line is
   * their whole rate card, priced by the same mirror the payload uses, so the
   * number the customer approves here is the number the server independently
   * recomputes.
   */
  const unitConfig = readUnitConfig(venue as any)
  const unitLine = unitConfig && sellsByTheUnit(venue as any)
    ? unitLineFor(unitConfig, formData.vehicleQuantity || unitConfig.minUnitQty || 1)
    : null
  const baseTotal = unitLine ? unitLine.total : composedBase

  // BK-100.52 Layer 2c — fetch the venue's optional bundled add-ons.
  // Filter to active + non-mandatory + non-included rows (those baked
  // into the package price aren't pickable). Anonymous flows also see
  // this — the picker doesn't need auth, only the API call. The
  // venue's businessId is the picker key.
  // WW-BUNDLED-WRONGID — `venue` is the Business row from GET /businesses/:id,
  // so `venue.vendor` is the OWNING USER, not a business: `venue.vendor.id` is a
  // User id. Asking for /businesses/<userId>/bundled-services 404s, and because
  // that wrong value is truthy the `|| venue.id` fallback never ran — the add-on
  // picker silently stayed empty for every vendor whose businessId != ownerId
  // (i.e. effectively all of them). The businessId is `venue.id`, as the comment
  // above always said.
  const venueBusinessId = venue?.id
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

  /**
   * A17 — the deposit is read from the VENUE's policy, never added to `total`.
   *
   * At Review the booking does not exist yet, so there is no server response to
   * take the sentences from; they come from the venue's own
   * securityDepositPkr / depositReturnDays, through a mirror of the server
   * helper that `scripts/deposit-terms-parity.mts` keeps honest.
   */
  const depositAmount = Number((venue as any)?.securityDepositPkr) || 0
  const depositTerms = describeDepositTerms(venue as any)

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

  /**
   * Marquee Stage — report the totals to the shell whenever they change.
   * The callback lives in a ref so an inline arrow from the form cannot make
   * this effect fire on every render (and loop through the shell's setState).
   */
  const depositTermsKey = depositTerms.join("␟")
  const onTotalsChangeRef = React.useRef(onTotalsChange)
  React.useEffect(() => {
    onTotalsChangeRef.current = onTotalsChange
  })
  React.useEffect(() => {
    onTotalsChangeRef.current?.({
      total,
      discountedTotal,
      discountedDown,
      projectedSavings,
      depositAmount,
      depositTerms: depositTermsKey ? depositTermsKey.split("␟") : [],
      addOnTotal,
    })
  }, [total, discountedTotal, discountedDown, projectedSavings, depositAmount, depositTermsKey, addOnTotal])

  const contactRows: ReviewRow[] = [
    { icon: User,  label: "Full name", value: formData.username || "—" },
    { icon: Mail,  label: "Email",     value: formData.email || "—" },
    { icon: Phone, label: "Phone",     value: formData.phoneNumber || "—" },
  ]
  // §10.6 — signed out: every cell reads "—" and one line says why.
  const contactEmpty = !(formData.username || formData.email || formData.phoneNumber)
  const showSignInLine = contactEmpty && !isAuthenticated

  const bookingRows: ReviewRow[] = [
    { icon: MapPin,   label: "Vendor",      value: venue?.name || "—" },
    { icon: Calendar, label: "Event date",  value: dateLabel, stepKey: "datetime" },
    { icon: Clock,    label: "Time of day", value: timeLabel, stepKey: "datetime" },
  ]
  /**
   * WW-SPACE-FIRST — the hall, named.
   *
   * The customer picks a specific hall on step 2, and that choice drives the
   * slots they were offered, the guest ceiling they were clamped to, the
   * packages they were shown and the menus they could order. It then did not
   * appear on Review at all — so the one screen for checking the booking is
   * right omitted the room it is in. Shown for both models: the sub-venue tree
   * and the BusinessResource picker.
   */
  const spaceName =
    (formData as any).selectedSubVenueName || (formData as any).selectedResourceName || null
  if (spaceName) bookingRows.push({ icon: MapPin, label: "Hall / space", value: String(spaceName), stepKey: "datetime" })
  if (showGuests) bookingRows.push({ icon: Users, label: "Guests", value: formData.guestCount ? `${formData.guestCount} ${formData.guestCount === 1 ? "guest" : "guests"}` : "—", stepKey: "datetime" })
  // BK-100.53 — where the service happens, when the customer chose a mode on
  // the date step. Read-only echo; the picker itself stays on that step.
  if (formData.serviceLocationMode) {
    const modeLabel = LOCATION_MODE_LABELS[formData.serviceLocationMode] || formData.serviceLocationMode
    const address = (formData.serviceLocationAddress || "").trim()
    bookingRows.push({
      icon: MapPin,
      label: "Location",
      value: address ? `${modeLabel} · ${address}` : modeLabel,
      stepKey: "datetime",
    })
  }
  if (unitLine) {
    // WW-RATECARD 10.7 — the arithmetic, not just the answer, for the same
    // reason a per-head package shows "Rs 2,500/head × 500". The minimum is
    // named when it lifted the quantity, so a number the customer did not ask
    // for never appears without its reason.
    let unitValue = `${describeUnitQty(unitLine.unitLabel, unitLine.billedQty)} — Rs ${unitLine.unitPrice.toLocaleString()} each`
    if (unitLine.liftedByMinimum) unitValue += ` (min ${unitLine.minUnitQty})`
    bookingRows.push({ icon: PackageIcon, label: "Booking", value: unitValue, stepKey: "unit" })
  }
  if (selectedPackageObj) {
    // WW-PKG-UNIT — a per-head package must show its basis, exactly as a
    // per-head menu already does. "Gold" alone next to Rs 12,50,000 gives the
    // customer nothing to check; "Rs 2,500/head × 500 guests" is arithmetic they
    // can verify, and it is the same arithmetic the server ran.
    const pkgLabel = isCarRental ? "Vehicle" : isBridalWear ? "Outfit" : "Package"
    let pkgValue = qty > 1 ? `${selectedPackageObj.name} × ${qty}` : selectedPackageObj.name
    if (packageIsPerHead(selectedPackageObj)) {
      const heads = packageBillableHeads(selectedPackageObj, formData.guestCount)
      pkgValue = `${selectedPackageObj.name} — Rs ${pkgPrice.toLocaleString()}/head × ${heads} ${heads === 1 ? "guest" : "guests"}`
      if (packageIsAtMinGuarantee(selectedPackageObj, formData.guestCount)) {
        pkgValue += ` (min ${selectedPackageObj.minGuaranteeCount})`
      }
    }
    const style = serviceStyleLabel(selectedPackageObj.serviceStyle)
    if (style) pkgValue += ` · ${style}`
    bookingRows.push({ icon: PackageIcon, label: pkgLabel, value: pkgValue, stepKey: "packages" })
  }
  if (selectedMenuObj && menuIncluded) {
    // WW-PKG-UNIT — the menu was chosen and costs nothing, because the package
    // covers catering. Saying so beats omitting the row: the customer needs to
    // see that their dish choice registered, and the kitchen needs it on the
    // booking either way.
    bookingRows.push({
      icon: PackageIcon,
      label: "Menu",
      value: `${selectedMenuObj.title || selectedMenuObj.name} — included in ${selectedPackageObj?.name || "your package"}`,
      stepKey: "menu",
    })
  } else if (selectedMenuObj) {
    // WW-PRICING-OVERHAUL — show the per-head breakdown so the customer sees why
    // the menu costs what it does (price × N guests), and a min-guarantee note
    // when their guest count is lifted to the vendor's minimum.
    const menuTitle = selectedMenuObj.title || selectedMenuObj.name
    let menuValue = menuTitle
    if (menuIsPerHead(selectedMenuObj)) {
      const heads = menuBillableHeads(selectedMenuObj, formData.guestCount)
      const perHead = Number(selectedMenuObj.price) || 0
      menuValue = `${menuTitle} — Rs ${perHead.toLocaleString()}/plate × ${heads} ${heads === 1 ? "guest" : "guests"}`
      if (menuIsAtMinGuarantee(selectedMenuObj, formData.guestCount)) {
        menuValue += ` (min ${selectedMenuObj.minGuaranteeCount})`
      }
    }
    bookingRows.push({ icon: PackageIcon, label: "Menu", value: menuValue, stepKey: "menu" })
  }

  // Marquee Stage — disclosure state. "What you've asked for" folds to a 56px
  // row; the add-on list shows two rows and folds the rest behind "Show N more".
  const [asksOpen, setAsksOpen] = React.useState(false)
  const [showAllAddOns, setShowAllAddOns] = React.useState(false)

  const hasRequirements =
    !!requirements &&
    (requirements.tags.length > 0 ||
      !!requirements.freeText.trim() ||
      Object.keys(requirements.setup || {}).length > 0)
  const setupEntries = (Object.entries(requirements?.setup || {}) as [string, unknown][]).filter(
    ([k, v]) => k !== "notes" && typeof v === "number" && v > 0,
  )
  const setupNotes =
    typeof requirements?.setup?.notes === "string" && requirements.setup.notes ? requirements.setup.notes : ""
  const asksSummary = (() => {
    const parts: string[] = []
    const t = requirements?.tags.length || 0
    if (t) parts.push(`${t} ${t === 1 ? "request" : "requests"}`)
    if (setupEntries.length) parts.push(`${setupEntries.length} setup ${setupEntries.length === 1 ? "count" : "counts"}`)
    if (requirements?.freeText.trim() || setupNotes) parts.push("a note in your own words")
    return parts.join(" · ")
  })()

  const editRow = (stepKey: string) => {
    if (onEdit) onEdit(stepKey)
    else shell.onJump(stepKey)
  }

  const visibleAddOns = showAllAddOns ? bundledServices : bundledServices.slice(0, 2)
  const hiddenAddOnCount = bundledServices.length - visibleAddOns.length

  const FOCUS =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
  const LABEL = "font-bridal text-[11px] leading-[14px] uppercase tracking-[0.18em] text-bridal-text-label"
  const stagger = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 30}ms` })
  let sectionIndex = 0

  return (
    <div className="w-full space-y-3">
      {/* Contact strip — 3 × 48 rows at the base width, one 64px strip of
          three cells from xl. Email may wrap (break-all); the strip grows. */}
      <section aria-label="Contact" className="animate-stagger-fade-up" style={stagger(sectionIndex++)}>
        <dl className="grid grid-cols-1 rounded-[4px] border border-bridal-beige bg-white xl:grid-cols-3">
          {contactRows.map((row) => (
            <div
              key={row.label}
              className="flex min-h-[48px] flex-col justify-center gap-0.5 border-b border-bridal-beige px-4 py-1.5 last:border-b-0 xl:min-h-[64px] xl:border-b-0 xl:border-r xl:last:border-r-0"
            >
              <dt className="font-bridal text-[10.5px] uppercase leading-[14px] tracking-[0.18em] text-bridal-text-label">
                {row.label}
              </dt>
              <dd
                className={`font-bridal text-[14px] leading-[20px] text-bridal-charcoal ${row.label === "Email" ? "break-all" : "truncate"}`}
                title={row.value}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        {showSignInLine && (
          <p className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
            {onSignIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className={`inline-flex min-h-[44px] items-center text-bridal-gold-dark underline-offset-4 hover:underline ${FOCUS}`}
              >
                Sign in so the venue can reach you
              </button>
            ) : (
              "Sign in so the venue can reach you"
            )}
          </p>
        )}
      </section>

      {/* Booking <dl> — header 36 + rows 44, two columns from xl. Each row
          owned by an earlier step carries "Edit ›". */}
      <section
        aria-label="Booking"
        className="animate-stagger-fade-up overflow-hidden rounded-[4px] border border-bridal-beige bg-white"
        style={stagger(sectionIndex++)}
      >
        <div className="flex h-9 items-center justify-between border-b border-bridal-beige px-4">
          <p className={LABEL}>Booking</p>
          <span className="font-bridal text-[12px] leading-[16px] tabular-nums text-bridal-text-soft">
            {bookingRows.length} details
          </span>
        </div>
        <dl className="-mb-px grid grid-cols-1 xl:grid-cols-2 xl:gap-x-6">
          {bookingRows.map((row, i) => (
            <div
              key={row.label}
              className="grid min-h-[44px] grid-cols-[1fr_auto] items-center gap-2 border-b border-bridal-beige px-4 py-[5px] animate-stagger-fade-up"
              style={stagger(i)}
            >
              <div className="min-w-0">
                <dt className={LABEL}>{row.label}</dt>
                <dd className="break-words font-bridal text-[14px] leading-[20px] text-bridal-charcoal">{row.value}</dd>
              </div>
              {row.stepKey && (
                <button
                  type="button"
                  onClick={() => editRow(row.stepKey!)}
                  aria-label={`Edit ${row.label.toLowerCase()}`}
                  className={`-mr-2 inline-flex h-11 shrink-0 items-center gap-0.5 rounded-full px-2 font-bridal text-[12px] leading-[16px] text-bridal-gold-dark transition-colors duration-150 hover:bg-bridal-blush/45 ${FOCUS}`}
                >
                  Edit
                  <ChevronRight className="h-3 w-3" aria-hidden />
                </button>
              )}
            </div>
          ))}
        </dl>
      </section>

      {/* WW-SETUP-COUNTS — what the customer asked for, echoed back before they
          send it. This step is the last chance to catch "I meant 40 tables, not
          4", and the requirements they had just typed were nowhere on it. */}
      {hasRequirements && requirements && (
        <Collapsible
          open={asksOpen}
          onOpenChange={setAsksOpen}
          className="animate-stagger-fade-up rounded-[4px] border border-bridal-beige bg-white"
          style={stagger(sectionIndex++)}
        >
          <CollapsibleTrigger
            className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[4px] px-4 text-left transition-colors duration-150 hover:bg-bridal-blush/45 ${FOCUS}`}
          >
            <span className="min-w-0">
              <span className={`block ${LABEL}`}>What you&apos;ve asked for</span>
              <span className="block truncate font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                {asksSummary}
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-bridal-gold-dark transition-transform duration-200 ${asksOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2.5 border-t border-bridal-beige px-4 py-3">
            {requirements.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requirements.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-bridal-beige bg-bridal-cream px-2.5 py-1 font-bridal text-[12px] leading-[16px] text-bridal-charcoal"
                  >
                    {REQUIREMENT_TAG_LABELS[t as RequirementTag] ?? t}
                  </span>
                ))}
              </div>
            )}
            {setupEntries.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {setupEntries.map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-full border border-bridal-sage/45 bg-bridal-sage/15 px-2.5 py-1 font-bridal text-[12px] leading-[16px] tabular-nums text-[#3F6B43]"
                  >
                    {String(v)} {SETUP_REVIEW_LABELS[k] ?? k}
                  </span>
                ))}
              </div>
            )}
            {setupNotes && (
              <p dir="auto" className="font-multilingual font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                {setupNotes}
              </p>
            )}
            {/* Their own words, exactly as typed — never trimmed to a preview
                on the screen whose job is to let them check it. */}
            {requirements.freeText.trim() && (
              <p
                dir="auto"
                className="font-multilingual whitespace-pre-wrap font-bridal text-[14px] leading-[20px] text-bridal-charcoal"
              >
                {requirements.freeText}
              </p>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Issue #5 — pickup / drop-off addresses for car rental bookings.
          Two optional free-text fields; the dynamic rent surcharge by
          distance is tracked separately (issue #35). */}
      {isCarRental && updateFormData && (
        <section
          aria-label="Pickup and drop-off"
          className="animate-stagger-fade-up rounded-[4px] border border-bridal-beige bg-white"
          style={stagger(sectionIndex++)}
        >
          <div className="flex h-9 items-center justify-between border-b border-bridal-beige px-4">
            <p className={LABEL}>Pickup &amp; drop-off</p>
            <span className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">Both optional</span>
          </div>
          <div className="space-y-3 px-4 py-3">
            <div>
              <label htmlFor="review-pickup-address" className={`mb-1 block ${LABEL}`}>
                Pickup address
              </label>
              <input
                id="review-pickup-address"
                type="text"
                value={formData.pickupAddress || ""}
                onChange={(e) => updateFormData({ pickupAddress: e.target.value })}
                placeholder="e.g. House 12, Street 4, DHA Phase 5, Lahore"
                className={`h-12 w-full rounded-[4px] border border-bridal-beige bg-white px-3 font-bridal text-[14px] text-bridal-charcoal placeholder:text-bridal-text-soft/70 focus:border-bridal-gold-dark ${FOCUS}`}
                maxLength={500}
              />
            </div>
            <div>
              <label htmlFor="review-dropoff-address" className={`mb-1 block ${LABEL}`}>
                Drop-off address
              </label>
              <input
                id="review-dropoff-address"
                type="text"
                value={formData.dropoffAddress || ""}
                onChange={(e) => updateFormData({ dropoffAddress: e.target.value })}
                placeholder="e.g. Wedding venue address, or 'same as pickup'"
                className={`h-12 w-full rounded-[4px] border border-bridal-beige bg-white px-3 font-bridal text-[14px] text-bridal-charcoal placeholder:text-bridal-text-soft/70 focus:border-bridal-gold-dark ${FOCUS}`}
                maxLength={500}
              />
              <p className="mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                Leave drop-off blank if it&apos;s the same as pickup.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* BK-100.52 Layer 2c — bundled add-on picker. Surfaces this
           vendor's optional in-house services (catering upgrades,
           valet, generator backup, etc.) so the customer can stack
           extras into the booking with one tap each. Hidden entirely
           when the vendor has zero optional bundled services — most
           non-venue vendors fall into this category and see no extra
           UI. */}
      {showBundledPicker && (loadingBundled || bundledServices.length > 0) && (
        <section
          aria-label="Optional add-ons"
          className="animate-stagger-fade-up rounded-[4px] border border-bridal-beige bg-white"
          style={stagger(sectionIndex++)}
        >
          <div className="flex h-9 items-center justify-between gap-2 border-b border-bridal-beige px-4">
            <p className={LABEL}>Optional add-ons</p>
            {pickedServices.length > 0 && (
              <span className="font-bridal text-[12px] leading-[16px] tabular-nums text-bridal-charcoal">
                + {formatPKR(addOnTotal)} · {pickedServices.length} selected
              </span>
            )}
          </div>
          {loadingBundled ? (
            <div className="flex h-14 items-center gap-2 px-4 font-bridal text-[12px] text-bridal-text-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading available add-ons…
            </div>
          ) : (
            <div>
              {visibleAddOns.map((svc, i) => {
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
                    aria-pressed={picked}
                    style={stagger(i)}
                    className={`relative grid min-h-[56px] w-full grid-cols-[1fr_auto_20px] items-center gap-3 border-b border-bridal-beige px-4 py-2 text-left transition-colors duration-150 last:border-b-0 animate-stagger-fade-up ${
                      picked ? "bg-bridal-cream" : "hover:bg-bridal-blush/45"
                    } ${FOCUS}`}
                  >
                    {/* 4px gold left rule, drawn on select (§8: scaleY 0→1). */}
                    <span
                      aria-hidden
                      className={`absolute inset-y-0 left-0 w-1 origin-center bg-bridal-gold transition-transform duration-200 ${picked ? "scale-y-100" : "scale-y-0"}`}
                    />
                    <span className="min-w-0">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate font-display text-[15px] italic leading-[20px] text-bridal-charcoal">
                          {svc.name}
                        </span>
                        <span className="shrink-0 font-bridal text-[10px] uppercase leading-[14px] tracking-[0.18em] text-bridal-text-label">
                          {BUNDLED_CATEGORY_LABELS[svc.category] || svc.category}
                        </span>
                      </span>
                      <span
                        className="block truncate font-bridal text-[12px] leading-[16px] tabular-nums text-bridal-text-soft"
                        title={svc.description || undefined}
                      >
                        {priceLabel}
                        {svc.description ? ` · ${svc.description}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-bridal text-[14px] leading-[20px] tabular-nums text-bridal-charcoal">
                      {cost > 0 ? `+ ${formatPKR(cost)}` : "Free"}
                    </span>
                    <span
                      aria-hidden
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-150 ${
                        picked ? "border-bridal-gold-dark bg-bridal-gold-dark text-white" : "border-bridal-beige bg-white"
                      }`}
                    >
                      {picked && <Check className="h-3 w-3 animate-scale-in" strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
              {hiddenAddOnCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllAddOns(true)}
                  className={`flex h-11 w-full items-center justify-center gap-1 border-t border-bridal-beige font-bridal text-[12px] leading-[16px] text-bridal-gold-dark transition-colors duration-150 hover:bg-bridal-blush/45 ${FOCUS}`}
                >
                  Show {hiddenAddOnCount} more
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </button>
              )}
              <p className="border-t border-bridal-beige px-4 py-2 font-bridal text-[11px] leading-[14px] text-bridal-text-soft">
                Your vendor confirms availability for each add-on; the final total is set when they accept. Required or always-included services aren&apos;t shown here.
              </p>
            </div>
          )}
        </section>
      )}

      {/* BK-100.2 Layer 2d — umbrella picker. Renders only when the
           customer is authenticated AND has at least one active
           umbrella. Anonymous bookings + customers without umbrellas
           see no extra UI — preserves the legacy review-step layout
           for the vast majority of flows. */}
      {showPicker && (loadingUmbrellas || umbrellas.length > 0) && (
        <section
          aria-label="Wedding-week umbrella"
          className="animate-stagger-fade-up rounded-[4px] border border-bridal-beige bg-white"
          style={stagger(sectionIndex++)}
        >
          {loadingUmbrellas ? (
            <div className="flex h-14 items-center gap-2 px-4 font-bridal text-[12px] text-bridal-text-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading your umbrellas…
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 px-4 py-3 xl:grid xl:min-h-[56px] xl:grid-cols-[1fr_260px] xl:items-center xl:gap-4 xl:py-0">
                <label htmlFor="umbrella-picker" className="min-w-0">
                  <span className={`block ${LABEL}`}>Wedding-week umbrella · optional</span>
                  <span className="block truncate font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                    Link this booking to one of your weddings for a multi-event bundle discount
                  </span>
                </label>
                <select
                  id="umbrella-picker"
                  value={formData.umbrellaId ?? ""}
                  onChange={(e) =>
                    updateFormData?.({
                      umbrellaId: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className={`h-11 w-full rounded-[4px] border border-bridal-beige bg-white px-3 font-bridal text-[14px] text-bridal-charcoal focus:border-bridal-gold-dark ${FOCUS}`}
                >
                  <option value="">— Don&apos;t link (standalone booking) —</option>
                  {umbrellas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {umbrellaLabel(u)}
                      {u.weddingDate ? ` · ${u.weddingDate}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount preview — soft estimate. Authoritative
                   pricing is recomputed by the backend on submit. */}
              {formData.umbrellaId && bundlePreview && (
                <div className="min-h-[64px] border-t border-bridal-beige px-4 py-2">
                  {previewLoading ? (
                    <div className="flex h-12 items-center gap-2 font-bridal text-[12px] text-bridal-text-soft">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      Calculating your bundle…
                    </div>
                  ) : projectedPercent > 0 ? (
                    <>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className={LABEL}>Estimated bundle discount</p>
                        <p className="font-display text-[18px] italic leading-[24px] tabular-nums text-bridal-gold-dark">
                          {formatPKR(projectedSavings)} off
                        </p>
                      </div>
                      <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                        {projectedPercent}% off — {estimatedNewCount} active event{estimatedNewCount === 1 ? "" : "s"} in this
                        umbrella once this booking confirms
                        {TIER_LABEL[Math.min(estimatedNewCount, 5)] ? ` (${TIER_LABEL[Math.min(estimatedNewCount, 5)]})` : ""}.
                      </p>
                    </>
                  ) : (
                    <p className="flex min-h-[48px] items-center font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                      Linked to your umbrella, but no bundle discount yet — bundles kick in at 2+ active events.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* A17 — the security deposit, DELIBERATELY OUTSIDE any total.
          It is a second sum of money: refundable, held by the venue, and not
          part of the price. Putting it inside a total block — even as its own
          figure — invites the customer to read it as another slice of the same
          total, which is the exact confusion this rule exists to prevent. The
          Stage's money block does not include it either (`depositAmount` is
          reported separately through `onTotalsChange`).

          Driving the live wizard to Review against a venue with a Rs 50,000
          deposit showed Rs 250,000 and nothing else; a grep of the booking form
          for "deposit" returned zero hits. The server had been returning it for
          two deploys. */}
      {depositTerms.length > 0 && (
        <section
          aria-label="Refundable security deposit"
          className="grid min-h-[56px] grid-cols-[1fr_auto] items-center gap-4 rounded-[4px] border border-bridal-beige bg-white px-4 py-2 animate-stagger-fade-up"
          style={stagger(sectionIndex++)}
        >
          <div className="min-w-0">
            <p className={LABEL}>Refundable security deposit · not part of the total</p>
            <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">{depositTerms.join(" ")}</p>
          </div>
          <p className="font-display text-[18px] italic leading-[24px] tabular-nums text-bridal-charcoal">
            {formatPKR(depositAmount)}
          </p>
        </section>
      )}

      {/* WW-TRUST-COPY — "Payments are Stripe-secured" was not true of this
          flow: the advance goes to the venue's own account and the platform
          records it rather than holding it. Saying so plainly also sets the
          right expectation about refunds, which are the venue's. In request
          mode nothing is charged at all until the venue accepts, and the
          sentence says that instead. */}
      <p
        className="flex min-h-[32px] items-center font-bridal text-[11.5px] leading-[16px] text-bridal-text-soft animate-stagger-fade-up"
        style={stagger(sectionIndex++)}
      >
        {requiresApproval
          ? "By sending this request you agree to the venue's terms. Nothing is charged until they accept."
          : "By confirming, you agree to the vendor's terms. You pay the venue directly — Wedding Wala records the payment, and doesn't hold it."}
      </p>
    </div>
  )
}
