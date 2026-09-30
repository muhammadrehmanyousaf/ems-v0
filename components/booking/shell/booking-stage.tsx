"use client"

/**
 * The Stage: the venue, the receipt and the progress, in one charcoal panel
 * that stays put while the desk beside it changes.
 *
 * The venue's image is a framed thumbnail beside its name — the way Airbnb's
 * booking page shows the listing — not a full-bleed hero. Vendors upload
 * flyers and logos as often as rooms, and a flyer blown up to 560px is the
 * ugliest thing a booking page can open with. At 96×72 the same image reads
 * as "this is the place" and nothing more. Every character sits on solid
 * charcoal. Nothing here rests at opacity 0.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"
import type { EventVenue } from "@/lib/types"
import { pickStageImage, stageImageUrl, stageImageUsable } from "@/lib/booking/stage-image"
import { LedgerRows, MoneyBlock, type LedgerRow, type MoneyState } from "./booking-ledger"

const JAAL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23C9956A' stroke-width='1' opacity='0.07'><path d='M40 0 C 50 20, 60 30, 80 40 C 60 50, 50 60, 40 80 C 30 60, 20 50, 0 40 C 20 30, 30 20, 40 0 Z'/><circle cx='40' cy='40' r='6'/><path d='M0 40 H 80 M 40 0 V 80' stroke-dasharray='2 6'/></g></svg>\")"

/** Preload, gate, then hand back a URL safe to mount (used by the phone sheet's band). */
export function useStagePhoto(src: string | null, w: number, h: number): string | null {
  const [ready, setReady] = useState<string | null>(null)
  useEffect(() => {
    setReady(null)
    const url = stageImageUrl(src, { w, h })
    if (!url) return
    let cancelled = false
    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      if (cancelled) return
      if (stageImageUsable(img.naturalWidth, img.naturalHeight)) setReady(url)
    }
    img.onerror = () => {}
    img.src = url
    return () => {
      cancelled = true
    }
  }, [src, w, h])
  return ready
}

