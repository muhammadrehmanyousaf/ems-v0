"use client"

/**
 * The Stage: the venue, the receipt and the progress, in one charcoal panel
 * that stays put while the desk beside it changes.
 *
 * The page the customer came from is a full-bleed photograph with the venue's
 * name in 64px Playfair. The booking page used to throw that away and show a
 * 40px circle. The Stage keeps the venue in front of the person booking it —
 * but every character sits on solid charcoal, not on the photograph: vendors
 * upload logos and flyers as often as rooms (business 3358's first image is
 * a 480px marketing tile), and ivory over an unknown picture is not a
 * contrast you can promise.
 *
 * The photograph is preloaded and mounted only once it has loaded and passed
 * a size gate; a missing or unusable image leaves the charcoal-and-lattice
 * resting state, which is a designed state, not an error. Nothing here rests
 * at opacity 0.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Star } from "lucide-react"
import type { EventVenue } from "@/lib/types"
import { pickStageImage, stageImageUrl, stageImageUsable } from "@/lib/booking/stage-image"
import { LedgerRows, MoneyBlock, type LedgerRow, type MoneyState } from "./booking-ledger"

const JAAL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><g fill='none' stroke='%23C9956A' stroke-width='1' opacity='0.12'><path d='M40 0 C 50 20, 60 30, 80 40 C 60 50, 50 60, 40 80 C 30 60, 20 50, 0 40 C 20 30, 30 20, 40 0 Z'/><circle cx='40' cy='40' r='6'/><path d='M0 40 H 80 M 40 0 V 80' stroke-dasharray='2 6'/></g></svg>\")"

/** Preload, gate, then hand back a URL safe to mount. */
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
  const baseSrc = pickStageImage(v?.images)
  const photo = useStagePhoto(packageImage || baseSrc, 1200, 900)
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
      <div className="flex h-[var(--bk-stage-band)] shrink-0 items-center justify-between px-8">
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

      {/* Photo zone */}
      <div className="relative min-h-[120px] flex-1" style={{ backgroundImage: JAAL, backgroundSize: "80px 80px" }}>
        {photo && (
          <div key={photo} className="absolute inset-0 animate-fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              decoding="async"
              // @ts-expect-error — fetchpriority is valid HTML; React 18 types lag.
              fetchpriority="high"
              className={`h-full w-full object-cover motion-safe:animate-ken-burns ${locked ? "brightness-[1.08]" : ""} transition-[filter] duration-700`}
              style={{ willChange: "transform" }}
            />
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(44,24,16,0), rgba(44,24,16,1))" }}
        />
      </div>

      {/* Identity + ledger + money */}
      <div className="relative shrink-0 px-8 pb-6 pt-2">
        {locked && <span aria-hidden className="absolute left-8 right-8 top-0 h-px origin-left bg-bridal-gold animate-hairline-draw" />}
        {loading ? (
          <div className="space-y-3 py-2" aria-hidden>
            <div className="h-3 w-24 rounded bg-bridal-sand/20" />
            <div className="h-8 w-64 rounded bg-bridal-sand/20" />
            <div className="h-3 w-40 rounded bg-bridal-sand/20" />
          </div>
        ) : (
          <>
            <p className="font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold">
              {caption || "Booking with"}
            </p>
            <h1 className="mt-1.5 line-clamp-2 font-display italic text-[length:var(--bk-stage-name)] leading-[var(--bk-stage-name-lh)] text-bridal-ivory">
              {venue?.name || "Vendor"}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 font-bridal text-[13px] leading-[18px] text-bridal-ivory/80">
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
          </>
        )}

        {!loading && rows.length > 0 && (
          <div className="mt-4">
            <LedgerRows rows={rows} onJump={onJump} locked={locked} />
          </div>
        )}
        {!loading && money && <MoneyBlock money={money} />}
      </div>
    </aside>
  )
}
