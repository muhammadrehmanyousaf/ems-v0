"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import DateTimeStepV2 from "@/components/booking/steps-v2/date-time-step"
import PackageStepV2 from "@/components/booking/steps-v2/package-step"
import ReviewStepV2 from "@/components/booking/steps-v2/review-step"
import MenuSelectionStep from "@/components/booking/steps/menu-selection-step"
import VendorSelectionStep from "@/components/booking/steps/vendor-selection-step"
import EventSelectionStep from "@/components/booking/steps/event-selection-step"
import EventTabs from "@/components/booking/ui/event-tabs"
import BookingTopBar from "@/components/booking/ui/booking-rail"
import MobileSummaryBar from "@/components/booking/ui/mobile-summary-bar"
import type { BookingFormData, EventVenue, EventBooking, Vendor } from "@/lib/types"
import { ArrowLeft, ArrowRight, Sparkles, Timer, AlertTriangle } from "lucide-react"
import { BridalButton } from "@/components/bridal/bridal-button"
import { useParams } from "next/navigation"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "../ui/use-toast"
import { getUser } from "@/hooks/getLoggedinUser"
import axiosInstance from '@/lib/axiosConfig'
import SuccessStep from "./steps/success-step"
import VendorSuccessStep from "./steps/vendor-success-step"
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
import VendorInquiryDialog from "@/components/VendorInquiryDialog"
import { useDateHold } from "@/hooks/use-date-hold"
import { useBookingDraft } from "@/hooks/use-booking-draft"
import BankTransferScreen from "./steps/bank-transfer-screen"
// WW-BOOKING-MODE — venues that accept a booking before asking for payment.
import RequestSentScreen from "./steps/request-sent-screen"
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
  const [bankTransferData, setBankTransferData] = useState<{ bookingId: number; amount: number; paymentType: string; customerEmail?: string; bookingDate?: string } | null>(null)
  // WW-BOOKING-MODE — set instead of bankTransferData when the venue accepts
  // bookings before payment. Nothing is charged until they do.
  const [requestSentData, setRequestSentData] = useState<{ bookingId: number; amount: number; bookingDate?: string; guestCount?: number } | null>(null)
  // WW-PRICE0 — drives the price-on-request inquiry dialog on this page.
  const [inquiryOpen, setInquiryOpen] = useState(false)
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
        if (requiresVendorApproval(venue)) {
          setRequestSentData({
            bookingId: realBookingId,
            amount: summedDownPayment,
            bookingDate: typeof currentForm.bookingDate === "string"
              ? currentForm.bookingDate
              : currentForm.bookingDate instanceof Date
                ? currentForm.bookingDate.toISOString()
                : undefined,
            guestCount: currentForm.guestCount,
          })
          return
        }

        setBankTransferData({
          bookingId: realBookingId,
          amount: summedDownPayment,
          paymentType: "down_payment",
          customerEmail: currentForm.email,
          bookingDate: typeof currentForm.bookingDate === "string"
            ? currentForm.bookingDate
            : currentForm.bookingDate instanceof Date
              ? currentForm.bookingDate.toISOString()
              : undefined,
        })
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
      steps.push({ key: "vendors", title: "Additional Vendors" })
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

    window.scrollTo({ top: 0, behavior: 'smooth' })

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
        const newEvents: EventBooking[] = selectedEvents.map((evt) => ({
          eventType: evt,
          formData: { ...base, eventType: evt },
          currentStep: 0,
          isSubmitted: false,
        }))
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  // Show bank transfer instructions for large amounts (> Rs 999,999)
  // WW-BOOKING-MODE — the venue reviews before payment, so this replaces the
  // transfer screen entirely. Placed FIRST so it wins if both are somehow set.
  if (requestSentData) {
    return (
      <div className="w-full">
        <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden p-6 sm:p-8 lg:p-10 shadow-sm">
          <RequestSentScreen
            bookingId={requestSentData.bookingId}
            venueName={venue?.name}
            bookingDate={requestSentData.bookingDate}
            guestCount={requestSentData.guestCount}
            amountDue={requestSentData.amount}
            whatsappNumber={(venue as any)?.whatsappNumber ?? null}
          />
        </div>
      </div>
    )
  }

  if (bankTransferData) {
    return (
      <div className="w-full">
        <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden p-6 sm:p-8 lg:p-10 shadow-sm">
          <BankTransferScreen
            bookingId={bankTransferData.bookingId}
            amount={bankTransferData.amount}
            paymentType={bankTransferData.paymentType}
            customerEmail={bankTransferData.customerEmail}
            bookingDate={bankTransferData.bookingDate}
          />
        </div>
      </div>
    )
  }

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
  if (!loading && venue && (isUnpricedVendor(venue as any) || wantsQuote || inquiryOnly)) {
    return (
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
    )
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {(loading || userLoading) ? (
        <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
          <div className="h-16 bg-zinc-100 animate-pulse" />
          <div className="p-8 space-y-6">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-7 flex-1 bg-zinc-100 rounded-md animate-pulse" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-5 w-48 bg-zinc-100 rounded animate-pulse" />
              <div className="h-12 bg-zinc-100 rounded-md animate-pulse" />
              <div className="h-12 bg-zinc-100 rounded-md animate-pulse" />
              <div className="h-12 bg-zinc-100 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white p-12 text-center border border-zinc-200 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mb-2">Something went wrong</h2>
          <p className="text-[13px] text-zinc-500 max-w-sm mx-auto mb-6">{error || 'Unable to load booking details.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[13px] font-medium transition-colors"
          >
            Refresh page
          </button>
        </div>
      ) : (
        <>
          {/* WW-DIRECT-PAY — the hold bar, rewritten for a 48-hour hold.
              A ticking MM:SS countdown was right for a 15-minute checkout. It
              is wrong now, in two ways: 48h renders as "2880:00", and a clock
              running down next to a wedding date manufactures urgency the
              product no longer has any reason to apply. Nobody is being asked
              to pay on this screen.
              So the default state is a plain statement that the date is held,
              and the countdown appears only in the last hour, when it is a
              real warning rather than a pressure tactic. */}
          {isHolding && timeRemaining > 0 && (() => {
            const HOUR = 3600
            const urgent = timeRemaining <= 15 * 60
            const soon = timeRemaining <= HOUR
            const hours = Math.floor(timeRemaining / HOUR)
            const mins = Math.floor((timeRemaining % HOUR) / 60)
            return (
              <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
                urgent
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : soon
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <div className="flex items-center gap-2 text-[12.5px] font-medium">
                  {urgent
                    ? <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                    : <Timer className="w-4 h-4 shrink-0" />
                  }
                  <span>
                    {urgent
                      ? 'Your date is about to be released — send your request now'
                      : soon
                        ? 'Your date is held for a little under an hour'
                        : 'Your date is held while you finish'}
                  </span>
                </div>
                {soon && (
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums leading-none">
                    {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                  </span>
                )}
                {!soon && (
                  <span className="shrink-0 text-[12px] font-medium tabular-nums leading-none opacity-80">
                    {hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`}
                  </span>
                )}
              </div>
            )
          })()}

          {/* Stacked layout: horizontal top bar on top, step body below at
              full width. The top bar carries vendor identity + step list +
              trust badges. */}
          <div className="space-y-4 lg:space-y-5">

            {/* Top bar */}
            <BookingTopBar
              venue={venue}
              steps={allDisplaySteps}
              currentStep={currentDisplayStep}
              isVenueBooking={isVenueBooking}
            />

            {/* 03-DRAFT-RESILIENCE — resume banner.
                Shown only when a saved draft exists AND the couple is still
                at the entry point (globalStep===1 with no events yet).
                Resume restores vendor/package/menu choices but resets the
                active event's date+time so the stale 15-min slot hold is
                re-acquired on the next step. */}
            {pendingDraft && globalStep === 1 && events.length === 0 && (
              <DraftResumeBanner
                // QA #3 — key on the draft identity so a newly-loaded draft
                // always gets a FRESH banner instance. The shared banner keeps an
                // internal `dismissed` latch (set on Resume/Discard); without a
                // key that latch could survive a soft navigation (Home → back to
                // vendor → Book) and leave the Resume button inert. Re-keying
                // guarantees dismissed=false whenever a new draft appears, and
                // changes nothing for any other form using the banner.
                key={String(pendingDraft.savedAt)}
                visible={true}
                title="Resume your booking"
                meta={`Last edited ${relativeTimeAgo(pendingDraft.savedAt)} — ${pendingDraft.events.length} event${pendingDraft.events.length === 1 ? '' : 's'} · step ${pendingDraft.globalStep}`}
                warning="Your previous date hold has expired — we'll send you back to the date & time step to re-confirm."
                onResume={() => {
                  // Restore form + events, but blank the active event's
                  // date/time so the user re-picks (and re-holds) the slot.
                  const restoredEvents = pendingDraft.events.map((e, idx) =>
                    idx === pendingDraft.activeEventIndex
                      ? {
                          ...e,
                          currentStep: 0,
                          formData: {
                            ...e.formData,
                            bookingDate: undefined,
                            timeSlot: '',
                            slotTemplateId: null,
                          },
                        }
                      : e
                  );
                  setFormData({
                    ...pendingDraft.formData,
                    bookingDate: undefined,
                    timeSlot: '',
                    slotTemplateId: null,
                  });
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
            )}

            {/* Step body — full-width bridal cream card */}
            <div className="min-w-0 rounded-md bg-bridal-cream border border-bridal-beige shadow-[0_8px_24px_-20px_rgba(176,125,84,0.45)] overflow-hidden">

              {/* Event Tabs */}
              {events.length > 0 && globalStep >= 2 && (
                <div className="border-b border-zinc-100 px-5 sm:px-7 py-2.5">
                  <EventTabs
                    events={events}
                    activeEventIndex={activeEventIndex}
                    onTabChange={setActiveEventIndex}
                  />
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="mx-4 mt-4 rounded-lg border border-rose-300 bg-rose-50 p-4 sm:mx-5 lg:mx-6"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <p className="text-sm font-semibold text-rose-900">We couldn&rsquo;t confirm this booking</p>
                  <p className="mt-1 text-sm text-rose-800">{submitError.message}</p>
                  {submitError.hint && (
                    <p className="mt-2 text-sm text-rose-800">{submitError.hint}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="mt-3 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    Dismiss and try again
                  </button>
                </div>
              )}

              {/* Step body — tightened padding so compressed steps don't sit
                  in a sea of empty space */}
              <div
                className="p-4 sm:p-5 lg:p-6"
                style={{ position: "relative", zIndex: 2, pointerEvents: "auto" }}
              >
                {stepContent}
              </div>

              {/* CJ-010 — slot conflict. Rendered inline, directly above the
                  action the customer just pressed, and persistent: losing a slot
                  is a blocking problem, not a transient notification. Lists the
                  times the backend confirmed are still free so the next step is
                  obvious rather than a dead end. */}
              {slotConflict && !isSuccessStep && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="border-t border-rose-200 bg-rose-50 px-5 sm:px-7 py-4"
                >
                  <p className="text-sm font-semibold text-rose-900">
                    That time was just booked
                  </p>
                  <p className="mt-1 text-sm text-rose-800">{slotConflict.message}</p>

                  {slotConflict.available.length > 0 ? (
                    <>
                      <p className="mt-3 text-sm font-medium text-rose-900">
                        Still free on this date:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {slotConflict.available.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-full border border-rose-300 bg-white px-3 py-1 text-sm font-medium text-rose-900"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-rose-800">
                      No other times are free on this date — please choose another day.
                    </p>
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
                        setEvents((prev) =>
                          prev.map((e, idx) =>
                            idx === activeEventIndex ? { ...e, currentStep: dateStepIndex } : e,
                          ),
                        )
                      }
                    }}
                  >
                    Change date or time
                  </BridalButton>
                </div>
              )}

              {/* Footer — Back · Continue, homepage BridalButton language */}
              {!isSuccessStep && (
                <div className="border-t border-bridal-beige bg-bridal-ivory/60 px-5 sm:px-7 py-3 relative z-10">
                  <div className="flex items-center justify-between gap-3">
                    <BridalButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      disabled={globalStep === 1}
                      className={globalStep === 1 ? "invisible" : ""}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </BridalButton>

                    <BridalButton
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleNext}
                      loading={isSubmitting}
                      disabled={!isStepValid && !isSubmitting}
                    >
                      {/* WW-APPROVE-VS-CONFIRM — the label has to match what the
                          click actually does. In request mode it sends a request
                          and charges nothing: the very next screen says "Nothing
                          has been charged", so "Pay & confirm" was a promise the
                          flow immediately contradicted. */}
                      {isSubmitting
                        ? "Processing…"
                        : isReviewStep
                        ? (requiresVendorApproval(venue) ? "Send request" : "Pay & confirm")
                        : "Continue"}
                      {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
                    </BridalButton>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile bottom summary bar — replaces sticky desktop sidebar */}
          {globalStep >= 2 && !isSuccessStep && (
            <MobileSummaryBar
              formData={activeFormData}
              venue={venue}
              vendorsDetails={vendorsDetails[activeEventIndex] || []}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
            />
          )}

          {/* Multi-event info banner */}
          {globalStep >= 2 && events.length > 1 && (
            <div className="rounded-xl bg-white border border-zinc-200 p-4 text-[13px] text-zinc-700 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-zinc-100 inline-flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-zinc-900 mb-0.5">Multiple events booked</p>
                <p className="text-zinc-500">Complete the form for each event tab and submit them individually.</p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}
