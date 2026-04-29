"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import DateSelectionStep from "@/components/booking/steps/date-selection-step"
import PackageSelectionStep from "@/components/booking/steps/package-selection-step"
import MenuSelectionStep from "@/components/booking/steps/menu-selection-step"
import VendorSelectionStep from "@/components/booking/steps/vendor-selection-step"
import PreviewStep from "@/components/booking/steps/preview-step"
import EventSelectionStep from "@/components/booking/steps/event-selection-step"
import StepIndicator from "@/components/booking/ui/step-indicator"
import EventTabs from "@/components/booking/ui/event-tabs"
import type { BookingFormData, EventVenue, EventBooking, Vendor } from "@/lib/types"
import { ArrowLeft, ArrowRight, Sparkles, MapPin, Star, RotateCcw, X, Timer, AlertTriangle } from "lucide-react"
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
import LivePricingPanel from "./ui/live-pricing-panel"
import PaymentSuccessScreen from "./steps/payment-success-screen"
import BankTransferScreen from "./steps/bank-transfer-screen"

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
  const [showAllTags, setShowAllTags] = useState(false)
  const { timeRemaining, isHolding, holdFailed, holdFailedUntil, createHold, releaseHold } = useDateHold()
  const { user, loading: userLoading } = getUser();
  const { save: saveDraft, load: loadDraft, clear: clearDraft } = useBookingDraft(venueId, user?.id ? String(user.id) : null)
  const [showDraftBanner, setShowDraftBanner] = useState(false)
  const [draftAge, setDraftAge] = useState("")

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

  // Check for saved draft once user is loaded
  useEffect(() => {
    if (userLoading || !user?.id) return
    const draft = loadDraft()
    if (draft && draft.globalStep >= 2) {
      const mins = Math.round((Date.now() - draft.savedAt) / 60000)
      setDraftAge(mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`)
      setShowDraftBanner(true)
    }
  }, [userLoading, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const resumeDraft = () => {
    const draft = loadDraft()
    if (!draft) return
    setFormData(draft.formData)
    setEvents(draft.events)
    setGlobalStep(draft.globalStep)
    setActiveEventIndex(draft.activeEventIndex)
    setShowDraftBanner(false)
  }

  const discardDraft = () => {
    clearDraft()
    setShowDraftBanner(false)
  }

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

        // Create Stripe Checkout Session and redirect — booking confirmed only after payment
        const origin = typeof window !== "undefined" ? window.location.origin : ""
        const bookingPath = `/${venueId}/booking`
        const successRedirect = `${origin}${bookingPath}?ps=1&sid={CHECKOUT_SESSION_ID}&bid=${realBookingId}&pt=down_payment`
        const cancelRedirect = `${origin}${bookingPath}?pc=1&bid=${realBookingId}`

        const checkoutResp = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/create-checkout-session`, {
          bookingId: realBookingId,
          customerEmail: currentForm.email,
          paymentType: "down_payment",
          successUrl: successRedirect,
          cancelUrl: cancelRedirect,
        })

        const checkoutData = checkoutResp.data?.data

        // Large amounts (> Rs 999,999) cannot go through Stripe — show bank transfer instructions
        if (checkoutData?.requiresBankTransfer) {
          clearDraft()
          setBankTransferData({
            bookingId: checkoutData.bookingId,
            amount: checkoutData.amount,
            paymentType: checkoutData.paymentType,
            customerEmail: checkoutData.customerEmail,
            bookingDate: checkoutData.bookingDate,
          })
          return
        }

        const checkoutUrl = checkoutData?.url
        if (!checkoutUrl) throw new Error("No checkout URL received from payment service")

        // Redirect to Stripe hosted checkout page
        window.location.href = checkoutUrl
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
          <DateSelectionStep
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
          <PackageSelectionStep
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
          <PreviewStep
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
      <div className="w-full mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden p-6 sm:p-8">
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
      <div className="w-full mx-auto max-w-5xl">
        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden p-6 sm:p-8">
          <PaymentSuccessScreen
            bookingId={paymentReturnBookingId}
            venue={venue}
            paymentType={paymentReturnType}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full mx-auto max-w-5xl space-y-4">
      {(loading || userLoading) ? (
        <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden">
          <div className="h-24 bg-neutral-100 animate-pulse" />
          <div className="p-8 space-y-6">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-8 flex-1 bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-5 w-48 bg-neutral-100 rounded animate-pulse" />
              <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-10 text-center border border-neutral-200">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">{error || 'Unable to load booking details.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <>
          {/* Draft Resume Banner */}
          {showDraftBanner && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <RotateCcw className="h-5 w-5 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-purple-900">Continue your booking?</p>
                  <p className="text-xs text-purple-600">You have an unsaved booking from {draftAge}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={resumeDraft} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                  Resume
                </button>
                <button type="button" aria-label="Discard draft" onClick={discardDraft} className="p-1.5 rounded-lg text-purple-400 hover:text-purple-600 hover:bg-purple-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          {/* Slot Hold Timer Bar */}
          {isHolding && timeRemaining > 0 && (
            <div className={`flex items-center justify-between gap-3 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              timeRemaining <= 120
                ? 'bg-red-50 border border-red-200 text-red-700'
                : timeRemaining <= 300
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-purple-50 border border-purple-200 text-purple-700'
            }`}>
              <div className="flex items-center gap-2">
                {timeRemaining <= 120
                  ? <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                  : <Timer className="w-4 h-4 shrink-0" />
                }
                <span>
                  {timeRemaining <= 120
                    ? 'Slot expiring soon! Complete your booking.'
                    : 'Your selected slot is reserved'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Progress bar */}
                <div className="w-24 h-1.5 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      timeRemaining <= 120 ? 'bg-red-500' : timeRemaining <= 300 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, (timeRemaining / (15 * 60)) * 100)}%` }}
                  />
                </div>
                <span className="font-mono font-bold tabular-nums text-base">
                  {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
          {/* Venue Banner */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 text-white">
            {(venue as any)?.coverImage && (
              <img
                src={(venue as any).coverImage}
                alt={venue?.name || ''}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold truncate">{venue?.name || 'Book Now'}</h1>
                  {(venue as any)?.location && (
                    <p className="text-sm text-purple-200 truncate">{(venue as any).location}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                {(venue as any)?.rating > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{(venue as any).rating}</span>
                  </div>
                )}
                {/* Vendor type badge */}
                <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold">
                  {isVenueBooking ? 'Venue' : (venue as any)?.type || 'Vendor'}
                </span>
                {/* Expertise / subBusinessType tags */}
                {!isVenueBooking && (() => {
                  const sub = (venue as any)?.subBusinessType
                  const tags: string[] = Array.isArray(sub) ? sub : sub ? [sub] : []
                  if (tags.length === 0) return null
                  const visible = showAllTags ? tags : tags.slice(0, 3)
                  const extra = tags.length - 3
                  return (
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {visible.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-white/90">
                          {tag}
                        </span>
                      ))}
                      {extra > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllTags(v => !v)}
                          className="px-2.5 py-1 rounded-full bg-white/20 border border-white/30 text-[11px] font-medium text-white hover:bg-white/30 transition-colors cursor-pointer"
                        >
                          {showAllTags ? 'Show less' : `+${extra} more`}
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Main Content + Pricing Panel Grid */}
          <div className={`grid grid-cols-1 gap-4 items-start ${globalStep >= 2 && !isSuccessStep ? 'lg:grid-cols-[1fr_280px]' : ''}`}>
          {/* Main Card */}
          <div className="rounded-2xl bg-white border border-neutral-200 overflow-hidden">
            {/* Step Progress */}
            {!isSuccessStep && (
              <div className="border-b border-neutral-100 px-5 py-4 overflow-x-auto">
                <StepIndicator steps={allDisplaySteps} currentStep={currentDisplayStep} />
              </div>
            )}

            {/* Event Tabs */}
            {events.length > 0 && globalStep >= 2 && (
              <div className="border-b border-neutral-100 px-5 py-3">
                <EventTabs
                  events={events}
                  activeEventIndex={activeEventIndex}
                  onTabChange={setActiveEventIndex}
                />
              </div>
            )}

            {/* Step Content */}
            <div className="p-6 sm:p-8" style={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
              {stepContent}
            </div>

            {/* Navigation Footer */}
            {!isSuccessStep && (
              <div className="border-t border-neutral-100 px-5 py-4 relative z-10">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      globalStep === 1
                        ? 'text-neutral-300 pointer-events-none'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                    onClick={handleBack}
                    disabled={globalStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <span className="text-xs text-neutral-400 hidden sm:block">
                    Step {currentDisplayStep + 1} of {allDisplaySteps.length}
                  </span>

                  <button
                    type="button"
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isSubmitting
                        ? 'bg-neutral-100 text-neutral-400'
                        : !isStepValid
                          ? 'bg-purple-200 text-purple-400 hover:bg-purple-300'
                          : isReviewStep
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    }`}
                    onClick={handleNext}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isReviewStep ? 'Confirm & Pay' : 'Continue'}
                        {!isReviewStep && <ArrowRight className="h-4 w-4" />}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Pricing Panel */}
          {globalStep >= 2 && !isSuccessStep && (
            <LivePricingPanel
              formData={activeFormData}
              venue={venue}
              vendorsDetails={vendorsDetails[activeEventIndex] || []}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
            />
          )}
          </div>{/* end grid */}

          {/* Multi-event info */}
          {globalStep >= 2 && events.length > 1 && (
            <div className="rounded-xl bg-purple-50 border border-purple-100 p-4 text-sm text-purple-700 flex items-start gap-3">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Complete the form for each event tab and submit them individually.</p>
            </div>
          )}
        </>
      )}

    </div>
  )
}
