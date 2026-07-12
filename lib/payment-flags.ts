// Payment + auth flexibility feature flags. Mirror the backend gates
// (FEAT_CASH_BOOKING / FEAT_PK_PAYMENTS / FEAT_PHONE_OTP). Default OFF — the
// new surfaces stay hidden unless the env var is explicitly "true" at build
// time, so the live Stripe-card + email/password flows are unchanged.
//
// NOTE: NEXT_PUBLIC_* vars are inlined by Next at build time, so each must be
// referenced as a full static `process.env.NEXT_PUBLIC_*` access (no dynamic
// key lookups) — hence three separate constants.
export const CASH_BOOKING_ENABLED = process.env.NEXT_PUBLIC_FEAT_CASH_BOOKING === "true"
export const PK_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_FEAT_PK_PAYMENTS === "true"
export const PHONE_OTP_ENABLED = process.env.NEXT_PUBLIC_FEAT_PHONE_OTP === "true"
