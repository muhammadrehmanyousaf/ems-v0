"use client"

/**
 * Instant-mode confirmation (a venue booking that was paid on confirm).
 *
 * Marquee Stage — renders in the desk body beside the locked Stage. It owns
 * its heading (an arrival, drawn at 40/44 per §9), sits left-aligned in the
 * 768px body with the summary card capped at 560px, and enters with the CSS
 * stagger instead of framer variants — nothing here rests at opacity 0 or
 * waits on an observer. Confetti stays (pay mode only) and is skipped under
 * reduced motion. Every prop is unchanged.
 */

import { Check, Printer, Home, Building, DollarSign } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { slotText } from "@/lib/booking/slot-vocabulary"
import { BridalButton } from "@/components/bridal/bridal-button"

interface SuccessStepProps {
  formData: BookingFormData
  venue?: EventVenue | null
  selectedPackageObj?: any
  selectedMenuObj?: any
  vendorDetails?: Vendor[]
}

const LABEL = "font-bridal text-[11px] leading-[14px] uppercase tracking-[0.18em] text-bridal-text-label"
const stagger = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 30}ms` })

export default function SuccessStep({
  formData,
  venue,
  selectedPackageObj,
  selectedMenuObj,
  vendorDetails
}: SuccessStepProps) {
  useEffect(() => {
    // §8 — reduced motion: no confetti at all.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  // SLOTS step 10 — one vocabulary. The local switch could not name a vendor's
  // own slot, so the confirmation screen for a "Dinner event" booking said
  // "19:00" — a different sentence from the one on the button the customer had
  // pressed two screens earlier.
  const timeSlotText = slotText({
    bookingTime: formData.timeSlot,
    slotLabel: formData.slotLabel,
    slotStartTime: formData.slotStartTime,
    slotEndTime: formData.slotEndTime,
  })

  const isVendor = venue && !('menus' in venue)

  const facts = [
    { label: "Name", value: formData.username },
    ...( ["Wedding venue", "Catering", "Decorator"].includes(venue?.vendor?.vendorType ?? "")
      ? [{ label: "Guests", value: `${formData.guestCount}` }]
      : []
    ),
    { label: "Date", value: formData.bookingDate ? new Date(formData.bookingDate).toLocaleDateString() : "N/A" },
    { label: "Time", value: timeSlotText || "N/A" },
  ]

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
          Thank you,{" "}
          <span className="font-display italic text-bridal-charcoal">{formData.username}</span>.
          A confirmation has been sent to{" "}
          <span className="font-display italic text-bridal-gold-dark">{formData.email}</span>.
        </p>
      </header>

      {/* Booking summary — capped at 560, white on ivory, no shadow. */}
      <section
        aria-label="Booking summary"
        className="mt-6 w-full max-w-[560px] rounded-[4px] border border-bridal-beige bg-white animate-stagger-fade-up"
        style={stagger(block++)}
      >
        <div className="relative overflow-hidden rounded-t-[3px] bg-bridal-charcoal px-4 py-3">
          <div className="pointer-events-none absolute inset-0 bg-mughal-jaal opacity-[0.08]" aria-hidden />
          <div className="relative flex items-center gap-2">
            <Building className="h-3.5 w-3.5 text-bridal-gold" aria-hidden />
            <p className="font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-bridal-gold">
              {isVendor ? 'Vendor booking' : 'Venue booking'}
            </p>
          </div>
          <h3 className="relative mt-1 truncate font-display text-[22px] italic leading-[26px] text-bridal-ivory" title={venue?.name}>
            {venue?.name}
          </h3>
        </div>

        <div className="p-4">
          {/* Customer & event facts — 2 columns at the base width, 4 from xl. */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 xl:grid-cols-4">
            {facts.map((row, i) => (
              <div key={row.label} className="min-w-0 animate-stagger-fade-up" style={stagger(i)}>
                <dt className={LABEL}>{row.label}</dt>
                <dd className="mt-1 truncate font-display text-[15px] italic leading-[20px] text-bridal-charcoal" title={row.value}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Services */}
          {(selectedPackageObj || selectedMenuObj) && (
            <dl className="mt-4 border-t border-bridal-beige pt-3">
              {selectedPackageObj && (
                <div className="flex h-8 items-center justify-between gap-3">
                  <dt className="min-w-0 truncate font-bridal text-[13px] leading-[18px] text-bridal-charcoal">
                    <span className={`mr-2 ${LABEL}`}>Package</span>
                    {selectedPackageObj.name}
                  </dt>
                  <dd className="shrink-0 font-bridal text-[14px] leading-[20px] tabular-nums text-bridal-charcoal">
                    Rs. {Number(selectedPackageObj.price)?.toLocaleString()}
                  </dd>
                </div>
              )}
              {selectedMenuObj && (
                <div className="flex h-8 items-center justify-between gap-3">
                  <dt className="min-w-0 truncate font-bridal text-[13px] leading-[18px] text-bridal-charcoal">
                    <span className={`mr-2 ${LABEL}`}>Menu</span>
                    {selectedMenuObj.name || selectedMenuObj.title}
                  </dt>
                  <dd className="shrink-0 font-bridal text-[14px] leading-[20px] tabular-nums text-bridal-charcoal">
                    Rs. {Number(selectedMenuObj.price)?.toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {/* Total */}
          <div className="mt-3 flex min-h-[56px] items-center justify-between gap-3 rounded-[4px] border border-bridal-gold-dark bg-bridal-cream px-4 py-2">
            <div>
              <p className={LABEL}>Total amount</p>
              <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">All inclusive</p>
            </div>
            <span className="font-display text-[22px] italic leading-[26px] tabular-nums text-bridal-gold-dark">
              Rs. {Number(formData.totalPrice)?.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Actions — the shell's action bar is hidden on arrival; these act. */}
      <div className="mt-6 flex w-full max-w-[560px] flex-col gap-3 xl:flex-row animate-stagger-fade-up" style={stagger(block++)}>
        <BridalButton type="button" variant="outline" size="lg" className="xl:flex-1" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" aria-hidden />
          Print
        </BridalButton>
        <BridalButton
          type="button"
          variant="outline"
          size="lg"
          className="border-bridal-sage/50 text-[#3F6B43] hover:border-[#3F6B43] hover:text-[#3F6B43] xl:flex-1"
          onClick={() => (window.location.href = "/user/payments")}
        >
          <DollarSign className="h-3.5 w-3.5" aria-hidden />
          Manage payments
        </BridalButton>
        <BridalButton type="button" variant="primary" size="lg" className="xl:flex-1" onClick={() => (window.location.href = "/")}>
          <Home className="h-3.5 w-3.5" aria-hidden />
          Home
        </BridalButton>
      </div>
    </div>
  )
}
