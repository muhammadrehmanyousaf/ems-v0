// Dashboard redesign — ON by default.
//
// The redesigned vendor/admin dashboard renders at every canonical route with no
// configuration required. There is NOTHING to set for normal operation.
//
// The only env var here is an emergency rollback: set
//   NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true   (or  NEXT_PUBLIC_DASHBOARD_REDESIGN=false)
// to instantly serve the OLD screens again. You should never need it.
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time, so each is read as a full
// static process.env.NEXT_PUBLIC_… access.)

/** Hard OFF — serve the original screens. Default (unset) → redesign is ON. */
const OFF =
  process.env.NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF === "true" ||
  process.env.NEXT_PUBLIC_DASHBOARD_REDESIGN === "false"

/**
 * Whether the redesigned dashboard should render. ON by default; only the
 * emergency kill-switch above turns it off. The optional argument is accepted
 * for call-site compatibility and ignored.
 */
export function isRedesignOn(_businessId?: number | string | null): boolean {
  return !OFF
}

/** Convenience for non-conditional consumers. */
export const DASHBOARD_REDESIGN_ON = isRedesignOn()
