"use client"

import { useEffect, useState } from "react"
import { CheckCircle, Calendar, Clock, CreditCard, Home, FileText } from "lucide-react"
import confetti from "canvas-confetti"
import type { EventVenue } from "@/lib/types"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
import Link from "next/link"

interface PaymentSuccessScreenProps {
  bookingId: number
  venue: EventVenue | null
  paymentType?: string
}

interface BookingDetails {
  customerName: string
  customerEmail: string
  bookingDate: string
  bookingTime: string
  totalAmount: number
  downPayment: number
  status: string
  paymentStatus: string
}

export default function PaymentSuccessScreen({ bookingId, venue, paymentType = "down_payment" }: PaymentSuccessScreenProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null)

  useEffect(() => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.3 + 0.7, y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!bookingId) return
    axiosInstance
      .get(`${BACKEND_URL}api/v1/payments/booking-status/${bookingId}`)
      .then((res) => {
        const d = res.data?.data
        if (d) setBooking(d as BookingDetails)
      })
      .catch(() => {})
  }, [bookingId])

  const formatTime = (time: string) => {
    switch (time) {
      case "09:00": return "Morning (9 AM – 12 PM)"
      case "14:00": return "Afternoon (2 PM – 6 PM)"
      case "18:00": return "Evening (6 PM – 11 PM)"
      default: return time
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    } catch { return dateStr }
  }

  const paidAmount = paymentType === "full_payment"
    ? booking?.totalAmount
    : booking?.downPayment

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Success crown */}
      <div className="mb-7 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative rounded-full bg-bridal-cream border border-bridal-gold/55 p-7 shadow-[0_18px_44px_-22px_rgba(176,125,84,0.55)]">
          <CheckCircle className="h-16 w-16 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
      </div>

      <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
        Payment received
      </p>
      <h2 className="mb-3 font-display italic text-[40px] sm:text-[52px] text-bridal-charcoal leading-[1.05]">
        Your booking is confirmed
      </h2>
      <div className="mx-auto mb-4 h-[1px] w-24 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
      <p className="mb-8 font-bridal text-[14px] text-bridal-text-soft">
        Booking reference:{" "}
        <span className="font-display italic text-[16px] text-bridal-gold-dark">#{bookingId}</span>
      </p>

      {/* Summary Card */}
      <div className="w-full max-w-lg overflow-hidden rounded-md border border-bridal-beige bg-bridal-cream shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
        {/* Header */}
        <div className="relative bg-bridal-charcoal px-6 py-5 text-left overflow-hidden">
          <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <p className="relative font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold mb-1">
            Booking summary
          </p>
          <h3 className="relative font-display italic text-[22px] text-bridal-ivory">{venue?.name || "Service Provider"}</h3>
        </div>

        <div className="divide-y divide-bridal-beige/70 p-2 text-left">
          {booking?.bookingDate && (
            <div className="flex items-center gap-3 px-3 py-3.5">
              <span className="w-8 h-8 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-bridal-gold-dark" />
              </span>
              <div className="min-w-0">
                <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Date</p>
                <p className="font-display italic text-[15px] text-bridal-charcoal mt-0.5">{formatDate(booking.bookingDate)}</p>
              </div>
            </div>
          )}
          {booking?.bookingTime && (
            <div className="flex items-center gap-3 px-3 py-3.5">
              <span className="w-8 h-8 rounded-full bg-bridal-gold/15 inline-flex items-center justify-center flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-bridal-gold-dark" />
              </span>
              <div className="min-w-0">
                <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Time</p>
                <p className="font-display italic text-[15px] text-bridal-charcoal mt-0.5">{formatTime(booking.bookingTime)}</p>
              </div>
            </div>
          )}
          {paidAmount !== undefined && (
            <div className="flex items-center gap-3 px-3 py-3.5">
              <span className="w-8 h-8 rounded-full bg-bridal-sage/25 inline-flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-3.5 w-3.5 text-[#3F6B43]" />
              </span>
              <div className="min-w-0">
                <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
                  {paymentType === "full_payment" ? "Total Paid" : "Down Payment Paid"}
                </p>
                <p className="font-display italic text-[18px] text-[#3F6B43] mt-0.5">Rs. {Number(paidAmount).toLocaleString()}</p>
              </div>
            </div>
          )}
          {paymentType === "down_payment" && booking?.totalAmount && booking?.downPayment && (
            <div className="rounded-md bg-bridal-cream border border-bridal-gold/45 px-4 py-3 m-3">
              <p className="font-bridal text-[12px] text-bridal-charcoal/85 leading-relaxed">
                <span className="font-medium text-bridal-gold-dark uppercase tracking-[0.18em] text-[10.5px] mr-1">Remaining</span>
                Rs. {(Number(booking.totalAmount) - Number(booking.downPayment)).toLocaleString()} due before the event.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation note */}
      <p className="mt-7 font-bridal text-[13.5px] text-bridal-text-soft max-w-sm">
        A confirmation email has been sent to{" "}
        <span className="font-display italic text-bridal-gold-dark">{booking?.customerEmail || "your email"}</span>.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/user/bookings"
          className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
        >
          <FileText className="h-3.5 w-3.5" />
          View my bookings
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
