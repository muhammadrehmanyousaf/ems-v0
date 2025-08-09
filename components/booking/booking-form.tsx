"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import UserInfoStep from "@/components/booking/steps/user-info-step"
import DateSelectionStep from "@/components/booking/steps/date-selection-step"
import PackageSelectionStep from "@/components/booking/steps/package-selection-step"
import MenuSelectionStep from "@/components/booking/steps/menu-selection-step"
import VendorSelectionStep from "@/components/booking/steps/vendor-selection-step"
import PreviewStep from "@/components/booking/steps/preview-step"
import EventSelectionStep from "@/components/booking/steps/event-selection-step"
import StepIndicator from "@/components/booking/ui/step-indicator"
import EventTabs from "@/components/booking/ui/event-tabs"
import type { BookingFormData, EventVenue, EventBooking, Vendor } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { set } from "date-fns"
import axios from "axios"
import { usePathname } from "next/navigation"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "../ui/use-toast"
import { getUser } from "@/hooks/getLoggedinUser"
import axiosInstance from '@/lib/axiosConfig';
import SuccessStep from "./steps/success-step"
import { Icons } from "../ui/icons"
import { VendorAPI } from "@/lib/api/vendors"

// Steps are dynamic based on booking type (venue vs other)

export default function BookingForm() {
  // Global pre-events steps: 0=User, 1=Event Selection; Afterwards, per-event steps tracked in each event
  const [globalStep, setGlobalStep] = useState(0)
  const [formData, setFormData] = useState<BookingFormData>({
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    eventType: "",
    bookingDate: undefined,
    timeSlot: "",
    guestCount: 0,
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

  const pathname = usePathname();

  // Extract ID from the URL, e.g., /3/booking -> "3"
  const venueId = useMemo(() => {
    const parts = pathname?.split('/');
    return parts?.[1] || null;
  }, [pathname]);

  const [venue, setVenue] = useState<EventVenue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, loading: userLoading, error: userError } = getUser();

  const fetchVenue = async (id: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}api/v1/businesses/${id}`);
      setVenue(response.data.data); // Fix: use .data.data
    } catch (err: any) {
      console.error('Failed to fetch venue:', err);
      setError('Failed to load venue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) {
      fetchVenue(venueId);
    } else {
      setLoading(false);
      setError('Invalid venue ID.');
    }
  }, [venueId]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber
      }))
    }
  }, [user])

  // Compute selected package/menu based on the active form (global or current event)
  const currentFormForSelection: BookingFormData = (events.length > 0 && events[activeEventIndex]?.formData)
    ? events[activeEventIndex].formData
    : formData
  const selectedPackageObj = venue?.packages?.find((pkg) => String(pkg.id) === String(currentFormForSelection.selectedPackage));
  const selectedMenuObj = venue?.menus.find((menu) => String(menu.id) === String(currentFormForSelection.selectedMenu));

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
    // Determine current form data: if multi-event started, use active event's data
    const currentForm: BookingFormData = events.length > 0 ? events[activeEventIndex].formData : formData
    const currentVendorsDetails: Vendor[] = events.length > 0 ? (vendorsDetails[activeEventIndex] || []) : []

    // Build vendors array for payload
    const venuePackage = venue?.packages?.find((pkg) => pkg.id === currentForm.selectedPackage)
    const venueMenu = venue?.menus?.find((menu) => menu.id === currentForm.selectedMenu)

    const vendorsPayload: any[] = []
    // Push main venue/vendor
    vendorsPayload.push({
      businessId: venue?.id,
      packageId: currentForm.selectedPackage,
      menuId: venueMenu ? currentForm.selectedMenu : undefined,
      totalAmount: (venuePackage?.price || 0) + (venueMenu?.price || 0),
      downPayment: venue?.downPayment || 0,
      specialRequests: ''
    })

    // Additional vendors (from selected vendor packages, mapped to actual vendor/business)
    if (currentForm.selectedVendorPackages && currentForm.selectedVendorPackages.length > 0) {
      currentForm.selectedVendorPackages.forEach((pkgId: any) => {
        const ownerVendor = currentVendorsDetails.find(v => (v.packages || []).some(p => p.id === pkgId))
        const ownerPackage = ownerVendor?.packages?.find(p => p.id === pkgId)
        vendorsPayload.push({
          businessId: ownerVendor?.id,
          packageId: pkgId,
          menuId: undefined,
          totalAmount: ownerPackage?.price || 0,
          downPayment: 0,
          specialRequests: ''
        })
      })
    }

    const payload = {
      customerName: currentForm.username,
      customerEmail: currentForm.email,
      customerPhone: currentForm.phoneNumber,
      vendorId: venue?.vendor.id,
      bookingDate: currentForm.bookingDate,
      bookingTime: currentForm.timeSlot,
      vendors: vendorsPayload
    };

    try {
      setIsSubmitting(true); // Optional: manage a loading state
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/bookings`, payload);

      if (response.status === 201 || response.status === 200) {
        toast({ title: 'Booking Confirmed', description: 'Your booking has been submitted successfully.' });
        // Move active event to success step
        if (globalStep >= 2) {
          setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, currentStep: eventStepOrder.length - 1, isSubmitted: true } : e))
        } else {
          setGlobalStep(2)
        }
        // Mark active event as submitted if multi
        // (Handled above)
      } else {
        throw new Error('Unexpected response');
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      toast({
        title: 'Submission Failed',
        description: error?.response?.data?.message || 'Something went wrong while submitting your booking.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false); // Turn off loading indicator
    }
  };

  const isStepValid = useMemo(() => {
    const inEventPhase = globalStep >= 2
    const currentForm: BookingFormData = inEventPhase && events.length > 0 ? events[activeEventIndex].formData : formData
    const eventStep = inEventPhase ? (events[activeEventIndex]?.currentStep ?? 0) : 0
    if (!inEventPhase) {
      switch (globalStep) {
        case 0:
        // Personal Info: name, phone & email are required
        return (
          currentForm.username.trim() !== "" &&
          currentForm.phoneNumber.trim() !== "" &&
          currentForm.email.trim() !== ""
        )
        case 1:
        // Event Selection: must pick at least one event
        return selectedEvents.length > 0
        default:
          return true
      }
    } else {
      // Event phase validation by eventStep
      switch (eventStep) {
        case 0: // Date & Time
          return (
            !!currentForm.bookingDate &&
            currentForm.timeSlot !== "" &&
            currentForm.guestCount > 0
          )
        default:
          return true
      }
    }
  }, [globalStep, formData, events, activeEventIndex, selectedEvents])

  // Dynamic steps based on booking type for headers
  const isVenueBooking = !!venue?.menus && Array.isArray(venue?.menus) && (venue?.menus?.length ?? 0) > 0
  const stepOrder = useMemo(() => {
    const steps = [
      { key: "user", title: "Personal Information" },
      { key: "events", title: "Event Selection" },
    ] as { key: string; title: string }[]
    return steps
  }, [isVenueBooking])

  const eventStepOrder = useMemo(() => {
    const steps: { key: string; title: string }[] = [{ key: "datetime", title: "Date & Time" }]
    if (isVenueBooking) steps.push({ key: "vendors", title: "Vendors" })
    steps.push({ key: "packages", title: "Packages" })
    if (isVenueBooking) steps.push({ key: "menu", title: "Menu" })
    steps.push({ key: "review", title: "Review" }, { key: "success", title: "Success" })
    return steps
  }, [isVenueBooking])

  // Helper to update form for active event or single
  const updateCurrentForm = (updater: React.SetStateAction<BookingFormData>) => {
    if (events.length === 0) {
      setFormData(updater)
    } else {
      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, formData: typeof updater === 'function' ? (updater as any)(e.formData) : updater } : e))
    }
  }

  // Step content
  let stepContent = null
  if (globalStep === 0) {
      stepContent = (
        <UserInfoStep
          formData={events.length ? events[activeEventIndex].formData : formData}
          updateFormData={updateCurrentForm}
        />
      )
  } else if (globalStep === 1) {
      stepContent = (
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
    // Event phase - per event step
    const eventStep = events[activeEventIndex]?.currentStep ?? 0
    switch (eventStep) {
      case 0:
        stepContent = (
          <DateSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={updateCurrentForm}
          />
        )
        break
      case 1:
        stepContent = isVenueBooking ? (
          <VendorSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={(data) => updateCurrentForm(prev => ({ ...prev, ...data }))}
          />
        ) : (
          <PackageSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={updateCurrentForm}
            venue={venue}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        )
        break
      case 2:
        stepContent = isVenueBooking ? (
          <PackageSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={updateCurrentForm}
            venue={venue}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        ) : (
          <PreviewStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            selectedPackageObj={selectedPackageObj}
            selectedMenuObj={selectedMenuObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        )
        break
      case 3:
        stepContent = isVenueBooking ? (
          <MenuSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={updateCurrentForm}
            venue={venue}
          />
        ) : null
        break
      case 4:
        stepContent = (
          <PreviewStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            selectedPackageObj={selectedPackageObj}
            selectedMenuObj={selectedMenuObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
          />
        )
        break
      case 5:
        stepContent = (
          <SuccessStep
            formData={events.length ? events[activeEventIndex].formData : formData}
          />
        )
        break
      default:
        stepContent = null
    }
  }

  // Step header for current step
  const header = globalStep < 2 ? stepOrder[globalStep] : eventStepOrder[events[activeEventIndex]?.currentStep ?? 0]

  const handleNext = () => {
    if (globalStep < 1) {
      setGlobalStep((s) => s + 1)
      return
    }
    if (globalStep === 1) {
      // Initialize per-event flows
      if (selectedEvents.length > 0) {
        const base = formData
        const newEvents: EventBooking[] = selectedEvents.map((evt) => ({
          eventType: evt,
          formData: { ...base, eventType: evt },
          currentStep: 0, // Date & Time
          isSubmitted: false,
        }))
        setEvents(newEvents)
        setActiveEventIndex(0)
        setGlobalStep(2)
      }
      return
    }
    // Event phase next
    const eventStep = events[activeEventIndex]?.currentStep ?? 0
    const lastEventStep = eventStepOrder.length - 2 // review is second last
    if (eventStep < lastEventStep) {
      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, currentStep: eventStep + 1 } : e))
    } else if (eventStep === lastEventStep) {
      handleSubmit()
    }
  }
  return (
    <div className="mx-auto max-w-3xl">
      {(loading || userLoading) ?
        <div className="h-[500px] w-full flex items-center justify-center">
            <span className="flex items-center gap-3 text-lg font-medium">
              <Icons.spinner className="w-12 h-12 mr-2 animate-spin text-blue-500" />
              Loading form
            </span>
          </div> :
        (error || userError) ?
          <div className="rounded-md bg-red-50 p-4 text-center">
            <h2 className="text-red-700 font-semibold text-lg">
              Something went wrong. Please try again later.
            </h2>
            <p className="text-sm text-red-600 mt-1">
              Your booking cannot be processed right now. Please refresh the page or try again in a few minutes.
            </p>
          </div> :
        <div className="rounded-lg bg-white shadow-lg">
          {/* Multi-event tabs (visible after selection) */}
          {events.length > 0 && globalStep >= 2 && (
            <div className="border-b border-gray-200 bg-gray-50 p-4">
              <EventTabs
                events={events}
                activeEventIndex={activeEventIndex}
                onTabChange={setActiveEventIndex}
              />
            </div>
          )}
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                {header?.title && <h2 className="text-lg font-medium text-gray-800">{header.title}</h2>}
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:p-6">
            {stepContent}
          </div>

          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  if (globalStep > 0 && globalStep < 2) {
                    setGlobalStep((s) => Math.max(0, s - 1))
                    return
                  }
                  if (globalStep >= 2) {
                    const eventStep = events[activeEventIndex]?.currentStep ?? 0
                    if (eventStep > 0) {
                      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, currentStep: eventStep - 1 } : e))
                    } else {
                      setGlobalStep(1)
                    }
                  }
                }}
                disabled={globalStep === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleNext}
                disabled={!isStepValid || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (
                  globalStep < 2
                    ? 'Next'
                    : ((events[activeEventIndex]?.currentStep ?? 0) === (eventStepOrder.length - 2) ? 'Submit' : 'Next')
                )}
                {(globalStep < 2 || (events[activeEventIndex]?.currentStep ?? 0) !== (eventStepOrder.length - 2)) && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      }

      {/* Info message */}
      {globalStep >= 2 && events.length > 0 && (
        <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          <p>
            You're booking multiple events. Complete the form for each event tab and submit them individually.
          </p>
        </div>
      )}
    </div>
  )
}
