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

  const getVendorIcon = (vendorType?: string | string[]) => {
    const vt = Array.isArray(vendorType) ? vendorType[0] : vendorType
    switch (vt?.toLowerCase()) {
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

  // Bridal palette — every vendor type gets the same charcoal+gold accent so the
  // success card feels like a single brand statement, not a rainbow.
  const getVendorColor = (_vendorType?: string | string[]) => "from-bridal-charcoal to-bridal-charcoal/85"

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {/* Success crown */}
      <div className="mb-7 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative rounded-full bg-bridal-cream border border-bridal-gold/55 p-7 shadow-[0_18px_44px_-22px_rgba(176,125,84,0.55)]">
          <CheckCircle className="h-16 w-16 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
      </div>

      {/* Main Success Message */}
      <div className="mb-9 text-center">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
          Confirmed
        </p>
        <h2 className="mb-4 font-display italic text-[40px] sm:text-[52px] text-bridal-charcoal leading-[1.05]">
          Your booking is confirmed
        </h2>
        <div className="mx-auto mb-4 h-[1px] w-24 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <p className="font-bridal text-[15px] text-bridal-text-soft max-w-md mx-auto">
          A confirmation email is on its way to{" "}
          <span className="font-display italic text-[16px] text-bridal-gold-dark">{formData.email}</span>
        </p>
      </div>

      {/* Main Booking Card */}
      <div className="mb-10 w-full max-w-3xl overflow-hidden rounded-md border border-bridal-beige bg-bridal-cream shadow-[0_28px_60px_-32px_rgba(176,125,84,0.5)]">
        {/* Vendor Header */}
        <div className={`relative bg-gradient-to-r ${getVendorColor(vendor?.vendor?.vendorType || vendorData?.type || vendorData?.subBusinessType)} px-8 py-6 text-left overflow-hidden`}>
          <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="rounded-full bg-bridal-gold/95 text-bridal-charcoal p-3.5">
              {getVendorIcon(vendor?.vendor?.vendorType || vendorData?.type || vendorData?.subBusinessType)}
            </div>
            <div>
              <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold mb-0.5">
                Booked with
              </p>
              <h3 className="font-display italic text-[24px] text-bridal-ivory leading-tight">
                {vendorData?.name || vendorData?.businessName || vendor?.name || 'Vendor'}
              </h3>
              <p className="font-bridal text-[12px] text-bridal-ivory/75 capitalize mt-1">
                {vendor?.vendor?.vendorType || vendorData?.type || 'Service Provider'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Customer Information */}
          <div className="mb-8">
            <h4 className="mb-4 font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-bridal-gold" />
              Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                <span className="font-bridal text-[12.5px] text-bridal-text-soft">Name:</span>
                <span className="font-display italic text-[15px] text-bridal-charcoal">{bookingData?.customerName || formData.username}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                <span className="font-bridal text-[12.5px] text-bridal-text-soft">Email:</span>
                <span className="font-display italic text-[15px] text-bridal-charcoal">{bookingData?.customerEmail || formData.email}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                <span className="font-bridal text-[12.5px] text-bridal-text-soft">Phone:</span>
                <span className="font-display italic text-[15px] text-bridal-charcoal">{bookingData?.customerPhone || formData.phoneNumber}</span>
              </div>
                             <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                 <span className="font-bridal text-[12.5px] text-bridal-text-soft">Guest Count:</span>
                 <span className="font-display italic text-[15px] text-bridal-charcoal">
                   {formData.guestCount && formData.guestCount > 0 ? `${formData.guestCount} guests` : "Not specified"}
                 </span>
               </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="mb-8">
            <h4 className="mb-4 font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-2">
              <Building className="h-3.5 w-3.5 text-bridal-gold" />
              Vendor Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                <span className="font-bridal text-[12.5px] text-bridal-text-soft">Business Name:</span>
                <span className="font-display italic text-[15px] text-bridal-charcoal">{vendorData?.name || vendorData?.businessName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                <span className="font-bridal text-[12.5px] text-bridal-text-soft">Specialization:</span>
                <span className="font-display italic text-[15px] text-bridal-charcoal capitalize">{vendorData?.type || vendorData?.subBusinessType || 'N/A'}</span>
              </div>
              {(vendorData?.location || vendorData?.city) && (
                <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                  <span className="font-bridal text-[12.5px] text-bridal-text-soft">Location:</span>
                  <span className="font-display italic text-[15px] text-bridal-charcoal">{vendorData?.location || vendorData?.city}</span>
                </div>
              )}
              {vendorData?.rating && (
                <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                  <span className="font-bridal text-[12.5px] text-bridal-text-soft">Rating:</span>
                  <span className="font-display italic text-[15px] text-bridal-charcoal flex items-center gap-1">
                    <Star className="h-4 w-4 text-bridal-gold fill-bridal-gold" />
                    {vendorData.rating}/5
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-8">
            <h4 className="mb-4 font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-bridal-gold" />
              Event Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                 <span className="font-bridal text-[12.5px] text-bridal-text-soft">Event Type:</span>
                 <span className="font-display italic text-[15px] text-bridal-charcoal">{formData.eventType || bookingData?.eventType || "Wedding"}</span>
               </div>
               <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                 <span className="font-bridal text-[12.5px] text-bridal-text-soft">Event Date:</span>
                 <span className="font-display italic text-[15px] text-bridal-charcoal">
                   {formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : 
                    bookingData?.bookingDate ? new Date(bookingData.bookingDate).toLocaleDateString() : "N/A"}
                 </span>
               </div>
               <div className="flex items-center justify-between border-b border-dashed border-bridal-beige pb-3">
                 <span className="font-bridal text-[12.5px] text-bridal-text-soft">Time Slot:</span>
                 <span className="font-display italic text-[15px] text-bridal-charcoal">
                   {formData.timeSlot ? getTimeSlotText(formData.timeSlot) : 
                    bookingData?.bookingTime ? getTimeSlotText(bookingData.bookingTime) : "N/A"}
                 </span>
               </div>
            </div>
          </div>

          {/* Selected Package */}
          {(packageData || formData.selectedPackage) && (
            <div className="mb-8">
              <h4 className="mb-4 font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-bridal-gold" />
                Selected Package
              </h4>
              <div className="rounded-md bg-bridal-cream p-6 border border-bridal-gold/45 shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bridal text-[12.5px] text-bridal-text-soft">Package Name:</span>
                    <span className="font-display italic text-[15px] text-bridal-charcoal">
                      {packageData?.name || formData.selectedPackage}
                    </span>
                  </div>
                  {packageData?.price && (
                    <div className="flex items-center justify-between">
                      <span className="font-bridal text-[12.5px] text-bridal-text-soft">Package Price:</span>
                      <span className="font-display italic text-[20px] text-bridal-gold-dark">${packageData.price}</span>
                    </div>
                  )}
                  {packageData?.description && (
                    <div className="md:col-span-2">
                      <span className="font-bridal text-[12.5px] text-bridal-text-soft">Description:</span>
                      <p className="text-neutral-800 mt-1">{packageData.description}</p>
                    </div>
                  )}
                  {packageData?.features && packageData.features.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="font-bridal text-[12.5px] text-bridal-text-soft">Features:</span>
                      <ul className="mt-2 space-y-1">
                        {packageData.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center text-neutral-800">
                            <span className="mr-2 text-bridal-gold">•</span>
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
              <h4 className="mb-4 font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-bridal-gold" />
                Additional Vendors
              </h4>
              <div className="space-y-3">
                {vendorDetails.map((vendor, index) => (
                  <div key={index} className="rounded-md bg-bridal-ivory p-4 border border-bridal-beige">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bridal text-[12.5px] text-bridal-text-soft font-medium">Vendor {index + 1}:</span>
                      <span className="font-display italic text-[15px] text-bridal-charcoal">{vendor.name}</span>
                    </div>
                    <div className="text-sm font-bridal text-[12.5px] text-bridal-text-soft capitalize">
                      {vendor.type}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="mt-8 rounded-md bg-bridal-cream p-6 border border-bridal-gold/45 shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
            <div className="flex items-end justify-between">
              <div>
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-text-label mb-1">Total amount</p>
                <p className="font-display italic text-[18px] text-bridal-charcoal leading-none">All inclusive</p>
              </div>
              <span className="font-display italic text-[36px] text-bridal-gold-dark leading-none">${bookingData?.totalAmount || formData.totalPrice}</span>
            </div>
            {bookingData?.downPayment && (
              <div className="mt-4 pt-4 border-t border-bridal-beige/70 flex items-center justify-between font-bridal text-[12.5px]">
                <span className="text-bridal-text-soft uppercase tracking-[0.18em] text-[10.5px] font-medium">Down payment required</span>
                <span className="font-display italic text-[18px] text-bridal-charcoal">${bookingData.downPayment}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[12px] uppercase tracking-[0.22em] font-medium px-7 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print receipt
        </button>
        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="inline-flex items-center justify-center gap-2 h-12 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium px-7 shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
        >
          <Home className="h-3.5 w-3.5" />
          Return home
        </button>
      </div>
    </div>
  )
}
