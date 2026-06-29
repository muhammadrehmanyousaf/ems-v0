// Per-event costing depth — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-11). Gates the fully-costed per-event P&L that
// allocates a venue's untagged period overhead (rent/utilities/admin) across the
// period's events, so a booking that looks profitable on direct cost alone is
// shown carrying its fair share of overhead. While unset, no costing-depth UI
// renders and the backend /bookings/:id/costed-pnl endpoint 404s.
//
//   NEXT_PUBLIC_EVENT_COSTING_DEPTH_ON=true   → render the fully-costed view
//   (unset / anything else)                   → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_EVENT_COSTING_DEPTH_ON === "true"

/** Whether the per-event costing-depth surface should render. OFF by default. */
export function isEventCostingOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const EVENT_COSTING_DEPTH_ON = isEventCostingOn()
