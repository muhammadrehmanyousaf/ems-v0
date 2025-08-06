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
import type { BookingFormData, EventVenue } from "@/lib/types"
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

// Number of steps
const TOTAL_STEPS = 7

export default function BookingForm() {
  // Add local state for step navigation
  const [step, setStep] = useState(0)
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

  const selectedPackageObj = venue?.packages?.find((pkg) => pkg.id === formData.selectedPackage);
  const selectedMenuObj = venue?.menus.find((menu) => menu.id === formData.selectedMenu);

  const handleSubmit = async () => {
    const payload = {
      customerName: formData.username,
      customerEmail: formData.email,
      customerPhone: formData.phoneNumber,
      vendorId: venue?.vendor.id,
      bookingDate: formData.bookingDate,
      bookingTime: formData.timeSlot,
      vendors: [
        {
          businessId: venue?.id,
          packageId: formData.selectedPackage,
          menuId: formData.selectedMenu,
          totalAmount: (selectedPackageObj?.price || 0) + (selectedMenuObj?.price || 0),
          downPayment: venue?.downPayment || 0,
          specialRequests: ''
        }
      ]
    };

    try {
      setIsSubmitting(true); // Optional: manage a loading state
      const response = await axiosInstance.post(`${BACKEND_URL}api/v1/bookings`, payload);

      if (response.status === 201 || response.status === 200) {
        toast({ title: 'Booking Confirmed', description: 'Your booking has been submitted successfully.' });
        // Optional: reset form or redirect
        setStep(6)
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
    switch (step) {
      case 0:
        // Personal Info: name, phone & email are required
        return (
          formData.username.trim() !== "" &&
          formData.phoneNumber.trim() !== "" &&
          formData.email.trim() !== ""
        )
      case 1:
        // Event Selection: must pick an event type
        return formData.eventType !== ""
      case 2:
        // Date & Time: date, time slot & guest count > 0
        return (
          !!formData.bookingDate &&
          formData.timeSlot !== "" &&
          formData.guestCount > 0
        )
      case 3:
        // Package: must choose a package
        return formData.selectedPackage !== ""
      case 4:
        // Menu: OPTIONAL step → always valid
        return true
      case 5:
        // Preview: always valid (you’re just reviewing)
        return true
      default:
        return false
    }
  }, [step, formData])

  // Step headers
  const stepHeaders = [
    {
      title: "Personal Information",
      subtitle: "Common for all events",
    },
    {
      title: "Event Selection",
      subtitle: "",
    },
    {
      title: "Date & Time",
      subtitle: "Step 1 of 5",
    },
    // {
    //   title: "Vendors",
    //   subtitle: "Step 2 of 5",
    // },
    {
      title: "Packages",
      subtitle: "Step 3 of 5",
    },
    {
      title: "Menu",
      subtitle: "Step 4 of 5",
    },
    {
      title: "Review",
      subtitle: "Step 5 of 5",
    },
  ]

  // Step content
  let stepContent = null
  switch (step) {
    case 0:
      stepContent = (
        <UserInfoStep
          formData={formData}
          updateFormData={setFormData}
        />
      )
      break
    case 1:
      stepContent =
        <EventSelectionStep
          formData={formData}
          venue={venue}
          setFormData={setFormData}
        />
      break
    case 2:
      stepContent = (
        <DateSelectionStep
          formData={formData}
          updateFormData={setFormData}
        />
      )
      break
    // case 3:
    //   stepContent = (
    //     <VendorSelectionStep
    //       formData={dummyFormData}
    //       updateFormData={() => { }}
    //     />
    //   )
    //   break
    case 3:
      stepContent = (
        <PackageSelectionStep
          formData={formData}
          updateFormData={setFormData}
          venue={venue}
        />
      )
      break
    case 4:
      stepContent = (
        <MenuSelectionStep
          formData={formData}
          updateFormData={setFormData}
          venue={venue}
        />
      )
      break
    case 5:
      stepContent = (
        <PreviewStep
          formData={formData}
          selectedPackageObj={selectedPackageObj}
          selectedMenuObj={selectedMenuObj}
        />
      )
      break
    case 6:
      stepContent = (
        <SuccessStep
          formData={formData}
        />
      )
      break
    default:
      stepContent = null
  }

  // Step header for current step
  const header = stepHeaders[step]

  const handleNext = () => {
    if (step < 5) {
      setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
    } else {
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
          {step !== 6 && <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                {header.title && <h2 className="text-lg font-medium text-gray-800">{header.title}</h2>}
                {header.subtitle && (
                  <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                    {header.subtitle}
                  </span>
                )}
              </div>
            </div>
          </div>}

          <div className="px-4 py-6 sm:p-6">
            {stepContent}
          </div>

          {step !== 6 && <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => setStep((prev) => (prev > 0 ? prev - 1 : prev))}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
                onClick={handleNext}
                disabled={!isStepValid || step === TOTAL_STEPS - 1 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : step === 5 ? 'Submit' : 'Next'}
                {step !== 5 && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>}
        </div>
      }

      {/* Info message */}
      <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
        <p>
          You're booking multiple events. Complete the form for each event tab and submit them individually.
        </p>
      </div>
    </div>
  )
}
