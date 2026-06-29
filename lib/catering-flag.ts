// Catering deg-rate-card costing — feature flag (OFF by default).
//
// Part of the venue-OS foundations (P1 · WS-3, decision SCO-4). Gates the
// deg-rate-card per-head food-cost + underwater-booking re-cost surface. While
// unset, no catering-costing UI renders and the backend /catering/recost
// endpoint 404s, so the live dashboard is byte-for-byte unchanged.
//
//   NEXT_PUBLIC_CATERING_DEGCARD_ON=true   → render the re-cost surface
//   (unset / anything else)                → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_CATERING_DEGCARD_ON === "true"

/**
 * Whether the catering deg-rate-card costing surface should render. OFF by
 * default. The optional argument is accepted for call-site compatibility.
 */
export function isCateringDegcardOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const CATERING_DEGCARD_ON = isCateringDegcardOn()
