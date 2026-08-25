"use client"

/**
 * WW-QUOTE-PIPELINE — a quotation as a document, for both sides.
 *
 * `QuoteLinesEditor` is what a vendor builds a quote in; `QuoteLinesTable` is
 * what the customer reads. They are in one file on purpose: the whole value of
 * the document is that both parties are looking at the SAME rows, and splitting
 * them into two components in two files is how the two drift apart.
 *
 * Why a builder at all: `quotedPrice` was a single number, so haggling could
 * only ever be "Rs 1,320,000?" / "Rs 1,150,000?". The actual conversation in a
 * marquee office is about the lines — "keep the hall, drop Platinum to Gold,
 * lose the generator". You cannot have that conversation against one number.
 *
 * The total shown here is computed by `priceQuoteLines`, the client mirror of
 * the server's `quoteDocument.js`. The server recomputes and is the authority;
 * this exists so the number does not change under the vendor when they submit.
 */

import { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
  priceQuoteLines,
  formatPkr,
  QUOTE_LINE_KINDS,
  type QuoteLine,
  type QuoteLineKind,
  type QuoteLineUnit,
} from "@/lib/api/quotes"

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none ring-ring focus-visible:ring-2"

/** A sensible default row for each kind, so adding a line is one click not five. */
function blankLine(kind: QuoteLineKind = "extra"): QuoteLine {
  const unit: QuoteLineUnit =
    kind === "menu" ? "per_head" : kind === "discount" || kind === "tax" ? "percent" : "per_event"
  // `note` is the discount reason (6.32/A14) and starts empty, so a new
  // discount row opens showing the amber prompt rather than looking complete.
  return { label: "", kind, unit, unitPrice: 0, qty: null, note: null }
}

