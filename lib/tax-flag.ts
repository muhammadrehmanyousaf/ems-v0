// Tax & compliance rate-store / engine — feature flag (OFF by default).
//
// Part of the venue-OS foundations (P0 · WS-0D, decision ACC-3; goes live in
// P1 · WS-4 for 236CB + provincial PRA/SRB/KPRA/BRA). Every PKR/tax/compliance
// figure is an effective-dated, source-cited row in the rate-store; the engine
// never shows or computes a tax number while this is unset. The six unverified
// placeholder rate classes additionally hard-gate their own province/feature
// go-live on the server regardless of this flag.
//
//   NEXT_PUBLIC_TAX_ENGINE_ON=true   → render tax surfaces (236CB line, etc.)
//   (unset / anything else)          → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the per-business gate is the
// server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_TAX_ENGINE_ON === "true"

/**
 * Whether the tax engine surfaces should render. OFF by default.
 * The optional argument is accepted for call-site compatibility and ignored.
 */
export function isTaxEngineOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const TAX_ENGINE_ON = isTaxEngineOn()
