"use client"

import { useState, useEffect, useReducer } from "react"
import { useToast } from "@/components/ui/use-toast"
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
import type { BookingFormData, EventBooking, MultiEventBookingState } from "@/lib/types"
import { createBooking } from "@/lib/actions/booking"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { vendorPackages } from "@/lib/data"

// Initial form data
const initialFormData: BookingFormData = {
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
  selectedVendorPackages: [],

  // Pricing
  totalPrice: 0,
}

// Reducer for managing multiple event bookings
function multiEventBookingReducer(state: MultiEventBookingState, action: any): MultiEventBookingState {
  switch (action.type) {
    case "SET_EVENTS":
      return {
        ...state,
        events: action.payload,
        activeEventIndex: 0,
      }
    case "SET_ACTIVE_EVENT":
      return {
        ...state,
        activeEventIndex: action.payload,
      }
    case "UPDATE_EVENT_STEP":
      return {
        ...state,
        events: state.events.map((event, index) =>
          index === state.activeEventIndex ? { ...event, currentStep: action.payload } : event,
        ),
      }
    case "UPDATE_EVENT_FORM_DATA":
      return {
        ...state,
        events: state.events.map((event, index) =>
          index === state.activeEventIndex ? { ...event, formData: { ...event.formData, ...action.payload } } : event,
        ),
      }
    case "UPDATE_ALL_EVENTS_FORM_DATA":
      return {
        ...state,
        events: state.events.map((event) => ({
          ...event,
          formData: { ...event.formData, ...action.payload },
        })),
      }
    case "SET_EVENT_SUBMITTED":
      return {
        ...state,
        events: state.events.map((event, index) =>
          index === state.activeEventIndex ? { ...event, isSubmitted: true } : event,
        ),
      }
    default:
      return state
  }
}

