/**
 * "This venue isn't taking new enquiries right now." The calm notice a customer sees on the public page of a locked
 * venue, and inside an enquiry / quote dialog that was refused 409 VENUE_UNAVAILABLE. No hooks, so it renders in a server
 * component (the SEO vendor page) as well as in client dialogs.
 *
 * Kind and specific: it says what is true (not taking new enquiries), what is NOT affected (an existing booking), and
 * where to go next. English first, Roman Urdu under it (lib/plans/copy.ts, cust.*).
 */

import Link from "next/link"
import { Info } from "lucide-react"
import { COPY } from "@/lib/plans/copy"

export function VenueUnavailableNotice({ text, compact = false, className = "" }: { text?: string | null; compact?: boolean; className?: string }) {
  return (
    <div
      role="status"
      data-testid="venue-unavailable-notice"
      className={`rounded-xl border border-bridal-beige bg-bridal-cream/70 px-4 py-3.5 text-bridal-charcoal ${className}`}
    >
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4.5 w-4.5 shrink-0 text-bridal-gold-dark" aria-hidden />
        <div className="min-w-0 font-bridal">
          <p className="text-[14px] font-semibold leading-snug">{COPY["cust.unavailable.title"].en}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-bridal-text">{text || COPY["cust.unavailable.body"].en}</p>
          <p lang="und" className="mt-1 text-[12px] leading-relaxed text-bridal-text-soft">{COPY["cust.unavailable.body"].ru}</p>
          {!compact && (
            <p className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium">
              <Link href="/user/bookings" className="text-bridal-gold-dark underline underline-offset-4 hover:text-bridal-charcoal">{COPY["cust.unavailable.view"].en}</Link>
              <Link href="/search" className="text-bridal-gold-dark underline underline-offset-4 hover:text-bridal-charcoal">{COPY["cust.unavailable.browse"].en}</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** The disabled stand-in for an enquiry / booking button: same size and shape, clearly not available, explained by the notice. */
export function UnavailableButton({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={COPY["cust.unavailable.title"].en}
      data-testid="venue-cta-disabled"
      className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-bridal-beige bg-bridal-cream/60 px-5 py-2.5 font-bridal text-[13px] font-medium text-bridal-text-soft ${className}`}
    >
      {label || COPY["cust.cta.disabled"].en}
    </button>
  )
}