export function Wordmark({ onNavigate, light = true }: { onNavigate?: (href: string) => boolean | void; light?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Wedding Wala — home"
      onClick={(e) => {
        if (onNavigate && onNavigate("/") === false) e.preventDefault()
      }}
      className="flex items-center gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-charcoal"
    >
      {/* Served from /public, not /_next/image — the optimiser quota is exhausted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-mark.png" alt="" aria-hidden width={32} height={32} className="h-8 w-auto" />
      <span className={`font-display italic text-[20px] leading-none tracking-tight ${light ? "text-bridal-ivory" : "text-bridal-charcoal"}`}>
        Wedding <span className="text-bridal-gold">Wala</span>
      </span>
    </Link>
  )
}

interface BookingStageProps {
  venue: EventVenue | null
  loading: boolean
  rows: LedgerRow[]
  money: MoneyState | null
  locked: boolean
  onJump: (stepKey: string) => void
  /** Return false to cancel navigation (the leave dialog takes over). */
  onNavigate: (href: string) => boolean | void
  venueHref: string
  /** A package's own image, shown in place of the venue's while it is chosen. */
  packageImage?: string | null
  /** Enquiry-only vendors: identity, no ledger. */
  caption?: string | null
}

export default function BookingStage({
  venue,
  loading,
  rows,
  money,
  locked,
  onJump,
  onNavigate,
  venueHref,
  packageImage,
  caption,
}: BookingStageProps) {
  const v = venue as any
  const thumbSrc = packageImage || pickStageImage(v?.images)
  const thumb = stageImageUrl(thumbSrc, { w: 288, h: 216, mode: "thumb" })
  const [thumbBroken, setThumbBroken] = useState(false)
  useEffect(() => setThumbBroken(false), [thumb])
  const where = [v?.subArea, v?.city].filter(Boolean).join(", ")
  const rating = Number(v?.rating) > 0 ? Number(v.rating).toFixed(1) : null
  const kind = v?.vendor?.vendorType === "Wedding venue" ? "Venue" : v?.vendor?.vendorType || "Vendor"

  return (
    <aside
      role="complementary"
      aria-label="Your booking"
      className="booking-stage relative flex flex-col overflow-hidden bg-bridal-charcoal text-bridal-ivory"
    >
      {/* Top band */}
      <div className="flex h-[var(--bk-stage-band)] shrink-0 items-center justify-between border-b border-bridal-ivory/10 px-8">
        <Wordmark onNavigate={onNavigate} />
        <Link
          href={venueHref}
          onClick={(e) => {
            if (onNavigate(venueHref) === false) e.preventDefault()
          }}
          className="inline-flex h-9 max-w-[240px] items-center gap-1.5 truncate rounded-full bg-bridal-ivory/10 px-3.5 font-bridal text-[11px] font-medium uppercase tracking-[0.16em] text-bridal-ivory transition-colors hover:bg-bridal-ivory/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold"
        >
          <ArrowLeft className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">Back to venue</span>
        </Link>
      </div>

      {/* Identity + ledger + money. Sized by the short-screen variables so it
          fits a 614px viewport; on anything smaller still it scrolls inside
          itself rather than clipping the total. */}
      <div className="bridal-scroll relative min-h-0 overflow-y-auto px-8 pb-[var(--bk-stage-pad)] pt-[var(--bk-stage-pad)]">
        {locked && <span aria-hidden className="absolute left-8 right-8 top-0 h-px origin-left bg-bridal-gold animate-hairline-draw" />}
        {loading ? (
          <div className="flex gap-4 py-2" aria-hidden>
            <div className="h-[72px] w-24 shrink-0 rounded-[6px] bg-bridal-sand/20" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded bg-bridal-sand/20" />
              <div className="h-7 w-52 rounded bg-bridal-sand/20" />
              <div className="h-3 w-40 rounded bg-bridal-sand/20" />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {thumb && !thumbBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={thumb}
                src={thumb}
                alt=""
                width={96}
                height={72}
                decoding="async"
                onError={() => setThumbBroken(true)}
                className={`h-[72px] w-24 shrink-0 rounded-[6px] border border-bridal-ivory/15 object-cover animate-fade-in ${locked ? "brightness-[1.06]" : ""}`}
              />
            ) : (
              <div
                className="flex h-[72px] w-24 shrink-0 items-center justify-center rounded-[6px] border border-bridal-ivory/15 font-display italic text-[24px] text-bridal-gold"
                style={{ backgroundImage: JAAL, backgroundSize: "40px 40px" }}
              >
                {(venue?.name || "V").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold">
                {caption || "Booking with"}
              </p>
              <h1 className="mt-1 line-clamp-2 font-display italic text-[length:var(--bk-stage-name)] leading-[var(--bk-stage-name-lh)] text-bridal-ivory">
                {venue?.name || "Vendor"}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 font-bridal text-[13px] leading-[18px] text-bridal-ivory/80">
                {rating && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3 fill-bridal-gold text-bridal-gold" aria-hidden />
                    <span className="tabular-nums">{rating}</span>
                  </span>
                )}
                {rating && where && <span aria-hidden>·</span>}
                {where && <span>{where}</span>}
                {(rating || where) && <span aria-hidden>·</span>}
                <span>{kind}</span>
              </p>
            </div>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="mt-[var(--bk-stage-gap)] border-t border-bridal-ivory/10 pt-1">
            <LedgerRows rows={rows} onJump={onJump} locked={locked} />
          </div>
        )}
        {!loading && money && <MoneyBlock money={money} />}
      </div>

      {/* Whatever height is left carries the lattice — a quiet surface, not a
          hero, and it gives way first when the screen is short. */}
      <div aria-hidden className="min-h-0 flex-1 basis-0" style={{ backgroundImage: JAAL, backgroundSize: "80px 80px" }} />
    </aside>
  )
}
