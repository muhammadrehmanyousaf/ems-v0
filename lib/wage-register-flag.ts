// Wage register + per-event dihari labour — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-13). Gates recording dihari shifts into the immutable
// wage register, posting them to the GL tagged to their event (so labour becomes
// a direct per-event cost), and the labour-by-event view. While unset, no labour
// UI renders and the backend /wages + /labour-by-event endpoints 404.
//
//   NEXT_PUBLIC_WAGE_REGISTER_ON=true   → render the wage / labour surface
//   (unset / anything else)             → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_WAGE_REGISTER_ON === "true"

/** Whether the wage-register / labour surface should render. OFF by default. */
export function isWageRegisterOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const WAGE_REGISTER_ON = isWageRegisterOn()