export default function BookingForm() {
  const { toast } = useToast()
  const [isEventSelectionStep, setIsEventSelectionStep] = useState(true)
  const [isPersonalInfoStep, setIsPersonalInfoStep] = useState(false)
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allEventsSubmitted, setAllEventsSubmitted] = useState(false)
  const [bookingReferences, setBookingReferences] = useState<Record<string, string>>({})
  const [commonUserInfo, setCommonUserInfo] = useState({
    username: "",
    phoneNumber: "",
    email: "",
    password: "",
  })

  // State for multiple event bookings
  const [multiEventBooking, dispatch] = useReducer(multiEventBookingReducer, {
    events: [],
    activeEventIndex: 0,
  })

  // Effect to initialize events when event types are selected
  useEffect(() => {
    if (!isEventSelectionStep && !isPersonalInfoStep && selectedEventTypes.length > 0) {
      const events: EventBooking[] = selectedEventTypes.map((eventType) => ({
        eventType,
        formData: {
          ...initialFormData,
          // Apply common user info to all events
          username: commonUserInfo.username,
          phoneNumber: commonUserInfo.phoneNumber,
          email: commonUserInfo.email,
          password: commonUserInfo.password,
        },
        currentStep: 1, // Start at step 1 (date selection, since personal info is common)
        isSubmitted: false,
      }))

      dispatch({ type: "SET_EVENTS", payload: events })
    }
  }, [isEventSelectionStep, isPersonalInfoStep, selectedEventTypes, commonUserInfo])

  // Effect to check if all events are submitted
  useEffect(() => {
    if (multiEventBooking.events.length > 0) {
      const allSubmitted = multiEventBooking.events.every((event) => event.isSubmitted)
      setAllEventsSubmitted(allSubmitted)
    }
  }, [multiEventBooking.events])

  // Handle event type toggle
  const handleEventToggle = (eventId: string) => {
    setSelectedEventTypes((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId)
      } else {
        return [...prev, eventId]
      }
    })
  }

  // Handle tab change
  const handleTabChange = (index: number) => {
    dispatch({ type: "SET_ACTIVE_EVENT", payload: index })
  }

  // Handle next step
  const nextStep = () => {
    if (isEventSelectionStep) {
      if (selectedEventTypes.length === 0) {
        toast({
          title: "No Events Selected",
          description: "Please select at least one event to continue",
          variant: "destructive",
        })
        return
      }

      setIsEventSelectionStep(false)
      setIsPersonalInfoStep(true)
      return
    }

    if (isPersonalInfoStep) {
      // Validate personal info
      if (
        !commonUserInfo.username ||
        !commonUserInfo.phoneNumber ||
        !commonUserInfo.email ||
        !commonUserInfo.password
      ) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
      if (!commonUserInfo.email.includes("@") || !commonUserInfo.email.includes(".")) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        return
      }
      if (commonUserInfo.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      // Apply personal info to all events
      dispatch({
        type: "UPDATE_ALL_EVENTS_FORM_DATA",
        payload: {
          username: commonUserInfo.username,
          phoneNumber: commonUserInfo.phoneNumber,
          email: commonUserInfo.email,
          password: commonUserInfo.password,
        },
      })

      setIsPersonalInfoStep(false)
      return
    }

    const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
    if (!activeEvent) return

    if (activeEvent.currentStep < 5) {
      // 5 is the preview step (reduced by 1 since personal info is common)
      // Validate current step before proceeding
      if (validateCurrentStep()) {
        if (activeEvent.currentStep === 3 || activeEvent.currentStep === 4) {
          calculateTotalPrice()
        }
        dispatch({ type: "UPDATE_EVENT_STEP", payload: activeEvent.currentStep + 1 })
      }
    }
  }

  // Handle previous step
  const prevStep = () => {
    if (isPersonalInfoStep) {
      setIsPersonalInfoStep(false)
      setIsEventSelectionStep(true)
      return
    }

    if (!isEventSelectionStep && !isPersonalInfoStep) {
      const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
      if (!activeEvent) return

      if (activeEvent.currentStep > 1) {
        dispatch({ type: "UPDATE_EVENT_STEP", payload: activeEvent.currentStep - 1 })
      } else if (activeEvent.currentStep === 1) {
        // If we're at the first step of any event, go back to personal info
        setIsPersonalInfoStep(true)
      }
    }
  }

  // Update form data for the active event
  const updateFormData = (data: Partial<BookingFormData>) => {
    dispatch({ type: "UPDATE_EVENT_FORM_DATA", payload: data })
  }

  // Update common user info
  const updateCommonUserInfo = (data: Partial<typeof commonUserInfo>) => {
    setCommonUserInfo((prev) => ({ ...prev, ...data }))
  }

  // Calculate total price for the active event
  const calculateTotalPrice = () => {
    const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
    if (!activeEvent) return 0

    const formData = activeEvent.formData
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

    // Add vendor package prices
    formData.selectedVendorPackages.forEach((packageId) => {
      const vendorPackage = vendorPackages.find((pkg) => pkg.id === packageId)
      if (vendorPackage) {
        total += vendorPackage.price
      }
    })

    // Update total price in form data
    updateFormData({ totalPrice: total })

    return total
  }

  // Validate current step
  const validateCurrentStep = () => {
    const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
    if (!activeEvent) return false

    const formData = activeEvent.formData
    const currentStep = activeEvent.currentStep

    switch (currentStep) {
      case 1: // Date & Time (since personal info is now common)
        if (!formData.bookingDate || !formData.timeSlot || formData.guestCount <= 0) {
          toast({
            title: "Missing Information",
            description: "Please select a date, time slot, and enter number of guests",
            variant: "destructive",
          })
          return false
        }
        return true

      case 2: // Vendors
        // We don't need to validate vendors as they're optional
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

  // Handle submit for the active event
  const handleSubmit = async () => {
    const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
    if (!activeEvent) return

    try {
      setIsSubmitting(true)

      // Calculate final price before submission
      calculateTotalPrice()

      // Submit to database using server action
      const result = await createBooking(activeEvent.formData)

      if (result.success) {
        // Store the booking reference
        setBookingReferences((prev) => ({
          ...prev,
          [activeEvent.eventType]: result.booking.booking_reference,
        }))

        // Mark this event as submitted
        dispatch({ type: "SET_EVENT_SUBMITTED", payload: true })

        // Show success message
        toast({
          title: "Event Booking Submitted",
          description: `Your ${activeEvent.eventType} booking has been successfully submitted!`,
        })

        // Check if all events are submitted
        const updatedEvents = multiEventBooking.events.map((event, index) =>
          index === multiEventBooking.activeEventIndex ? { ...event, isSubmitted: true } : event,
        )

        const allSubmitted = updatedEvents.every((event) => event.isSubmitted)
        if (allSubmitted) {
          setAllEventsSubmitted(true)
        }
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "There was an error submitting your booking",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting booking:", error)
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render the current step for the active event
  const renderEventStep = () => {
    const activeEvent = multiEventBooking.events[multiEventBooking.activeEventIndex]
    if (!activeEvent) return null

    const formData = activeEvent.formData
    const currentStep = activeEvent.currentStep

    switch (currentStep) {
      case 1: // Date & Time (since personal info is now common)
        return <DateSelectionStep formData={formData} updateFormData={updateFormData} />
      case 2:
        return <VendorSelectionStep formData={formData} updateFormData={updateFormData} />
      case 3:
        return <PackageSelectionStep formData={formData} updateFormData={updateFormData} />
      case 4:
        return <MenuSelectionStep formData={formData} updateFormData={updateFormData} />
      case 5:
        return <PreviewStep formData={formData} />
      default:
        return null
    }
  }

  // Render the success view when all events are submitted
  const renderAllEventsSubmitted = () => {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-6 rounded-full bg-green-100 p-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <h2 className="mb-3 text-2xl font-bold text-gray-800">All Events Booked Successfully!</h2>

        <p className="mb-6 text-gray-600">
          Thank you for your bookings. We have sent confirmation emails with all the details.
        </p>

        <div className="mb-8 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="bg-blue-500 px-6 py-4 text-left">
            <h3 className="text-lg font-medium text-white">Booking References</h3>
          </div>
          <div className="max-h-[30vh] overflow-y-auto p-6 text-left">
            {multiEventBooking.events.map((event, index) => (
              <div
                key={`reference-${event.eventType}-${index}`}
                className="mb-4 flex items-center justify-between border-b border-dashed border-gray-200 pb-4 last:mb-0 last:border-0 last:pb-0"
              >
                <span className="text-gray-600">
                  {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}:
                </span>
                <span className="font-mono text-lg font-bold text-blue-600">
                  {bookingReferences[event.eventType] || "N/A"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
        >
          Return to Home
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Get the step name for the current step
  const getStepName = (step: number) => {
    switch (step) {
      case 1:
        return "Date & Time"
      case 2:
        return "Vendors"
      case 3:
        return "Packages"
      case 4:
        return "Menu"
      case 5:
        return "Review"
      default:
        return ""
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-lg bg-white shadow-lg">
        {/* Header with event tabs and step indicator */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          {!isEventSelectionStep && !isPersonalInfoStep && !allEventsSubmitted && (
            <EventTabs
              events={multiEventBooking.events}
              activeEventIndex={multiEventBooking.activeEventIndex}
              onTabChange={handleTabChange}
            />
          )}

          {!isEventSelectionStep &&
            !isPersonalInfoStep &&
            !allEventsSubmitted &&
            multiEventBooking.events.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-800">
                    {getStepName(multiEventBooking.events[multiEventBooking.activeEventIndex].currentStep)}
                  </h2>
                  <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                    Step {multiEventBooking.events[multiEventBooking.activeEventIndex].currentStep} of 5
                  </span>
                </div>
                <StepIndicator
                  currentStep={multiEventBooking.events[multiEventBooking.activeEventIndex].currentStep}
                  totalSteps={5}
                />
              </div>
            )}

          {isPersonalInfoStep && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-800">Personal Information</h2>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
                  Common for all events
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                isEventSelectionStep
                  ? "event-selection"
                  : isPersonalInfoStep
                    ? "personal-info"
                    : allEventsSubmitted
                      ? "all-submitted"
                      : `event-${multiEventBooking.activeEventIndex}-step-${multiEventBooking.events[multiEventBooking.activeEventIndex]?.currentStep}`
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isEventSelectionStep ? (
                <EventSelectionStep selectedEvents={selectedEventTypes} onEventToggle={handleEventToggle} />
              ) : isPersonalInfoStep ? (
                <UserInfoStep
                  formData={commonUserInfo as BookingFormData}
                  updateFormData={updateCommonUserInfo as any}
                />
              ) : allEventsSubmitted ? (
                renderAllEventsSubmitted()
              ) : (
                renderEventStep()
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {!allEventsSubmitted && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="flex justify-between">
              {isEventSelectionStep ? (
                <div></div>
              ) : (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}

              {isEventSelectionStep ? (
                <Button
                  onClick={nextStep}
                  disabled={selectedEventTypes.length === 0}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : isPersonalInfoStep ? (
                <Button onClick={nextStep} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : multiEventBooking.events[multiEventBooking.activeEventIndex]?.currentStep < 5 ? (
                <Button
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : multiEventBooking.events[multiEventBooking.activeEventIndex]?.currentStep === 5 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || multiEventBooking.events[multiEventBooking.activeEventIndex]?.isSubmitted}
                  className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : multiEventBooking.events[multiEventBooking.activeEventIndex]?.isSubmitted ? (
                    <>
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Submitted
                    </>
                  ) : (
                    <>
                      Submit Booking
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Info message */}
      {!isEventSelectionStep && !isPersonalInfoStep && !allEventsSubmitted && (
        <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          <p>
            You're booking {multiEventBooking.events.length} event{multiEventBooking.events.length > 1 ? "s" : ""}.
            Complete the form for each event tab and submit them individually.
          </p>
        </div>
      )}
    </div>
  )
}
