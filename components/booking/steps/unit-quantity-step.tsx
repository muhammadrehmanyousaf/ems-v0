"use client"

/**
 * WW-RATECARD 10.7 — "how many?"
 *
 * A car-rental firm has no packages and no guests. It has a car at a price and
 * a number of cars, declared as `pricingMode = "per_unit"` with the unit in
 * `pricingConfigJson`. The engine honours that; the booking flow never asked.
 *
 * The quantity control that DID exist lived inside the package step and was
 * gated on three hardcoded vendor-type strings ("Car rental", "Bridal wearing",
 * "Wedding Invitations and Stationery"). A per-unit vendor has no package step
 * to put it in, so the quantity silently defaulted to 1 and a customer wanting
 * four cars had no way to say so.
 *
 * This step is the missing question, and it is the ONLY thing on the screen —
 * for this vendor it is the entire rate card. The shell's StepFrame renders
 * the title ("How many cars do you need?") and the subtitle; this component
 * renders the stepper, the floor/ceiling lines and the priced line.
 *
 * ── Everything here is stated before Review, not after ────────────────────
 *
 * The vendor's minimum quantity is a floor, the same shape as a menu's minimum
 * guarantee: order one car against a three-car minimum and three is billed.
 * That has to be visible AT the control, not discovered at the till — so the
 * stepper refuses to go below the minimum and says why, and the running total
 * is the billed quantity's total, never the requested one's.
 */

import { Minus, Plus } from "lucide-react"
import {
  type UnitConfig,
  unitLineFor,
  describeUnitQty,
  MAX_UNIT_QTY,
} from "@/lib/pricing/per-unit"

interface Props {
  config: UnitConfig
  /** What the customer has asked for so far. */
  quantity: number
  onChange: (qty: number) => void
  vendorName?: string
}

const money = (n: number) => `Rs ${Math.round(n).toLocaleString("en-PK")}`

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"

// 48px circles at base (phone), 56px from xl.
const CIRCLE = `flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-bridal-beige bg-white text-bridal-charcoal transition-colors duration-150 hover:border-bridal-gold-dark hover:bg-bridal-blush/45 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-bridal-beige disabled:hover:bg-white xl:h-14 xl:w-14 ${FOCUS_RING}`

export default function UnitQuantityStep({ config, quantity, onChange, vendorName }: Props) {
  const line = unitLineFor(config, quantity)

  // The floor is enforced at the control, so the number on screen is always a
  // number that can actually be booked.
  const floor = Math.max(1, config.minUnitQty ?? 1)
  const atFloor = line.requestedQty <= floor
  const atCeiling = line.requestedQty >= MAX_UNIT_QTY

  const step = (delta: number) =>
    onChange(Math.min(MAX_UNIT_QTY, Math.max(floor, line.requestedQty + delta)))

  const unitWord =
    line.requestedQty === 1
      ? config.unitLabel
      : /^[A-Za-z]+$/.test(config.unitLabel) && !config.unitLabel.endsWith("s")
        ? `${config.unitLabel}s`
        : config.unitLabel

  return (
    <div className="mx-auto w-full max-w-[560px]">
      {/* Stepper row — 120px, centred */}
      <div
        className="animate-stagger-fade-up flex h-[120px] items-center justify-center gap-6"
        style={{ animationDelay: "0ms" }}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atFloor}
          aria-label={`One fewer ${config.unitLabel}`}
          className={CIRCLE}
        >
          <Minus className="h-5 w-5" aria-hidden />
        </button>

        <div className="min-w-[128px] text-center">
          <div
            className="font-display text-[64px] italic leading-[72px] tabular-nums text-bridal-charcoal"
            aria-live="polite"
          >
            {line.requestedQty}
          </div>
          <div className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
            {unitWord}
          </div>
        </div>

        <button
          type="button"
          onClick={() => step(1)}
          disabled={atCeiling}
          aria-label={`One more ${config.unitLabel}`}
          className={CIRCLE}
        >
          <Plus className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/*
        The minimum is stated wherever it is binding, not only when it bites.
        A customer who never tries to go below three still deserves to know
        three is the floor before they reach Review.
      */}
      <div className="animate-stagger-fade-up mt-4 text-center" style={{ animationDelay: "30ms" }}>
        {config.minUnitQty ? (
          <p className="font-bridal text-[13px] leading-[24px] text-bridal-text-soft">
            {vendorName || "This vendor"} takes bookings of{" "}
            <span className="tabular-nums">{describeUnitQty(config.unitLabel, config.minUnitQty)}</span> or more.
          </p>
        ) : null}

        {atCeiling ? (
          <p className="font-bridal text-[13px] leading-[24px] text-bridal-text-soft">
            <span className="tabular-nums">{MAX_UNIT_QTY}</span> is the most that can be booked online — message the vendor for a
            larger order.
          </p>
        ) : null}
      </div>

      {/* Hairline, then the priced line: "3 cars × Rs 25,000 = Rs 75,000" */}
      <div className="animate-stagger-fade-up mt-4 border-t border-bridal-beige pt-4 text-center" style={{ animationDelay: "60ms" }}>
        <p className="font-display text-[22px] italic leading-[26px] tabular-nums text-bridal-charcoal" data-booking-unit-line>
          {describeUnitQty(config.unitLabel, line.billedQty)} × {money(config.unitPrice)} ={" "}
          <span className="text-bridal-gold-dark">{money(line.total)}</span>
        </p>
        {/*
          Only reachable if the floor is somehow bypassed, but it is carried
          because the server carries it: a customer shown a quantity they did
          not ask for is owed the reason on the same screen as the number.
        */}
        {line.liftedByMinimum ? (
          <p className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
            You asked for {describeUnitQty(config.unitLabel, line.requestedQty)}. The vendor&rsquo;s minimum is{" "}
            {describeUnitQty(config.unitLabel, line.billedQty)}, so that is what is billed.
          </p>
        ) : null}
      </div>
    </div>
  )
}
