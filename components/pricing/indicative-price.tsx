"use client"

/**
 * 7.13 / A22 / UC-16 — the indicative figure, for a family reading from abroad.
 *
 * ── What this is, and firmly what it is not ───────────────────────────────
 *
 * THE VENUE IS PAID IN RUPEES. Always. This never replaces the PKR figure, is
 * never presented as the price, and always renders BELOW it: a converted number
 * is a guide, the rate moves between reading a listing and sending a transfer,
 * banks take a spread, and the family pays whatever their own bank gives them
 * on the day. Quoting the converted figure as the price would be quoting a
 * number nobody can honour — and the gap lands on the venue, who agreed a PKR
 * total and receives less.
 *
 * ── Why it does no arithmetic ─────────────────────────────────────────────
 *
 * Every decision about whether a figure may be shown — a seven-day staleness
 * cut-off, a zero-rate refusal, the supported list, rounding UP against the
 * customer's optimism — lives in one module on the server. This asks what to
 * display and renders the answer, so those four rules cannot drift out of sync
 * with the one screen that shows them.
 *
 * ── It renders nothing rather than something wrong ────────────────────────
 *
 * With no rate set for any currency this returns null and the page is exactly
 * what it is today. If the platform's rate ages past a week it stops being
 * offered on its own, so the failure mode of an admin forgetting is "no
 * conversion", never "a wrong conversion".
 */

import { useEffect, useState } from "react"
import { fxApi, type FxQuote } from "@/lib/api/fx"

/** Remembered per browser, so a family doesn't re-pick on every venue. */
const STORAGE_KEY = "ww_display_currency"

/**
 * "I don't want this" is a choice, and it has to be storable.
 *
 * Choosing "Rupees only" used to DELETE the stored value, which is the same
 * state as never having chosen anything — so on the next page the locale kicked
 * in and the conversion came straight back. The customer said no and was
 * ignored, politely, forever.
 *
 * A sentinel distinguishes the two: PKR means "asked for, declined", absent
 * means "never asked". Not a supported currency, so it can never be mistaken
 * for one server-side.
 */
const DECLINED = "PKR"

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private windows and blocked site data both throw here. A remembered
    // currency is a convenience; losing it costs one click.
    return null
  }
}

const writeStored = (v: string | null) => {
  try {
    localStorage.setItem(STORAGE_KEY, v || DECLINED)
  } catch {
    /* see readStored */
  }
}

interface Props {
  /** The rupee figure being explained. The component is silent for 0 or null. */
  amountPkr: number | null | undefined
  className?: string
  /**
   * The mobile hero sits on a dark photographic ground. Charcoal-on-ivory
   * would be unreadable there, so the palette flips — the layout, the rules
   * and the wording are identical.
   */
  tone?: "default" | "onDark"
}