export function QuoteLinesEditor({
  lines,
  guestCount,
  onChange,
  disabled,
}: {
  lines: QuoteLine[]
  guestCount: number | null
  onChange: (next: QuoteLine[]) => void
  disabled?: boolean
}) {
  const { subtotal, total } = useMemo(
    () => priceQuoteLines(lines, guestCount),
    [lines, guestCount],
  )

  const set = (i: number, patch: Partial<QuoteLine>) =>
    onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))

  const remove = (i: number) => onChange(lines.filter((_, idx) => idx !== i))

  /**
   * The total for one editable row.
   *
   * Computed directly rather than looked up in `priced` — `priced` reorders
   * (charges before percent lines) and an earlier version matched rows back by
   * label+kind, so two lines sharing a label showed each other's totals. A
   * percent line depends on the charge subtotal, which is the one thing this
   * needs from the priced pass.
   */
  const totalFor = (l: QuoteLine): number => {
    const round = (n: number) => Math.round((Number(n) || 0) * 100) / 100
    const price = Number(l.unitPrice) || 0
    if (l.unit === "percent") return round((subtotal * price) / 100)
    const qty =
      l.unit === "per_head"
        ? Math.max(0, Math.floor(Number(l.qty) || Number(guestCount) || 0))
        : Math.max(1, Math.floor(Number(l.qty) || 1))
    return round(price * qty)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {lines.map((l, i) => {
          const isPercent = l.unit === "percent"
          return (
            <div key={i} className="rounded-lg border border-border p-2.5">
              <div className="flex gap-2">
                <input
                  className={inputCls + " flex-1"}
                  value={l.label}
                  disabled={disabled}
                  placeholder={
                    l.kind === "hall" ? "Hall — Barat, 6pm–11pm"
                      : l.kind === "menu" ? "Gold menu"
                        : l.kind === "discount" ? "Repeat-family discount"
                          : "Stage & floral"
                  }
                  onChange={(e) => set(i, { label: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Remove line"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  className={inputCls}
                  value={l.kind}
                  disabled={disabled}
                  onChange={(e) => {
                    const kind = e.target.value as QuoteLineKind
                    // Switching to a discount/tax makes it a percentage, and a
                    // discount must be negative — enforced here so the server's
                    // refusal is never the first time the vendor hears about it.
                    const next = blankLine(kind)
                    set(i, {
                      kind,
                      unit: next.unit,
                      unitPrice:
                        kind === "discount" ? -Math.abs(l.unitPrice || 0) : Math.abs(l.unitPrice || 0),
                    })
                  }}
                >
                  {QUOTE_LINE_KINDS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>

                <select
                  className={inputCls}
                  value={l.unit}
                  disabled={disabled || l.kind === "discount" || l.kind === "tax"}
                  onChange={(e) => set(i, { unit: e.target.value as QuoteLineUnit })}
                >
                  <option value="per_event">Per event</option>
                  <option value="per_head">Per head</option>
                  <option value="percent">Percentage</option>
                </select>

                <input
                  type="number"
                  className={inputCls}
                  value={l.unitPrice === 0 ? "" : l.unitPrice}
                  disabled={disabled}
                  placeholder={isPercent ? "%" : "Rs"}
                  onChange={(e) => {
                    const raw = Number(e.target.value)
                    const v = Number.isFinite(raw) ? raw : 0
                    set(i, { unitPrice: l.kind === "discount" ? -Math.abs(v) : v })
                  }}
                />

                {l.unit === "per_head" ? (
                  <input
                    type="number"
                    className={inputCls}
                    value={l.qty ?? ""}
                    disabled={disabled}
                    placeholder={guestCount ? `${guestCount} guests` : "guests"}
                    onChange={(e) => {
                      const raw = Number(e.target.value)
                      set(i, { qty: Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null })
                    }}
                  />
                ) : (
                  <div className="flex h-9 items-center justify-end px-1 text-sm tabular-nums text-muted-foreground">
                    {formatPkr(totalFor(l))}
                  </div>
                )}
              </div>

              {/*
                WW-TEST-CASES 6.32 / A14 — a discount has to say WHY.

                An unexplained discount is the one line on a quote nobody can
                check later: the vendor's own books cannot answer "why did we
                drop 15% on this booking", and on a marketplace taking
                commission it is exactly where revenue goes missing.

                The field is only shown for a discount. Every other kind is
                self-explanatory from its label, and a note box on all six rows
                would be noise nobody fills in.

                Asked HERE rather than left to the server's 400, for the same
                reason the negative-amount rule is enforced in this component:
                a refusal after pressing Send is the worst place to learn a
                field was needed.
              */}
              {l.kind === "discount" && (
                <div className="mt-2">
                  <input
                    className={`${inputCls}${!String(l.note ?? "").trim() ? " border-amber-400" : ""}`}
                    value={l.note ?? ""}
                    disabled={disabled}
                    placeholder="Why? e.g. third booking this year, paying the balance up front"
                    maxLength={200}
                    onChange={(e) => set(i, { note: e.target.value })}
                    aria-label="Reason for this discount"
                  />
                  {!String(l.note ?? "").trim() && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      The customer sees this, and you&apos;ll be asked about it later.
                    </p>
                  )}
                </div>
              )}

              {l.unit === "per_head" && (
                <p className="mt-1.5 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPkr(l.unitPrice)} × {l.qty ?? guestCount ?? 0} ={" "}
                  <span className="font-medium text-foreground">{formatPkr(totalFor(l))}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...lines, blankLine(lines.length === 0 ? "hall" : "extra")])}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add a line
        </button>
      )}

      {lines.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPkr(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatPkr(total)}</span>
          </div>
          {guestCount ? (
            <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
              {formatPkr(total / guestCount)} per head at {guestCount} guests
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

/** Read-only view of an issued quotation — what the customer compares. */
export function QuoteLinesTable({
  lines,
  guestCount,
  total,
}: {
  lines: QuoteLine[]
  guestCount?: number | null
  total?: number | string | null
}) {
  if (!Array.isArray(lines) || lines.length === 0) return null
  const computed = priceQuoteLines(lines, guestCount ?? 0)
  const shown = total != null ? Number(total) : computed.total

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {computed.priced.map((l, i) => (
            <tr key={i} className="border-b border-border/60 last:border-0">
              <td className="py-1.5 pr-3">
                <span className={l.kind === "discount" ? "text-emerald-700 dark:text-emerald-400" : ""}>
                  {l.label}
                </span>
                {l.unit === "per_head" && (
                  <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                    {formatPkr(l.unitPrice)} × {l.qty}
                  </span>
                )}
                {l.unit === "percent" && (
                  <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{l.unitPrice}%</span>
                )}
              </td>
              <td className="py-1.5 text-right tabular-nums whitespace-nowrap">
                {formatPkr(l.total ?? 0)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-border">
            <td className="py-2 font-semibold">Total</td>
            <td className="py-2 text-right font-semibold tabular-nums">{formatPkr(shown)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
