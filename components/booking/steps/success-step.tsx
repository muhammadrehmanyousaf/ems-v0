"use client"

import { CheckCircle, Printer, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookingFormData } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface SuccessStepProps {
  formData: BookingFormData
  // bookingReference: string | null
}

export default function SuccessStep({ formData }: SuccessStepProps) {
  // const reference = bookingReference || `VB-${Math.floor(100000 + Math.random() * 900000)}`

  useEffect(() => {
    // Trigger confetti animation on component mount
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-6 rounded-full bg-green-100 p-4">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>

      <h2 className="mb-2 text-3xl font-bold text-gray-800">Booking Confirmed!</h2>

      <p className="mb-8 max-w-md text-gray-600">
        Thank you for your booking, <span className="font-medium">{formData.username}</span>. We have sent a
        confirmation email to <span className="font-medium">{formData.email}</span> with all the details.
      </p>

      <div className="mb-10 w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <div className="bg-indigo-600 px-6 py-4 text-left">
          <h3 className="text-lg font-medium text-white">Booking Information</h3>
        </div>
        <div className="p-6 text-left">
          {/* <div className="mb-4 flex items-center justify-between border-b border-dashed border-gray-200 pb-4">
            <span className="text-gray-600">Booking Reference:</span>
            <span className="font-mono text-lg font-bold text-indigo-600">{reference}</span>
          </div> */}
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-gray-200 pb-4">
            <span className="text-gray-600">Event Date:</span>
            <span className="font-medium text-gray-800">
              {formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div className="mb-4 flex items-center justify-between border-b border-dashed border-gray-200 pb-4">
            <span className="text-gray-600">Time Slot:</span>
            <span className="font-medium text-gray-800">
              {formData.timeSlot === "9:00" && "Morning (9AM - 12PM)"}
              {formData.timeSlot === "12:00" && "Midday (12PM - 4PM)"} 
              {formData.timeSlot === "17:00" && "Evening (5PM - 10PM)"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="text-xl font-bold text-indigo-600">${formData.totalPrice}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center rounded-full border-gray-300 px-6 hover:bg-gray-100"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button
          onClick={() => (window.location.href = "/")}
          className="flex items-center rounded-full bg-indigo-600 px-6 hover:bg-indigo-700"
        >
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </div>
  )
}
