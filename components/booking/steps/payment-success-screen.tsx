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
      {/* Success Icon */}
      <div className="mb-6 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 p-6 shadow-xl">
        <CheckCircle className="h-20 w-20 text-green-500" />
      </div>

      <h2 className="mb-2 text-4xl font-bold text-neutral-900">Payment Successful!</h2>
      <p className="mb-1 text-lg text-neutral-600">Your booking has been confirmed.</p>
      <p className="mb-8 text-sm text-neutral-500">
        Booking reference: <span className="font-semibold text-purple-600">#{bookingId}</span>
      </p>

      {/* Summary Card */}
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-200">Booking Summary</p>
          <h3 className="text-lg font-bold text-white">{venue?.name || "Service Provider"}</h3>
        </div>

        <div className="divide-y divide-neutral-100 p-6 text-left space-y-0">
          {booking?.bookingDate && (
            <div className="flex items-center gap-3 py-3">
              <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Date</p>
                <p className="text-sm font-semibold text-neutral-800">{formatDate(booking.bookingDate)}</p>
              </div>
            </div>
          )}
          {booking?.bookingTime && (
            <div className="flex items-center gap-3 py-3">
              <Clock className="h-4 w-4 text-purple-500 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">Time</p>
                <p className="text-sm font-semibold text-neutral-800">{formatTime(booking.bookingTime)}</p>
              </div>
            </div>
          )}
          {paidAmount !== undefined && (
            <div className="flex items-center gap-3 py-3">
              <CreditCard className="h-4 w-4 text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-neutral-400">
                  {paymentType === "full_payment" ? "Total Paid" : "Down Payment Paid"}
                </p>
                <p className="text-sm font-semibold text-green-600">Rs. {Number(paidAmount).toLocaleString()}</p>
              </div>
            </div>
          )}
          {paymentType === "down_payment" && booking?.totalAmount && booking?.downPayment && (
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 mt-2">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Remaining balance:</span>{" "}
                Rs. {(Number(booking.totalAmount) - Number(booking.downPayment)).toLocaleString()} due before the event.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation note */}
      <p className="mt-6 text-sm text-neutral-500 max-w-sm">
        A confirmation email has been sent to{" "}
        <span className="font-medium text-purple-600">{booking?.customerEmail || "your email"}</span>.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/user/bookings"
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
        >
          <FileText className="h-4 w-4" />
          View My Bookings
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
