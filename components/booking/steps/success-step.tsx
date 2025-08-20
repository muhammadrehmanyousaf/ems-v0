"use client"

import { CheckCircle, Printer, Home, Calendar, Clock, Users, MapPin, Package, Building, Camera, Palette, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface SuccessStepProps {
  formData: BookingFormData
  venue?: EventVenue | null
  selectedPackageObj?: any
  selectedMenuObj?: any
  vendorDetails?: Vendor[]
  // bookingReference: string | null
}

export default function SuccessStep({ 
  formData, 
  venue, 
  selectedPackageObj, 
  selectedMenuObj, 
  vendorDetails 
}: SuccessStepProps) {
  // const reference = bookingReference || `VB-${Math.floor(100000 + Math.random() * 900000)}`

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
        return "Evening (5PM - 10PM)"
      default:
        return timeSlot
    }
  }

  const getVendorIcon = (vendorType?: string) => {
    switch (vendorType?.toLowerCase()) {
      case 'photographer':
        return <Camera className="h-6 w-6" />
      case 'makeup artist':
        return <Palette className="h-6 w-6" />
      case 'henna artist':
        return <Palette className="h-6 w-6" />
      case 'decorator':
        return <Palette className="h-6 w-6" />
      case 'catering':
        return <Package className="h-6 w-6" />
      default:
        return <Star className="h-6 w-6" />
    }
  }

  const isVendor = venue && !('menus' in venue)

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-6 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 p-4 shadow-lg">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>

      <h2 className="mb-2 text-3xl font-bold text-neutral-900">Booking Confirmed!</h2>

      <p className="mb-8 max-w-md text-neutral-600">
        Thank you for your booking, <span className="font-semibold text-rose-600">{formData.username}</span>. We have sent a
        confirmation email to <span className="font-semibold text-rose-600">{formData.email}</span> with all the details.
      </p>

      <div className="mb-10 w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4 text-left">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {getVendorIcon(venue?.subBusinessType)}
            {isVendor ? 'Vendor Booking Details' : 'Venue Booking Details'}
          </h3>
        </div>
        <div className="p-6 text-left">
          {/* Customer Information */}
          <div className="mb-6">
            <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-rose-500" />
              Customer Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Name:</span>
                <span className="font-medium text-neutral-800">{formData.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Email:</span>
                <span className="font-medium text-neutral-800">{formData.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Phone:</span>
                <span className="font-medium text-neutral-800">{formData.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Guest Count:</span>
                <span className="font-medium text-neutral-800">{formData.guestCount} guests</span>
              </div>
            </div>
          </div>

          {/* Vendor/Venue Information */}
          {venue && (
            <div className="mb-6">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Building className="h-5 w-5 text-rose-500" />
                {isVendor ? 'Vendor Details' : 'Venue Details'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                  <span className="text-neutral-600">Business Name:</span>
                  <span className="font-medium text-neutral-800">{venue.name || venue.name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                  <span className="text-neutral-600">Business Type:</span>
                  <span className="font-medium text-neutral-800 capitalize">{venue.subBusinessType || venue.subBusinessType || 'N/A'}</span>
                </div>
                {(venue.subArea || venue.city) && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Location:</span>
                    <span className="font-medium text-neutral-800">{venue.subArea} , {venue.city}</span>
                  </div>
                )}
                {venue.vendor?.rating && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Rating:</span>
                    <span className="font-medium text-neutral-800 flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      {venue.vendor?.rating}/5
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Details */}
          <div className="mb-6">
            <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-500" />
              Event Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Event Type:</span>
                <span className="font-medium text-neutral-800">{formData.eventType || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Event Date:</span>
                <span className="font-medium text-neutral-800">
                  {formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                <span className="text-neutral-600">Time Slot:</span>
                <span className="font-medium text-neutral-800">
                  {formData.timeSlot ? getTimeSlotText(formData.timeSlot) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Package & Menu Information */}
          {(selectedPackageObj || selectedMenuObj || formData.selectedPackage || formData.selectedMenu) && (
            <div className="mb-6">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-rose-500" />
                Selected Services
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedPackageObj || formData.selectedPackage) && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Selected Package:</span>
                    <span className="font-medium text-neutral-800">
                      {selectedPackageObj?.name || formData.selectedPackage}
                    </span>
                  </div>
                )}
                {(selectedMenuObj || formData.selectedMenu) && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Selected Menu:</span>
                    <span className="font-medium text-neutral-800">
                      {selectedMenuObj?.name || formData.selectedMenu}
                    </span>
                  </div>
                )}
                {selectedPackageObj?.price && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Package Price:</span>
                    <span className="font-medium text-neutral-800">${selectedPackageObj.price}</span>
                  </div>
                )}
                {selectedMenuObj?.price && (
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-3">
                    <span className="text-neutral-600">Menu Price:</span>
                    <span className="font-medium text-neutral-800">${selectedMenuObj.price}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Vendors Information */}
          {vendorDetails && vendorDetails.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" />
                Additional Vendors
              </h4>
              <div className="space-y-3">
                {vendorDetails.map((vendor, index) => (
                  <div key={index} className="rounded-xl bg-gradient-to-r from-neutral-50 to-rose-50 p-4 border border-rose-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 font-medium">Vendor {index + 1}:</span>
                      <span className="font-semibold text-neutral-800">{vendor.name}</span>
                    </div>
                    <div className="text-sm text-neutral-600 capitalize">
                      {vendor.subBusinessType || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Vendor Packages */}
          {formData.selectedVendorPackages && formData.selectedVendorPackages.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-4 text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-rose-500" />
                Selected Vendor Packages
              </h4>
              <div className="space-y-2">
                {formData.selectedVendorPackages.map((pkgId, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-dashed border-neutral-200 pb-2">
                    <span className="text-neutral-600">Package {index + 1}:</span>
                    <span className="font-medium text-neutral-800">{pkgId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Information */}
          <div className="mt-6 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-neutral-700">Total Amount:</span>
              <span className="text-2xl font-bold text-rose-600">${formData.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center rounded-xl border-neutral-300 px-6 py-3 hover:border-rose-500 hover:text-rose-600 transition-all duration-200"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Receipt
        </Button>
        <Button
          onClick={() => (window.location.href = "/")}
          className="flex items-center rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-3 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    </div>
  )
}
