"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import DateTimeStepV2 from "@/components/booking/steps-v2/date-time-step"
import PackageStepV2 from "@/components/booking/steps-v2/package-step"
import ReviewStepV2 from "@/components/booking/steps-v2/review-step"
import MenuSelectionStep from "@/components/booking/steps/menu-selection-step"
import VendorSelectionStep from "@/components/booking/steps/vendor-selection-step"
import EventSelectionStep from "@/components/booking/steps/event-selection-step"
import EventTabs from "@/components/booking/ui/event-tabs"
// The shell: the Stage (venue + ledger), the Desk (one step, its own
// scroller) and the action bar. See components/booking/shell/*.
import BookingStage from "@/components/booking/shell/booking-stage"
import BookingDesk from "@/components/booking/shell/booking-desk"
import StepFrame from "@/components/booking/shell/step-frame"
import ActionBar from "@/components/booking/shell/action-bar"
import StepBreadcrumb, { stepCounter } from "@/components/booking/shell/step-breadcrumb"
import PhoneHeader from "@/components/booking/shell/phone-header"
import LedgerSheet from "@/components/booking/shell/ledger-sheet"
import LeaveDialog, { useBeforeUnload } from "@/components/booking/shell/leave-dialog"
import { BookingShellContext, useShellTier, type BookingShellApi } from "@/components/booking/shell/booking-shell-context"
import { buildLedgerRows, buildMoney, guestRowApplies, type ReviewTotalsLike } from "@/components/booking/shell/booking-ledger"
import { computeBreakdown, formatPKR } from "@/lib/booking/breakdown"
import { stepHeading, continueLabel, disabledReason, type StepCopyCtx } from "@/lib/booking/step-copy"
import { venueDetailHref } from "@/lib/booking/venue-href"
import Link from "next/link"
import type { BookingFormData, EventVenue, EventBooking, Vendor } from "@/lib/types"
import { X } from "lucide-react"
import { BridalButton } from "@/components/bridal/bridal-button"
import { useParams, useRouter } from "next/navigation"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "../ui/use-toast"
import { getUser } from "@/hooks/getLoggedinUser"
import axiosInstance from '@/lib/axiosConfig'
import dynamic from "next/dynamic"
// The end-of-flow screens are split out of the route's first load: they carry
// framer-motion and canvas-confetti, and nobody needs them before the last
// step. `ssr: false` — they only ever render after a client-side submit.
const SuccessStep = dynamic(() => import("./steps/success-step"), { ssr: false })
const VendorSuccessStep = dynamic(() => import("./steps/vendor-success-step"), { ssr: false })
import { VendorAPI } from "@/lib/api/vendors"
// WW-PRICE0 — an unpriced vendor can't be booked (server 400s); offer the
// inquiry instead of dead-ending the customer. This page is the choke point.
import { isUnpricedVendor } from "@/lib/pricing/unpriced"
import { menuChargeFor } from "@/lib/pricing/menu"
// WW-PKG-UNIT — per-head packages + the includesFood rule. The step order below
// and the submitted payload both derive from this, so a venue whose package
// covers food never renders a priced Menu step.
import { composeLineTotal, packageIncludesFood } from "@/lib/pricing/package"
import { readUnitConfig, sellsByTheUnit, unitLineFor } from "@/lib/pricing/per-unit"
import UnitQuantityStep from "./steps/unit-quantity-step"
const VendorInquiryDialog = dynamic(() => import("@/components/VendorInquiryDialog"), { ssr: false })
import { useDateHold } from "@/hooks/use-date-hold"
import { useBookingDraft } from "@/hooks/use-booking-draft"
const BankTransferScreen = dynamic(() => import("./steps/bank-transfer-screen"), { ssr: false })
// WW-BOOKING-MODE — venues that accept a booking before asking for payment.
const RequestSentScreen = dynamic(() => import("./steps/request-sent-screen"), { ssr: false })
import { requiresVendorApproval, effectiveBookingMode } from "@/lib/booking/booking-mode"
// WW-REQUIREMENTS — the free-text field the flow never had. Everything a family
// actually needs to say went to WhatsApp instead.
import RequirementsStep, { type RequirementsDraft } from "./steps/requirements-step"
import { RequirementsAPI } from "@/lib/api/requirements"
// 03-DRAFT-RESILIENCE — couples lose laborious vendor/package/menu
// choices on refresh because useBookingDraft's load was never wired.
import { DraftResumeBanner, relativeTimeAgo } from "@/components/shared/DraftResumeBanner"

