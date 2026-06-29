// Rented-venue lease economics — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-15). Gates the rented-venue lease register + monthly
// rent/pagri accrual (whose expense feeds the costing-depth overhead pool). While
// unset, no lease UI renders and the backend /venue-leases + /lease-accrual
// endpoints 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_VENUE_LEASE_ON=true   → render the lease register + accrual
//   (unset / anything else)           → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_VENUE_LEASE_ON === "true"

/** Whether the rented-venue lease surface should render. OFF by default. */
export function isVenueLeaseOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const VENUE_LEASE_ON = isVenueLeaseOn()
