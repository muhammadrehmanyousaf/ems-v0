"use client"

import { useState } from "react"
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
import type { BookingFormData } from "@/lib/types"
import { ArrowLeft, ArrowRight } from "lucide-react"

// Number of steps
const TOTAL_STEPS = 7

export default function BookingForm() {
  // Add local state for step navigation
  const [step, setStep] = useState(0)

  // Dummy form data for all steps
  const dummyFormData: BookingFormData = {
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
    bookingDate: undefined,
    timeSlot: "",
    guestCount: 0,
    selectedPackage: "",
    selectedMenu: "",
    menuAddons: [],
    selectedVendors: [],
    selectedVendorPackages: [],
    totalPrice: 0,
  }

  // Step headers
  const stepHeaders = [
    {
      title: "Event Selection",
      subtitle: "",
    },
    {
      title: "Personal Information",
      subtitle: "Common for all events",
    },
    {
      title: "Date & Time",
      subtitle: "Step 1 of 5",
    },
    {
      title: "Vendors",
      subtitle: "Step 2 of 5",
    },
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
      stepContent = <EventSelectionStep selectedEvents={[]} onEventToggle={() => {}} />
      break
    case 1:
      stepContent = (
        <UserInfoStep
          formData={dummyFormData}
          updateFormData={() => {}}
        />
      )
      break
    case 2:
      stepContent = (
        <DateSelectionStep
          formData={dummyFormData}
          updateFormData={() => {}}
        />
      )
      break
    case 3:
      stepContent = (
        <VendorSelectionStep
          formData={dummyFormData}
          updateFormData={() => {}}
        />
      )
      break
    case 4:
      stepContent = (
        <PackageSelectionStep
          formData={dummyFormData}
          updateFormData={() => {}}
        />
      )
      break
    case 5:
      stepContent = (
        <MenuSelectionStep
          formData={dummyFormData}
          updateFormData={() => {}}
        />
      )
      break
    case 6:
      stepContent = (
        <PreviewStep
          formData={dummyFormData}
        />
      )
      break
    default:
      stepContent = null
  }

  // Step header for current step
  const header = stepHeaders[step]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg bg-white shadow-lg">
        {/* Header with event tabs and step indicator */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">{header.title}</h2>
              {header.subtitle && (
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                  {header.subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main content: Only one step at a time */}
        <div className="p-6">
          {stepContent}
        </div>

        {/* Navigation buttons: enabled */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
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
              onClick={() => setStep((prev) => (prev < TOTAL_STEPS - 1 ? prev + 1 : prev))}
              disabled={step === TOTAL_STEPS - 1}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info message */}
      <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
        <p>
          You're booking multiple events. Complete the form for each event tab and submit them individually.
        </p>
      </div>
    </div>
  )
}
