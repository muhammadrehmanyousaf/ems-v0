// Group consolidation (ghar-ka-maal elimination) — feature flag (OFF by default).
//
// Part of venue-OS P2 (WS-10). Gates the consolidated group roll-up that
// eliminates inter-business (intercompany) revenue against the matching cost, so
// the owner sees true EXTERNAL group revenue/cost rather than the double-counted
// standalone sum. While unset, no consolidation UI renders and the backend
// /org/:id/consolidated endpoint 404s, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_GROUP_CONSOLIDATION_ON=true   → render the consolidated roll-up
//   (unset / anything else)                   → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the authoritative per-business
// gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_GROUP_CONSOLIDATION_ON === "true"

/** Whether the group-consolidation surface should render. OFF by default. */
export function isGroupConsolidationOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const GROUP_CONSOLIDATION_ON = isGroupConsolidationOn()
