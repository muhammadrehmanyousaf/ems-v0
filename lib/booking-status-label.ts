/**
 * How a booking status is WORDED to the vendor.
 *
 * `Booking.status` is a stored value referenced across both repos — analytics
 * KPI buckets, the edit guard, the postpone rules, the transition tables — so
 * it cannot be renamed without a migration and a sweep of every guard. What a
 * vendor READS is a separate question, and this is the one place that answers
 * it.
 *
 * WW-DIRECT-PAY made one of those words actively wrong rather than clumsy. The
 * platform takes no money; the customer pays the vendor directly, and a new
 * booking sits waiting for the VENDOR to accept. Calling that "Awaiting
 * Payment" told the vendor the opposite of what the screen needed them to do —
 * the reported symptom was that they could not tell which bookings needed
 * approving.
 *
 * ── Why this takes the row and not just the status ────────────────────────
 *
 * "Awaiting Payment" covers TWO different real-world states, because accepting
 * a request-mode booking deliberately does NOT move it to Confirmed (see
 * WW-APPROVE-VS-CONFIRM in bookingController): it stays "Awaiting Payment"
 * until the advance is recorded, and `vendorApprovedAt` is the only thing that
 * separates them.
 *
 *   vendorApprovedAt == null   the vendor has not decided yet   → "Pending approval"
 *   vendorApprovedAt != null   decided; money not yet recorded  → "Awaiting payment"
 *
 * Labelling both "Pending approval" would have been exactly as misleading as
 * the old label, just in the other direction, and would defeat the point — the
 * vendor would still not be able to see which bookings actually need them.
 *
 * Anything else falls through unchanged, so a status added on the server shows
 * its own name rather than "undefined".
 */

/** The stored statuses where a vendor decision is still meaningful. */
const AWAITING_VENDOR = ["Pending", "Awaiting Payment"];

export interface BookingStatusRow {
  status?: string | null;
  /** ISO timestamp of the vendor's accept, or null/undefined if undecided. */
  vendorApprovedAt?: string | null;
}

export function bookingStatusLabel(row: BookingStatusRow | null | undefined): string {
  const status = row?.status;
  if (!status) return "—";
  if (!AWAITING_VENDOR.includes(status)) return status;
  return row?.vendorApprovedAt ? "Awaiting payment" : "Pending approval";
}

/** True when this booking is still waiting on the vendor's accept/decline. */
export function needsVendorApproval(row: BookingStatusRow | null | undefined): boolean {
  return !!row?.status && AWAITING_VENDOR.includes(row.status) && !row.vendorApprovedAt;
}

export default bookingStatusLabel;
