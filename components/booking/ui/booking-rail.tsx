"use client"

import { Check, Star, Lock, ShieldCheck, MapPin } from "lucide-react"
import Image from "next/image"
import type { EventVenue } from "@/lib/types"

interface BookingTopBarProps {
  venue: EventVenue | null
  steps: { key: string; title: string }[]
  currentStep: number
  isVenueBooking: boolean
}

/**
 * Compact horizontal top bar — vendor identity + step list + trust badges
 * fit into a single tight card. No tall stacked rows.
 */
export default function BookingTopBar({
  venue,
  steps,
  currentStep,
  isVenueBooking,
}: BookingTopBarProps) {
  const v = venue as any
  const venueImage: string | null =
    (Array.isArray(v?.images) && v.images.find((u: unknown) => typeof u === "string" && u)) || null
  const where = [v?.subArea, v?.city].filter(Boolean).join(", ")

  return (
    <header className="rounded-md border border-bridal-beige bg-bridal-cream shadow-[0_8px_24px_-20px_rgba(176,125,84,0.45)] overflow-hidden">
      {/* Identity + trust — single tight row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-b border-bridal-beige/70">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* The venue's own photograph, not its initial.
              Six screens of questions is a long way to walk from the page where
              you chose a place, and the only thing carried across was a letter
              in a circle. The business payload has ten images; using the first
              costs one request the vendor page has already warmed, and it keeps
              the thing being bought in front of the person buying it. Falls back
              to the initial when a vendor has uploaded nothing. */}
          {venueImage ? (
            <Image
              src={venueImage}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-bridal-charcoal font-display italic text-[15px] text-bridal-ivory">
              {(venue?.name || "V").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
            <p className="hidden sm:block font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              Booking with
            </p>
            <h2 className="font-display italic text-[16px] sm:text-[17px] text-bridal-charcoal leading-tight truncate">
              {venue?.name || "Vendor"}
            </h2>
            {(venue as any)?.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-[12px]">
                <Star className="w-3.5 h-3.5 fill-bridal-gold text-bridal-gold" />
                <span className="font-display italic text-bridal-charcoal tabular-nums">{Number((venue as any).rating).toFixed(1)}</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-bridal-blush/55 border border-bridal-rose/40 text-bridal-mauve font-bridal text-[9.5px] uppercase tracking-[0.18em] font-medium">
              {isVenueBooking ? "Venue" : (venue as any)?.type || "Vendor"}
            </span>
            {where && (
              <span className="hidden items-center gap-1 font-bridal text-[12px] text-bridal-text-soft sm:inline-flex">
                <MapPin className="h-3 w-3 text-bridal-gold-dark" />
                {where}
              </span>
            )}
          </div>
        </div>

        {/* WW-TRUST-COPY — this read "Stripe-secured · PCI compliant". Stripe
            does not onboard Pakistani businesses, so no venue on the platform
            can take card money and the venue flow does not route there: the
            advance is transferred to the venue directly. A trust badge naming a
            rail the payment never touches is worse than none — it is the same
            class of claim as the placeholder IBAN this flow already carried.
            What IS true, and is what a couple actually needs to know, is who
            ends up holding the money. */}
        <div className="hidden md:flex items-center gap-2.5 font-bridal text-[10.5px] text-bridal-text-soft shrink-0">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3 text-bridal-gold-dark" />
            You pay the venue directly
          </span>
          <span className="text-bridal-beige">·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-bridal-gold-dark" />
            Every payment recorded
          </span>
        </div>
      </div>

      {/* Step list.
          On a phone this was the same six-step rail with labels, in a
          horizontally scrolling row: `min-w-max` inside `overflow-x-auto`, so
          the steps ran off the right edge and the person saw "MEHNDI ... PACK"
          with the rest hidden behind a scroll nobody thinks to try. A rail you
          cannot read is not orientation, it is decoration that costs height.
          Phones get the one fact that matters — which step this is, and how
          many are left — plus a bar that fills. The full rail returns at sm. */}
      <div className="border-t border-bridal-beige/70 bg-bridal-ivory/40 px-4 py-3 sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </span>
          <span className="truncate font-display italic text-[15px] text-bridal-charcoal">
            {steps[Math.min(Math.max(currentStep, 0), steps.length - 1)]?.title}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-bridal-beige">
          <div
            className="h-full rounded-full bg-bridal-gold-dark transition-all duration-500 ease-out"
            style={{ width: `${(Math.min(currentStep + 1, steps.length) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <nav className="hidden overflow-x-auto bg-bridal-ivory/40 px-4 py-2.5 sm:flex sm:justify-center sm:px-5">
        <ol className="flex items-center gap-1 min-w-max">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isCurrent = idx === currentStep
            return (
              <li key={step.key + idx} className="flex items-center">
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`relative flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-display italic tabular-nums shrink-0 transition-colors ${
                      isCompleted
                        ? "bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark"
                        : isCurrent
                        ? "bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark ring-[3px] ring-bridal-gold/20"
                        : "bg-bridal-ivory text-bridal-text-soft border border-bridal-beige"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3" strokeWidth={2.5} /> : idx + 1}
                  </span>
                  <span
                    className={`font-bridal text-[11px] uppercase tracking-[0.18em] font-medium whitespace-nowrap transition-colors ${
                      isCurrent ? "text-bridal-charcoal" : isCompleted ? "text-bridal-charcoal/70" : "text-bridal-text-soft"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <span className="mx-2.5 h-px w-6 sm:w-10 bg-bridal-beige overflow-hidden shrink-0">
                    <span
                      className="block h-full bg-gradient-to-r from-bridal-gold to-bridal-gold-dark transition-all duration-500"
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </header>
  )
}
