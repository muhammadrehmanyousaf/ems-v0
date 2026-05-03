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
import { useDateHold } from "@/hooks/use-date-hold"
import { useBookingDraft } from "@/hooks/use-booking-draft"
import PaymentSuccessScreen from "./steps/payment-success-screen"
import BankTransferScreen from "./steps/bank-transfer-screen"
import BookingPaymentScreen from "./steps-v2/booking-payment-screen"

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
  const [paymentReturnBookingId, setPaymentReturnBookingId] = useState<number | null>(null)
  const [paymentReturnType, setPaymentReturnType] = useState<string>("down_payment")
  const [bankTransferData, setBankTransferData] = useState<{ bookingId: number; amount: number; paymentType: string; customerEmail?: string; bookingDate?: string } | null>(null)
  const [paymentScreenData, setPaymentScreenData] = useState<{ bookingId: number; amount: number; customerEmail: string; customerName: string; vendorName: string; bookingDate?: string } | null>(null)
  const { timeRemaining, isHolding, holdFailed, holdFailedUntil, createHold, releaseHold } = useDateHold()
  const { user, loading: userLoading } = getUser();
  const { save: saveDraft, load: loadDraft, clear: clearDraft } = useBookingDraft(venueId, user?.id ? String(user.id) : null)

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

  // Detect return from Stripe Checkout (payment_success / payment_cancelled in URL)
  useEffect(() => {
    if (typeof window === "undefined") return
    const sp = new URLSearchParams(window.location.search)
    const ps = sp.get("ps")
    const pc = sp.get("pc")
    const bid = sp.get("bid")
    const sid = sp.get("sid")
    const pt = sp.get("pt") || "down_payment"

    if (ps === "1" && bid) {
      setPaymentReturnBookingId(Number(bid))
      setPaymentReturnType(pt)
      window.history.replaceState({}, "", window.location.pathname)
      // Best-effort verify session (non-blocking)
      if (sid) {
        axiosInstance
          .get(`${BACKEND_URL}api/v1/payments/verify-checkout-session`, { params: { sessionId: sid, bookingId: bid, paymentType: pt } })
          .catch(() => {})
      }
    } else if (pc === "1" && bid) {
      window.history.replaceState({}, "", window.location.pathname)
      // Delete the unpaid booking silently, then inform the user
      axiosInstance
        .delete(`${BACKEND_URL}api/v1/bookings/${bid}/cancel-pending`)
        .catch(() => {})
      toast({
        title: "Payment Cancelled",
        description: "Your booking has been removed. Start a new booking whenever you're ready.",
        variant: "destructive",
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
              formData: { ...e.formData, bookingDate: undefined, timeSlot: '' }
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

    const vehicleQty = isCarRental ? (currentForm.vehicleQuantity || 1) : 1
    const packagePrice = (Number(venuePackage?.price) || 0) * vehicleQty
    const menuPrice = Number(venueMenu?.price) || 0

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
    if ((isCarRental || isBridalWear || isWeddingStationery) && vehicleQty > 1) mainBusinessEntry.vehicleQuantity = vehicleQty
    if (additionalPackageIds.length > 0) mainBusinessEntry.additionalPackageIds = additionalPackageIds

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
      const fallbackTotal = Number(venue?.minimumPrice) || 0
      vendorsPayload.push({
        businessId: venue.id,
        packageId: null,
        menuId: null,
        totalAmount: fallbackTotal,
        downPayment: calculateDownPayment(fallbackTotal, venue),
        specialRequests: ''
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
        downPayment: Number(vendor.downPayment)
      }))
    };
    if (currentForm.guestCount && currentForm.guestCount > 0) {
      payload.guestCount = currentForm.guestCount;
    }

    try {
      setIsSubmitting(true)
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/bookings`, payload)

      if (response.status === 201 || response.status === 200) {
        clearDraft()

        const bookingObj = response.data?.data?.booking || response.data?.data || response.data
        const realBookingId = bookingObj?.id || bookingObj?.bookingId || null

        if (!realBookingId) {
          toast({ title: "Booking Error", description: "No booking ID received. Please contact support.", variant: "destructive" })
          return
        }

        // Bank-transfer threshold check — Stripe caps Pakistan card payments
        // around Rs 999,999, so very large bookings get bank-transfer
        // instructions instead of an inline payment screen.
        const summedDownPayment = vendorsPayload.reduce((s, v) => s + (v.downPayment || 0), 0)
        if (summedDownPayment > 999999) {
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
          return
        }

        // Render the inline bridal-themed BookingPaymentScreen instead of
        // redirecting to Stripe-hosted Checkout. The screen creates a
        // PaymentIntent itself, mounts <PaymentElement>, and confirms the
        // payment client-side. Stripe webhook (PA-001 signed) marks the
        // booking paid server-side.
        setPaymentScreenData({
          bookingId: realBookingId,
          amount: summedDownPayment,
          customerEmail: currentForm.email,
          customerName: currentForm.username,
          vendorName: venue?.name || "",
          bookingDate: typeof currentForm.bookingDate === "string"
            ? currentForm.bookingDate
            : currentForm.bookingDate instanceof Date
              ? currentForm.bookingDate.toISOString()
              : undefined,
        })
      } else {
        throw new Error("Unexpected response")
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error?.response?.data?.message || "Something went wrong while submitting your booking.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Booking type detection (single source of truth) ──
  // Venue = has menus (banquet halls, wedding venues, restaurants)
  // Vendor = everything else (photographers, decorators, caterers, etc.)
  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  const hasPackages = !!venue?.packages && Array.isArray(venue.packages) && venue.packages.length > 0
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
      steps.push({ key: "menu", title: "Menu" })
      steps.push({ key: "review", title: "Review" })
      steps.push({ key: "success", title: "Success" })
    } else {
      // VENDOR flow: Date → Packages → Review → Success (NO vendor selection)
      if (hasPackages) steps.push({ key: "packages", title: "Package Selection" })
      steps.push({ key: "review", title: "Review" })
      steps.push({ key: "success", title: "Success" })
    }

    return steps
  }, [isVenueBooking, hasPackages])

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
        // Car rental: require a vehicle to be selected (selectedPackage), service packages are optional
        const carPkgs = (venue?.packages || []).filter((p: any) => {
          const f = !Array.isArray(p.features) ? p.features as Record<string, string[]> : {}
          return !!f.vehicleType?.[0]
        })
        if (isCarRental && carPkgs.length > 0) return currentForm.selectedPackage !== ""
        return currentForm.selectedPackage !== ""
      }
      case 'vendors':
        return true // optional step
      case 'menu':
        return true // optional step
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

  // Show payment success screen when returning from Stripe
  if (paymentReturnBookingId) {
    return (
      <div className="w-full">
        <div className="rounded-md bg-bridal-cream border border-bridal-beige overflow-hidden p-6 sm:p-8 lg:p-10 shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
          <PaymentSuccessScreen
            bookingId={paymentReturnBookingId}
            venue={venue}
            paymentType={paymentReturnType}
          />
        </div>
      </div>
    )
  }

  // Inline bridal-themed payment screen (replaces redirect to Stripe Checkout).
  if (paymentScreenData) {
    return (
      <div className="w-full">
        <div className="rounded-md bg-bridal-cream border border-bridal-beige overflow-hidden p-5 sm:p-6 lg:p-8 shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
          <BookingPaymentScreen
            bookingId={paymentScreenData.bookingId}
            amount={paymentScreenData.amount}
            customerEmail={paymentScreenData.customerEmail}
            customerName={paymentScreenData.customerName}
            vendorName={paymentScreenData.vendorName}
            bookingDate={paymentScreenData.bookingDate}
            paymentType="down_payment"
            onSuccess={() => {
              setPaymentReturnBookingId(paymentScreenData.bookingId)
              setPaymentReturnType("down_payment")
              setPaymentScreenData(null)
            }}
            onCancel={() => {
              axiosInstance
                .delete(`${BACKEND_URL}api/v1/bookings/${paymentScreenData.bookingId}/cancel-pending`)
                .catch(() => {})
              setPaymentScreenData(null)
            }}
          />
        </div>
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
          {/* Slot Hold Timer Bar — minimal, semantic colors */}
          {isHolding && timeRemaining > 0 && (
            <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border transition-colors ${
              timeRemaining <= 120
                ? 'bg-red-50 border-red-200 text-red-700'
                : timeRemaining <= 300
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <div className="flex items-center gap-2 text-[12.5px] font-medium">
                {timeRemaining <= 120
                  ? <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  : <Timer className="w-4 h-4 shrink-0" />
                }
                <span>
                  {timeRemaining <= 120
                    ? 'Slot expiring soon — complete your booking'
                    : 'Your slot is reserved'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-20 h-1 rounded-full bg-current/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-current transition-all duration-1000"
                    style={{ width: `${Math.min(100, (timeRemaining / (15 * 60)) * 100)}%` }}
                  />
                </div>
                <span className="text-[14px] font-semibold tabular-nums leading-none">
                  {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

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

              {/* Step body — tightened padding so compressed steps don't sit
                  in a sea of empty space */}
              <div
                className="p-4 sm:p-5 lg:p-6"
                style={{ position: "relative", zIndex: 2, pointerEvents: "auto" }}
              >
                {stepContent}
              </div>

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
                      {isSubmitting
                        ? "Processing…"
                        : isReviewStep
                        ? "Pay & confirm"
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
