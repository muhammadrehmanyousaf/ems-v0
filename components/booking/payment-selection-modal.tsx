"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, Calendar, Building, Users, Clock, Shield, Banknote, Check, ChevronRight } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"

interface PaymentSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  formData: BookingFormData
  venue?: EventVenue | null
  vendorDetails?: Vendor[]
  onPaymentSelect: (paymentType: 'down_payment' | 'full_payment') => void
  loading?: boolean
  bookingId?: number
  totalAmount?: number
  downPaymentAmount?: number
}

export default function PaymentSelectionModal({
  isOpen,
  onClose,
  formData,
  venue,
  vendorDetails,
  onPaymentSelect,
  loading = false,
  bookingId,
  totalAmount: propTotalAmount,
  downPaymentAmount: propDownPayment,
}: PaymentSelectionModalProps) {
  const [selectedPaymentType, setSelectedPaymentType] = useState<'down_payment' | 'full_payment' | null>(null)

  // Use actual amounts from booking response (calculated by backend from DB data)
  const totalPrice = propTotalAmount || Number(formData.totalPrice) || 0
  const downPaymentAmount = propDownPayment || Math.round(totalPrice * 0.2)
  const remainingAmount = totalPrice - downPaymentAmount

  const handlePaymentSelect = (paymentType: 'down_payment' | 'full_payment') => {
    setSelectedPaymentType(paymentType)
    onPaymentSelect(paymentType)
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
        <div className="bg-purple-600 px-6 py-5 rounded-t-2xl">
          <DialogHeader className="text-left">
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Complete Your Payment
            </DialogTitle>
            <DialogDescription className="text-purple-200 text-sm mt-1">
              Choose how you&apos;d like to pay for your booking
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Summary */}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 space-y-3">
            {bookingId && (
              <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="font-medium">Booking #{bookingId}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <Building className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate">{venue?.name || 'Business'}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span>{formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                <span>{formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <Users className="h-3.5 w-3.5 text-neutral-400" />
                <span>{formData.guestCount} guests</span>
              </div>
            </div>

            {vendorDetails && vendorDetails.length > 0 && (
              <div className="pt-2 border-t border-neutral-200 flex flex-wrap gap-1.5">
                {vendorDetails.map((vendor, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    {vendor.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Payment Timeline */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Payment Schedule</p>
            <div className="flex items-center gap-0">
              {/* Step 1 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">1</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 truncate">Down Payment</p>
                  <p className="text-[10px] text-neutral-400">Due at booking</p>
                  <p className="text-xs font-bold text-green-600">Rs. {downPaymentAmount.toLocaleString()}</p>
                </div>
              </div>
              {/* Connector */}
              <ChevronRight className="h-4 w-4 text-neutral-300 flex-shrink-0 mx-1" />
              {/* Step 2 */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-neutral-500">2</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-800 truncate">Remaining</p>
                  <p className="text-[10px] text-neutral-400">Before event</p>
                  <p className="text-xs font-bold text-neutral-600">Rs. {remainingAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          {(venue || (vendorDetails && vendorDetails.length > 0)) && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">What&apos;s Included</p>
              <div className="space-y-1.5">
                {venue && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                      <span className="text-neutral-700 truncate">{venue.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200">Venue</Badge>
                    </div>
                  </div>
                )}
                {vendorDetails?.map((vendor, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-neutral-700 truncate">{vendor.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200">{vendor.type || 'Vendor'}</Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-neutral-100 flex justify-between text-sm font-semibold">
                <span className="text-neutral-600">Total</span>
                <span className="text-neutral-900">Rs. {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Choose Payment Option</p>
            {/* Down Payment */}
            <button
              type="button"
              onClick={() => handlePaymentSelect('down_payment')}
              disabled={loading}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                selectedPaymentType === 'down_payment'
                  ? 'border-green-500 bg-green-50'
                  : 'border-neutral-200 bg-white hover:border-green-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-neutral-900">Pay Down Payment</h4>
                    <span className="text-lg font-bold text-green-600">Rs. {downPaymentAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Reserve your booking now, pay the rest before the event</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-neutral-500">
                      <span>Remaining balance (due later)</span>
                      <span className="font-medium text-neutral-700">Rs. {remainingAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  {selectedPaymentType === 'down_payment' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Selected
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Full Payment */}
            <button
              type="button"
              onClick={() => handlePaymentSelect('full_payment')}
              disabled={loading}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all duration-200 ${
                selectedPaymentType === 'full_payment'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-neutral-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-neutral-900">Pay Full Amount</h4>
                    <span className="text-lg font-bold text-purple-600">Rs. {totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">Complete the full payment in one go — no remaining balance</p>
                  {selectedPaymentType === 'full_payment' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-purple-600 font-medium">
                      <Check className="h-3.5 w-3.5" />
                      Selected
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 px-1">
            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Payments are processed securely via Stripe. Your data is encrypted.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
