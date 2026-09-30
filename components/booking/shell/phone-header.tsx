"use client"

/**
 * The phone's version of the Stage: 64px, sticky, with the venue's thumbnail,
 * where you are, and a pill that opens the ledger sheet. A 2px progress line
 * fills underneath as steps complete.
 */

import { ChevronUp } from "lucide-react"
import type { EventVenue } from "@/lib/types"
import { pickStageImage, stageImageUrl } from "@/lib/booking/stage-image"

interface PhoneHeaderProps {
  venue: EventVenue | null
  counter: string
  /** 0..1 */
  progress: number
  pillLabel: string
  onPill: () => void
}

export default function PhoneHeader({ venue, counter, progress, pillLabel, onPill }: PhoneHeaderProps) {
  const thumb = stageImageUrl(pickStageImage((venue as any)?.images), { w: 88, h: 88, mode: "thumb" })
  return (
    <header className="booking-phone-header sticky top-0 z-30 border-b border-bridal-beige bg-bridal-ivory/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-3 px-4">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="h-11 w-11 shrink-0 rounded-[4px] object-cover" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-bridal-charcoal font-display italic text-[15px] text-bridal-ivory">
            {(venue?.name || "V").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display italic text-[15px] leading-[20px] text-bridal-charcoal" title={venue?.name || ""}>
            {venue?.name || "Vendor"}
          </p>
          <p className="truncate font-bridal text-[11px] font-medium uppercase tracking-[0.14em] leading-[14px] text-bridal-text-label">
            {counter}
          </p>
        </div>
        {/* No pill when there is nothing to summarise (an enquiry-only vendor). */}
        {pillLabel && (
          <button
            type="button"
            onClick={onPill}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-bridal-rose/50 bg-bridal-blush px-3 font-bridal text-[13px] font-medium text-bridal-gold-dark tabular-nums transition-colors hover:border-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark"
            aria-label="Open booking summary"
          >
            {pillLabel}
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      <div className="h-[2px] w-full bg-bridal-beige" aria-hidden>
        <div className="h-full bg-bridal-gold-dark transition-[width] duration-300 ease-out" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
    </header>
  )
}
