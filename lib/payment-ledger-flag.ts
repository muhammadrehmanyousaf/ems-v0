// Payment-as-ledger (receipts / allocations / cash-float / PDC / Raast) —
// feature flag (OFF by default).
//
// Part of the venue-OS foundations (P0 · WS-0C, decisions MON-4/MON-5/MON-6).
// Extends the existing BookingInstallment → PaymentReceipt chain into a true
// Installment → Receipt → Allocation ledger with per-device gapless receipt
// serial blocks, cash-float reconciliation, and security-deposit-as-liability.
// Dark until enabled; the existing receipt / PDC endpoints and screens behave
// exactly as today while it is unset.
//
//   NEXT_PUBLIC_PAYMENT_LEDGER_ON=true   → render payment-ledger surfaces
//   (unset / anything else)              → OFF (default)
//
// (NEXT_PUBLIC_* vars are inlined by Next at build time. The optional businessId
// arg is accepted for call-site compatibility; the per-business gate is the
// server-side FeatureFlagOverride table.)

/** ON only when explicitly enabled. Default (unset) → OFF. */
const ON = process.env.NEXT_PUBLIC_PAYMENT_LEDGER_ON === "true"

/**
 * Whether the payment-ledger surfaces should render. OFF by default.
 * The optional argument is accepted for call-site compatibility and ignored.
 */
export function isPaymentLedgerOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Convenience for non-conditional consumers. */
export const PAYMENT_LEDGER_ON = isPaymentLedgerOn()
