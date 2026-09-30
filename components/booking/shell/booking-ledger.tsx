"use client"

/**
 * The running record of what the customer has chosen, and what it costs.
 *
 * Rows are fixed per vendor shape at mount — a marquee always shows Event,
 * Date, Time, Hall, Guests, Package, Menu; a photographer shows Event, Date,
 * Time, Package — and fill in as the customer moves. A row never appears or
 * disappears mid-flow, so the Stage never jumps. A filled row is a button that
 * takes you back to the step that owns it.
 *
 * Money comes from `computeBreakdown` (the same arithmetic the old mobile bar
 * used), with the review step's discounted figures layered on when it reports
 * them, so the Stage and the review body cannot disagree.
 */

import { Check } from "lucide-react"
import type { BookingFormData, EventBooking, EventVenue, Vendor } from "@/lib/types"
import { slotText } from "@/lib/booking/slot-vocabulary"
import { describeUnitQty, readUnitConfig, unitLineFor } from "@/lib/pricing/per-unit"
import { computeBreakdown, formatPKR } from "@/lib/booking/breakdown"

export interface LedgerRow {
  key: string
  label: string
  value: string | null
  /** The step that owns this row; a filled row jumps there. */
  stepKey: string
  /** The customer has passed the owning step. */
  done: boolean
  /** The chosen package no longer belongs to the chosen hall. */
  rechoose?: boolean
}

export interface MoneyState {
  label: string
  value: string
  struck?: string
  line2?: string
  line3?: string
  line4?: string
}

/** What the review step reports once it has computed discounts and add-ons. */
export interface ReviewTotalsLike {
  total: number
  discountedTotal: number
  discountedDown: number
  projectedSavings: number
  depositAmount: number
  depositTerms: string[]
  addOnTotal: number
}

const GUEST_COUNT_VENDOR_TYPES = new Set<string>([
  "Wedding venue",
  "Catering",
  "Mithai and sweets",
  "Wedding cakes",
  "Live cooking stall",
])

export function guestRowApplies(venue: EventVenue | null): boolean {
  const type = venue?.vendor?.vendorType || ""
  return GUEST_COUNT_VENDOR_TYPES.has(type) && (!!venue?.maxCapacity || !!venue?.minCapacity)
}

