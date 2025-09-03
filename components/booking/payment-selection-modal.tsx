"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DollarSign, CreditCard, Calendar, Building, Users, Clock } from "lucide-react"
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
}

export default function PaymentSelectionModal({
  isOpen,
  onClose,
  formData,
  venue,
  vendorDetails,
  onPaymentSelect,
  loading = false,
  bookingId
}: PaymentSelectionModalProps) {
  const [selectedPaymentType, setSelectedPaymentType] = useState<'down_payment' | 'full_payment' | null>(null)

  const isVendor = venue && !('menus' in venue)
  const downPaymentAmount = Math.round(formData.totalPrice * 0.2) // 20% down payment
  const remainingAmount = formData.totalPrice - downPaymentAmount

  const handlePaymentSelect = (paymentType: 'down_payment' | 'full_payment') => {
    setSelectedPaymentType(paymentType)
    onPaymentSelect(paymentType)
  }

  const getTimeSlotText = (timeSlot: string) => {
    switch (timeSlot) {
      case "09:00":
        return "Morning (9AM - 12PM)"
      case "12:00":
        return "Midday (12PM - 4PM)"
      case "17:00":
        return "Evening (5PM - 10PM)"
      default:
        return timeSlot
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-neutral-900">
            <DollarSign className="h-6 w-6 text-green-600" />
            Choose Payment Option
          </DialogTitle>
          <DialogDescription className="text-neutral-600">
            Select your preferred payment method to complete your booking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">

          
          {/* Booking Summary */}
          <Card className="border-2 border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-neutral-800">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingId && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium">Booking ID: #{bookingId}</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-rose-500" />
                  <span className="text-sm text-neutral-600">Business:</span>
                  <span className="font-medium text-neutral-800">{venue?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  <span className="text-sm text-neutral-600">Date:</span>
                  <span className="font-medium text-neutral-800">
                    {formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-500" />
                  <span className="text-sm text-neutral-600">Time:</span>
                  <span className="font-medium text-neutral-800">
                    {formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-500" />
                  <span className="text-sm text-neutral-600">Guests:</span>
                  <span className="font-medium text-neutral-800">{formData.guestCount}</span>
                </div>
              </div>
              
              {vendorDetails && vendorDetails.length > 0 && (
                <div className="pt-2 border-t border-rose-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-neutral-700">Additional Vendors:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {vendorDetails.map((vendor, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                        {vendor.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-800">Select Payment Option</h3>
            
            {/* Down Payment Option */}
            <Card className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPaymentType === 'down_payment' 
                ? 'border-green-500 bg-green-50' 
                : 'border-neutral-200 hover:border-green-300'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900">Down Payment</h4>
                        <p className="text-sm text-neutral-600">Secure your booking with a partial payment</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Down Payment (20%):</span>
                        <span className="font-semibold text-green-600">${downPaymentAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Remaining Amount:</span>
                        <span className="font-semibold text-neutral-700">${remainingAmount}</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200 pt-2">
                        <span className="text-neutral-600">Total Amount:</span>
                        <span className="font-semibold text-neutral-900">${formData.totalPrice}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-green-700">
                        <strong>Benefits:</strong> Lower initial cost, secure your date, pay remaining amount later
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handlePaymentSelect('down_payment')}
                    disabled={loading}
                    className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? 'Processing...' : 'Select Down Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Full Payment Option */}
            <Card className={`border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedPaymentType === 'full_payment' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-neutral-200 hover:border-blue-300'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-neutral-900">Full Payment</h4>
                        <p className="text-sm text-neutral-600">Complete payment upfront for maximum convenience</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Total Amount:</span>
                        <span className="font-semibold text-blue-600">${formData.totalPrice}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700">
                        <strong>Benefits:</strong> One-time payment, no future payments, complete peace of mind
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handlePaymentSelect('full_payment')}
                    disabled={loading}
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Processing...' : 'Select Full Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Notes */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-amber-600 text-xs font-bold">!</span>
                </div>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important Information:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Down payment secures your booking date and time</li>
                    <li>• Remaining payment is due before the event date</li>
                    <li>• Full payment provides complete booking confirmation</li>
                    <li>• All payments are processed securely via Stripe</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
