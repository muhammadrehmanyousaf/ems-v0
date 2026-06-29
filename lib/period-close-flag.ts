// Month-end period close — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-14). Gates closing a month (locks that business's
// journal entries + freezes a P&L snapshot; the engine then rejects new posting
// into the closed month) and reopening it. While unset, no period-close UI
// renders, the backend close/reopen/status endpoints 404, AND the engine guard
// is off (the guard keys off the same env on the server), so posting is never
// affected on the live system.
//
//   NEXT_PUBLIC_PERIOD_CLOSE_ON=true   → render the month-end close surface
//   (unset / anything else)            → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_PERIOD_CLOSE_ON === "true"

/** Whether the month-end period-close surface should render. OFF by default. */
export function isPeriodCloseOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const PERIOD_CLOSE_ON = isPeriodCloseOn()
