"use client"

import { CheckCircle, Printer, Home, Calendar, Clock, Users, MapPin, Package, Building, Camera, Palette, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookingFormData, Vendor } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface VendorSuccessStepProps {
  formData: BookingFormData
  vendor?: any // Changed to any to handle both Vendor and EventVenue types
  selectedPackageObj?: any
  vendorDetails?: Vendor[]
  bookingResponse?: any // Add booking response to access nested data
}

export default function VendorSuccessStep({ 
  formData, 
  vendor, 
  selectedPackageObj, 
  vendorDetails,
  bookingResponse
}: VendorSuccessStepProps) {

  // Extract vendor data from booking response if available
  const vendorData = bookingResponse?.data?.bookingDetails?.[0]?.business || vendor;
  const packageData = bookingResponse?.data?.bookingDetails?.[0]?.package || selectedPackageObj;
  const bookingData = bookingResponse?.data;

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

  const getTimeSlotText = (timeSlot: string) => {
    switch (timeSlot) {
            case "09:00":
        return "Morning (9AM - 12PM)"
      case "12:00":
        return "Midday (12PM - 4PM)"
      case "17:00":
      case "5:00":
        return "Evening (5PM - 10PM)"
      default:
        return timeSlot
    }
  }

  const getVendorIcon = (vendorType?: string) => {
    switch (vendorType?.toLowerCase()) {
      case 'photographer':
        return <Camera className="h-8 w-8" />
      case 'makeup artist':
        return <Palette className="h-8 w-8" />
      case 'henna artist':
        return <Palette className="h-8 w-8" />
      case 'decorator':
        return <Palette className="h-8 w-8" />
      case 'catering':
        return <Package className="h-8 w-8" />
      default:
        return <Sparkles className="h-8 w-8" />
    }
  }

  const getVendorColor = (vendorType?: string) => {
    switch (vendorType?.toLowerCase()) {
      case 'photographer':
        return 'from-blue-500 to-indigo-600'
      case 'makeup artist':
        return 'from-purple-500 to-purple-600'
      case 'henna artist':
        return 'from-orange-500 to-amber-600'
      case 'decorator':
        return 'from-purple-500 to-violet-600'
      case 'catering':
        return 'from-green-500 to-emerald-600'
      default:
        return 'from-purple-600 to-purple-700'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Success Animation */}
      <div className="mb-8 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-6 shadow-xl">
        <CheckCircle className="h-20 w-20 text-green-600" />
      </div>

      {/* Main Success Message */}
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-4xl font-bold text-neutral-900">Booking Confirmed!</h2>
        <p className="text-lg text-neutral-600 max-w-md">
          Your booking has been successfully confirmed!
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          We've sent a confirmation email to <span className="font-medium text-purple-600">{formData.email}</span>
        </p>
      </div>

      {/* Main Booking Card */}
      <div className="mb-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        {/* Vendor Header */}
        <div className={`bg-gradient-to-r ${getVendorColor(vendorData?.type || vendorData?.subBusinessType)} px-8 py-6 text-left`}>
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-3">
              {getVendorIcon(vendorData?.type || vendorData?.subBusinessType)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{vendorData?.name || vendorData?.businessName || 'Vendor'}</h3>
              <p className="text-white/90 capitalize">{vendorData?.type || vendorData?.subBusinessType || 'Service Provider'}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Customer Information */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Name:</span>
                <span className="font-semibold text-neutral-800">{bookingData?.customerName || formData.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Email:</span>
                <span className="font-semibold text-neutral-800">{bookingData?.customerEmail || formData.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Phone:</span>
                <span className="font-semibold text-neutral-800">{bookingData?.customerPhone || formData.phoneNumber}</span>
              </div>
                             <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                 <span className="text-neutral-600">Guest Count:</span>
                 <span className="font-semibold text-neutral-800">
                   {formData.guestCount && formData.guestCount > 0 ? `${formData.guestCount} guests` : "Not specified"}
                 </span>
               </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-500" />
              Vendor Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Business Name:</span>
                <span className="font-semibold text-neutral-800">{vendorData?.name || vendorData?.businessName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Specialization:</span>
                <span className="font-semibold text-neutral-800 capitalize">{vendorData?.type || vendorData?.subBusinessType || 'N/A'}</span>
              </div>
              {(vendorData?.location || vendorData?.city) && (
                <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                  <span className="text-neutral-600">Location:</span>
                  <span className="font-semibold text-neutral-800">{vendorData?.location || vendorData?.city}</span>
                </div>
              )}
              {vendorData?.rating && (
                <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                  <span className="text-neutral-600">Rating:</span>
                  <span className="font-semibold text-neutral-800 flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    {vendorData.rating}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Event Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                 <span className="text-neutral-600">Event Type:</span>
                 <span className="font-semibold text-neutral-800">{formData.eventType || bookingData?.eventType || "Wedding"}</span>
               </div>
               <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                 <span className="text-neutral-600">Event Date:</span>
                 <span className="font-semibold text-neutral-800">
                   {formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : 
                    bookingData?.bookingDate ? new Date(bookingData.bookingDate).toLocaleDateString() : "N/A"}
                 </span>
               </div>
               <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                 <span className="text-neutral-600">Time Slot:</span>
                 <span className="font-semibold text-neutral-800">
                   {formData.timeSlot ? getTimeSlotText(formData.timeSlot) : 
                    bookingData?.bookingTime ? getTimeSlotText(bookingData.bookingTime) : "N/A"}
                 </span>
               </div>
            </div>
          </div>

          {/* Selected Package */}
          {(packageData || formData.selectedPackage) && (
            <div className="mb-8">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Selected Package
              </h4>
              <div className="rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/80 p-6 border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Package Name:</span>
                    <span className="font-semibold text-neutral-800">
                      {packageData?.name || formData.selectedPackage}
                    </span>
                  </div>
                  {packageData?.price && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Package Price:</span>
                      <span className="font-semibold text-purple-600 text-lg">${packageData.price}</span>
                    </div>
                  )}
                  {packageData?.description && (
                    <div className="md:col-span-2">
                      <span className="text-neutral-600">Description:</span>
                      <p className="text-neutral-800 mt-1">{packageData.description}</p>
                    </div>
                  )}
                  {packageData?.features && packageData.features.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-neutral-600">Features:</span>
                      <ul className="mt-2 space-y-1">
                        {packageData.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center text-neutral-800">
                            <span className="mr-2 text-purple-500">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Additional Vendors */}
          {vendorDetails && vendorDetails.length > 0 && (
            <div className="mb-8">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                Additional Vendors
              </h4>
              <div className="space-y-3">
                {vendorDetails.map((vendor, index) => (
                  <div key={index} className="rounded-xl bg-gradient-to-r from-neutral-50 to-purple-50 p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 font-medium">Vendor {index + 1}:</span>
                      <span className="font-semibold text-neutral-800">{vendor.name}</span>
                    </div>
                    <div className="text-sm text-neutral-600 capitalize">
                      {vendor.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="mt-8 rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/80 p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-neutral-700">Total Amount:</span>
              <span className="text-3xl font-bold text-purple-600">${bookingData?.totalAmount || formData.totalPrice}</span>
            </div>
            {bookingData?.downPayment && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-neutral-600">Down Payment Required:</span>
                <span className="font-semibold text-purple-600">${bookingData.downPayment}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center rounded-xl border-neutral-300 px-8 py-3 hover:border-purple-500 hover:text-purple-600 transition-all duration-200"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button
          onClick={() => (window.location.href = "/")}
          className="flex items-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-3 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </div>
  )
}