export default function BookingForm() {
  // Global steps: 1=Event Selection; Afterwards, per-event steps tracked in each event
  const [globalStep, setGlobalStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    eventType: "",
    bookingDate: undefined,
    timeSlot: "",
    slotTemplateId: null,
    guestCount: 1,
    selectedPackage: "",
    selectedMenu: "",
    menuAddons: [],
    selectedVendors: [],
    selectedVendorPackages: [],
    totalPrice: 0,
  })

  // Multi-event booking state
  const [events, setEvents] = useState<EventBooking[]>([])
  const [activeEventIndex, setActiveEventIndex] = useState<number>(0)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [vendorsDetails, setVendorsDetails] = useState<Vendor[][]>([])

  const params = useParams();
  const venueId = params?.id as string | null;

  const [venue, setVenue] = useState<EventVenue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)
  // CJ-010 — the double-booking guard returns a 400 carrying the conflicting
  // venues AND the slots that ARE free that day. Previously the whole response
  // was reduced to a transient toast, so a customer who lost the race for a slot
  // was left on the review step with nothing to act on. Held in state so the
  // conflict renders inline, persistently, next to the button they just pressed.
  const [slotConflict, setSlotConflict] = useState<{
    message: string
    available: string[]
    booked: string[]
  } | null>(null)
  /**
   * A submit failure the customer can still read after the toast has gone.
   *
   * Every error without `alternativeSlots` used to become a transient toast:
   * the customer had filled six steps, pressed "Pay & confirm", watched a
   * message appear and vanish, and was left on Review with no explanation and
   * no next action. The worst case is real — a cart with a second vendor drops
   * the venue's slotTemplateId, so the venue's own time (10:58) is validated
   * against the legacy whitelist and rejected with "Invalid booking time.
   * Allowed slots: 09:00, 14:00, 18:00", which names three times the customer
   * was never offered.
   */
  const [submitError, setSubmitError] = useState<{ message: string; hint?: string } | null>(null)
  // Keyed by event index. On a multi-function booking the Baraat can be sent
  // while the Mehndi is still being filled in, and each tab shows its own
  // outcome. State shape only — the payloads are untouched.
  const [bankTransfer, setBankTransfer] = useState<Record<number, { bookingId: number; amount: number; paymentType: string; customerEmail?: string; bookingDate?: string }>>({})
  // WW-BOOKING-MODE — set instead of bankTransferData when the venue accepts
  // bookings before payment. Nothing is charged until they do.
  const [requestSent, setRequestSent] = useState<Record<number, { bookingId: number; amount: number; bookingDate?: string; guestCount?: number }>>({})
  // WW-PRICE0 — drives the price-on-request inquiry dialog on this page.
  const [inquiryOpen, setInquiryOpen] = useState(false)

  // ── Shell state ──
  const tier = useShellTier()
  const router = useRouter()
  const deskBodyRef = useRef<HTMLDivElement>(null)
  /** +1 forward, −1 back, 0 tab switch — read by the step frame's entrance. */
  const dirRef = useRef<-1 | 0 | 1>(0)
  const [reviewTotals, setReviewTotals] = useState<ReviewTotalsLike | null>(null)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [leaveHref, setLeaveHref] = useState<string | null>(null)
  const [liveText, setLiveText] = useState("")
  /** The desk body scrolls on wide screens; the document on a phone. */
  const scrollDeskTop = () => {
    if (deskBodyRef.current) deskBodyRef.current.scrollTo({ top: 0 })
    else window.scrollTo({ top: 0, behavior: "smooth" })
  }
  /**
   * WW-REQUIREMENTS — what the customer needs the venue to know.
   *
   * Held at the FORM level rather than per-event: a family's parda requirement,
   * their diabetic mother-in-law and their under-fives are true of the wedding,
   * not of the Barat specifically, and asking them three times across a
   * multi-event booking is how a good field gets abandoned.
   *
   * Posted AFTER the booking is created — it needs a bookingId, and a failure
   * here must never lose the booking.
   */
  const [requirements, setRequirements] = useState<RequirementsDraft>({
    tags: [], dietary: {}, setup: {}, freeText: "",
  })
  const { timeRemaining, isHolding, holdFailed, holdFailedUntil, createHold, releaseHold } = useDateHold()
  const { user, loading: userLoading } = getUser();
  const { save: saveDraft, load: loadDraft, clear: clearDraft } = useBookingDraft(venueId, user?.id ? String(user.id) : null)

  // 03-DRAFT-RESILIENCE — booking-flow resume.
  //
  // `useBookingDraft` saves drafts to localStorage but until now `load` was
  // destructured and never called: every saved draft was orphaned. Couples
  // who refreshed mid-booking thought the system was broken.
  //
  // We load on mount (once user + venueId are known) and surface a banner.
  // On Resume we restore the form/event state but DELIBERATELY drop the
  // bookingDate/timeSlot/slotTemplateId of the active event: the 15-min
  // slot hold from the previous session is almost certainly stale (the
  // client-side hold timer doesn't survive refresh), so we force the user
  // back to the date/time step to re-pick + re-hold. Vendor/package/menu
  // selections — the laborious choices — are preserved.
  const [pendingDraft, setPendingDraft] = useState<{
    formData: BookingFormData;
    events: EventBooking[];
    globalStep: number;
    activeEventIndex: number;
    savedAt: number;
  } | null>(null);
  const draftLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (draftLoadAttemptedRef.current) return;
    if (userLoading || !user?.id || !venueId) return;
    draftLoadAttemptedRef.current = true;
    const d = loadDraft();
    if (d && d.events && d.events.length > 0) {
      setPendingDraft({
        formData: d.formData,
        events: d.events,
        globalStep: d.globalStep,
        activeEventIndex: d.activeEventIndex,
        savedAt: d.savedAt,
      });
    }
  }, [userLoading, user?.id, venueId, loadDraft]);

  const fetchVenue = async (id: string) => {
    try {
      const response = await axiosInstance.get(`${BACKEND_URL}api/v1/businesses/${id}`);
      const data = response.data.data;
      setVenue(data);
    } catch (err: any) {
      setError('Failed to load business details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) {
      setLoading(true);
      setError(null);
      setVenue(null);
      fetchVenue(venueId);
    } else {
      setLoading(false);
      setError('Invalid business ID.');
    }
  }, [venueId]);

  // Sync user data into formData whenever user becomes available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.fullName || prev.username,
        email: user.email || prev.email,
        phoneNumber: user.phoneNumber || prev.phoneNumber || ""
      }))
    }
  }, [user])

  /**
   * WW-DIRECT-PAY — the Stripe-return handler is gone.
   *
   * It read `?ps=1&bid=…&redirect_status=…` off the URL to tell a completed
   * 3DS redirect from a failed one, and a `?pc=1` cancel to delete the unpaid
   * booking. Every one of those parameters was written by Stripe on its way
   * back to this page. With no gateway anywhere in the product nothing can
   * produce them, so the branches were unreachable — and an unreachable branch
   * that deletes a booking is worth removing rather than leaving for someone
   * to trust later.
   *
   * The cancel branch has no replacement and needs none: a customer who does
   * not pay no longer leaves a booking to clean up on the spot. The stale-
   * booking sweeper handles genuine abandonment, and its `awaitingVendorDecision`
   * guard keeps it away from bookings that are merely waiting on the venue.
   */


  // Auto-save draft on form state changes
  useEffect(() => {
    if (globalStep < 2) return // don't save until past event selection step
    saveDraft({ formData, events, globalStep, activeEventIndex })
  }, [formData, events, globalStep, activeEventIndex, saveDraft])

  // Redirect to Date & Time step when slot hold expires
  const wasHoldingRef = useRef(false)
  useEffect(() => {
    if (isHolding) {
      wasHoldingRef.current = true
    }
    if (wasHoldingRef.current && !isHolding && timeRemaining === 0 && globalStep >= 2) {
      wasHoldingRef.current = false
      clearDraft()
      toast({
        title: 'Slot Hold Expired',
        description: 'Your reserved slot has expired. Please select a new date and time.',
        variant: 'destructive',
      })
      // Reset booking date/time and go back to datetime step (step 0)
      setEvents(prev => prev.map((e, idx) =>
        idx === activeEventIndex
          ? {
              ...e,
              currentStep: 0,
              formData: { ...e.formData, bookingDate: undefined, timeSlot: '', slotTemplateId: null }
            }
          : e
      ))
    }
  }, [isHolding, timeRemaining, globalStep, activeEventIndex])

  // Compute selected package/menu based on the active form (global or current event)
  const currentFormForSelection: BookingFormData = (events.length > 0 && events[activeEventIndex]?.formData)
    ? events[activeEventIndex].formData
    : formData

  const venuePackages = venue?.packages || [];
  const venueMenus = venue?.menus || [];

  const selectedPackageObj = venuePackages.find((pkg) => String(pkg.id) === String(currentFormForSelection.selectedPackage));
  const selectedMenuObj = venueMenus.find((menu) => String(menu.id) === String(currentFormForSelection.selectedMenu));

  // Fetch and maintain selected vendors' details for active event
  const refreshVendorsDetailsForActive = async (vendorIds: (string|number)[]) => {
    try {
      const details = await Promise.all(
        vendorIds.map(async (id) => await VendorAPI.getBusinessById(id))
      )
      const filtered = details.filter(Boolean) as Vendor[]
      setVendorsDetails((prev) => {
        const copy = prev.length ? [...prev] : Array(events.length).fill([])
        copy[activeEventIndex] = filtered
        return copy
      })
    } catch (e) {
      // no-op
    }
  }

  // Keep vendor details in sync with active event selections
  useEffect(() => {
    if (events.length === 0) return
    const active = events[activeEventIndex]
    if (!active) return
    if (active.formData.selectedVendors && active.formData.selectedVendors.length > 0) {
      refreshVendorsDetailsForActive(active.formData.selectedVendors)
    } else {
      setVendorsDetails((prev) => {
        const copy = prev.length ? [...prev] : Array(events.length).fill([])
        copy[activeEventIndex] = []
        return copy
      })
    }
  }, [events, activeEventIndex])

  // Also refresh vendor details when selected vendors change on the active tab
  useEffect(() => {
    if (events.length === 0) return
    const active = events[activeEventIndex]
    if (!active) return
    refreshVendorsDetailsForActive(active.formData.selectedVendors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events[activeEventIndex]?.formData.selectedVendors])

  const handleSubmit = async () => {
    setSubmitError(null)
    const currentForm: BookingFormData = events.length > 0 ? events[activeEventIndex].formData : formData
    const currentVendorsDetails: Vendor[] = events.length > 0 ? (vendorsDetails[activeEventIndex] || []) : []

    const venuePackage = venue?.packages?.find((pkg) => String(pkg.id) === String(currentForm.selectedPackage))
    const venueMenu = venue?.menus?.find((menu) => String(menu.id) === String(currentForm.selectedMenu))

    if (!venue?.id) {
      toast({
        title: 'Booking Error',
        description: 'Invalid business information. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    const calculateDownPayment = (amount: number, business: any): number => {
      const dpType = (business?.downPaymentType || '').toLowerCase()
      const dpValue = parseFloat(business?.downPayment) || 0
      if (dpType === 'percentage' || dpType === 'percent') {
        return Math.round(amount * (dpValue / 100))
      }
      return dpValue
    }

    const vendorsPayload: any[] = []

    // WW-RATECARD 10.7 — a per-unit vendor's quantity is the whole rate card,
    // and they need not be one of the three hardcoded vendor types this used to
    // read. Their floor is the vendor's own minimum, not 1.
    const vehicleQty = sellsByUnit
      ? (currentForm.vehicleQuantity || unitConfig?.minUnitQty || 1)
      : isCarRental ? (currentForm.vehicleQuantity || 1) : 1
    // WW-PRICING-OVERHAUL — a per-head menu bills price × max(guests, min-pax);
    // a flat menu is its price (unchanged). Same helper the server mirrors, so the
    // submitted totalAmount matches the Review the customer agreed to.
    const menuPriceRaw = menuChargeFor(venueMenu, currentForm.guestCount)
    // WW-PKG-UNIT — and the package now honours its own pricing basis, with the
    // menu zeroed when the package already covers catering. Composed by the same
    // shared helper the Review step uses, so the number the customer approved is
    // the number submitted — and the number the server independently recomputes.
    const {
      packageCharge: packagePrice,
      menuCharge: menuPrice,
    } = composeLineTotal({
      pkg: venuePackage,
      guestCount: currentForm.guestCount,
      qty: vehicleQty,
      menuCharge: menuPriceRaw,
    })

    // For car rental: service packages belong to the same business — pass as additionalPackageIds
    // so the backend can look them up from DB (avoids duplicate businessId entries)
    const carRentalServiceNotes: string[] = []
    const additionalPackageIds: number[] = []
    if (isCarRental && currentForm.selectedVendorPackages?.length > 0) {
      currentForm.selectedVendorPackages.forEach((pkgId: any) => {
        const venuePkg = (venue?.packages || []).find((p: any) => String(p.id) === String(pkgId))
        if (venuePkg) {
          additionalPackageIds.push(Number(pkgId))
          carRentalServiceNotes.push(venuePkg.name)
        }
      })
    }

    const mainTotal = packagePrice + menuPrice
    const mainDownPayment = calculateDownPayment(mainTotal, venue)

    const qtyUnit = isCarRental ? 'vehicles' : isBridalWear ? 'outfits' : isWeddingStationery ? 'sets' : 'units'
    const specialNotes: string[] = []
    if (vehicleQty > 1) specialNotes.push(`Quantity: ${vehicleQty} ${qtyUnit}`)
    if (carRentalServiceNotes.length > 0) specialNotes.push(`Services: ${carRentalServiceNotes.join(', ')}`)

    const mainBusinessEntry: any = {
      businessId: venue.id,
      packageId: currentForm.selectedPackage || null,
      menuId: venueMenu ? currentForm.selectedMenu : null,
      totalAmount: mainTotal,
      downPayment: mainDownPayment,
      specialRequests: specialNotes.join(' | ')
    }
    if ((isCarRental || isBridalWear || isWeddingStationery || sellsByUnit) && vehicleQty > 1) mainBusinessEntry.vehicleQuantity = vehicleQty
    if (additionalPackageIds.length > 0) mainBusinessEntry.additionalPackageIds = additionalPackageIds
    // Pin the booking to the chosen hall/lawn/partition (BusinessResource) when the
    // customer selected one. Additive — omitted entirely if left as "whole venue".
    if ((currentForm as any).selectedResourceId) mainBusinessEntry.resourceId = Number((currentForm as any).selectedResourceId)
    // F-2 — canonical per-hall path: when the venue models spaces as SubVenues,
    // send subVenueId directly. The backend (SCHEDULING_MULTI_RESOURCE) claims a
    // BookingSpace on it; if omitted it falls back to the resourceId→subVenue
    // bridge. Additive — omitted for the whole-venue / legacy path.
    if ((currentForm as any).selectedSubVenueId) mainBusinessEntry.subVenueId = Number((currentForm as any).selectedSubVenueId)

    if (mainBusinessEntry.packageId || mainBusinessEntry.menuId) {
      vendorsPayload.push(mainBusinessEntry)
    }

    // Track which vendor businessIds are already in the payload (via packages)
    const vendorBusinessIdsWithPackages = new Set<string>()

    // External vendor packages (non-car-rental)
    if (!isCarRental && currentForm.selectedVendorPackages && currentForm.selectedVendorPackages.length > 0) {
      currentForm.selectedVendorPackages.forEach((pkgId: any) => {
        const ownerVendor = currentVendorsDetails.find(v => (v.packages || []).some(p => String(p.id) === String(pkgId)))
        if (ownerVendor?.id) {
          const ownerPackage = ownerVendor.packages?.find(p => String(p.id) === String(pkgId))
          const vendorPkgPrice = Number(ownerPackage?.price) || 0
          vendorBusinessIdsWithPackages.add(String(ownerVendor.id))
          vendorsPayload.push({
            businessId: ownerVendor.id,
            packageId: pkgId,
            menuId: null,
            totalAmount: vendorPkgPrice,
            downPayment: calculateDownPayment(vendorPkgPrice, ownerVendor),
            specialRequests: ''
          })
        }
      })
    }

    // Include selected vendors that DON'T have a package selected — book at their base price
    if (currentForm.selectedVendors && currentForm.selectedVendors.length > 0) {
      currentForm.selectedVendors.forEach((vendorId: any) => {
        if (vendorBusinessIdsWithPackages.has(String(vendorId))) return // already covered
        if (String(vendorId) === String(venue?.id)) return // skip main venue (already added above)
        const vendorDetail = currentVendorsDetails.find(v => String(v.id) === String(vendorId))
        const vendorPrice = Number((vendorDetail as any)?.minimumPrice || (vendorDetail as any)?.price || 0)
        vendorsPayload.push({
          businessId: vendorId,
          packageId: null,
          menuId: null,
          totalAmount: vendorPrice,
          downPayment: calculateDownPayment(vendorPrice, vendorDetail),
          specialRequests: ''
        })
      })
    }

    if (vendorsPayload.length === 0) {
      /**
       * WW-RATECARD 10.7 — a per-unit vendor lands here, and it used to lose
       * both halves of their rate card.
       *
       * The main entry above is only pushed when a package or a menu was
       * chosen, and a per-unit vendor has neither. So this fallback ran, sent
       * `minimumPrice` as the total, and — the part that actually cost money —
       * sent no `vehicleQuantity` at all. The server recomputes the total
       * itself, so it would have billed one unit however many were asked for,
       * and the Review screen would have shown a minimumPrice the booking was
       * never going to cost.
       */
      const unitLine = sellsByUnit && unitConfig ? unitLineFor(unitConfig, vehicleQty) : null
      const fallbackTotal = unitLine ? unitLine.total : Number(venue?.minimumPrice) || 0
      vendorsPayload.push({
        businessId: venue.id,
        packageId: null,
        menuId: null,
        totalAmount: fallbackTotal,
        downPayment: calculateDownPayment(fallbackTotal, venue),
        // The quantity is the selection here, so it travels even when it is 1 —
        // unlike the `> 1` shorthand above, where 1 is genuinely the default.
        ...(unitLine ? { vehicleQuantity: unitLine.billedQty } : {}),
        specialRequests: unitLine
          ? `Quantity: ${unitLine.billedQty} ${unitConfig!.unitLabel}`
          : '',
      })
    }

    const invalidEntries = vendorsPayload.filter(vendor => !vendor.businessId || vendor.businessId === null || vendor.businessId === undefined);
    if (invalidEntries.length > 0) {
      toast({
        title: 'Booking Error',
        description: 'Some vendor information is invalid. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    const payload: Record<string, any> = {
      customerName: currentForm.username,
      customerEmail: currentForm.email,
      customerPhone: currentForm.phoneNumber,
      vendorId: venue?.vendor?.id || venue?.id,
      bookingDate: currentForm.bookingDate,
      bookingTime: currentForm.timeSlot,
      vendors: vendorsPayload.map(vendor => ({
        ...vendor,
        businessId: Number(vendor.businessId),
        packageId: vendor.packageId ? Number(vendor.packageId) : null,
        menuId: vendor.menuId ? Number(vendor.menuId) : null,
        totalAmount: Number(vendor.totalAmount),
        downPayment: Number(vendor.downPayment),
        // Capacity-aware slot booking. Only attach when a single-vendor cart
        // picked a configured slot template — the backend rejects mixed-mode
        // carts (some with slotTemplateId, some without). Multi-vendor carts
        // fall back to the legacy fixed-period path.
        ...(currentForm.slotTemplateId && vendorsPayload.length === 1
          ? { slotTemplateId: Number(currentForm.slotTemplateId) }
          : {}),
      }))
    };
    if (currentForm.guestCount && currentForm.guestCount > 0) {
      payload.guestCount = currentForm.guestCount;
    }

    /**
     * 10.13 (UC-15) — the arrangement the family asked for.
     *
     * The column, its CHECK constraint, the comparison against the hall's own
     * `genderMode` and the verdict on the response have all existed; this is
     * the value that makes any of them mean anything. Without it every booking
     * arrived stating nothing, `checkGenderFit` returned `unknown` forever, and
     * a family asking for a zenana function had no way to say so.
     *
     * Omitted entirely when the customer expressed no preference — absence is
     * not a value, and sending "MIXED" for "didn't say" would record a
     * requirement they never stated.
     */
    if (currentForm.requestedGenderMode) {
      payload.requestedGenderMode = currentForm.requestedGenderMode;
    }

    // BK-100.53 — service-location mode + address + notes. All optional.
    // Backend defaults absent fields to NULL (treated as at_vendor).
    if (currentForm.serviceLocationMode) {
      payload.serviceLocationMode = currentForm.serviceLocationMode;
    }
    if (currentForm.serviceLocationAddress?.trim()) {
      payload.serviceLocationAddress = currentForm.serviceLocationAddress.trim();
    }
    if (currentForm.serviceLocationNotes?.trim()) {
      payload.serviceLocationNotes = currentForm.serviceLocationNotes.trim();
    }
    // BK-100.2 Layer 2d — optional umbrella attachment. Backend
    // validates ownership + active status + applies any qualifying
    // multi-event bundle discount inside the create transaction.
    // Missing / 0 / NaN → omitted → standalone booking (legacy path).
    if (currentForm.umbrellaId && Number.isFinite(Number(currentForm.umbrellaId))) {
      payload.umbrellaId = Number(currentForm.umbrellaId);
    }
    // BK-100.52 Layer 2c — optional bundled-service selections from
    // the in-house add-on picker. Backend validates each selection
    // against the vendor's actual BusinessBundledService rows and
    // applies the priceModel math (flat / per_plate × guestCount /
    // percentage_of_total / free) inside the same transaction.
    // Missing / empty / non-object → omitted → no add-ons applied.
    if (
      currentForm.selectedBundledServices &&
      typeof currentForm.selectedBundledServices === "object" &&
      !Array.isArray(currentForm.selectedBundledServices) &&
      Object.keys(currentForm.selectedBundledServices).length > 0
    ) {
      payload.selectedBundledServices = currentForm.selectedBundledServices;
    }

    // Issue #5 — car-rental pickup / dropoff addresses. Trimmed and
    // omitted when blank so non-car-rental bookings are byte-identical.
    if (currentForm.pickupAddress?.trim()) {
      payload.pickupAddress = currentForm.pickupAddress.trim();
    }
    if (currentForm.dropoffAddress?.trim()) {
      payload.dropoffAddress = currentForm.dropoffAddress.trim();
    }

    try {
      setIsSubmitting(true)
      setSlotConflict(null)
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/bookings`, payload)

      if (response.status === 201 || response.status === 200) {
        clearDraft()

        const bookingObj = response.data?.data?.booking || response.data?.data || response.data
        const realBookingId = bookingObj?.id || bookingObj?.bookingId || null

        if (!realBookingId) {
          toast({ title: "Booking Error", description: "No booking ID received. Please contact support.", variant: "destructive" })
          return
        }

        // WW-RECORD-MODE — bank transfer is the DEFAULT rail, not an overflow.
        //
        // This branch used to fire only above Rs 999,999 ("Stripe caps Pakistan
        // card payments"), which framed the country's most-used payment method
        // as a fallback for bookings too large to process. The real constraint
        // is the other way round: Stripe does not onboard Pakistani businesses
        // at all, so a Lahore marquee cannot receive card money from this flow —
        // while every one of them can receive a bank transfer.
        //
        // The threshold is gone. Every booking now goes to the transfer screen,
        // which fetches the VENUE's own published account, shows a reference
        // they can match against their statement, and lets the customer report
        // the transfer in-product instead of messaging a hardcoded number.
        // WW-REQUIREMENTS — filed against the booking that now exists.
        //
        // Deliberately AFTER the create and deliberately best-effort. It needs a
        // bookingId, and a network blip filing a note must never cost the
        // customer the booking they just made — six steps of work, a held date
        // and a payment screen, thrown away because a textarea didn't post.
        //
        // If it fails they can add it from the booking page, and the venue can
        // still be told the ordinary way. Losing the booking has no such repair.
        const hasRequirements =
          requirements.tags.length > 0 ||
          requirements.freeText.trim().length > 0 ||
          Object.keys(requirements.dietary).length > 0 ||
          // WW-SETUP-COUNTS — "40 round tables" on its own is a complete
          // requirement. Omitting it here would silently drop a booking whose
          // ONLY stated need was the furniture.
          Object.keys(requirements.setup || {}).length > 0
        if (hasRequirements) {
          try {
            await RequirementsAPI.create(realBookingId, {
              tags: requirements.tags,
              dietary: requirements.dietary,
              setup: requirements.setup,
              freeText: requirements.freeText.trim() || undefined,
              source: "booking_flow",
            })
          } catch (reqErr) {
            console.error("[Requirements] post-booking save failed:", reqErr)
            toast({
              title: "Booking made — but your note didn't send",
              description: "Add it again from your booking page so the venue sees it.",
            })
          }
        }

        const summedDownPayment = vendorsPayload.reduce((s, v) => s + (v.downPayment || 0), 0)

        // WW-BOOKING-MODE — a venue that reviews first is not asking for money
        // yet. Sending this customer to a transfer screen would have them pay
        // for a date the venue may still decline, which then has to be refunded
        // by hand. The server refuses a payment claim in this state too, so a
        // customer who reaches the payment screen by URL is also stopped.
        // This function is done; the tab shows its outcome and the others
        // carry on. `isSubmitted` was declared on EventBooking and never set.
        const sentIndex = activeEventIndex
        setEvents((prev) => prev.map((e, i) => (i === sentIndex ? { ...e, isSubmitted: true } : e)))
        dirRef.current = 1
        scrollDeskTop()

        if (requiresVendorApproval(venue)) {
          setRequestSent((prev) => ({
            ...prev,
            [sentIndex]: {
              bookingId: realBookingId,
              amount: summedDownPayment,
              bookingDate: typeof currentForm.bookingDate === "string"
                ? currentForm.bookingDate
                : currentForm.bookingDate instanceof Date
                  ? currentForm.bookingDate.toISOString()
                  : undefined,
              guestCount: currentForm.guestCount,
            },
          }))
          return
        }

        setBankTransfer((prev) => ({
          ...prev,
          [sentIndex]: {
            bookingId: realBookingId,
            amount: summedDownPayment,
            paymentType: "down_payment",
            customerEmail: currentForm.email,
            bookingDate: typeof currentForm.bookingDate === "string"
              ? currentForm.bookingDate
              : currentForm.bookingDate instanceof Date
                ? currentForm.bookingDate.toISOString()
                : undefined,
          },
        }))
        // The inline Stripe screen that used to run here is gone from THIS
        // flow. It could never complete for a Pakistani venue — Stripe does not
        // onboard Pakistani businesses, so there is no account for the money to
        // land in. `BookingPaymentScreen` itself is untouched and still serves
        // /user/bookings/[id]/pay and /user/plan/[id]/pay, which is where a card
        // rail belongs if one is ever provisioned.
      } else {
        throw new Error("Unexpected response")
      }
    } catch (error: any) {
      const body = error?.response?.data
      const alt = body?.data?.alternativeSlots
      // CJ-010 — a slot conflict is not a generic failure. The backend already
      // computed which times are still free that day, so surface them inline
      // instead of discarding them behind a toast the customer cannot act on.
      if (Array.isArray(alt?.availableSlots) || Array.isArray(alt?.bookedSlots)) {
        setSlotConflict({
          message: body?.message || "That time was just taken.",
          available: Array.isArray(alt?.availableSlots) ? alt.availableSlots : [],
          booked: Array.isArray(alt?.bookedSlots) ? alt.bookedSlots : [],
        })
      } else {
        // Persist it on the page. A toast is the wrong container for a failure
        // that ends a six-step journey and needs the customer to change
        // something before trying again.
        const code = body?.data?.code || body?.code
        const hint =
          code === "MIXED_SLOT_MODE" || /allowed slots/i.test(String(body?.message || ""))
            ? "This venue sells its own time slots, which cannot be combined with extra vendors in one booking yet. Book the venue on its own, then add the other vendors as a separate booking."
            : code === "MULTI_SLOT_TEMPLATE"
              ? "Pick a single time slot for this booking, then book the other one separately."
              : undefined
        setSubmitError({
          message: body?.message || "Something went wrong while submitting your booking.",
          hint,
        })
        toast({
          title: "Submission Failed",
          description: body?.message || "Something went wrong while submitting your booking.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Booking type detection (single source of truth) ──
  // Venue = has menus (banquet halls, wedding venues, restaurants)
  // Vendor = everything else (photographers, decorators, caterers, etc.)
  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  const hasPackages = !!venue?.packages && Array.isArray(venue.packages) && venue.packages.length > 0
  // WW-PKG-UNIT — the Menu step's existence and its title are derived from
  // configuration rather than hardcoded into the venue flow.
  const hasMenus = Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  // Reuses `selectedPackageObj` (line ~284), which already resolves against the
  // ACTIVE event's form — the right scope, because a multi-event booking can
  // take a food-inclusive package for the Barat and a hall-only one for the
  // Mehndi, and the Menu step must follow whichever event is on screen.
  const selectedPackageIncludesFood = packageIncludesFood(selectedPackageObj as any)
  /**
   * WW-RATECARD 10.7 — a vendor whose rate card IS a unit.
   *
   * `pricingMode = "per_unit"` plus a priced unit in `pricingConfigJson` is the
   * whole rate card for a car-rental firm, a stationery press or a chair
   * supplier. `pricingService` bills it; nothing in this flow ever asked how
   * many, because the only quantity control lived inside the package step and a
   * per-unit vendor has no packages to put it in.
   *
   * `sellsByTheUnit` is deliberately narrower than "has a unit configured": the
   * server bills the unit line only when nothing else is selected, so a vendor
   * with packages or menus never reaches it. A quantity control that does not
   * move the price would be worse than no control at all.
   */
  const unitConfig = useMemo(() => readUnitConfig(venue as any), [venue])
  const sellsByUnit = useMemo(() => sellsByTheUnit(venue as any), [venue])
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  // Vendor types that skip the "What are you celebrating?" event selection step
  const isDirectBooking = isCarRental || isBridalWear || isWeddingStationery

  // Direct-booking vendors auto-skip step 1 and go straight to Date & Time
  useEffect(() => {
    const directEventType = isCarRental
      ? 'Car Rental'
      : isBridalWear
        ? 'Bridal Wear'
        : isWeddingStationery
          ? 'Wedding Stationery'
          : null
    if (!directEventType || !venue || loading || globalStep !== 1 || events.length > 0) return
    const base = {
      ...formData,
      username: formData.username || user?.fullName || '',
      email: formData.email || user?.email || '',
      phoneNumber: formData.phoneNumber || user?.phoneNumber || '',
      eventType: directEventType,
    }
    setEvents([{ eventType: directEventType, formData: base, currentStep: 0, isSubmitted: false }])
    setSelectedEvents([directEventType])
    setGlobalStep(2)
  }, [isCarRental, isBridalWear, isWeddingStationery, venue, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step definitions ──
  // Global steps (before per-event phase)
  const stepOrder = useMemo(() => [
    { key: "events", title: "Event Selection" },
  ] as { key: string; title: string }[], [])

  // Per-event steps (key-based — rendering uses the key, not the index)
  const eventStepOrder = useMemo(() => {
    const steps: { key: string; title: string }[] = [
      { key: "datetime", title: "Date & Time" },
    ]

    if (isVenueBooking) {
      // VENUE flow: Date → Add Vendors → Packages → Menu → Review → Success
      //
      /* "Additional Vendors" only when the venue actually takes outside
         vendors. `Business.outsideVendorsAllowed` has been on the model and in
         the payload all along and nothing in the booking flow read it, so a
         venue that answered NO still invited couples to bring a photographer
         it would turn away at the gate — a promise made on the booking screen
         and broken on the day. Verified live: business 3358 has
         outsideVendorsAllowed=false and was still showing the step.

         Explicit `false` only. Null means the venue never answered, and
         silently removing a step from every venue that has not filled this in
         would be a far bigger change than the one asked for. */
      if ((venue as any)?.outsideVendorsAllowed !== false) {
        steps.push({ key: "vendors", title: "Additional Vendors" })
      }
      if (hasPackages) steps.push({ key: "packages", title: "Packages" })
      // WW-PKG-UNIT — the Menu step is now derived, not hardcoded.
      //
      //   · venue has no menus at all      -> step does not render
      //     (a hall-only venue whose customers bring their own caterer had a
      //      Menu step forced on it with nothing to show)
      //   · chosen package includes food   -> step renders as "Customise menu",
      //     a free CHOICE. The customer still picks their dishes — the kitchen
      //     needs to know, and a package that hides its menu is worse than one
      //     that shows it — but the price does not move.
      //   · otherwise                      -> priced Menu step, unchanged.
      if (hasMenus) {
        steps.push({
          key: "menu",
          title: selectedPackageIncludesFood ? "Customise menu" : "Menu",
        })
      }
      // WW-REQUIREMENTS — always, and always immediately before Review, so the
      // customer states what they need while the booking is still theirs to
      // change. Nothing on it is required; a step that blocked on being filled
      // in would only be filled in with a full stop.
      steps.push({ key: "requirements", title: "Your requirements" })
      steps.push({ key: "review", title: "Review" })
      steps.push({ key: "success", title: "Success" })
    } else {
      // VENDOR flow: Date → Packages → Review → Success (NO vendor selection)
      if (hasPackages) steps.push({ key: "packages", title: "Package Selection" })
      // WW-RATECARD 10.7 — for a per-unit vendor this step IS the rate card, so
      // it takes the place the packages step would have had. `sellsByTheUnit`
      // already guarantees the two can never both appear.
      if (sellsByUnit && unitConfig) {
        steps.push({ key: "unit", title: `How many ${unitConfig.unitLabel}?` })
      }
      // WW-REQUIREMENTS — always, and always immediately before Review, so the
      // customer states what they need while the booking is still theirs to
      // change. Nothing on it is required; a step that blocked on being filled
      // in would only be filled in with a full stop.
      steps.push({ key: "requirements", title: "Your requirements" })
      steps.push({ key: "review", title: "Review" })
      steps.push({ key: "success", title: "Success" })
    }

    return steps
    // WW-PKG-UNIT — `hasMenus` and `selectedPackageIncludesFood` are read inside,
    // so they must be dependencies. Omitting the latter would freeze the step
    // list at whatever the FIRST package selection implied, and a customer
    // switching from a hall-only package to a food-inclusive one would keep
    // being charged for a menu the package already covers.
  }, [isVenueBooking, hasPackages, hasMenus, selectedPackageIncludesFood, sellsByUnit, unitConfig])

  // ── Step validation (key-based) ──
  const getIsStepValid = (): boolean => {
    const inEventPhase = globalStep >= 2
    const currentForm: BookingFormData = inEventPhase && events.length > 0 ? events[activeEventIndex].formData : formData
    const eventStep = inEventPhase ? (events[activeEventIndex]?.currentStep ?? 0) : 0

    if (!inEventPhase) {
      // globalStep 1 = Event Selection
      if (globalStep === 1) return selectedEvents.length > 0
      return true
    }

    // Event phase — validate by step KEY, not index
    const stepKey = eventStepOrder[eventStep]?.key
    switch (stepKey) {
      case 'datetime':
        return !!currentForm.bookingDate && currentForm.timeSlot !== "" && (isCarRental || currentForm.guestCount > 0)
      case 'packages': {
        if (!hasPackages) return true
        // WW-PKGFEAT-NULL — a `carPkgs` scan used to run here to decide whether a
        // car rental required a vehicle to be picked. Both of its branches returned
        // the same expression, so it never changed the answer — but it dereferenced
        // `pkg.features` unguarded (`!Array.isArray(null)` is true) and threw
        // "Cannot read properties of null" on any package stored with
        // `features: null`. This runs during render, so it took the entire booking
        // page down at the package step for EVERY vendor type, not just car rentals.
        // The rule is the same for all of them: a package must be selected.
        return currentForm.selectedPackage !== ""
      }
      case 'vendors':
        return true // optional step
      case 'menu':
        return true // optional step
      case 'unit':
        /**
         * Never blocks. The stepper cannot produce an invalid quantity — it is
         * clamped to the vendor's minimum and the server's cap of 50 — and the
         * field opens at a bookable number, so there is nothing to refuse. A
         * gate here could only ever fire on a state the UI cannot reach.
         */
        return true
      case 'requirements':
        // WW-REQUIREMENTS — never blocks. A step that demanded input would be
        // satisfied with a full stop and teach people the field is a toll gate.
        return true
      case 'review':
        return true
      default:
        return true
    }
  }
  const isStepValid = getIsStepValid()

  // Helper to update form for active event or single
  const updateCurrentForm = (updater: React.SetStateAction<BookingFormData>) => {
    if (events.length === 0) {
      setFormData(updater)
    } else {
      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, formData: typeof updater === 'function' ? (updater as any)(e.formData) : updater } : e))
    }
  }

  const updateFormDataPartial = (data: Partial<BookingFormData>) => {
    updateCurrentForm(prev => ({ ...prev, ...data }))
  }

  // ── Active form data shorthand ──
  const activeFormData = events.length ? events[activeEventIndex]?.formData ?? formData : formData

  // ── Step content (key-based rendering) ──
  let stepContent = null

  if (globalStep === 1) {
    // Direct-booking types skip event selection — useEffect auto-advances; show nothing during that brief tick
    stepContent = isDirectBooking ? null : (
      <EventSelectionStep
        formData={formData}
        venue={venue}
        setFormData={setFormData}
        selectedEvents={selectedEvents}
        onEventToggle={(eventId) => {
          setSelectedEvents(prev => prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId])
        }}
      />
    )
  } else {
    // Event phase — render based on step KEY
    const eventStep = events[activeEventIndex]?.currentStep ?? 0
    const stepKey = eventStepOrder[eventStep]?.key

    switch (stepKey) {
      case 'datetime':
        stepContent = (
          <DateTimeStepV2
            formData={activeFormData}
            updateFormData={updateCurrentForm}
            venue={venue}
            timeRemaining={timeRemaining}
            isHolding={isHolding}
            holdFailed={holdFailed}
            holdFailedUntil={holdFailedUntil}
            createHold={createHold}
            releaseHold={releaseHold}
          />
        )
        break
      case 'vendors':
        stepContent = (
          <VendorSelectionStep
            formData={activeFormData}
            updateFormData={updateFormDataPartial}
          />
        )
        break
      case 'packages':
        stepContent = (
          <PackageStepV2
            formData={activeFormData}
            updateFormData={updateFormDataPartial}
            venue={venue}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        )
        break
      case 'menu':
        stepContent = (
          <MenuSelectionStep
            formData={activeFormData}
            updateFormData={updateCurrentForm}
            venue={venue}
            // WW-PKG-UNIT — when the chosen package already covers catering the
            // menu is a CHOICE, not a CHARGE. The step must say so plainly:
            // showing per-head prices the customer will not be billed is how
            // "you charged me twice" starts, even when the total is right.
            includedInPackage={selectedPackageIncludesFood}
            packageName={selectedPackageObj?.name}
          />
        )
        break
      case 'unit':
        stepContent = unitConfig ? (
          <UnitQuantityStep
            config={unitConfig}
            quantity={activeFormData.vehicleQuantity || unitConfig.minUnitQty || 1}
            onChange={(qty) => updateFormDataPartial({ vehicleQuantity: qty })}
            vendorName={venue?.name}
          />
        ) : null
        break
      case 'requirements':
        stepContent = (
          <RequirementsStep
            value={requirements}
            onChange={setRequirements}
            venueName={venue?.name}
            // The dietary counts only make sense where food is served. A
            // photographer has no use for "how many children under 5".
            showDietary={isVenueBooking || hasMenus}
            // WW-SETUP-COUNTS — only a venue lays out a room. A photographer
            // has no round tables to count, and asking for some is how an
            // optional section starts reading as noise.
            showSetup={isVenueBooking}
          />
        )
        break
      case 'review':
        stepContent = (
          <ReviewStepV2
            formData={activeFormData}
            selectedPackageObj={selectedPackageObj}
            selectedMenuObj={selectedMenuObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
            venue={venue}
            // BK-100.2 Layer 2d — only render the umbrella picker
            // when we have a logged-in user (anonymous customers
            // can't own umbrellas) AND a setter for the form data.
            updateFormData={updateFormDataPartial}
            isAuthenticated={!!user}
            // WW-SETUP-COUNTS — echo the previous step back, so the last
            // screen before sending shows what was actually asked for.
            requirements={requirements}
            // The shell: "Edit" on a row jumps back to the step that owns it,
            // the discounted totals feed the Stage, and the legal sentence
            // says what the button will actually do.
            onEdit={(k: string) => onJump(k)}
            onTotalsChange={setReviewTotals}
            requiresApproval={requiresVendorApproval(venue)}
            onSignIn={() => router.push("/login")}
          />
        )
        break
      case 'success':
        stepContent = isVenueBooking ? (
          <SuccessStep
            formData={activeFormData}
            venue={venue}
            selectedPackageObj={selectedPackageObj}
            selectedMenuObj={selectedMenuObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        ) : (
          <VendorSuccessStep
            formData={activeFormData}
            vendor={venue as any}
            selectedPackageObj={selectedPackageObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
            bookingResponse={events[activeEventIndex]?.bookingResponse}
          />
        )
        break
      default:
        stepContent = null
    }
  }

  // Step header for current step
  const header = globalStep < 2 ? stepOrder[0] : eventStepOrder[events[activeEventIndex]?.currentStep ?? 0]

  // ── Navigation ──
  const handleNext = () => {
    if (isSubmitting) return

    // Validate current step — show toast instead of disabling button
    if (!isStepValid) {
      if (globalStep === 1) {
        toast({ title: 'Select an Event', description: 'Please select at least one event type to continue.' })
      } else if (globalStep >= 2) {
        const stepKey = eventStepOrder[events[activeEventIndex]?.currentStep ?? 0]?.key
        if (stepKey === 'datetime') {
          toast({ title: 'Complete Date & Time', description: 'Please select a date, time slot, and guest count.' })
        } else if (stepKey === 'packages') {
          toast({ title: 'Select a Package', description: 'Please choose a package to continue.' })
        }
      }
      return
    }

    // A signed-out customer cannot send — the API needs a session. Say so at
    // the door rather than after a failed request.
    if (isReviewStep && !user && !userLoading) {
      router.push("/login")
      return
    }

    dirRef.current = 1
    scrollDeskTop()

    if (globalStep === 1) {
      // Initialize per-event flows
      if (selectedEvents.length > 0) {
        // Ensure user data is in formData before passing to events
        const base = {
          ...formData,
          username: formData.username || user?.fullName || '',
          email: formData.email || user?.email || '',
          phoneNumber: formData.phoneNumber || user?.phoneNumber || '',
        }
        // Keep a function's choices when the customer comes back to add or
        // remove another one; only brand-new functions start empty. A venue
        // that states a minimum opens the guest count at that minimum rather
        // than at 1 — a 1-guest marquee booking (BK-769) is what the old
        // default produced when nobody touched the field.
        const minGuests = guestRowApplies(venue) ? Number(venue?.minCapacity) || 0 : 0
        const newEvents: EventBooking[] = selectedEvents.map((evt) => {
          const existing = events.find((e) => e.eventType === evt)
          if (existing) return existing
          return {
            eventType: evt,
            formData: { ...base, eventType: evt, guestCount: Math.max(base.guestCount || 0, minGuests) },
            currentStep: 0,
            isSubmitted: false,
          }
        })
        setEvents(newEvents)
        setActiveEventIndex(0)
        setGlobalStep(2)
      }
      return
    }

    // Event phase — advance step or submit
    const eventStep = events[activeEventIndex]?.currentStep ?? 0
    const reviewStepIndex = eventStepOrder.findIndex(s => s.key === 'review')

    if (eventStep < reviewStepIndex) {
      // Advance to next step
      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, currentStep: eventStep + 1 } : e))
    } else if (eventStep === reviewStepIndex) {
      // Submit booking
      handleSubmit()
    }
  }

  // Computed values for display
  // Direct-booking types skip the global Event Selection step — show only event-phase steps
  const allDisplaySteps = isDirectBooking
    ? eventStepOrder.filter(s => s.key !== 'success')
    : [...stepOrder, ...eventStepOrder.filter(s => s.key !== 'success')]
  const currentDisplayStep = isDirectBooking
    ? (events[activeEventIndex]?.currentStep ?? 0)
    : globalStep < 2
      ? 0
      : 1 + (events[activeEventIndex]?.currentStep ?? 0)
  const isSuccessStep = globalStep >= 2 && eventStepOrder[events[activeEventIndex]?.currentStep ?? 0]?.key === 'success'
  const isReviewStep = globalStep >= 2 && eventStepOrder[events[activeEventIndex]?.currentStep ?? 0]?.key === 'review'

  const handleBack = () => {
    dirRef.current = -1
    scrollDeskTop()
    // CJ-010 — a conflict is about the slot that was submitted. Once the
    // customer steps away it is stale; leaving it up would warn about a time
    // they may have already changed.
    setSlotConflict(null)
    if (globalStep >= 2) {
      const eventStep = events[activeEventIndex]?.currentStep ?? 0
      if (eventStep > 0) {
        setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, currentStep: eventStep - 1 } : e))
      } else if (!isDirectBooking) {
        // Direct-booking types have no Event Selection step to go back to
        setGlobalStep(1)
      }
    }
    // globalStep 1 is the first step — no going back further
  }

  // The request-sent and bank-transfer screens render inside the desk body
  // (see the shell below), keyed by event, so the Stage stays up and a
  // multi-function booking can carry on with its other tabs.

  /**
   * WW-DIRECT-PAY — both the inline Stripe screen and the post-Stripe success
   * screen that used to render here are gone.
   *
   * The success screen was kept last time on the grounds that it was reached
   * from the URL rather than from this component, so it still served someone
   * returning from a card payment on /user/bookings/[id]/pay. That page no
   * longer takes card payments — it shows the venue's own accounts and a
   * "I've transferred" form — so there is no redirect left to return from.
   */

  // WW-PRICE0 — the booking funnel's choke point.
  //
  // A vendor with no minimumPrice and nothing priced to select cannot be booked:
  // the server refuses it (400 `vendor_not_priced`). There are FOUR ways into
  // this page — VendorDetailsMobile, VendorDetails (desktop), VendorCard, and
  // the SEO vendor-detail-page's "Check availability" link — plus anyone who
  // pastes /{id}/booking directly. Guarding each CTA would leave the direct URL
  // open and would rot the next time someone adds a fifth. Guard here instead:
  // everything must pass through this component.
  //
  // Rather than dead-end the customer, offer the inquiry: the vendor replies
  // with a real price and it lands in their Leads inbox.
  // WW-PRICING-OVERHAUL — a vendor who declared `quote` mode is quote-only by
  // choice (even if they carry a starting price), so route them to the same
  // inquiry flow as an unpriced vendor.
  const wantsQuote = (venue as any)?.pricingMode === "quote"
  /**
   * WW-TEST-CASES 5.14 — `inquiry_only` means NO ONLINE BOOKING.
   *
   * The mode was selectable in the portal, labelled "Enquiries only — I'll
   * contact them", and hinted "No online booking. Customers send an enquiry and
   * you contact them." It then behaved exactly like `request`:
   * `requiresVendorApproval` returns true for both, so the customer walked the
   * whole wizard, picked a date, and created a booking the venue had said they
   * did not take.
   *
   * A vendor who chose this told us in plain words that their calendar is not
   * bookable online. Taking the booking anyway is the platform overruling them
   * about their own availability — and the customer finds out later, holding a
   * confirmation the venue never agreed to.
   *
   * They land on the same enquiry screen an unpriced or quote-only vendor
   * already lands on, which exists and works.
   */
  const inquiryOnly = effectiveBookingMode(venue as any) === "inquiry_only"
  const unpricedNode = !loading && venue && (isUnpricedVendor(venue as any) || wantsQuote || inquiryOnly) ? (
      <div className="w-full">
        <div className="mx-auto max-w-xl rounded-md bg-bridal-cream border border-bridal-beige p-6 sm:p-8 text-center shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
          <h1 className="font-display italic text-[26px] sm:text-[30px] text-bridal-charcoal leading-tight">
            {inquiryOnly
              ? `${venue.name} takes bookings by enquiry`
              : wantsQuote
                ? `${venue.name} prices each event with a custom quote`
                : `${venue.name} hasn't published a price yet`}
          </h1>
          <p className="mt-3 text-[14px] text-bridal-charcoal/75 leading-relaxed">
            {inquiryOnly ? (
              <>
                They don&apos;t take bookings online. Send your date and guest count and
                they&apos;ll get back to you to arrange it.
              </>
            ) : (
              <>
                Send them a quick inquiry with your date and guest count — they&apos;ll reply
                with a quote, and you can book once you agree on the price.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setInquiryOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
          >
            {inquiryOnly ? "Send an enquiry" : "Ask for a price"}
          </button>
        </div>
        <VendorInquiryDialog
          businessId={venue.id}
          vendorName={venue.name}
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
        />
      </div>
    ) : null

  /* ── The shell ─────────────────────────────────────────────────────────
     Everything from here down is presentation. The Stage (venue + ledger)
     stays put on the left; the Desk shows one step and scrolls on its own;
     the action bar is always on screen. The state, the step order, the
     validation and the submit above are what they were. */
  const isPhone = tier !== "desk"
  const requiresApproval = requiresVendorApproval(venue)
  const vendorTypeName = venue?.vendor?.vendorType || ""
  const eventStep = events[activeEventIndex]?.currentStep ?? 0
  const activeKey: string = globalStep === 1 ? "event" : (eventStepOrder[eventStep]?.key ?? "datetime")
  const sentActive = requestSent[activeEventIndex] || null
  const bankActive = bankTransfer[activeEventIndex] || null
  const arrived = !!sentActive || !!bankActive || isSuccessStep

  const copyCtx: StepCopyCtx = {
    stepIndex: currentDisplayStep,
    stepCount: allDisplaySteps.length,
    vendorTypeName,
    isCarRental,
    isBridalWear,
    isWeddingStationery,
    isVenueBooking,
    includedInPackage: selectedPackageIncludesFood,
    hasMenus,
    hasPackages,
    venueName: venue?.name || "",
    eventType: events[activeEventIndex]?.eventType,
    multiEvent: events.length > 1,
    unitLabel: unitConfig?.unitLabel,
    requiresApproval,
  }
  const heading = arrived ? null : stepHeading(activeKey, copyCtx)

  const eventLabel =
    globalStep >= 2
      ? `${events[activeEventIndex]?.eventType ?? ""}${events.length > 1 ? ` · ${activeEventIndex + 1} of ${events.length}` : ""}`
      : selectedEvents.length
        ? selectedEvents.join(", ")
        : null
  const ledgerRows = buildLedgerRows({
    formData: activeFormData,
    venue,
    isDirectBooking,
    hasPackages,
    hasMenus,
    sellsByUnit,
    selectedPackageObj,
    selectedMenuObj,
    menuIncluded: selectedPackageIncludesFood,
    eventStepOrder,
    currentStepIndex: globalStep >= 2 ? eventStep : -1,
    globalStep,
    eventLabel,
  })
  const breakdown = computeBreakdown({
    formData: activeFormData,
    venue,
    vendorsDetails: vendorsDetails[activeEventIndex] || [],
    selectedPackageObj,
    selectedMenuObj,
  })
  const money = buildMoney({
    formData: activeFormData,
    venue,
    vendorsDetails: vendorsDetails[activeEventIndex] || [],
    selectedPackageObj,
    selectedMenuObj,
    requiresApproval,
    reviewTotals: isReviewStep ? reviewTotals : null,
    events,
    sent: sentActive
      ? { bookingId: sentActive.bookingId, amount: sentActive.amount }
      : bankActive
        ? { bookingId: bankActive.bookingId, amount: bankActive.amount }
        : null,
  })

  const nextKey = globalStep === 1 ? "datetime" : eventStepOrder[eventStep + 1]?.key
  const reason = disabledReason(activeKey, activeFormData, {
    functionCount: selectedEvents.length,
    needsGuestCount: guestRowApplies(venue),
    hasPackages,
  })
  const advanceDue = (isReviewStep && reviewTotals?.discountedDown) || breakdown.downPayment
  const ctaLabel = continueLabel({
    currentKey: activeKey,
    nextKey,
    valid: isStepValid,
    isReview: isReviewStep,
    requiresApproval,
    advance: advanceDue > 0 ? formatPKR(advanceDue) : null,
    functionCount: selectedEvents.length,
    phone: isPhone,
    signedIn: !!user || userLoading,
    ctx: copyCtx,
    disabledReason: reason,
  })
  // One clause on the desk (the review step carries the full sentence); the
  // phone ledger sheet gets both.
  const reassurance = requiresApproval
    ? `Nothing is charged until ${venue?.name || "the venue"} accepts`
    : "You pay the venue directly · Every payment recorded"
  const legalLine = requiresApproval
    ? `Nothing is charged until ${venue?.name || "the venue"} accepts · You pay the venue directly`
    : "You pay the venue directly · Every payment recorded"

  const venueHref = venueDetailHref(venue, venueId)
  const dirty = globalStep >= 2 && !arrived && !loading
  useBeforeUnload(dirty)
  /** Returns false (and opens the dialog) when leaving would lose work. */
  const guardNavigate = (href: string): boolean => {
    if (!dirty) return true
    setLeaveHref(href)
    return false
  }
  const leaveTo = (href: string) => {
    if (guardNavigate(href)) router.push(href)
  }

  /** Back to an earlier step, from the breadcrumb or a ledger row. Forward
      jumps are ignored — those only ever offer the way back. */
  const onJump = (key: string) => {
    const k = key === "events" ? "event" : key
    setSlotConflict(null)
    dirRef.current = -1
    if (k === "event") {
      if (!isDirectBooking && globalStep >= 2) setGlobalStep(1)
      scrollDeskTop()
      return
    }
    const target = eventStepOrder.findIndex((s) => s.key === k)
    if (target < 0 || globalStep < 2 || target >= eventStep) return
    setEvents((prev) => prev.map((e, i) => (i === activeEventIndex ? { ...e, currentStep: target } : e)))
    scrollDeskTop()
  }

  const shellApi: BookingShellApi = {
    tier,
    onJump,
    scrollBodyTo: (el, opts) => el?.scrollIntoView?.({ block: "nearest", ...(opts || {}) }),
    bodyRef: isPhone ? null : deskBodyRef,
    announce: setLiveText,
  }

  // The phone ledger opens itself once on arrival at the review step, so the
  // breakdown is never hidden on the final screen.
  useEffect(() => {
    if (!isPhone || !isReviewStep || !venueId) return
    const k = `ww-ledger-review-shown:${venueId}`
    try {
      if (sessionStorage.getItem(k)) return
      sessionStorage.setItem(k, "1")
    } catch {}
    setLedgerOpen(true)
  }, [isPhone, isReviewStep, venueId])

  const nextUnsubmittedIndex = events.findIndex((_, i) => i !== activeEventIndex && !requestSent[i] && !bankTransfer[i])
  const nextUnsubmittedEvent =
    nextUnsubmittedIndex >= 0 ? { index: nextUnsubmittedIndex, eventType: events[nextUnsubmittedIndex].eventType } : undefined
  const goToEvent = (i: number) => {
    dirRef.current = 0
    setActiveEventIndex(i)
    scrollDeskTop()
  }

  const progress = arrived ? 1 : allDisplaySteps.length ? currentDisplayStep / allDisplaySteps.length : 0
  const pillLabel = sentActive
    ? `BK-${sentActive.bookingId}`
    : breakdown.priced
      ? formatPKR(breakdown.downPayment > 0 ? breakdown.downPayment : breakdown.subtotal)
      : "Summary"

  const LOCATION_LABEL: Record<string, string> = {
    at_vendor: "At the venue",
    at_customer_home: "At our home",
    at_customer_plot: "At our plot / lawn",
    at_third_party: "Different venue",
  }
  const requirementCount =
    requirements.tags.length +
    (requirements.freeText.trim() ? 1 : 0) +
    Object.keys(requirements.dietary).length +
    Object.keys(requirements.setup || {}).length
  const sheetExtraRows = [
    ...(activeFormData.serviceLocationMode
      ? [{
          label: "Location",
          value: [LOCATION_LABEL[activeFormData.serviceLocationMode] || activeFormData.serviceLocationMode, activeFormData.serviceLocationAddress]
            .filter(Boolean)
            .join(" · "),
        }]
      : []),
    ...(requirementCount > 0
      ? [{ label: "Requirements", value: `${requirementCount} ${requirementCount === 1 ? "note" : "notes"}` }]
      : []),
  ]

  // ── Body ──
  const banners = (
    <>
      {/* 03-DRAFT-RESILIENCE — resume banner, only at the entry point.
          Keyed on the draft identity so a newly loaded draft always gets a
          fresh instance (its internal `dismissed` latch would otherwise
          survive a soft navigation). Resume restores the choices but blanks
          the active event's date and time so they are re-confirmed. */}
      {pendingDraft && globalStep === 1 && events.length === 0 && (
        <div className="mb-5">
          <DraftResumeBanner
            key={String(pendingDraft.savedAt)}
            visible={true}
            title="Resume your booking"
            meta={`Last edited ${relativeTimeAgo(pendingDraft.savedAt)} — ${pendingDraft.events.length} event${pendingDraft.events.length === 1 ? '' : 's'} · step ${pendingDraft.globalStep}`}
            warning="Your previous date hold has expired — we'll send you back to the date & time step to re-confirm."
            onResume={() => {
              const restoredEvents = pendingDraft.events.map((e, idx) =>
                idx === pendingDraft.activeEventIndex
                  ? {
                      ...e,
                      currentStep: 0,
                      formData: { ...e.formData, bookingDate: undefined, timeSlot: '', slotTemplateId: null },
                    }
                  : e
              );
              setFormData({ ...pendingDraft.formData, bookingDate: undefined, timeSlot: '', slotTemplateId: null });
              setEvents(restoredEvents);
              setActiveEventIndex(pendingDraft.activeEventIndex);
              setGlobalStep(pendingDraft.globalStep);
              setPendingDraft(null);
              toast({
                title: 'Booking restored',
                description: 'Your vendor and package choices are back. Please re-confirm date and time.',
              });
            }}
            onDiscard={() => {
              clearDraft();
              setPendingDraft(null);
            }}
          />
        </div>
      )}

      {submitError && (
        <div role="alert" tabIndex={-1} className="mb-5 rounded-[4px] border border-rose-200 bg-rose-50 p-4">
          <p className="font-bridal text-[14px] font-medium text-rose-900">We couldn&rsquo;t confirm this booking</p>
          <p className="mt-1 font-bridal text-[13px] leading-[18px] text-rose-800">{submitError.message}</p>
          {submitError.hint && <p className="mt-2 font-bridal text-[13px] leading-[18px] text-rose-800">{submitError.hint}</p>}
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            className="mt-3 h-9 rounded-[4px] border border-rose-300 bg-white px-3 font-bridal text-[12px] font-medium text-rose-900 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Dismiss and try again
          </button>
        </div>
      )}

      {/* CJ-010 — a lost slot is a blocking problem, not a notification. It
          stays on the page, names the times still free, and offers the way
          back to the date step. */}
      {slotConflict && !isSuccessStep && (
        <div role="alert" aria-live="assertive" className="mb-5 rounded-[4px] border border-rose-200 bg-rose-50 p-4">
          <p className="font-bridal text-[14px] font-medium text-rose-900">That time was just booked</p>
          <p className="mt-1 font-bridal text-[13px] leading-[18px] text-rose-800">{slotConflict.message}</p>
          {slotConflict.available.length > 0 ? (
            <>
              <p className="mt-3 font-bridal text-[13px] font-medium text-rose-900">Still free on this date:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {slotConflict.available.map((slot) => (
                  <span key={slot} className="rounded-full border border-rose-300 bg-white px-3 py-1 font-bridal text-[12.5px] font-medium text-rose-900">
                    {slot}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 font-bridal text-[13px] text-rose-800">No other times are free on this date — please choose another day.</p>
          )}
          <BridalButton
            type="button"
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSlotConflict(null)
              const dateStepIndex = eventStepOrder.findIndex((s) => s.key === "datetime")
              if (dateStepIndex >= 0) {
                dirRef.current = -1
                setEvents((prev) => prev.map((e, idx) => (idx === activeEventIndex ? { ...e, currentStep: dateStepIndex } : e)))
              }
            }}
          >
            Change date or time
          </BridalButton>
        </div>
      )}
    </>
  )

  let bodyNode: React.ReactNode
  if (loading || userLoading) {
    bodyNode = (
      <div className="space-y-6" aria-busy="true" aria-label="Loading booking">
        <div className="h-3 w-28 rounded bg-bridal-sand animate-pulse" />
        <div className="h-9 w-80 max-w-full rounded bg-bridal-sand animate-pulse" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 rounded-[4px] bg-bridal-sand animate-pulse" />
          ))}
        </div>
      </div>
    )
  } else if (error) {
    bodyNode = (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-100 bg-red-50">
          <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-display italic text-[26px] leading-tight text-bridal-charcoal">Something went wrong</h2>
        <p className="mx-auto mb-6 mt-2 max-w-sm font-bridal text-[13px] text-bridal-text-soft">{error || 'Unable to load booking details.'}</p>
        <BridalButton type="button" variant="primary" size="md" onClick={() => window.location.reload()}>
          Refresh page
        </BridalButton>
      </div>
    )
  } else if (unpricedNode) {
    bodyNode = <div className="py-6">{unpricedNode}</div>
  } else if (sentActive) {
    bodyNode = (
      <StepFrame key={`sent-${activeEventIndex}`} stepKey="sent" heading={null} direction={1}>
        <RequestSentScreen
          bookingId={sentActive.bookingId}
          venueName={venue?.name}
          bookingDate={sentActive.bookingDate}
          guestCount={sentActive.guestCount}
          amountDue={sentActive.amount}
          whatsappNumber={(venue as any)?.whatsappNumber ?? null}
          nextUnsubmittedEvent={nextUnsubmittedEvent}
          onContinueNext={goToEvent}
        />
      </StepFrame>
    )
  } else if (bankActive) {
    bodyNode = (
      <StepFrame key={`bank-${activeEventIndex}`} stepKey="bank" heading={null} direction={1}>
        <BankTransferScreen
          bookingId={bankActive.bookingId}
          amount={bankActive.amount}
          paymentType={bankActive.paymentType}
          customerEmail={bankActive.customerEmail}
          bookingDate={bankActive.bookingDate}
        />
      </StepFrame>
    )
  } else {
    bodyNode = (
      <StepFrame
        key={`${activeEventIndex}-${activeKey}`}
        stepKey={activeKey}
        heading={heading}
        direction={dirRef.current}
        focusTitle={globalStep >= 2}
      >
        {banners}
        {stepContent}
      </StepFrame>
    )
  }

  const showActionBar = !loading && !userLoading && !error && !unpricedNode && !arrived
  const atFirstStep = globalStep === 1 || (isDirectBooking && globalStep >= 2 && eventStep === 0)
  const actionBarNode = showActionBar ? (
    <ActionBar
      tier={tier}
      backVisible={!atFirstStep || isPhone}
      onBack={() => (atFirstStep ? leaveTo(venueHref) : handleBack())}
      continueLabel={ctaLabel}
      continueDisabled={!isStepValid}
      disabledReason={reason}
      onContinue={handleNext}
      submitting={isSubmitting}
      submittingLine="Checking availability with the venue…"
      reassurance={reassurance}
    />
  ) : null

  const topRight = (
    <>
      {!user && !userLoading && (
        <Link
          href="/login"
          className="inline-flex h-9 items-center rounded-[4px] px-3 font-bridal text-[12px] font-medium uppercase tracking-[0.16em] text-bridal-mauve transition-colors hover:bg-bridal-blush focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark"
        >
          Sign in
        </Link>
      )}
      <button
        type="button"
        onClick={() => leaveTo(venueHref)}
        aria-label="Close booking"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bridal-beige bg-white text-bridal-charcoal transition-colors hover:border-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </>
  )

  const tabsNode =
    events.length > 1 && globalStep >= 2 && !loading ? (
      <EventTabs events={events} activeEventIndex={activeEventIndex} onTabChange={goToEvent} />
    ) : undefined

  const counter = arrived
    ? requiresApproval ? "Request sent" : "Confirmed"
    : unpricedNode
      ? "Enquiry"
      : stepCounter(allDisplaySteps, currentDisplayStep, copyCtx)

  return (
    <BookingShellContext.Provider value={shellApi}>
      {!isPhone && (
        <BookingStage
          venue={venue}
          loading={loading || userLoading}
          rows={error || unpricedNode ? [] : ledgerRows}
          money={error || unpricedNode || loading ? null : money}
          locked={arrived}
          onJump={onJump}
          onNavigate={guardNavigate}
          venueHref={venueHref}
          packageImage={(selectedPackageObj as any)?.images?.[0] || null}
          caption={unpricedNode ? "Enquiry" : null}
        />
      )}
      {isPhone && (
        <PhoneHeader venue={venue} counter={counter} progress={progress} pillLabel={unpricedNode ? "" : pillLabel} onPill={() => setLedgerOpen(true)} />
      )}
      <BookingDesk
        ref={deskBodyRef}
        tier={tier}
        breadcrumb={
          arrived || unpricedNode ? (
            <p className="font-bridal text-[12px] text-bridal-charcoal">{counter}</p>
          ) : (
            <StepBreadcrumb steps={allDisplaySteps} currentIndex={currentDisplayStep} onJump={onJump} ctx={copyCtx} />
          )
        }
        topRight={topRight}
        tabs={tabsNode}
        actionBar={actionBarNode}
      >
        {bodyNode}
      </BookingDesk>
      {isPhone && (
        <LedgerSheet
          open={ledgerOpen}
          onOpenChange={setLedgerOpen}
          venue={venue}
          rows={ledgerRows}
          money={money}
          locked={arrived}
          onJump={onJump}
          extraRows={sheetExtraRows}
          legal={legalLine}
        />
      )}
      <LeaveDialog
        open={!!leaveHref}
        onOpenChange={(o) => {
          if (!o) setLeaveHref(null)
        }}
        onLeave={() => {
          const h = leaveHref
          setLeaveHref(null)
          if (h) router.push(h)
        }}
        signedIn={!!user}
      />
      <span className="sr-only" aria-live="polite">
        {liveText}
      </span>
    </BookingShellContext.Provider>
  )
}
