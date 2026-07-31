// NOT feature flags — these two are UNPROVISIONED THIRD-PARTY INTEGRATIONS.
//
// Every other gate in this codebase that hid a built-and-running feature has
// been removed. These two stay, because deleting them would not reveal a
// working feature — it would reveal a broken one:
//
//   PK_PAYMENTS  The JazzCash / Easypaisa adapters in the backend
//                (services/payments/*Adapter.js) are scaffolds. Each returns
//                { ok: false, reason: "not_configured" } until its merchant
//                credentials exist — JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD,
//                JAZZCASH_INTEGRITY_SALT, JAZZCASH_RETURN_URL, JAZZCASH_API_URL,
//                and the Easypaisa equivalents. Turning this on would offer
//                customers two payment methods that cannot take money.
//
//   PHONE_OTP    Verified against LIVE production on 2026-07-31:
//                POST /api/v1/auth/phone-otp/request returns HTTP 503
//                { code: "not_configured", requiredCredentials: ["SMS_PROVIDER"] }.
//                Turning this on would put a "Sign in with phone number" button
//                on the live login page that always fails.
//
// Note that the backend flags FEAT_PK_PAYMENTS and FEAT_PHONE_OTP ARE globally
// enabled. What blocks these is missing credentials, not a switch. The fix is to
// provision them or to delete the scaffold UI — both product calls, not cleanup.
//
// FEAT_CASH_BOOKING has been removed from this file: it needs no third-party
// credentials, its backend gate is on, and cash is how most Pakistani bookings
// are actually paid.
//
// NEXT_PUBLIC_* vars are inlined by Next at build time, so each must be a full
// static process.env access — no dynamic key lookups.
export const PK_PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_FEAT_PK_PAYMENTS === "true"
export const PHONE_OTP_ENABLED = process.env.NEXT_PUBLIC_FEAT_PHONE_OTP === "true"
