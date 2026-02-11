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
import VendorSuccessStep from "./steps/vendor-success-step"
import { Icons } from "../ui/icons"
import { VendorAPI } from "@/lib/api/vendors"
import PaymentSelectionModal from "./payment-selection-modal"
import StripePayment from "./stripe-payment"

// Steps are dynamic based on booking type (venue vs vendor)

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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showStripePayment, setShowStripePayment] = useState(false)
  const [selectedPaymentType, setSelectedPaymentType] = useState<'down_payment' | 'full_payment' | null>(null)
  const [bookingId, setBookingId] = useState<number | null>(null)
  const { user, loading: userLoading, error: userError } = getUser();

  const fetchVenue = async (id: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}api/v1/businesses/${id}`);
      const data = response.data.data;
      setVenue(data); // This can be either EventVenue or Vendor type
    } catch (err: any) {
      console.error('Failed to fetch business:', err);
      setError('Failed to load business details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (venueId) {
      fetchVenue(venueId);
    } else {
      setLoading(false);
      setError('Invalid business ID.');
    }
  }, [venueId]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        username: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber || ""
      }))
    }
  }, [user])

  // Compute selected package/menu based on the active form (global or current event)
  const currentFormForSelection: BookingFormData = (events.length > 0 && events[activeEventIndex]?.formData)
    ? events[activeEventIndex].formData
    : formData
  
  // Handle both EventVenue and Vendor types for packages and menus
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
    // Determine current form data: if multi-event started, use active event's data
    const currentForm: BookingFormData = events.length > 0 ? events[activeEventIndex].formData : formData
    const currentVendorsDetails: Vendor[] = events.length > 0 ? (vendorsDetails[activeEventIndex] || []) : []

    // Build vendors array for payload
    const venuePackage = venue?.packages?.find((pkg) => pkg.id === currentForm.selectedPackage)
    const venueMenu = venue?.menus?.find((menu) => menu.id === currentForm.selectedMenu)

    // Ensure we have a valid business ID
    if (!venue?.id) {
      toast({
        title: 'Booking Error',
        description: 'Invalid business information. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    const vendorsPayload: any[] = []
    
    // Push main venue/vendor - ensure businessId is always set
    const mainBusinessEntry = {
      businessId: venue.id, // This should always be the venue/vendor ID
      packageId: currentForm.selectedPackage || null,
      menuId: venueMenu ? currentForm.selectedMenu : null,
      totalAmount: (venuePackage?.price || 0) + (venueMenu?.price || 0),
      downPayment: venue?.downPayment || 0,
      specialRequests: ''
    }
    
    // Only add main business entry if there's a package or menu selected
    if (mainBusinessEntry.packageId || mainBusinessEntry.menuId) {
      vendorsPayload.push(mainBusinessEntry)
    }

    // Additional vendors (from selected vendor packages, mapped to actual vendor/business)
    if (currentForm.selectedVendorPackages && currentForm.selectedVendorPackages.length > 0) {
      currentForm.selectedVendorPackages.forEach((pkgId: any) => {
        const ownerVendor = currentVendorsDetails.find(v => (v.packages || []).some(p => p.id === pkgId))
        const ownerPackage = ownerVendor?.packages?.find(p => p.id === pkgId)
        
        if (ownerVendor?.id && pkgId) {
          vendorsPayload.push({
            businessId: ownerVendor.id,
            packageId: pkgId,
            menuId: null,
            totalAmount: ownerPackage?.price || 0,
            downPayment: 0,
            specialRequests: ''
          })
        }
      })
    }

    // Ensure we have at least one vendor entry
    if (vendorsPayload.length === 0) {
      // If no packages/menus selected, create a basic entry with just the business
      vendorsPayload.push({
        businessId: venue.id,
        packageId: null,
        menuId: null,
        totalAmount: 0,
        downPayment: venue?.downPayment || 0,
        specialRequests: ''
      })
    }

    // Validate that all entries have valid businessId
    const invalidEntries = vendorsPayload.filter(vendor => !vendor.businessId || vendor.businessId === null || vendor.businessId === undefined);
    if (invalidEntries.length > 0) {
      toast({
        title: 'Booking Error',
        description: 'Some vendor information is invalid. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      customerName: currentForm.username,
      customerEmail: currentForm.email,
      customerPhone: currentForm.phoneNumber,
      vendorId: venue?.vendor?.id || venue?.id, // Handle both venue and vendor cases
      bookingDate: currentForm.bookingDate,
      bookingTime: currentForm.timeSlot,
      vendors: vendorsPayload.map(vendor => ({
        ...vendor,
        businessId: Number(vendor.businessId), // Ensure businessId is a number
        packageId: vendor.packageId ? Number(vendor.packageId) : null,
        menuId: vendor.menuId ? Number(vendor.menuId) : null,
        totalAmount: Number(vendor.totalAmount),
        downPayment: Number(vendor.downPayment)
      }))
    };

    try {
      setIsSubmitting(true); // Optional: manage a loading state
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/bookings`, payload);

      if (response.status === 201 || response.status === 200) {
        toast({ title: 'Booking Confirmed', description: 'Your booking has been submitted successfully.' });
        
        // Store the booking response in the events state
        const bookingResponse = response.data;

        // Move active event to success step and store booking response
        if (globalStep >= 2) {
          setEvents(prev => prev.map((e, idx) => 
            idx === activeEventIndex 
              ? { 
                  ...e, 
                  currentStep: eventStepOrder.length - 1, 
                  isSubmitted: true,
                  bookingResponse: bookingResponse // Store the booking response
                } 
              : e
          ))
        } else {
          setGlobalStep(2)
        }
        // Mark active event as submitted if multi
        // (Handled above)
        
        // Store booking ID for payment processing
        // Try multiple possible locations for booking ID
        let realBookingId = null
        
        if (response.data?.data?.id) {
          realBookingId = response.data.data.id
        } else if (response.data?.id) {
          realBookingId = response.data.id
        } else if (response.data?.bookingId) {
          realBookingId = response.data.bookingId
        } else if (response.data?.data?.bookingId) {
          realBookingId = response.data.data.bookingId
        }
        
        if (realBookingId) {
          setBookingId(realBookingId)
          
          // Show payment modal after successful booking
          setTimeout(() => {
            setShowPaymentModal(true)
          }, 1000)
        } else {
          try {
            const listResp = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`)
            const bookingsList = listResp?.data?.data || []
            // Pick latest by createdAt or highest id
            let fallbackId: number | null = null
            if (Array.isArray(bookingsList) && bookingsList.length > 0) {
              const sorted = [...bookingsList].sort((a: any, b: any) => {
                const aTime = new Date(a?.createdAt || 0).getTime()
                const bTime = new Date(b?.createdAt || 0).getTime()
                if (aTime && bTime && aTime !== bTime) return bTime - aTime
                return Number(b?.id || 0) - Number(a?.id || 0)
              })
              fallbackId = Number(sorted[0]?.id) || null
            }
            if (fallbackId) {
              setBookingId(fallbackId)
              setTimeout(() => {
                setShowPaymentModal(true)
              }, 800)
            } else {
              toast({
                title: 'Booking Error',
                description: 'No booking ID received. Please contact support.',
                variant: 'destructive'
              })
              return
            }
          } catch (fallbackErr) {
            toast({
              title: 'Booking Error',
              description: 'No booking ID received. Please contact support.',
              variant: 'destructive'
            })
            return
          }
        }
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

  const handlePaymentSelect = (paymentType: 'down_payment' | 'full_payment') => {
    setSelectedPaymentType(paymentType)
    setShowPaymentModal(false)
    setShowStripePayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowStripePayment(false)
    setSelectedPaymentType(null)
    setBookingId(null)
    // Redirect to payments page or show success message
    toast({
      title: "Payment Successful!",
      description: "Your booking has been confirmed and payment processed.",
    })
  }

  const handlePaymentFailure = () => {
    setShowStripePayment(false)
    setSelectedPaymentType(null)
    // Show error message or retry options
    toast({
      title: "Payment Failed",
      description: "Your payment could not be processed. Please try again.",
      variant: "destructive"
    })
  }

  // Dynamic steps based on booking type for headers
  const isVenueBooking = venue && 'menus' in venue && !!venue?.menus && Array.isArray(venue?.menus) && (venue?.menus?.length ?? 0) > 0
  const isVendor = venue && !('menus' in venue) && ((venue as any)?.subBusinessType || (venue as any)?.type)
  const hasPackages = !!venue?.packages && Array.isArray(venue?.packages) && (venue?.packages?.length ?? 0) > 0

  // Force vendor detection for testing - if it has subBusinessType or type but no menus, it's a vendor
  const forceIsVendor = venue && !isVenueBooking && ((venue as any)?.subBusinessType || (venue as any)?.type)

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
        case 1: // Package Selection (for vendors) or Vendor Selection (for venues)
          if (forceIsVendor) {
            // For vendors, package selection is optional if they don't have packages
            return hasPackages ? currentForm.selectedPackage !== "" : true
          }
          return true // Vendor selection is optional for venues
        case 2: // Menu Selection (for venues) or Preview (for vendors)
          if (isVenueBooking) {
            return true // Menu selection is optional
          }
          return true // Preview step
        default:
          return true
      }
    }
  }, [globalStep, formData, events, activeEventIndex, selectedEvents, isVendor, isVenueBooking])


  
  const stepOrder = useMemo(() => {
    const steps = [
      { key: "user", title: "Personal Information" },
      { key: "events", title: "Event Selection" },
    ] as { key: string; title: string }[]
    return steps
  }, [isVenueBooking])

  const eventStepOrder = useMemo(() => {
    const steps: { key: string; title: string }[] = [{ key: "datetime", title: "Date & Time" }]
    
    if (forceIsVendor) {
      // Vendor booking flow: Date & Time -> Package Selection -> Preview -> Success
      steps.push({ key: "packages", title: "Package Selection" })
      steps.push({ key: "review", title: "Review" }, { key: "success", title: "Success" })
    } else if (isVenueBooking) {
      // Venue booking flow: Date & Time -> Vendors -> Packages -> Menu -> Review -> Success
      steps.push({ key: "vendors", title: "Vendors" })
      if (hasPackages) steps.push({ key: "packages", title: "Packages" })
      steps.push({ key: "menu", title: "Menu" })
      steps.push({ key: "review", title: "Review" }, { key: "success", title: "Success" })
    } else {
      // Fallback flow
      if (hasPackages) steps.push({ key: "packages", title: "Package Selection" })
      steps.push({ key: "review", title: "Review" }, { key: "success", title: "Success" })
    }
    
    return steps
  }, [isVenueBooking, forceIsVendor, hasPackages])

  // Helper to update form for active event or single
  const updateCurrentForm = (updater: React.SetStateAction<BookingFormData>) => {
    if (events.length === 0) {
      setFormData(updater)
    } else {
      setEvents(prev => prev.map((e, idx) => idx === activeEventIndex ? { ...e, formData: typeof updater === 'function' ? (updater as any)(e.formData) : updater } : e))
    }
  }

  // Wrapper function for components that expect Partial<BookingFormData>
  const updateFormDataPartial = (data: Partial<BookingFormData>) => {
    updateCurrentForm(prev => ({ ...prev, ...data }))
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
      case 0: // Date & Time
        stepContent = (
          <DateSelectionStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            updateFormData={updateCurrentForm}
          />
        )
        break
      case 1: // Package Selection (for vendors) or Vendor Selection (for venues)
        if (forceIsVendor) {
          // Always show package selection for vendors, regardless of hasPackages
          stepContent = (
            <PackageSelectionStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              updateFormData={updateFormDataPartial}
              venue={venue}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        } else if (isVenueBooking) {
          stepContent = (
            <VendorSelectionStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              updateFormData={updateFormDataPartial}
            />
          )
        } else {
          stepContent = (
            <PreviewStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        }
        break
            case 2: // Review step (for vendors) or Package Selection (for venues with packages)
        if (forceIsVendor) {
          // For vendors: Date & Time -> Package Selection -> Review -> Success
          stepContent = (
            <PreviewStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        } else if (isVenueBooking) {
          // For venues: Date & Time -> Vendors -> Packages -> Menu -> Review -> Success
          if (hasPackages) {
            stepContent = (
              <PackageSelectionStep
                formData={events.length ? events[activeEventIndex].formData : formData}
                updateFormData={updateFormDataPartial}
                venue={venue}
                vendorDetails={vendorsDetails[activeEventIndex]}
              />
            )
          } else {
            stepContent = (
              <MenuSelectionStep
                formData={events.length ? events[activeEventIndex].formData : formData}
                updateFormData={updateCurrentForm}
                venue={venue}
              />
            )
          }
        } else {
          stepContent = (
            <PreviewStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        }
        break
      case 3: // Menu Selection (for venues with packages) or Success (for vendors)
        if (forceIsVendor) {
          // For vendors: Date & Time -> Package Selection -> Review -> Success
          stepContent = (
            <VendorSuccessStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              vendor={venue as any}
              selectedPackageObj={selectedPackageObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
              bookingResponse={events[activeEventIndex]?.bookingResponse}
            />
          )
        } else if (isVenueBooking && hasPackages) {
          stepContent = (
            <MenuSelectionStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              updateFormData={updateCurrentForm}
              venue={venue}
            />
          )
        } else {
          stepContent = (
            <PreviewStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        }
        break
      case 4: // Review step (for venues)
        if (isVenueBooking) {
          stepContent = (
            <PreviewStep
              formData={events.length ? events[activeEventIndex].formData : formData}
              selectedPackageObj={selectedPackageObj}
              selectedMenuObj={selectedMenuObj}
              vendorDetails={vendorsDetails[activeEventIndex]}
            />
          )
        }
        break
      case 5: // Success step (for venues)
        stepContent = (
          <SuccessStep
            formData={events.length ? events[activeEventIndex].formData : formData}
            venue={venue}
            selectedPackageObj={selectedPackageObj}
            selectedMenuObj={selectedMenuObj}
            vendorDetails={vendorsDetails[activeEventIndex]}
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
    // Scroll to top when navigating to next step
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
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
    <div className="w-[90%] mx-auto max-w-4xl">
      {(loading || userLoading) ?
        <div className="h-[500px] w-full flex items-center justify-center">
            <span className="flex items-center gap-3 text-lg font-medium text-neutral-700">
              <Icons.spinner className="w-12 h-12 mr-2 animate-spin text-rose-500" />
              Loading form
            </span>
          </div> :
        (error || userError) ?
          <div className="rounded-xl bg-red-50 p-6 text-center border border-red-200">
            <h2 className="text-red-700 font-semibold text-lg">
              Something went wrong. Please try again later.
            </h2>
            <p className="text-sm text-red-600 mt-2">
              Your booking cannot be processed right now. Please refresh the page or try again in a few minutes.
            </p>
          </div> :
        <div className="rounded-xl bg-white/80 backdrop-blur-sm shadow-xl border border-neutral-200">
          {/* Multi-event tabs (visible after selection) */}
          {events.length > 0 && globalStep >= 2 && (
            <div className="border-b border-neutral-200 bg-gradient-to-r from-rose-50 to-pink-50 p-4">
              <EventTabs
                events={events}
                activeEventIndex={activeEventIndex}
                onTabChange={setActiveEventIndex}
              />
            </div>
          )}
          <div className="border-b border-neutral-200 bg-gradient-to-r from-rose-50 to-pink-50 p-4">
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                {header?.title && <h2 className="text-lg font-semibold text-neutral-800">{header.title}</h2>}
                {/* Show business type indicator */}
                {venue && (
                  <div className="text-sm text-neutral-600">
                    {isVendor ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {(venue as any).subBusinessType || (venue as any).type} Service
                      </span>
                    ) : isVenueBooking ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Venue Booking
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {(venue as any).subBusinessType || (venue as any).type}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-6 sm:p-6">
            {stepContent}
          </div>

          {/* Hide navigation buttons on success step */}
          {((events[activeEventIndex]?.currentStep ?? 0) !== (eventStepOrder.length - 1)) && (
            <div className="border-t border-neutral-200 bg-gradient-to-r from-rose-50 to-pink-50 p-4">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-neutral-300 hover:border-rose-500 hover:text-rose-600 transition-all duration-200"
                  onClick={() => {
                    // Scroll to top when navigating back
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                    
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
                  className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
          )}
        </div>
      }

      {/* Info message */}
      {globalStep >= 2 && events.length > 0 && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 text-sm text-rose-700 border border-rose-200">
          <p>
            You're booking multiple events. Complete the form for each event tab and submit them individually.
          </p>
        </div>
      )}

                  {/* Payment Selection Modal */}
            {showPaymentModal && bookingId && (
              <PaymentSelectionModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                formData={events.length > 0 ? events[activeEventIndex]?.formData || formData : formData}
                venue={venue}
                vendorDetails={events.length > 0 ? vendorsDetails[activeEventIndex] : []}
                onPaymentSelect={handlePaymentSelect}
                loading={false}
                bookingId={bookingId}
              />
            )}

      {/* Stripe Payment Modal */}
      {showStripePayment && selectedPaymentType && bookingId && (
        <StripePayment
          isOpen={showStripePayment}
          onClose={() => setShowStripePayment(false)}
          bookingId={bookingId}
          customerEmail={user?.email || ''}
          paymentType={selectedPaymentType}
          amount={events.length > 0 ? events[activeEventIndex]?.formData.totalPrice || formData.totalPrice : formData.totalPrice}
          currency="usd"
          businessName={venue?.name || 'Business'}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentFailure={handlePaymentFailure}
        />
      )}
    </div>
  )
}
