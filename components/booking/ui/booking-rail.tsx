"use client"

import { Check, Star, Lock, ShieldCheck } from "lucide-react"
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
  return (
    <header className="rounded-md border border-bridal-beige bg-bridal-cream shadow-[0_8px_24px_-20px_rgba(176,125,84,0.45)] overflow-hidden">
      {/* Identity + trust — single tight row */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 border-b border-bridal-beige/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-bridal-charcoal text-bridal-ivory flex items-center justify-center flex-shrink-0 font-display italic text-[15px]">
            {(venue?.name || "V").slice(0, 1).toUpperCase()}
          </div>
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
                <span className="font-display italic text-bridal-charcoal tabular-nums">{(venue as any).rating}</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-bridal-blush/55 border border-bridal-rose/40 text-bridal-mauve font-bridal text-[9.5px] uppercase tracking-[0.18em] font-medium">
              {isVenueBooking ? "Venue" : (venue as any)?.type || "Vendor"}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2.5 font-bridal text-[10.5px] text-bridal-text-soft shrink-0">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3 text-bridal-gold-dark" />
            Stripe-secured
          </span>
          <span className="text-bridal-beige">·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-bridal-gold-dark" />
            PCI compliant
          </span>
        </div>
      </div>

      {/* Step list — centered */}
      <nav className="px-4 sm:px-5 py-2.5 overflow-x-auto bg-bridal-ivory/40 flex justify-center">
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
