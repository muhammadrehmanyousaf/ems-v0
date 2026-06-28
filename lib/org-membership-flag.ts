// Org / Membership workspace spine — feature flag (OFF by default).
//
// Part of the venue-OS foundations (P0 · WS-0A, decisions SCO-1/SCO-3). The
// Org → Business → Membership hierarchy and membership-scoped reads stay
// completely dark until this is explicitly turned on, so the live dashboard
// and marketplace are byte-for-byte unchanged while it is unset.
//
//   NEXT_PUBLIC_ORG_MEMBERSHIP_ON=true   → render workspace/roll-up surfaces
//   (unset / anything else)              → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time, so each is read as a
// full static process.env.NEXT_PUBLIC_… access. The optional businessId arg is
// accepted for call-site compatibility with per-business overrides; the
// authoritative per-business gate is the server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_ORG_MEMBERSHIP_ON === "true"

/**
 * Whether the Org/Membership workspace surfaces should render. OFF by default.
 * The optional argument is accepted for call-site compatibility and ignored.
 */
export function isOrgMembershipOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const ORG_MEMBERSHIP_ON = isOrgMembershipOn()
