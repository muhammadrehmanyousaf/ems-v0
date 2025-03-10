"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import UserInfoStep from "@/components/booking/steps/user-info-step"
import DateSelectionStep from "@/components/booking/steps/date-selection-step"
import PackageSelectionStep from "@/components/booking/steps/package-selection-step"
import MenuSelectionStep from "@/components/booking/steps/menu-selection-step"
import VendorSelectionStep from "@/components/booking/steps/vendor-selection-step"
import PreviewStep from "@/components/booking/steps/preview-step"
import SuccessStep from "@/components/booking/steps/success-step"
import StepIndicator from "@/components/booking/ui/step-indicator"
import type { BookingFormData } from "@/lib/types"

export default function BookingForm() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BookingFormData>({
    // User Info
    username: "",
    phoneNumber: "",
    email: "",
    password: "",

    // Date & Time
    bookingDate: undefined,
    timeSlot: "",
    guestCount: 0,

    // Package
    selectedPackage: "",

    // Menu
    selectedMenu: "",
    menuAddons: [],

    // Vendors
    selectedVendors: [],

    // Pricing
    totalPrice: 0,
  })

  const totalSteps = 7

  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const calculateTotalPrice = () => {
    let total = 0

    // Add package price
    if (formData.selectedPackage === "basic") total += 1000
    if (formData.selectedPackage === "standard") total += 2000
    if (formData.selectedPackage === "deluxe") total += 3000

    // Add menu price
    if (formData.selectedMenu === "continental") total += 500
    if (formData.selectedMenu === "italian") total += 700
    if (formData.selectedMenu === "asian") total += 600

    // Add menu addons
    formData.menuAddons.forEach((addon) => {
      total += 100 // Each addon costs $100
    })

    // Add vendor prices
    formData.selectedVendors.forEach((vendor) => {
      total += 300 // Each vendor costs $300
    })

    // Update total price in form data
    updateFormData({ totalPrice: total })

    return total
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      // Validate current step before proceeding
      if (validateCurrentStep()) {
        if (currentStep === 3 || currentStep === 4) {
          calculateTotalPrice()
        }
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1: // User Info
        if (!formData.username || !formData.phoneNumber || !formData.email || !formData.password) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields",
            variant: "destructive",
          })
          return false
        }
        if (!formData.email.includes("@") || !formData.email.includes(".")) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address",
            variant: "destructive",
          })
          return false
        }
        if (formData.password.length < 6) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          })
          return false
        }
        return true

      case 2: // Date & Time
        if (!formData.bookingDate || !formData.timeSlot || formData.guestCount <= 0) {
          toast({
            title: "Missing Information",
            description: "Please select a date, time slot, and enter number of guests",
            variant: "destructive",
          })
          return false
        }
        return true

      case 3: // Package
        if (!formData.selectedPackage) {
          toast({
            title: "Missing Selection",
            description: "Please select a package",
            variant: "destructive",
          })
          return false
        }
        return true

      case 4: // Menu
        if (!formData.selectedMenu) {
          toast({
            title: "Missing Selection",
            description: "Please select a menu",
            variant: "destructive",
          })
          return false
        }
        return true

      default:
        return true
    }
  }

  const handleSubmit = () => {
    // Here you would typically send the data to your backend
    console.log("Form submitted:", formData)

    // Move to success step
    setCurrentStep(7)

    toast({
      title: "Booking Submitted",
      description: "Your venue booking has been successfully submitted!",
    })
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <UserInfoStep formData={formData} updateFormData={updateFormData} />
      case 2:
        return <DateSelectionStep formData={formData} updateFormData={updateFormData} />
      case 3:
        return <PackageSelectionStep formData={formData} updateFormData={updateFormData} />
      case 4:
        return <MenuSelectionStep formData={formData} updateFormData={updateFormData} />
      case 5:
        return <VendorSelectionStep formData={formData} updateFormData={updateFormData} />
      case 6:
        return <PreviewStep formData={formData} />
      case 7:
        return <SuccessStep formData={formData} />
      default:
        return null
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

      <Card className="mt-6 p-6 shadow-lg">
        {renderStep()}

        {currentStep < 7 && (
          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
            ) : (
              <div></div>
            )}

            {currentStep < 6 ? (
              <Button onClick={nextStep}>Next</Button>
            ) : currentStep === 6 ? (
              <Button onClick={handleSubmit}>Submit Booking</Button>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  )
}

