"use client"

/**
 * Vendor (non-venue) confirmation — the `success` step in `eventStepOrder`.
 *
 * Marquee Stage — renders in the desk body beside the locked Stage, owns its
 * heading (an arrival, 40/44 per §9), sits left-aligned with the card capped
 * at 560px, and scrolls internally past the fold (the customer, vendor and
 * event sections come first; package, extra vendors and the total follow).
 * Confetti stays (pay mode only) and is skipped under reduced motion. Every
 * prop is unchanged; the figures are shown in rupees — the "$" this screen
 * printed was never the currency of anything booked here.
 */

import { Check, Printer, Home, Calendar, Users, MapPin, Package, Building, Camera, Palette, Star, Sparkles } from "lucide-react"
import type { BookingFormData, Vendor } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect, type ReactNode } from "react"
import { slotText } from "@/lib/booking/slot-vocabulary"
import { BridalButton } from "@/components/bridal/bridal-button"

interface VendorSuccessStepProps {
  formData: BookingFormData
  vendor?: any // Changed to any to handle both Vendor and EventVenue types
  selectedPackageObj?: any
  vendorDetails?: Vendor[]
  bookingResponse?: any // Add booking response to access nested data
}

const LABEL = "font-bridal text-[11px] leading-[14px] uppercase tracking-[0.18em] text-bridal-text-label"
const stagger = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 30}ms` })
const rs = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? `Rs. ${n.toLocaleString()}` : String(v ?? "")
}

/** One 36px fact row: 13px label at left, 15px italic value at right. */
function Fact({ label, value, className = "" }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-[36px] items-center justify-between gap-3 border-b border-bridal-beige ${className}`}>
      <dt className="shrink-0 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">{label}</dt>
      <dd className="min-w-0 truncate text-right font-display text-[15px] italic leading-[20px] text-bridal-charcoal">{value}</dd>
    </div>
  )
}

