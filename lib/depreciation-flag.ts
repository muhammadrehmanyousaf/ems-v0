// Depreciation engine — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-12). Gates the fixed-asset register + straight-line
// monthly depreciation run, whose expense feeds the costing-depth overhead pool.
// While unset, no depreciation UI renders and the backend /fixed-assets and
// /depreciation/run endpoints 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_DEPRECIATION_ON=true   → render the asset register + run
//   (unset / anything else)            → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_DEPRECIATION_ON === "true"

/** Whether the depreciation surface should render. OFF by default. */
export function isDepreciationOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const DEPRECIATION_ON = isDepreciationOn()
