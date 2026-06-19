// Vendor-claim feature flag. Mirrors the backend CLAIM_ENABLED gate.
// Default OFF — the wizard renders a "not available yet" notice unless the
// env var is explicitly set to the string "true" at build time.
//
// NOTE: NEXT_PUBLIC_* vars are inlined by Next at build time, so this must be
// referenced as a full static `process.env.NEXT_PUBLIC_CLAIM_ENABLED` access.
export const CLAIM_ENABLED = process.env.NEXT_PUBLIC_CLAIM_ENABLED === "true"