export function formatLedgerDate(d: unknown): string | null {
  if (!d) return null
  const date = d instanceof Date ? d : new Date(String(d))
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

export function buildLedgerRows({
  formData,
  venue,
  isDirectBooking,
  hasPackages,
  hasMenus,
  sellsByUnit,
  selectedPackageObj,
  selectedMenuObj,
  menuIncluded,
  eventStepOrder,
  currentStepIndex,
  globalStep,
  eventLabel,
}: {
  formData: BookingFormData
  venue: EventVenue | null
  isDirectBooking: boolean
  hasPackages: boolean
  hasMenus: boolean
  sellsByUnit: boolean
  selectedPackageObj?: any
  selectedMenuObj?: any
  menuIncluded: boolean
  eventStepOrder: { key: string }[]
  /** Index into eventStepOrder of the step on screen; -1 while on event selection. */
  currentStepIndex: number
  globalStep: number
  /** "Baraat" or "Baraat · 1 of 2". */
  eventLabel: string | null
}): LedgerRow[] {
  const idx = (key: string) => eventStepOrder.findIndex((s) => s.key === key)
  const passed = (key: string) => globalStep >= 2 && idx(key) >= 0 && idx(key) < currentStepIndex
  const f = formData as any
  const rows: LedgerRow[] = []

  if (!isDirectBooking) {
    rows.push({ key: "event", label: "Event", value: eventLabel, stepKey: "event", done: globalStep >= 2 })
  }
  rows.push({ key: "date", label: "Date", value: formatLedgerDate(formData.bookingDate), stepKey: "datetime", done: passed("datetime") })
  rows.push({
    key: "time",
    label: "Time",
    value: formData.timeSlot
      ? slotText({
          bookingTime: formData.timeSlot,
          slotLabel: f.slotLabel,
          slotStartTime: f.slotStartTime,
          slotEndTime: f.slotEndTime,
        }) || formData.timeSlot
      : null,
    stepKey: "datetime",
    done: passed("datetime"),
  })
  const isVenue = venue?.vendor?.vendorType === "Wedding venue"
  if (isVenue || f.selectedSubVenueId || f.selectedResourceId) {
    rows.push({
      key: "hall",
      label: "Hall",
      value: f.selectedSubVenueName || f.selectedResourceName || (formData.timeSlot ? "Whole venue" : null),
      stepKey: "datetime",
      done: passed("datetime"),
    })
  }
  if (guestRowApplies(venue)) {
    // Nothing to report until a function exists: the global form's default of
    // 1 is a placeholder, not a decision.
    const n = globalStep >= 2 ? Number(formData.guestCount) || 0 : 0
    rows.push({ key: "guests", label: "Guests", value: n > 0 ? `${n.toLocaleString("en-US")} ${n === 1 ? "guest" : "guests"}` : null, stepKey: "datetime", done: passed("datetime") })
  }
  if (hasPackages) {
    const qty = Number(formData.vehicleQuantity) || 1
    rows.push({
      key: "package",
      label: "Package",
      value: selectedPackageObj ? `${selectedPackageObj.name}${qty > 1 ? ` × ${qty}` : ""}` : null,
      stepKey: "packages",
      done: passed("packages"),
      rechoose: !!formData.selectedPackage && !selectedPackageObj,
    })
  }
  if (hasMenus) {
    rows.push({
      key: "menu",
      label: "Menu",
      value: selectedMenuObj ? `${selectedMenuObj.title || selectedMenuObj.name}${menuIncluded ? " · included" : ""}` : null,
      stepKey: "menu",
      done: passed("menu"),
    })
  }
  if (sellsByUnit && venue) {
    const cfg = readUnitConfig(venue as any)
    const line = cfg ? unitLineFor(cfg, formData.vehicleQuantity || cfg.minUnitQty || 1) : null
    rows.push({ key: "units", label: "Quantity", value: line ? describeUnitQty(line.unitLabel, line.billedQty) : null, stepKey: "unit", done: passed("unit") })
  }
  return rows
}

export function buildMoney({
  formData,
  venue,
  vendorsDetails,
  selectedPackageObj,
  selectedMenuObj,
  requiresApproval,
  reviewTotals,
  events,
  sent,
}: {
  formData: BookingFormData
  venue: EventVenue | null
  vendorsDetails: Vendor[]
  selectedPackageObj?: any
  selectedMenuObj?: any
  requiresApproval: boolean
  reviewTotals?: ReviewTotalsLike | null
  /** All functions, for the combined line on a multi-event booking. */
  events?: EventBooking[]
  /** Set once this function's request/booking has been sent. */
  sent?: { bookingId: number; amount: number } | null
}): MoneyState {
  const b = computeBreakdown({ formData, venue, vendorsDetails, selectedPackageObj, selectedMenuObj })

  if (sent) {
    return {
      label: requiresApproval ? "Advance" : "Due now",
      value: formatPKR(sent.amount || b.downPayment),
      line2: requiresApproval ? `Not yet charged · BK-${sent.bookingId}` : `Reference BK-${sent.bookingId}`,
    }
  }

  if (!b.priced) {
    return b.startingPrice > 0
      ? { label: "Starting price", value: `from ${formatPKR(b.startingPrice)}`, line2: "A package sets your total" }
      : { label: "Total", value: "—", line2: "Choose a package to see your total" }
  }

  let total = b.subtotal
  let down = b.downPayment
  let struck: string | undefined
  let line3: string | undefined
  let line4: string | undefined
  if (reviewTotals) {
    if (reviewTotals.addOnTotal > 0 || reviewTotals.total !== b.subtotal) {
      total = reviewTotals.total
      down = b.downPayment
    }
    if (reviewTotals.projectedSavings > 0 && reviewTotals.discountedTotal < total) {
      struck = formatPKR(total)
      total = reviewTotals.discountedTotal
      down = reviewTotals.discountedDown
    }
    if (reviewTotals.depositAmount > 0) {
      line4 = `Refundable deposit · ${formatPKR(reviewTotals.depositAmount)} (separate)`
    }
    line3 = `Remaining at venue · ${formatPKR(Math.max(0, total - down))}`
  }

  const line2 = requiresApproval
    ? `Advance after approval · ${formatPKR(down)}`
    : reviewTotals
      ? `Due now · ${formatPKR(down)}`
      : `Due now · ${formatPKR(down)} · Remaining at venue ${formatPKR(Math.max(0, total - down))}`

  const money: MoneyState = { label: "Total", value: formatPKR(total), struck, line2, line3, line4 }

  if (events && events.length > 1) {
    const all = events.reduce((sum, e) => {
      const pkg = (venue?.packages || []).find((p: any) => String(p.id) === String(e.formData.selectedPackage))
      const menu = (venue?.menus || []).find((m: any) => String(m.id) === String(e.formData.selectedMenu))
      return sum + computeBreakdown({ formData: e.formData, venue, vendorsDetails: [], selectedPackageObj: pkg, selectedMenuObj: menu }).subtotal
    }, 0)
    if (all > 0) money.line4 = `All functions · ${formatPKR(all)}`
  }
  return money
}

/* ───────────────────────────── rendering ───────────────────────────── */

interface LedgerProps {
  rows: LedgerRow[]
  money: MoneyState
  onJump: (stepKey: string) => void
  /** Rows no longer jump; every row shows a tick. */
  locked?: boolean
  /** "stage" = 36px rows on charcoal; "sheet" = 48px rows on charcoal in the phone drawer. */
  variant?: "stage" | "sheet"
}

export function LedgerRows({ rows, onJump, locked, variant = "stage" }: Omit<LedgerProps, "money">) {
  const rowH = variant === "sheet" ? "h-12" : "h-[var(--bk-ledger-row)]"
  return (
    <dl aria-live="polite" className="divide-y divide-bridal-ivory/10">
      {rows.map((r) => {
        const filled = !!r.value
        const done = locked || r.done
        const inner = (
          <>
            <dt className="flex items-center gap-1.5 font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold">
              {done && filled && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
              {r.label}
            </dt>
            <dd className="min-w-0 text-right">
              {filled ? (
                <span
                  key={r.value as string}
                  title={r.value as string}
                  className={`block truncate font-display italic text-[15px] leading-[20px] animate-ledger-fill ${
                    r.rechoose ? "text-bridal-ivory/60 line-through" : "text-bridal-ivory"
                  }`}
                >
                  {r.value}
                </span>
              ) : (
                <span className="font-display italic text-[15px] leading-[20px] text-bridal-ivory/45">—</span>
              )}
              {r.rechoose && (
                <span className="ml-2 rounded-full border border-bridal-coral/60 px-1.5 py-px font-bridal text-[9.5px] uppercase tracking-[0.14em] text-bridal-coral">
                  Re-choose
                </span>
              )}
            </dd>
          </>
        )
        return (
          <div key={r.key} data-booking-ledger-row={r.key} className="relative">
            {filled && !locked ? (
              <button
                type="button"
                onClick={() => onJump(r.stepKey)}
                aria-label={`Change ${r.label.toLowerCase()}: ${r.value}`}
                className={`group flex w-full items-center justify-between gap-4 rounded-sm text-left transition-colors hover:text-bridal-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bridal-charcoal ${rowH}`}
              >
                {inner}
              </button>
            ) : (
              <div className={`flex w-full items-center justify-between gap-4 ${rowH}`}>{inner}</div>
            )}
            {filled && (
              <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left bg-bridal-gold/60 animate-hairline-draw" />
            )}
          </div>
        )
      })}
    </dl>
  )
}

export function MoneyBlock({ money, compact }: { money: MoneyState; compact?: boolean }) {
  return (
    <div data-booking-money className={compact ? "" : "pt-4"}>
      <p className="font-bridal text-[11px] font-medium uppercase tracking-[0.18em] text-bridal-gold">{money.label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        {money.struck && (
          <span className="font-display italic text-[16px] leading-[20px] text-bridal-ivory/50 line-through tabular-nums">{money.struck}</span>
        )}
        <span key={money.value} className="font-display italic text-[22px] leading-[26px] text-bridal-ivory tabular-nums animate-fade-in">
          {money.value}
        </span>
      </p>
      {money.line2 && <p className="mt-1 font-bridal text-[13px] leading-[18px] text-bridal-ivory/75 tabular-nums">{money.line2}</p>}
      {money.line3 && <p className="font-bridal text-[13px] leading-[18px] text-bridal-ivory/75 tabular-nums">{money.line3}</p>}
      {money.line4 && <p className="font-bridal text-[13px] leading-[18px] text-bridal-ivory/75 tabular-nums">{money.line4}</p>}
    </div>
  )
}
