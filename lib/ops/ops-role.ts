// Ops Portal — who belongs in /ops.
//
// This is ROUTING, never authorization: it decides where a signed-in person lands after login and which cookie hint
// middleware.ts reads. Every /api/v1/ops call is authorised again by the server (ops_access + a named permission).

type RoleLike = { id?: number; name?: string | null }
type UserLike = {
  roles?: RoleLike[] | null
  isVendor?: boolean
  isSuperAdmin?: boolean
} | null | undefined

const OPS_ROLE_PREFIX = "ops_"

const lower = (r: RoleLike) => String(r?.name || "").toLowerCase()

/** The account holds at least one ops_* role. */
export function hasOpsRole(user: UserLike): boolean {
  return !!user?.roles?.some((r) => lower(r).startsWith(OPS_ROLE_PREFIX))
}

/**
 * Someone whose home is the ops portal: an ops role and NOT a vendor, an admin or a super admin. A super admin keeps
 * /dashboard as their landing page (they can still open /ops by URL).
 */
export function isOpsOnly(user: UserLike): boolean {
  if (!hasOpsRole(user)) return false
  if (user?.isVendor === true || user?.isSuperAdmin === true) return false
  return !user?.roles?.some((r) => {
    const n = lower(r)
    return n === "vendor" || n === "admin" || n === "super admin" || r?.id === 1 || r?.id === 2
  })
}
