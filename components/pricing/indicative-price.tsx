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
    if (v) localStorage.setItem(STORAGE_KEY, v)
    else localStorage.removeItem(STORAGE_KEY)
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
    fxApi
      .quote(pkr, stored)
      .then((r) => {
        if (cancelled) return
        setAvailable(r.available || [])
        setQuote(r.quote)
        // Reflect what the server actually answered with, which may be the
        // locale's currency rather than anything this browser asked for.
        setCurrency(r.quote?.currency ?? (stored && (r.available || []).includes(stored) ? stored : null))
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
  const muted = onDark ? "text-bridal-ivory/65" : "text-bridal-text-soft"

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

        {/* A quiet inline control, not a boxed form field. It belongs to the
           figure beside it, so it carries no separate label. */}
        <select
          value={currency || ""}
          onChange={(e) => void pick(e.target.value)}
          aria-label="Show an approximate price in another currency"
          className={`cursor-pointer appearance-none border-0 bg-transparent p-0 pr-3 font-bridal text-[11px] tracking-wide underline decoration-dotted underline-offset-[3px] outline-none focus-visible:ring-1 focus-visible:ring-offset-2 ${
            onDark
              ? "text-bridal-gold focus-visible:ring-bridal-gold"
              : "text-bridal-gold-dark focus-visible:ring-bridal-gold-dark"
          }`}
        >
          <option value="">Rupees only</option>
          {available.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {quote && (
        // One line. `title` keeps the server's fuller sentence a hover away —
        // it is the same promise, at more length, for anyone who wants it.
        <p className={`mt-1 font-bridal text-[10.5px] leading-snug ${muted}`} title={quote.note}>
          Indicative only — you&apos;ll be billed Rs {quote.amountPkr.toLocaleString("en-PK")}. Rate of{" "}
          {asOfShort}.
        </p>
      )}
    </div>
  )
}

export default IndicativePrice