function SectionHead({ icon: Icon, children }: { icon: any; children: ReactNode }) {
  return (
    <h4 className={`flex h-9 items-center gap-2 ${LABEL}`}>
      <Icon className="h-3.5 w-3.5 text-bridal-gold-dark" aria-hidden />
      {children}
    </h4>
  )
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
    // §8 — reduced motion: no confetti at all.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

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

  /**
   * SLOTS step 10 — one vocabulary.
   *
   * This switch was the worst of the seven: it had no case for 14:00 or 18:00,
   * so two of the three canonical slots fell through to `default` and the
   * vendor's own confirmation screen showed a bare "14:00". It also claimed
   * "5:00" meant "Evening (5PM - 10PM)" — the backend parses 5:00 as five in
   * the morning, so the label was contradicting the engine that booked it.
   *
   * Both are fixed by deferring to the shared module rather than by adding the
   * two missing cases here.
   */
  const timeSlotText = slotText({
    bookingTime: formData.timeSlot || bookingData?.bookingTime,
    slotLabel: formData.slotLabel,
    slotStartTime: formData.slotStartTime,
    slotEndTime: formData.slotEndTime,
  })

  const getVendorIcon = (vendorType?: string | string[]) => {
    const vt = Array.isArray(vendorType) ? vendorType[0] : vendorType
    switch (vt?.toLowerCase()) {
      case 'photographer':
        return <Camera className="h-5 w-5" />
      case 'makeup artist':
        return <Palette className="h-5 w-5" />
      case 'henna artist':
        return <Palette className="h-5 w-5" />
      case 'decorator':
        return <Palette className="h-5 w-5" />
      case 'catering':
        return <Package className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const vendorType = vendor?.vendor?.vendorType || vendorData?.type || vendorData?.subBusinessType
  let block = 0

  return (
    <div className="w-full">
      {/* Heading — the screen's own: an arrival, not a step. */}
      <header className="animate-stagger-fade-up" style={stagger(block++)}>
        <p className="flex items-center gap-2 font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-bridal-gold-dark text-white motion-safe:animate-scale-in">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
          Confirmed
        </p>
        <h2 className="mt-2 font-display text-[32px] italic leading-[38px] text-bridal-charcoal xl:text-[40px] xl:leading-[44px]">
          Your booking is confirmed
        </h2>
        <span aria-hidden className="mt-3 block h-px w-16 origin-left bg-bridal-gold motion-safe:animate-hairline-draw" />
        <p className="mt-3 max-w-[640px] font-bridal text-[14px] leading-[20px] text-bridal-text-soft">
          A confirmation email is on its way to{" "}
          <span className="font-display italic text-bridal-gold-dark">{formData.email}</span>
        </p>
      </header>

      {/* Main Booking Card — capped at 560, white on ivory, no shadow. */}
      <section
        aria-label="Booking summary"
        className="mt-6 w-full max-w-[560px] rounded-[4px] border border-bridal-beige bg-white animate-stagger-fade-up"
        style={stagger(block++)}
      >
        {/* Vendor Header — charcoal + gold for every vendor type, one brand
            statement rather than a rainbow. */}
        <div className="relative overflow-hidden rounded-t-[3px] bg-bridal-charcoal px-4 py-3">
          <div className="pointer-events-none absolute inset-0 bg-mughal-jaal opacity-[0.08]" aria-hidden />
          <div className="relative flex items-center gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bridal-gold text-bridal-charcoal">
              {getVendorIcon(vendorType)}
            </div>
            <div className="min-w-0">
              <p className="font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-bridal-gold">
                Booked with
              </p>
              <h3 className="truncate font-display text-[22px] italic leading-[26px] text-bridal-ivory">
                {vendorData?.name || vendorData?.businessName || vendor?.name || 'Vendor'}
              </h3>
              <p className="truncate font-bridal text-[12px] capitalize leading-[16px] text-bridal-ivory/80">
                {vendor?.vendor?.vendorType || vendorData?.type || 'Service Provider'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          {/* Customer Information */}
          <div className="pt-1">
            <SectionHead icon={Users}>Customer information</SectionHead>
            <dl className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-6">
              <Fact label="Name" value={bookingData?.customerName || formData.username} />
              <Fact label="Email" value={bookingData?.customerEmail || formData.email} />
              <Fact label="Phone" value={bookingData?.customerPhone || formData.phoneNumber} />
              <Fact
                label="Guest count"
                value={formData.guestCount && formData.guestCount > 0 ? `${formData.guestCount} guests` : "Not specified"}
              />
            </dl>
          </div>

          {/* Vendor Details */}
          <div className="pt-3">
            <SectionHead icon={Building}>Vendor details</SectionHead>
            <dl className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-6">
              <Fact label="Business name" value={vendorData?.name || vendorData?.businessName || 'N/A'} />
              <Fact label="Specialization" value={<span className="capitalize">{vendorData?.type || vendorData?.subBusinessType || 'N/A'}</span>} />
              {(vendorData?.location || vendorData?.city) && (
                <Fact label="Location" value={vendorData?.location || vendorData?.city} />
              )}
              {vendorData?.rating && (
                <Fact
                  label="Rating"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-bridal-gold text-bridal-gold" aria-hidden />
                      {vendorData.rating}/5
                    </span>
                  }
                />
              )}
            </dl>
          </div>

          {/* Event Details */}
          <div className="pt-3">
            <SectionHead icon={Calendar}>Event details</SectionHead>
            <dl className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-6">
              <Fact label="Event type" value={formData.eventType || bookingData?.eventType || "Wedding"} />
              <Fact
                label="Event date"
                value={
                  formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() :
                  bookingData?.bookingDate ? new Date(bookingData.bookingDate).toLocaleDateString() : "N/A"
                }
              />
              <Fact label="Time slot" value={timeSlotText || "N/A"} />
            </dl>
          </div>

          {/* Selected Package */}
          {(packageData || formData.selectedPackage) && (
            <div className="pt-3">
              <SectionHead icon={Package}>Selected package</SectionHead>
              <div className="rounded-[4px] border border-bridal-gold-dark bg-bridal-cream px-4 py-1">
                <dl>
                  <Fact label="Package name" value={packageData?.name || formData.selectedPackage} className="border-bridal-beige/70" />
                  {packageData?.price && (
                    <Fact
                      label="Package price"
                      value={<span className="tabular-nums text-bridal-gold-dark">{rs(packageData.price)}</span>}
                      className="border-bridal-beige/70 last:border-b-0"
                    />
                  )}
                </dl>
                {packageData?.description && (
                  <div className="py-2">
                    <p className="font-bridal text-[13px] leading-[18px] text-bridal-text-soft">Description</p>
                    <p className="mt-1 font-bridal text-[14px] leading-[20px] text-bridal-charcoal">{packageData.description}</p>
                  </div>
                )}
                {packageData?.features && packageData.features.length > 0 && (
                  <div className="py-2">
                    <p className="font-bridal text-[13px] leading-[18px] text-bridal-text-soft">Features</p>
                    <ul className="mt-1 space-y-1">
                      {packageData.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start font-bridal text-[14px] leading-[20px] text-bridal-charcoal">
                          <span className="mr-2 text-bridal-gold-dark" aria-hidden>•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Vendors */}
          {vendorDetails && vendorDetails.length > 0 && (
            <div className="pt-3">
              <SectionHead icon={MapPin}>Additional vendors</SectionHead>
              <ul className="space-y-2">
                {vendorDetails.map((v, index) => (
                  <li key={index} className="flex min-h-[44px] items-center justify-between gap-3 rounded-[4px] border border-bridal-beige bg-bridal-ivory px-3 py-1">
                    <span className="font-bridal text-[13px] leading-[18px] text-bridal-text-soft">Vendor {index + 1}</span>
                    <span className="min-w-0 text-right">
                      <span className="block truncate font-display text-[15px] italic leading-[20px] text-bridal-charcoal">{v.name}</span>
                      <span className="block truncate font-bridal text-[12px] capitalize leading-[16px] text-bridal-text-soft">{v.type}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total Amount */}
          <div className="mt-4 rounded-[4px] border border-bridal-gold-dark bg-bridal-cream px-4 py-2">
            <div className="flex min-h-[40px] items-center justify-between gap-3">
              <div>
                <p className={LABEL}>Total amount</p>
                <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">All inclusive</p>
              </div>
              <span className="font-display text-[22px] italic leading-[26px] tabular-nums text-bridal-gold-dark">
                {rs(bookingData?.totalAmount || formData.totalPrice)}
              </span>
            </div>
            {bookingData?.downPayment && (
              <div className="mt-2 flex min-h-[32px] items-center justify-between gap-3 border-t border-bridal-beige/70 pt-2">
                <span className={LABEL}>Down payment required</span>
                <span className="font-display text-[18px] italic leading-[24px] tabular-nums text-bridal-charcoal">{rs(bookingData.downPayment)}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Action Buttons — the shell's action bar is hidden on arrival; these act. */}
      <div className="mt-6 flex w-full max-w-[560px] flex-col gap-3 xl:flex-row animate-stagger-fade-up" style={stagger(block++)}>
        <BridalButton type="button" variant="outline" size="lg" className="xl:flex-1" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Print receipt
        </BridalButton>
        <BridalButton type="button" variant="primary" size="lg" className="xl:flex-1" onClick={() => (window.location.href = "/")}>
          <Home className="h-3.5 w-3.5" aria-hidden />
          Return home
        </BridalButton>
      </div>
    </div>
  )
}
