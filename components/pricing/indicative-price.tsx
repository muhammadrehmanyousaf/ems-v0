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

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <label
          className={
            onDark
              ? "font-bridal text-[10px] uppercase tracking-[0.25em] text-bridal-gold"
              : "font-bridal text-[10px] uppercase tracking-[0.25em] text-bridal-text-label"
          }
        >
          Show approx in
        </label>
        <select
          value={currency || ""}
          onChange={(e) => void pick(e.target.value)}
          aria-label="Show an approximate price in another currency"
          className={
            onDark
              ? "rounded-md border border-bridal-ivory/30 bg-black/30 px-2 py-1 font-bridal text-[12px] text-bridal-ivory outline-none focus:border-bridal-gold"
              : "rounded-md border border-bridal-beige bg-bridal-ivory px-2 py-1 font-bridal text-[12px] text-bridal-charcoal outline-none focus:border-bridal-gold-dark"
          }
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
        <div className="mt-1.5 space-y-0.5">
          {/* Smaller and quieter than the rupee figure above it, deliberately.
             The typography is part of the claim: this is the guide, that is
             the price. */}
          <p
            className={
              onDark
                ? "font-display italic text-[18px] text-bridal-ivory/85 leading-none"
                : "font-display italic text-[18px] text-bridal-charcoal/80 leading-none"
            }
          >
            ≈ {quote.symbol}
            {quote.approx.toLocaleString("en-GB")}
          </p>
          {/* The rate and its DATE, both shown. The date is what makes an
             indicative figure honest rather than a number with no provenance. */}
          <p className={onDark ? "font-bridal text-[10.5px] text-bridal-ivory/70" : "font-bridal text-[10.5px] text-bridal-text-soft"}>
            {quote.caveat}
          </p>
          <p className={onDark ? "font-bridal text-[10.5px] text-bridal-ivory/70" : "font-bridal text-[10.5px] text-bridal-text-soft"}>
            {quote.note}
          </p>
        </div>
      )}
    </div>
  )
}

export default IndicativePrice
