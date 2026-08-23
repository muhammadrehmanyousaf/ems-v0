"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { BookingData } from "@/lib/dashboard-types"
import { User, CalendarDays, Package, CreditCard, Building, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { VendorChangeRequestsCard } from "@/components/bookings/vendor-change-requests-card"
import { InstallmentsCard } from "@/components/bookings/installments-card"
// WW-RECORD-MODE — customer payment reports, and the confirm/reject actions.
import { PaymentClaimsPanel } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/payment-claims-panel"
// BK-100.4 — vendor "report no-show" CTA. Only renders inside the
// 7-day reporting window enforced server-side.
import { VendorNoShowDialog } from "@/components/bookings/vendor-no-show-dialog"
import { outstandingOn, derivedPaymentStatus } from "@/lib/utils/booking-money"
// WWL-050 / WWL-100 — record which hall a booking is in.
import { AssignSpaceDialog } from "@/components/dashboard/shared/assign-space-dialog"

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
  // WWL-050 — the venue whose hall the vendor is recording, or null.
  const [assignFor, setAssignFor] = React.useState<number | null>(null)
  const vendorTotal = details.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0)
  const vendorDownPayment = details.reduce((sum, d) => sum + (Number(d.downPayment) || 0), 0)
  const amount = vendorTotal > 0 ? vendorTotal : Number(booking.totalAmount) || 0
  const dp = vendorDownPayment > 0 ? vendorDownPayment : Number(booking.downPayment) || 0
  // WWL-037 — balance is arithmetic on the amounts, not a reading of the flag.
  const remaining = outstandingOn(booking)
  const derivedStatus = derivedPaymentStatus(booking)
  const isPaid = derivedStatus === 'Paid'
  const isPartial = derivedStatus === 'Partial'

  // BK-100.4 — show "Report no-show" only when the booking is in a status
  // where a no-show can apply AND the event has occurred. Backend
  // re-enforces the same gates; this is just a UX hint to hide the CTA
  // outside the valid window. The 7-day reporting cap is enforced
  // server-side; we keep the trigger visible up to ~14 days post-event
  // so a stale tab still shows a friendly server-side error rather than
  // mysteriously hiding the button.
  const noShowCandidate = (() => {
    if (!["Confirmed", "Completed"].includes(booking.status || "")) return false
    const bd = booking.bookingDate
    if (!bd) return false
    const evt = new Date(bd)
    if (Number.isNaN(evt.getTime())) return false
    const now = new Date()
    const daysSince = (now.getTime() - evt.getTime()) / 86400000
    return daysSince >= 0 && daysSince <= 14
  })()

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
                    {/* WWL-050 — which hall this event is in. The booking
                        carried no space at all, so the vendor had to open the
                        calendar (which could not tell them either) to find out
                        where an event was actually happening. */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">Hall / Space:</span>
                      {detail.subVenue?.name || detail.resource?.label ? (
                        <span className="text-xs font-medium text-neutral-700">
                          {detail.subVenue?.name || detail.resource?.label}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAssignFor(detail.businessId)}
                          className="text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800"
                        >
                          Not recorded — set it
                        </button>
                      )}
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

          {/* BK-100.53 — service-location info, vendor-facing.
              Renders only when off-vendor mode is set so the vendor
              crew knows where to actually go. Legacy at-vendor bookings
              skip this section entirely. */}
          {booking.serviceLocationMode && booking.serviceLocationMode !== 'at_vendor' && (
            <>
              <hr className="border-neutral-100" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Service location
                  </span>
                </div>
                <div className="ml-6 space-y-1.5">
                  <p className="text-sm font-medium text-neutral-800">
                    {(() => {
                      switch (booking.serviceLocationMode) {
                        case 'at_customer_home':
                          return "At customer's home";
                        case 'at_customer_plot':
                          return "At customer's plot / lawn";
                        case 'at_third_party':
                          return 'Third-party venue';
                        default:
                          return 'Vendor address';
                      }
                    })()}
                  </p>
                  {booking.serviceLocationAddress && (
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {booking.serviceLocationAddress}
                    </p>
                  )}
                  {booking.serviceLocationNotes && (
                    <p className="text-xs text-neutral-500 italic leading-relaxed">
                      {booking.serviceLocationNotes}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* WW-RECORD-MODE — the customer reported paying; the vendor confirms
              or rejects here. Placed ABOVE the payment schedule because it is
              the action the vendor has to take before that schedule is right,
              and it renders nothing at all when there are no reports. */}
          <hr className="border-neutral-100" />
          <PaymentClaimsPanel bookingId={booking.id} />

          {/* BK-042 — payment schedule (read-only on vendor side). */}
          <InstallmentsCard bookingId={booking.id} />

          {/* BK-054/55/56 — customer change requests; vendor approves/declines pending. */}
          <VendorChangeRequestsCard bookingId={booking.id} />

          {/* BK-100.4 / BK-039 — vendor-side no-show report. Only visible
              when the event has passed AND the booking is Confirmed or
              Completed (the only states a no-show can apply to). The
              7-day server-side window means stale tabs render the
              trigger but get a friendly error from the backend. */}
          {noShowCandidate && (
            <>
              <hr className="border-neutral-100" />
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-700">
                      Customer didn&apos;t show up?
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Available for 7 days after the event. Filing pauses payouts and triggers an admin review.
                    </p>
                  </div>
                  <VendorNoShowDialog bookingId={booking.id} />
                </div>
              </div>
            </>
          )}

        </div>

        {/* WWL-050 — record the hall for a booking that has none. */}
        <AssignSpaceDialog
          bookingId={booking.id}
          businessId={assignFor}
          open={assignFor != null}
          onOpenChange={(o) => { if (!o) setAssignFor(null) }}
        />
      </SheetContent>
    </Sheet>
  )
}