export function IndicativePrice({ amountPkr, className, tone = "default" }: Props) {
  const onDark = tone === "onDark"
  const [available, setAvailable] = useState<string[]>([])
  const [currency, setCurrency] = useState<string | null>(null)
  const [quote, setQuote] = useState<FxQuote | null>(null)
  const [asked, setAsked] = useState(false)

  const pkr = Number(amountPkr)
  const hasPrice = Number.isFinite(pkr) && pkr > 0

  useEffect(() => {
    if (!hasPrice) return
    let cancelled = false

    /**
     * The first ask carries no explicit currency, so the server may answer from
     * the browser's OWN locale — never from an IP address. A Pakistani family
     * in Dubai visiting relatives is not shopping in dirhams, and a wrong
     * currency on a wedding quote is worse than none.
     */
    const stored = readStored()
    const declined = stored === DECLINED

    // Asked for even when declined, because the SELECTOR still has to render —
    // a customer who said "rupees only" must be able to change their mind.
    // Only the conversion is dropped, not the control.
    fxApi
      .quote(pkr, declined ? null : stored)
      .then((r) => {
        if (cancelled) return
        setAvailable(r.available || [])
        setQuote(declined ? null : r.quote)
        // Reflect what the server actually answered with, which may be the
        // locale's currency rather than anything this browser asked for.
        setCurrency(
          declined
            ? null
            : r.quote?.currency ?? (stored && (r.available || []).includes(stored) ? stored : null),
        )
        setAsked(true)
      })
      .catch(() => {
        // A courtesy must never take a venue page down.
        if (!cancelled) {
          setAvailable([])
          setQuote(null)
          setAsked(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [pkr, hasPrice])

  const pick = async (next: string) => {
    const value = next || null
    setCurrency(value)
    writeStored(value)
    if (!value) {
      setQuote(null)
      return
    }
    try {
      const r = await fxApi.quote(pkr, value)
      setQuote(r.quote)
      setAvailable(r.available || [])
    } catch {
      setQuote(null)
    }
  }

  // Nothing to explain, nothing set, or the platform has no live rate: the page
  // is exactly what it was before this existed.
  if (!hasPrice || !asked || available.length === 0) return null

  /**
   * The rate's date, in the reader's words rather than the database's.
   *
   * "2026-08-25" is a column value; "25 Aug" is what tells a person how fresh
   * the number is at a glance. The full ISO date stays in the hover text, so
   * nothing is lost — it just stops shouting.
   */
  const asOfShort = (() => {
    const d = new Date(`${quote?.asOf}T00:00:00Z`)
    return Number.isNaN(d.getTime())
      ? quote?.asOf
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
  })()

  /* ── Why this is two lines and not five ──────────────────────────────────
   *
   * It was: an uppercase "SHOW APPROX IN" eyebrow, a boxed native select, the
   * figure, then BOTH the caveat and the note — which overlap almost word for
   * word ("indicative"/"at today's rate", "paid in rupees"/"you'll be billed
   * Rs …"). Five lines of chrome under a two-line price, stacking a second
   * shouty label directly beneath "STARTING FROM" and saying the same thing
   * twice.
   *
   * Now the figure carries its own control — `≈ £924 · GBP` — and one quiet
   * line states the promise. Every claim the compliance rules require is still
   * on screen: that it is indicative, that the venue is paid in rupees, the
   * rupee amount itself, and the DATE of the rate. The server's longer
   * sentence moves to the hover title, where it is available without
   * competing with the price it is annotating.
   */
  /**
   * ── Why this block carries its own backdrop on dark ─────────────────────
   *
   * On a venue hero the only thing between this text and the vendor's photo
   * was a page-wide gradient scrim. Measured on the live hero, the currency
   * control came out at 1.54:1 at worst on mobile and 2.36:1 on the brightest
   * desktop slide, against the 4.5:1 that WCAG 2.2 AA asks of 11px text; the
   * compliance line reached 3.4:1. Both are legibility that depends on which
   * photograph the vendor happened to upload — a floor no vendor knows they
   * are setting, on the line that has to say the venue is paid in rupees.
   *
   * So the control and the disclosure sit on a near-opaque charcoal chip.
   * Composited over the worst case a photo can present (white), the chip
   * lands at L≈0.049, which puts ivory text at ~9.8:1 and the disclosure at
   * ~6.5:1 — above the floor for ANY image, not for the ones we sampled.
   *
   * Gold does not survive that test: #C9956A over the same worst case is
   * 4.05:1, under the line. It stays as the focus ring and the chevron,
   * where 3:1 non-text contrast applies, and the label itself goes ivory.
   */
  const muted = onDark ? "text-bridal-ivory/75" : "text-bridal-text-soft"
  const chip = onDark
    ? "bg-bridal-charcoal/85 ring-1 ring-bridal-ivory/20 backdrop-blur-[2px]"
    : "bg-white/70 ring-1 ring-bridal-charcoal/10"

  return (
    <div className={className}>
      <div className="flex items-baseline gap-1.5 flex-wrap">
        {quote ? (
          // Deliberately smaller than the rupee price above it. The typography
          // is part of the claim: that is the price, this is a guide.
          <span
            className={`font-display italic text-[17px] leading-none ${
              onDark ? "text-bridal-ivory/90" : "text-bridal-charcoal/85"
            }`}
          >
            ≈ {quote.symbol}
            {quote.approx.toLocaleString("en-GB")}
          </span>
        ) : (
          <span className={`font-bridal text-[11px] ${muted}`}>Show approx in</span>
        )}

        {/* A quiet control, but a control. It reads as one now: a chevron
           rather than a dotted underline (`appearance-none` had removed the
           native arrow and left nothing in its place), and a 24px box, which
           is the floor WCAG 2.2 AA sets for a touch target — the old one was
           16.5px tall with no padding, comfortably under it. */}
        <span
          className={`relative inline-flex items-center rounded-full ${chip}`}
        >
          <select
            value={currency || ""}
            onChange={(e) => void pick(e.target.value)}
            aria-label="Show an approximate price in another currency"
            className={`min-h-[24px] cursor-pointer appearance-none border-0 bg-transparent py-0 pl-2.5 pr-6 font-bridal text-[11px] tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
              onDark
                ? "text-bridal-ivory focus-visible:ring-bridal-gold focus-visible:ring-offset-bridal-charcoal"
                : "text-bridal-gold-dark focus-visible:ring-bridal-gold-dark"
            }`}
          >
            {/* The native popup paints options on the OS menu surface, not on
               this chip, so they get explicit colours rather than inheriting
               a transparent background that no longer applies. */}
            <option value="" className="bg-white text-bridal-charcoal">
              Rupees only
            </option>
            {available.map((c) => (
              <option key={c} value={c} className="bg-white text-bridal-charcoal">
                {c}
              </option>
            ))}
          </select>
          {/* Decorative: the select beside it already carries the label. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 10 6"
            className={`pointer-events-none absolute right-2 h-[6px] w-[10px] ${
              onDark ? "text-bridal-gold" : "text-bridal-gold-dark"
            }`}
          >
            <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      {quote && (
        // One line, with the fuller promise a hover away — and the
        // UNABBREVIATED date with it. The visible line drops the year to stay
        // short, and the comment here used to claim the full date "stays in
        // the hover text" when it appeared nowhere on the page at all. A
        // rate's provenance is what makes an indicative figure honest rather
        // than a number from nowhere, so it has to be recoverable.
        <p
          className={`mt-1 font-bridal text-[10.5px] leading-snug ${muted} ${
            onDark ? `inline-block rounded px-1.5 py-0.5 ${chip}` : ""
          }`}
          title={`${quote.note} Rate taken ${quote.asOf}.`}
        >
          Indicative only — you&apos;ll be billed Rs {quote.amountPkr.toLocaleString("en-PK")}. Rate of{" "}
          {asOfShort}.
        </p>
      )}
    </div>
  )
}

export default IndicativePrice
