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
      {/* Success crown */}
      <motion.div variants={item} className="mb-7 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative w-24 h-24 rounded-full bg-bridal-cream border border-bridal-gold/55 flex items-center justify-center shadow-[0_18px_44px_-22px_rgba(176,125,84,0.55)]">
          <CheckCircle className="h-12 w-12 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
        <motion.div
          className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center"
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        >
          <Sparkles className="w-4 h-4 text-bridal-charcoal" strokeWidth={2} />
        </motion.div>
      </motion.div>

      <motion.div variants={item}>
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
          Confirmed
        </p>
        <h2 className="font-display italic text-[40px] sm:text-[52px] text-bridal-charcoal leading-[1.05]">
          Your booking is confirmed
        </h2>
        <div className="mx-auto mt-4 mb-4 h-[1px] w-24 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <p className="max-w-md font-bridal text-[15px] text-bridal-text-soft mx-auto leading-relaxed">
          Thank you,{" "}
          <span className="font-display italic text-bridal-charcoal">{formData.username}</span>.
          A confirmation has been sent to{" "}
          <span className="font-display italic text-bridal-gold-dark">{formData.email}</span>.
        </p>
      </motion.div>

      {/* Booking Details */}
      <motion.div variants={item} className="mt-9 w-full max-w-2xl text-left">
        <div className="rounded-md border border-bridal-beige bg-bridal-cream divide-y divide-bridal-beige/70 overflow-hidden shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
          {/* Header */}
          <div className="relative bg-bridal-charcoal px-6 py-5 overflow-hidden">
            <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
            <div className="relative flex items-center gap-2.5">
              <Building className="h-4 w-4 text-bridal-gold" />
              <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold">
                {isVendor ? 'Vendor booking' : 'Venue booking'}
              </p>
            </div>
            <h3 className="relative font-display italic text-[22px] text-bridal-ivory mt-1.5">
              {venue?.name}
            </h3>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Customer & Event grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Name", value: formData.username },
                ...( ["Wedding venue", "Catering", "Decorator"].includes(venue?.vendor?.vendorType ?? "")
                  ? [{ label: "Guests", value: `${formData.guestCount}` }]
                  : []
                ),
                { label: "Date", value: formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A" },
                { label: "Time", value: formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A" },
              ].map((row) => (
                <div key={row.label}>
                  <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">{row.label}</p>
                  <p className="font-display italic text-[15px] text-bridal-charcoal mt-1">{row.value}</p>
                </div>
              ))}
            </div>

            {/* Services */}
            {(selectedPackageObj || selectedMenuObj) && (
              <div className="pt-4 border-t border-bridal-beige/70 space-y-2.5">
                {selectedPackageObj && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bridal text-[13px] text-bridal-charcoal/85">
                      <span className="text-bridal-text-label uppercase tracking-[0.18em] text-[10.5px] font-medium mr-2">Package</span>
                      {selectedPackageObj.name}
                    </span>
                    <span className="font-display italic text-[16px] text-bridal-charcoal shrink-0">Rs. {Number(selectedPackageObj.price)?.toLocaleString()}</span>
                  </div>
                )}
                {selectedMenuObj && (
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bridal text-[13px] text-bridal-charcoal/85">
                      <span className="text-bridal-text-label uppercase tracking-[0.18em] text-[10.5px] font-medium mr-2">Menu</span>
                      {selectedMenuObj.name || selectedMenuObj.title}
                    </span>
                    <span className="font-display italic text-[16px] text-bridal-charcoal shrink-0">Rs. {Number(selectedMenuObj.price)?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div className="rounded-md bg-bridal-ivory border border-bridal-gold/45 p-4 flex items-end justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
              <div>
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-text-label">Total amount</p>
                <p className="font-display italic text-[16px] text-bridal-charcoal leading-none mt-1">All inclusive</p>
              </div>
              <span className="font-display italic text-[28px] text-bridal-gold-dark leading-none">Rs. {Number(formData.totalPrice)?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={item} className="mt-9 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/user/payments")}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] bg-bridal-sage/30 hover:bg-bridal-sage text-[#3F6B43] hover:text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium border border-bridal-sage/50 hover:border-[#3F6B43] transition-colors"
        >
          <DollarSign className="h-3.5 w-3.5" />
          Manage payments
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </button>
      </motion.div>
    </motion.div>
  )
}
