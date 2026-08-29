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
 */

import { CalendarCheck, Clock, FileText, Home, MessageCircle } from "lucide-react"
import Link from "next/link"

interface RequestSentScreenProps {
  bookingId: number
  venueName?: string
  bookingDate?: string
  guestCount?: number
  amountDue?: number
  whatsappNumber?: string | null
}

export default function RequestSentScreen({
  bookingId,
  venueName,
  bookingDate,
  guestCount,
  amountDue,
  whatsappNumber,
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

  return (
    <div className="flex flex-col items-center py-8 text-center max-w-lg mx-auto">
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative rounded-full bg-bridal-cream border border-bridal-gold/55 p-6 shadow-[0_18px_44px_-22px_rgba(176,125,84,0.5)]">
          <CalendarCheck className="h-12 w-12 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
      </div>

      <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
        Request sent
      </p>
      {/* Said "Your date is held" until 2026-08-29. The booking flow no
          longer creates a hold, so that was a promise nothing was keeping. */}
      <h2 className="font-display italic text-[34px] sm:text-[40px] text-bridal-charcoal mb-2 leading-[1.05]">
        Request sent to the venue
      </h2>
      <div className="mx-auto mt-1 mb-5 h-[1px] w-20 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
      <p className="font-bridal text-[14px] text-bridal-text-soft mb-8 max-w-sm">
        {venueName || "The venue"} reviews each booking before confirming. Nothing has
        been charged — we&apos;ll ask for the advance once they accept.
      </p>

      {/* What was requested. The customer has just filled six steps; showing it
          back is how they know the right thing was sent. */}
      <div className="w-full rounded-md border border-bridal-beige bg-bridal-cream overflow-hidden mb-6 text-left">
        <div className="px-5 py-3 bg-bridal-ivory border-b border-bridal-beige">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">
            What you asked for
          </p>
        </div>
        <div className="divide-y divide-bridal-beige/70">
          {[
            venueName ? { label: "Venue", value: venueName } : null,
            formatDate(bookingDate) ? { label: "Date", value: formatDate(bookingDate)! } : null,
            guestCount ? { label: "Guests", value: String(guestCount) } : null,
            amountDue && amountDue > 0
              ? { label: "Advance (not yet charged)", value: `Rs. ${Number(amountDue).toLocaleString()}` }
              : null,
            { label: "Reference", value: `BK-${bookingId}` },
          ].filter(Boolean).map((row) => (
            <div key={row!.label} className="flex items-baseline justify-between gap-3 px-5 py-3">
              <span className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
                {row!.label}
              </span>
              <span className="font-bridal text-[13.5px] font-medium text-bridal-charcoal text-right">
                {row!.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full rounded-md border border-bridal-gold/45 bg-bridal-cream px-5 py-4 text-left mb-6">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5" /> What happens next
        </p>
        <ol className="font-bridal text-[12.5px] text-bridal-charcoal/85 space-y-1.5 list-decimal list-inside leading-relaxed">
          <li>{venueName || "The venue"} reviews your request — usually within a few hours.</li>
          <li>If they accept, we&apos;ll email you and show you how to pay the advance.</li>
          <li>Your booking is confirmed once they&apos;ve received it.</li>
          <li>If they can&apos;t take the date, nothing is charged and we&apos;ll suggest alternatives.</li>
        </ol>
      </div>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 h-11 mb-6 rounded-[4px] border border-bridal-beige bg-bridal-ivory text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Message {venueName || "the venue"} on WhatsApp
        </a>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/user/bookings"
          className="inline-flex items-center justify-center gap-2 flex-1 h-12 px-5 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
        >
          <FileText className="h-3.5 w-3.5" />
          Track this request
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 flex-1 h-12 px-5 rounded-[4px] border border-bridal-beige bg-bridal-cream text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
