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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-md p-0 bg-bridal-cream border border-bridal-beige">
        {/* Header */}
        <div className="relative bg-bridal-charcoal px-6 py-6 rounded-t-md overflow-hidden">
          <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <DialogHeader className="text-left relative">
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold mb-1.5">
              Final step
            </p>
            <DialogTitle className="font-display italic text-bridal-ivory text-[24px] sm:text-[26px] flex items-center gap-2.5 leading-tight">
              <CreditCard className="h-5 w-5 text-bridal-gold" />
              Complete your payment
            </DialogTitle>
            <DialogDescription className="font-bridal text-bridal-ivory/75 text-[13px] mt-2">
              Choose how you&apos;d like to pay for your booking
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* Booking Summary */}
          <div className="rounded-md bg-bridal-ivory border border-bridal-beige p-4 space-y-3">
            {bookingId && (
              <div className="flex items-center gap-2 font-bridal text-[12px] text-bridal-gold-dark bg-bridal-cream rounded-[4px] px-3 py-2 border border-bridal-gold/45">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="font-medium uppercase tracking-[0.2em]">Booking #{bookingId}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 font-bridal text-[13px] text-bridal-charcoal/85">
                <Building className="h-3.5 w-3.5 text-bridal-gold flex-shrink-0" />
                <span className="truncate">{venue?.name || 'Business'}</span>
              </div>
              <div className="flex items-center gap-2 font-bridal text-[13px] text-bridal-charcoal/85">
                <Calendar className="h-3.5 w-3.5 text-bridal-gold flex-shrink-0" />
                <span>{formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 font-bridal text-[13px] text-bridal-charcoal/85">
                <Clock className="h-3.5 w-3.5 text-bridal-gold flex-shrink-0" />
                <span>{formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 font-bridal text-[13px] text-bridal-charcoal/85">
                <Users className="h-3.5 w-3.5 text-bridal-gold flex-shrink-0" />
                <span>{formData.guestCount} guests</span>
              </div>
            </div>

            {vendorDetails && vendorDetails.length > 0 && (
              <div className="pt-2 border-t border-bridal-beige/70 flex flex-wrap gap-1.5">
                {vendorDetails.map((vendor, index) => (
                  <span key={index} className="inline-flex items-center font-bridal text-[10.5px] uppercase tracking-[0.18em] font-medium px-2.5 py-0.5 rounded-full bg-bridal-blush text-bridal-mauve border border-bridal-rose/45">
                    {vendor.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Payment Timeline */}
          <div className="rounded-md border border-bridal-beige bg-bridal-cream p-4">
            <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-3">Payment schedule</p>
            <div className="flex items-center gap-0">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center flex-shrink-0">
                  <span className="font-display italic text-[14px] text-bridal-charcoal">1</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark truncate">Down Payment</p>
                  <p className="font-bridal text-[10px] text-bridal-text-soft">Due at booking</p>
                  <p className="font-display italic text-[15px] text-bridal-charcoal mt-0.5">Rs. {downPaymentAmount.toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-bridal-gold/55 flex-shrink-0 mx-2" />
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-bridal-cream border border-bridal-beige flex items-center justify-center flex-shrink-0">
                  <span className="font-display italic text-[14px] text-bridal-text-soft">2</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label truncate">Remaining</p>
                  <p className="font-bridal text-[10px] text-bridal-text-soft">Before event</p>
                  <p className="font-display italic text-[15px] text-bridal-charcoal/85 mt-0.5">Rs. {remainingAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          {(venue || (vendorDetails && vendorDetails.length > 0)) && (
            <div className="rounded-md border border-bridal-beige bg-bridal-cream p-4">
              <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-3">What&apos;s included</p>
              <div className="space-y-2">
                {venue && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building className="h-3.5 w-3.5 text-bridal-gold flex-shrink-0" />
                      <span className="font-bridal text-[13px] text-bridal-charcoal truncate">{venue.name}</span>
                      <span className="inline-flex items-center font-bridal text-[10px] uppercase tracking-[0.2em] font-medium px-2 py-0.5 rounded-full bg-bridal-cream text-bridal-gold-dark border border-bridal-gold/45">Venue</span>
                    </div>
                  </div>
                )}
                {vendorDetails?.map((vendor, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-3.5 w-3.5 text-bridal-mauve flex-shrink-0" />
                      <span className="font-bridal text-[13px] text-bridal-charcoal truncate">{vendor.name}</span>
                      <span className="inline-flex items-center font-bridal text-[10px] uppercase tracking-[0.2em] font-medium px-2 py-0.5 rounded-full bg-bridal-blush text-bridal-mauve border border-bridal-rose/45">{vendor.type || 'Vendor'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-bridal-beige/70 flex items-baseline justify-between">
                <span className="font-bridal text-[10.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label">Total</span>
                <span className="font-display italic text-[22px] text-bridal-gold-dark">Rs. {totalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-3">
            <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">Choose payment option</p>
            {/* Down Payment */}
            <button
              type="button"
              onClick={() => handlePaymentSelect('down_payment')}
              disabled={loading}
              className={`w-full text-left rounded-md border p-5 transition-all duration-300 ${
                selectedPaymentType === 'down_payment'
                  ? 'border-bridal-sage bg-bridal-sage/15 shadow-[0_14px_32px_-18px_rgba(63,107,67,0.4)]'
                  : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-sage hover:bg-bridal-sage/10'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-bridal-sage/25 border border-bridal-sage/40 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-5 w-5 text-[#3F6B43]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-end justify-between gap-3">
                    <h4 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">Pay down payment</h4>
                    <span className="font-display italic text-[20px] text-[#3F6B43] shrink-0">Rs. {downPaymentAmount.toLocaleString()}</span>
                  </div>
                  <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-2 leading-relaxed">Reserve your booking now, pay the rest before the event.</p>
                  <div className="mt-3 pt-3 border-t border-bridal-beige/70 flex items-center justify-between font-bridal text-[12px]">
                    <span className="text-bridal-text-soft">Remaining balance (due later)</span>
                    <span className="font-medium text-bridal-charcoal">Rs. {remainingAmount.toLocaleString()}</span>
                  </div>
                  {selectedPaymentType === 'down_payment' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#3F6B43]">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
              className={`w-full text-left rounded-md border p-5 transition-all duration-300 ${
                selectedPaymentType === 'full_payment'
                  ? 'border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_32px_-18px_rgba(176,125,84,0.5)]'
                  : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-bridal-gold-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-end justify-between gap-3">
                    <h4 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">Pay full amount</h4>
                    <span className="font-display italic text-[20px] text-bridal-gold-dark shrink-0">Rs. {totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-2 leading-relaxed">Complete the full payment in one go — no remaining balance.</p>
                  {selectedPaymentType === 'full_payment' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      Selected
                    </div>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 font-bridal text-[11.5px] text-bridal-text-soft px-1">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 text-bridal-gold" />
            <span>Payments are processed securely via Stripe. Your data is encrypted.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
