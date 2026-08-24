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
 * for this vendor it is the entire rate card, so burying it under a heading
 * would misrepresent what is being bought.
 *
 * ── Everything here is stated before Review, not after ────────────────────
 *
 * The vendor's minimum quantity is a floor, the same shape as a menu's minimum
 * guarantee: order one car against a three-car minimum and three is billed.
 * That has to be visible AT the control, not discovered at the till — so the
 * stepper refuses to go below the minimum and says why, and the running total
 * is the billed quantity's total, never the requested one's.
 */

import { motion } from "framer-motion"
import { Minus, Plus, Info } from "lucide-react"
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

export default function UnitQuantityStep({ config, quantity, onChange, vendorName }: Props) {
  const line = unitLineFor(config, quantity)

  // The floor is enforced at the control, so the number on screen is always a
  // number that can actually be booked.
  const floor = Math.max(1, config.minUnitQty ?? 1)
  const atFloor = line.requestedQty <= floor
  const atCeiling = line.requestedQty >= MAX_UNIT_QTY

  const step = (delta: number) =>
    onChange(Math.min(MAX_UNIT_QTY, Math.max(floor, line.requestedQty + delta)))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display italic text-[24px] sm:text-[28px] text-bridal-charcoal leading-tight">
          How many {config.unitLabel}
          {/^[A-Za-z]+$/.test(config.unitLabel) && !config.unitLabel.endsWith("s") ? "s" : ""} do you
          need?
        </h2>
        <p className="mt-1 text-sm text-bridal-charcoal/70">
          {vendorName ? `${vendorName} charges` : "Charged"} {money(config.unitPrice)} per{" "}
          {config.unitLabel}.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-bridal-charcoal/10 bg-white p-6 sm:p-8"
      >
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atFloor}
            aria-label={`One fewer ${config.unitLabel}`}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-bridal-charcoal/15 text-bridal-charcoal transition hover:bg-bridal-charcoal/5 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="h-5 w-5" />
          </button>

          <div className="min-w-[7rem] text-center">
            <div
              className="font-display text-[44px] leading-none text-bridal-charcoal tabular-nums"
              aria-live="polite"
            >
              {line.requestedQty}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wide text-bridal-charcoal/50">
              {config.unitLabel}
              {line.requestedQty === 1 ? "" : /^[A-Za-z]+$/.test(config.unitLabel) && !config.unitLabel.endsWith("s") ? "s" : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={atCeiling}
            aria-label={`One more ${config.unitLabel}`}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-bridal-charcoal/15 text-bridal-charcoal transition hover:bg-bridal-charcoal/5 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/*
          The minimum is stated wherever it is binding, not only when it bites.
          A customer who never tries to go below three still deserves to know
          three is the floor before they reach Review.
        */}
        {config.minUnitQty ? (
          <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs text-bridal-charcoal/60">
            <Info className="mt-[1px] h-3.5 w-3.5 shrink-0" />
            <span>
              This vendor takes bookings of {describeUnitQty(config.unitLabel, config.minUnitQty)} or
              more.
            </span>
          </p>
        ) : null}

        {atCeiling ? (
          <p className="mt-3 text-center text-xs text-bridal-charcoal/60">
            {MAX_UNIT_QTY} is the most that can be booked online — message the vendor for a larger
            order.
          </p>
        ) : null}

        <div className="mt-6 border-t border-bridal-charcoal/10 pt-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-bridal-charcoal/70">
              {describeUnitQty(config.unitLabel, line.billedQty)} × {money(config.unitPrice)}
            </span>
            <span className="font-display text-[22px] text-bridal-charcoal tabular-nums">
              {money(line.total)}
            </span>
          </div>
          {/*
            Only reachable if the floor is somehow bypassed, but it is carried
            because the server carries it: a customer shown a quantity they did
            not ask for is owed the reason on the same screen as the number.
          */}
          {line.liftedByMinimum ? (
            <p className="mt-2 text-xs text-bridal-charcoal/60">
              You asked for {describeUnitQty(config.unitLabel, line.requestedQty)}. The vendor's
              minimum is {describeUnitQty(config.unitLabel, line.billedQty)}, so that is what is
              billed.
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
