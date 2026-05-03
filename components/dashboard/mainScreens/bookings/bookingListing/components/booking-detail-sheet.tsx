"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { BookingData } from "@/lib/dashboard-types"
import { User, CalendarDays, Package, CreditCard, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorChangeRequestsCard } from "@/components/bookings/vendor-change-requests-card"
import { InstallmentsCard } from "@/components/bookings/installments-card"

interface BookingDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingData
}

const statusColors: Record<string, string> = {
  'Awaiting Payment': 'bg-orange-50 text-orange-700 border-orange-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const paymentColors: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Partial: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-green-50 text-green-700 border-green-200',
}

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : "-"

const formatTime = (t?: string) => {
  if (!t) return "-"
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

export function BookingDetailSheet({ open, onOpenChange, booking }: BookingDetailSheetProps) {
  const details = booking.bookingDetails || []
  const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
  const vendorDownPayment = details.reduce((sum, d) => sum + (Number(d.downPayment) || 0), 0)
  const amount = vendorTotal > 0 ? vendorTotal : Number(booking.totalAmount) || 0
  const dp = vendorDownPayment > 0 ? vendorDownPayment : Number(booking.downPayment) || 0
  const isPaid = booking.paymentStatus === 'Paid'
  const isPartial = booking.paymentStatus === 'Partial'
  const remaining = isPaid ? 0 : isPartial ? Math.max(0, amount - dp) : amount

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Booking #{booking.id}</SheetTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className={cn('text-xs', statusColors[booking.status])}>
                {booking.status}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', paymentColors[booking.paymentStatus || 'Pending'])}>
                {booking.paymentStatus || 'Pending'}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">Customer</span>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Name</span>
                <span className="font-medium text-neutral-800">{booking.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Email</span>
                <span className="font-medium text-neutral-800">{booking.customerEmail}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Phone</span>
                <span className="font-medium text-neutral-800">{booking.customerPhone}</span>
              </div>
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Event Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">Event</span>
            </div>
            <div className="ml-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Date</span>
                <span className="font-medium text-neutral-800">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Time</span>
                <span className="font-medium text-neutral-800">{formatTime(booking.bookingTime)}</span>
              </div>
              {booking.guestCount != null && booking.guestCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Guests</span>
                  <span className="font-medium text-neutral-800">{booking.guestCount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Services (Vendor's portion from BookingDetails) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">Your Services</span>
            </div>
            {details.length > 0 ? (
              <div className="ml-6 space-y-3">
                {details.map((detail) => (
                  <div key={detail.id} className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-neutral-800">{detail.business?.name || 'Business'}</p>
                      <p className="text-sm font-bold text-bridal-gold-dark">Rs. {Number(detail.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    {detail.package && (
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-bridal-gold/70" />
                        <span className="text-xs text-neutral-600">{detail.package.name}</span>
                        <span className="text-xs text-bridal-gold font-medium">Rs. {Number(detail.package.price || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {detail.menu && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500">Menu: {detail.menu.title}</span>
                        <span className="text-xs text-bridal-gold font-medium">Rs. {Number(detail.menu.price || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {detail.specialRequests && (
                      <div className="flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-100 px-2 py-1">
                        <span className="text-xs font-semibold text-blue-700">{detail.specialRequests}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Down Payment</span>
                      <span>Rs. {Number(detail.downPayment || 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="ml-6 text-sm text-neutral-400">No service details available</p>
            )}
          </div>

          <hr className="border-neutral-100" />

          {/* Payment Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">Payment</span>
            </div>
            <div className="ml-6 rounded-lg bg-bridal-cream border border-bridal-beige p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Your Total</span>
                <span className="font-bold text-bridal-gold-dark">Rs. {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Down Payment</span>
                <span className="font-medium text-neutral-700">Rs. {dp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Remaining</span>
                <span className="font-medium text-neutral-700">Rs. {remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {(booking.specialRequests || booking.additionalRequests) && (
            <>
              <hr className="border-neutral-100" />
              <div>
                <span className="text-sm font-semibold text-neutral-700">Notes</span>
                <p className="mt-1 text-sm text-neutral-500">{booking.specialRequests || booking.additionalRequests}</p>
              </div>
            </>
          )}

          {/* BK-042 — payment schedule (read-only on vendor side). */}
          <hr className="border-neutral-100" />
          <InstallmentsCard bookingId={booking.id} />

          {/* BK-054/55/56 — customer change requests; vendor approves/declines pending. */}
          <VendorChangeRequestsCard bookingId={booking.id} />

        </div>
      </SheetContent>
    </Sheet>
  )
}
