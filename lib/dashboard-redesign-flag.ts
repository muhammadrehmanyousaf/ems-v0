// Dashboard redesign rollout flag — mirrors lib/claim-flag.ts.
//
// NEXT_PUBLIC_* vars are inlined by Next at build time, so each must be read as
// a full static `process.env.NEXT_PUBLIC_…` access (no destructuring/indexing),
// otherwise the value is not substituted.
//
// OFF by default. When a canonical dashboard route is wired for cutover it calls
// `isRedesignOn(businessId?)` and renders the redesigned view when true, else the
// original — so the swap is additive, per-route, and instantly reversible by
// flipping the env var. See docs/superpowers/plans/2026-06-28-dashboard-cutover-plan.md.

/** Global kill-switch / default. "true" → redesign on for everyone. */
const GLOBAL = process.env.NEXT_PUBLIC_DASHBOARD_REDESIGN === "true"

/** Hard global OFF — overrides everything for instant rollback. "true" → force original. */
const FORCE_OFF = process.env.NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF === "true"

/**
 * Comma-separated business-id allowlist for canary/gradual rollout, e.g.
 * NEXT_PUBLIC_DASHBOARD_REDESIGN_BUSINESSES="3406,512,77". Members get the
 * redesign even when GLOBAL is off.
 */
const COHORT = (process.env.NEXT_PUBLIC_DASHBOARD_REDESIGN_BUSINESSES ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

/** Resolve whether the redesign should render for the given business. */
export function isRedesignOn(businessId?: number | string | null): boolean {
  if (FORCE_OFF) return false
  if (GLOBAL) return true
  if (businessId != null && COHORT.includes(String(businessId))) return true
  return false
}

/** Convenience for routes with no business context (global/cohort only). */
export const DASHBOARD_REDESIGN_ON = isRedesignOn()
