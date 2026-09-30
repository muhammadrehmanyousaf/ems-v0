"use client"

/**
 * WW-BOOKING-MODE — what the customer sees when the venue reviews first.
 *
 * The flow was instant-book: pick a date, pay immediately, and the vendor finds
 * out afterwards. No Pakistani marquee sells a peak-season Saturday that way —
 * those dates are negotiated eight to twelve months out and are the venue's
 * scarcest asset.
 *
 * When a venue has set `bookingMode: request`, this replaces the payment screen.
 * Nothing is charged, and the customer is told plainly what happens next and
 * when. The one thing this screen must never do is imply the booking is
 * secured — it isn't until the venue says so, and since 2026-08-29 the date is
 * not held for them either.
 *
 * Marquee Stage — rendered INSIDE the desk body (the Stage persists and locks
 * beside it, the action bar is hidden, this screen's own buttons act). It owns
 * its heading because it is an arrival, not a step in `eventStepOrder`. The
 * four-line "what happens next" list is a three-node status timeline; the
 * reference copies on tap; a multi-function booking gets "Continue to {next}".
 */

import { useEffect, useRef, useState } from "react"
import { Check, Copy, FileText, Home, MessageCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { BridalButton } from "@/components/bridal/bridal-button"

interface RequestSentScreenProps {
  bookingId: number
  venueName?: string
  bookingDate?: string
  guestCount?: number
  amountDue?: number
  whatsappNumber?: string | null
  /** §10.2 — a multi-function booking with a function still to send. */
  nextUnsubmittedEvent?: { index: number; eventType: string }
  /** Switches the shell to that function's tab; the shell owns the navigation. */
  onContinueNext?: (index: number) => void
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
const LABEL = "font-bridal text-[11px] leading-[14px] uppercase tracking-[0.18em] text-bridal-text-label"
const OUTLINE_LINK = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] border border-bridal-beige bg-white px-6 font-bridal text-[13px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal transition-colors duration-150 hover:border-bridal-gold-dark hover:text-bridal-gold-dark ${FOCUS}`
const PRIMARY_LINK = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-bridal-gold px-6 font-bridal text-[13px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-colors duration-200 hover:bg-bridal-gold-dark hover:text-bridal-ivory ${FOCUS}`

const stagger = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 30}ms` })

export default function RequestSentScreen({
  bookingId,
  venueName,
  bookingDate,
  guestCount,
  amountDue,
  whatsappNumber,
  nextUnsubmittedEvent,
  onContinueNext,
}: RequestSentScreenProps) {
  const formatDate = (d?: string) => {
    if (!d) return null
    try {
      return new Date(d).toLocaleDateString("en-PK", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    } catch { return d }
  }

  const waHref = whatsappNumber
    ? `https://wa.me/${String(whatsappNumber).replace(/\D/g, "")}`
    : null

  const reference = `BK-${bookingId}`

  // Copy-on-tap for the reference: a 1.5s "Copied" state, then back. The
  // timer is cleared on unmount so a fast exit cannot set state on a dead tree.
  const [copied, setCopied] = useState(false)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current) }, [])
  const copyReference = () => {
    const done = () => {
      setCopied(true)
      if (copiedTimer.current) clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setCopied(false), 1500)
    }
    try {
      navigator.clipboard?.writeText(reference).then(done).catch(() => {})
    } catch {
      /* clipboard unavailable (http, permissions) — the reference is still on screen */
    }
  }

  const rows = [
    venueName ? { label: "Venue", value: venueName } : null,
    formatDate(bookingDate) ? { label: "Date", value: formatDate(bookingDate)! } : null,
    guestCount ? { label: "Guests", value: String(guestCount) } : null,
    amountDue && amountDue > 0
      ? { label: "Advance (not yet charged)", value: `Rs. ${Number(amountDue).toLocaleString()}` }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const hasNext = !!nextUnsubmittedEvent
  let block = 0

  return (
    <div className="w-full">
      {/* Heading — the screen's own: it is an arrival, not a step. */}
      <header className="animate-stagger-fade-up" style={stagger(block++)}>
        <p className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
          Request sent
        </p>
        {/* Said "Your date is held" until 2026-08-29. The booking flow no
            longer creates a hold, so that was a promise nothing was keeping. */}
        <h2 className="mt-2 font-display text-[32px] italic leading-[38px] text-bridal-charcoal xl:text-[40px] xl:leading-[44px]">
          Request sent to the venue
        </h2>
        <p className="mt-3 max-w-[640px] font-bridal text-[14px] leading-[20px] text-bridal-text-soft">
          {venueName || "The venue"} reviews each booking before confirming. Nothing has
          been charged — we&apos;ll ask for the advance once they accept.
        </p>
      </header>

      {/* Status timeline — three nodes on a 2px track. Node 1 fills on mount,
          node 2 (where the request is now) pulses, node 3 waits outlined. */}
      <ol
        aria-label="Request status"
        className="relative mt-6 grid min-h-[72px] grid-cols-3 gap-x-3 animate-stagger-fade-up"
        style={stagger(block++)}
      >
        <span aria-hidden className="absolute left-[calc(100%/6)] right-[calc(100%/6)] top-[11px] h-[2px] bg-bridal-beige" />
        <span
          aria-hidden
          className="absolute left-[calc(100%/6)] top-[11px] h-[2px] w-1/3 origin-left bg-bridal-gold-dark motion-safe:animate-hairline-draw"
        />
        <li className="relative flex flex-col items-center text-center">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-bridal-gold-dark bg-bridal-gold-dark text-white motion-safe:animate-scale-in">
            <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
          </span>
          <span className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-charcoal">Sent</span>
        </li>
        <li className="relative flex flex-col items-center text-center" aria-current="step">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-bridal-gold-dark bg-white motion-safe:animate-[pulse_1.5s_ease-in-out_infinite]">
            <span className="h-2 w-2 rounded-full bg-bridal-gold-dark" aria-hidden />
          </span>
          <span className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-charcoal">
            Venue reviews
            <span className="block text-bridal-text-soft">usually within a few hours</span>
          </span>
        </li>
        <li className="relative flex flex-col items-center text-center">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-bridal-beige bg-white" />
          <span className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">Confirmed</span>
        </li>
      </ol>

      {/* What was requested. The customer has just filled six steps; showing it
          back is how they know the right thing was sent. */}
      <section
        aria-label="What you asked for"
        className="mt-6 rounded-[4px] border border-bridal-beige bg-white animate-stagger-fade-up"
        style={stagger(block++)}
      >
        <div className="flex h-9 items-center border-b border-bridal-beige px-4">
          <p className={LABEL}>What you asked for</p>
        </div>
        <dl>
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex h-8 items-center justify-between gap-3 border-b border-bridal-beige px-4 animate-stagger-fade-up"
              style={stagger(i)}
            >
              <dt className={`shrink-0 ${LABEL}`}>{row.label}</dt>
              <dd className="min-w-0 truncate text-right font-bridal text-[13px] leading-[18px] tabular-nums text-bridal-charcoal" title={row.value}>
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex h-8 items-center justify-between gap-3 px-4 animate-stagger-fade-up" style={stagger(rows.length)}>
            <dt className={`shrink-0 ${LABEL}`}>Reference</dt>
            <dd className="min-w-0">
              {/* 32px row, 44px hit target: the button overhangs the row by 6px
                  each side so a thumb can land on it. */}
              <button
                type="button"
                onClick={copyReference}
                aria-label={copied ? "Reference copied" : `Copy reference ${reference}`}
                className={`-my-[6px] -mr-2 inline-flex h-11 items-center gap-1.5 rounded-full px-2 font-bridal text-[13px] leading-[18px] tabular-nums text-bridal-charcoal transition-colors duration-150 hover:bg-bridal-blush/45 ${FOCUS}`}
              >
                <span className="font-medium">{reference}</span>
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-[12px] text-[#3F6B43]" aria-live="polite">
                    <Check className="h-3 w-3 animate-scale-in" strokeWidth={3} aria-hidden />
                    Copied
                  </span>
                ) : (
                  <Copy className="h-3.5 w-3.5 text-bridal-gold-dark" aria-hidden />
                )}
              </button>
            </dd>
          </div>
        </dl>
      </section>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${OUTLINE_LINK} mt-4 animate-stagger-fade-up`}
          style={stagger(block++)}
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          Message {venueName || "the venue"} on WhatsApp
        </a>
      )}

      {/* §10.2 — another function of the same wedding still to send. It is the
          one thing left to do, so it takes the primary and Track steps down. */}
      {hasNext && (
        <BridalButton
          type="button"
          variant="primary"
          size="lg"
          block
          onClick={() => onContinueNext?.(nextUnsubmittedEvent!.index)}
          className="mt-3 animate-stagger-fade-up"
          style={stagger(block++)}
        >
          Continue to {nextUnsubmittedEvent!.eventType}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </BridalButton>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2 animate-stagger-fade-up" style={stagger(block++)}>
        <Link href="/user/bookings" className={hasNext ? OUTLINE_LINK : PRIMARY_LINK}>
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Track this request
        </Link>
        <Link href="/" className={OUTLINE_LINK}>
          <Home className="h-3.5 w-3.5" aria-hidden />
          Back to home
        </Link>
      </div>
    </div>
  )
}
