// Force-majeure batch refund matrix (CreditNote + 236CB/PST reversal) — feature
// flag (OFF by default). Venue-OS P2 · WS9. While unset no UI renders and the
// backend endpoints 404. NEVER auto-cancels a booking — it only issues credits/refunds.
//
//   NEXT_PUBLIC_FORCE_MAJEURE_BATCH_ON=true   → render the batch tool
//   (unset / anything else)                   → OFF (default)

const ON = process.env.NEXT_PUBLIC_FORCE_MAJEURE_BATCH_ON === "true"

/** Whether the force-majeure batch surface should render. OFF by default. */
export function isForceMajeureBatchOn(_businessId?: number | string | null): boolean {
  return ON
}

export const FORCE_MAJEURE_BATCH_ON = isForceMajeureBatchOn()
