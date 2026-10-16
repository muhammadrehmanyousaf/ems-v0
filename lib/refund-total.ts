/**
 * The money a customer actually receives when a booking is cancelled (WP26 / V4-6).
 *
 * `GET /bookings/:id/refund-preview` answers `preview.refund` = the POLICY part only, and reports two
 * more sums that are owed back IN FULL on their own obligations (they are not in `preview.refund` and
 * not in `totalPaid`, so nothing is counted twice):
 *   - `priceDropRefund`    (WP19) the vendor cut the price below what was paid: the overpayment
 *   - `declinedLineRefund` (WP18) the venue declined a line that held money
 * The dialog used to show `preview.refund` alone ("You'll get back Rs 18,000" for a customer who is
 * owed 38,000). `refundTotal` is the figure to show.
 *
 * `refundPin` is NOT the total: the cancel call pins `expectedRefund` and the server compares it with
 * the policy part it computes under the booking lock (bookingController.cancelBooking), so the pin
 * must stay `preview.refund`. Pinning the total would answer REFUND_CHANGED on every booking that has
 * a price-drop or declined-line sum.
 *
 * Guarded by scripts/cancellation-policy-check.mts (cases in scripts/fixtures/refundTotalCases.json,
 * mirrored by the backend's tests/fixtures/refundTotalCases.json).
 */

export interface RefundPartsInput {
  preview: { refund: number }
  priceDropRefund?: number | null
  declinedLineRefund?: number | null
}

export interface RefundParts {
  /** The refund the venue's cancellation policy governs. */
  policy: number
  /** An overpayment after a price cut, owed back in full. 0 when none. */
  priceDrop: number
  /** Money held by a line the venue declined, owed back in full. 0 when none. */
  declinedLine: number
  /** Everything the customer will receive. */
  total: number
  /** True when anything beyond the policy refund is owed (the component lines are worth showing). */
  hasExtras: boolean
}

const money = (n: unknown): number => {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? v : 0
}

export function refundParts(p: RefundPartsInput): RefundParts {
  const policy = money(p.preview?.refund)
  const priceDrop = money(p.priceDropRefund)
  const declinedLine = money(p.declinedLineRefund)
  return {
    policy,
    priceDrop,
    declinedLine,
    total: policy + priceDrop + declinedLine,
    hasExtras: priceDrop > 0 || declinedLine > 0,
  }
}

/** What the customer will receive in total (policy + price-drop + declined-line). */
export const refundTotal = (p: RefundPartsInput): number => refundParts(p).total

/** The figure `expectedRefund` pins on the cancel call: the policy part, exactly what the server compares. */
export function refundPin(p: { preview?: { refund?: number } | null }): number | undefined {
  const shown = p.preview?.refund
  return typeof shown === "number" && Number.isFinite(shown) ? shown : undefined
}
