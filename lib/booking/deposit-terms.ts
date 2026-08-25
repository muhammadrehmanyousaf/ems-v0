/**
 * A17 — what the customer is told about the security deposit, at Review.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * The deposit is a second sum of money. It is NOT part of the quoted total,
 * it is refundable, and the customer agrees to it when they book. The server
 * has always computed it and, since the deposit-visibility work, returns it on
 * both `POST /bookings` and `GET /bookings/:id/order`.
 *
 * The Review screen showed none of it. Driving the live wizard to Review
 * against a venue with a Rs 50,000 deposit, the screen displayed Rs 250,000 and
 * nothing else — no deposit, no "refundable", no "not part of the price". A
 * grep of the whole booking form for "deposit" returned zero hits. So a family
 * committed to handing over Rs 50,000 that appeared on no screen they saw.
 *
 * Review is the right place, and the server's own helper says so: "Plain-
 * language terms, shown at Review — before the night, never after."
 *
 * ── Why a mirror ──────────────────────────────────────────────────────────
 *
 * At Review the booking does not exist yet, so there is no server response to
 * read the sentences from — they have to be derived client-side from the
 * venue's own policy. This is a deliberate mirror of
 * `src/utils/depositLedger.js#describeDepositTerms`, kept honest by
 * `scripts/deposit-terms-parity.mts`, which drives BOTH implementations over
 * the same inputs and fails on any divergence.
 *
 * That guard is the whole point. The last time this codebase kept a rule in two
 * places without one, the frontend said Sindh had a one-dish rule and the
 * server said `unknown` — and only one of them was right.
 */

/** parseFloat, or null. Mirrors the server's `num`. */
const num = (v: unknown): number | null => {
  const n = parseFloat(String(v))
  return Number.isFinite(n) ? n : null
}

export type DepositPolicy = {
  securityDepositPkr?: number | string | null
  depositReturnDays?: number | string | null
} | null | undefined

/**
 * The customer's deposit sentences, or [] when the venue takes no deposit.
 *
 * An unset `depositReturnDays` states NO number. It used to default to 7 days,
 * which told the customer a specific promise on the authority of nobody — the
 * venue never agreed to it and would be held to it. Absence of a declared value
 * is not a value.
 */
export function describeDepositTerms(policy: DepositPolicy): string[] {
  const d = num(policy?.securityDepositPkr) ?? 0
  if (d <= 0) return []

  const first = `A refundable security deposit of Rs ${d.toLocaleString("en-PK")} is taken separately from your booking total.`

  const days = num(policy?.depositReturnDays)
  if (days == null || days <= 0) {
    return [
      first,
      "It is not part of the price. If nothing is damaged it comes back in full after your event — ask the venue how soon.",
    ]
  }

  return [
    first,
    `It is not part of the price. If nothing is damaged it comes back in full within ${days} ${days === 1 ? "day" : "days"} of your event.`,
  ]
}
