"use client"

import { CheckCircle, Printer, Home, Calendar, Clock, Users, MapPin, Package, Building, DollarSign, Sparkles } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { motion } from "framer-motion"

interface SuccessStepProps {
  formData: BookingFormData
  venue?: EventVenue | null
  selectedPackageObj?: any
  selectedMenuObj?: any
  vendorDetails?: Vendor[]
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
}

export default function SuccessStep({
  formData,
  venue,
  selectedPackageObj,
  selectedMenuObj,
  vendorDetails
}: SuccessStepProps) {
  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  const getTimeSlotText = (timeSlot: string) => {
    switch (timeSlot) {
      case "09:00": return "Morning (9 AM - 12 PM)"
      case "12:00": return "Midday (12 PM - 4 PM)"
      case "14:00": return "Afternoon (2 PM - 6 PM)"
      case "17:00": return "Evening (5 PM - 10 PM)"
      case "18:00": return "Evening (6 PM - 11 PM)"
      default: return timeSlot
    }
  }

  const isVendor = venue && !('menus' in venue)

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-6 text-center"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* Success Icon */}
      <motion.div variants={item} className="mb-6 relative">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </motion.div>
      </motion.div>

      <motion.div variants={item}>
        <h2 className="font-heading text-3xl font-bold text-neutral-900">Booking Confirmed!</h2>
        <p className="mt-2 max-w-md text-neutral-500 text-sm mx-auto">
          Thank you, <span className="font-semibold text-purple-600">{formData.username}</span>. A confirmation has been sent to{" "}
          <span className="font-semibold text-purple-600">{formData.email}</span>.
        </p>
      </motion.div>

      {/* Booking Details */}
      <motion.div variants={item} className="mt-8 w-full max-w-2xl text-left">
        <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 px-6 py-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building className="h-4 w-4" />
              {isVendor ? 'Vendor Booking' : 'Venue Booking'} — {venue?.name}
            </h3>
          </div>

          <div className="p-5 space-y-4">
            {/* Customer & Event grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Name", value: formData.username },
                { label: "Guests", value: `${formData.guestCount}` },
                { label: "Date", value: formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A" },
                { label: "Time", value: formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A" },
              ].map((row) => (
                <div key={row.label}>
                  <p className="text-xs text-neutral-400">{row.label}</p>
                  <p className="text-sm font-medium text-neutral-800 mt-0.5">{row.value}</p>
                </div>
              ))}
            </div>

            {/* Services */}
            {(selectedPackageObj || selectedMenuObj) && (
              <div className="pt-3 border-t border-neutral-100 space-y-1.5">
                {selectedPackageObj && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Package: {selectedPackageObj.name}</span>
                    <span className="font-medium text-neutral-800">Rs. {Number(selectedPackageObj.price)?.toLocaleString()}</span>
                  </div>
                )}
                {selectedMenuObj && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Menu: {selectedMenuObj.name || selectedMenuObj.title}</span>
                    <span className="font-medium text-neutral-800">Rs. {Number(selectedMenuObj.price)?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="rounded-lg bg-purple-50 p-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-700">Total Amount</span>
              <span className="text-xl font-bold text-purple-600">Rs. {Number(formData.totalPrice)?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={item} className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/user/payments")}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          Manage Payments
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          Home
        </button>
      </motion.div>
    </motion.div>
  )
}
