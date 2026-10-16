/**
 * One place that answers questions about `Booking.paymentStatus`.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 *
 * The server enum gained "Partially Refunded" (backend migration
 * 20260827100000) so that a goodwill refund stops cancelling the whole
 * wedding. Adding a value to an enum is the easy half. The dangerous half is
 * that five places in this app asked "is this paid?" by writing
 * `paymentStatus === 'Paid'`, and every one of them silently answers NO for a
 * booking that was paid in full and then had some money returned.
 *
 * What that produced, before this helper:
 *
 *   - /user/bookings/[id]/pay fell through to its down-payment branch and
 *     asked the couple to pay the deposit AGAIN, days after we sent them
 *     money back. That is the worst outcome in the set and it is the default
 *     one, because the fall-through is the else.
 *   - The vendor's "Mark as Completed" switch is gated on full payment, so a
 *     vendor who gave a discount after the wedding could never close the
 *     booking.
 *   - The record-refund dialog computes "amount received" as 0 for any status
 *     that is neither Paid nor Partial, so after one partial refund the
 *     vendor could not record a second one — every amount read as exceeding
 *     what was received.
 *
 * Five copies of the same question is how the backend ended up with two
 * different answers to "is this caller an admin" in a single function, which
 * is what let a customer award themselves a full refund. One answer, imported.
 *
 * ── The judgement encoded here ────────────────────────────────────────────
 *
 * A partially refunded booking owes NOTHING further. The refund is a price
 * reduction — a discount, an apology, a dropped extra — not a debt the couple
 * has to make good. If that is ever wrong for some future flow, the flow
 * should say so explicitly rather than this default flipping, because the
 * failure mode of the other choice is billing someone for money we gave them.
 */

/** The server's exact label. Compare through the helpers, not against this. */
export const PARTIALLY_REFUNDED = "Partially Refunded" as const;

/**
 * The server sends Title Case ("Paid", "Partially Refunded"), but several
 * call sites lowercase before comparing and at least one staff surface uses
 * lowercase values for an unrelated payroll status. Normalise so a caller
 * cannot get the wrong answer by having already lowercased.
 */
const norm = (s?: string | null): string => String(s ?? "").trim().toLowerCase();

/**
 * True when the couple owes nothing further on this booking.
 *
 * Use this anywhere the old code said `paymentStatus === 'Paid'` to decide
 * whether to ask for money, enable completion, or treat the booking as
 * financially closed.
 */
export function isSettled(paymentStatus?: string | null): boolean {
  const p = norm(paymentStatus);
  return p === "paid" || p === norm(PARTIALLY_REFUNDED);
}

/** True when any money has gone back to the couple, in part or in full. */
export function hasRefund(paymentStatus?: string | null): boolean {
  const p = norm(paymentStatus);
  return p === "refunded" || p === norm(PARTIALLY_REFUNDED);
}

/**
 * True only for a fully refunded booking — the terminal state where the
 * booking is over and every rupee is back.
 *
 * Deliberately does NOT include "Partially Refunded": a partly refunded
 * wedding is still happening.
 */
export function isFullyRefunded(paymentStatus?: string | null): boolean {
  return norm(paymentStatus) === "refunded";
}

/**
 * WP08 / PAY-UI_CUSTOMER-002 — the server's own per-booking payment figure.
 *
 * `GET /bookings/simple-user-bookings` carries `paymentView` on every booking
 * whose schedule could be read: what to pay now (`amountDue`), what is due today
 * (`dueNow`), whether it is payable, and what is outstanding / received / total.
 * The customer's Payments list takes its "Pay now" amount and its Pending /
 * History split from it instead of deriving them from `totalAmount`,
 * `downPayment` and the `paymentStatus` flag (the three-way disagreement that
 * produced "Now due Rs. 2,100" over a "Pay Rs. 0" button).
 */
export interface CustomerPaymentView {
  bookingId?: number;
  /** "down_payment" | "full_payment" | "remaining", or null when nothing is payable. */
  paymentType?: string | null;
  amountDue: number;
  dueNow?: number;
  payable?: boolean;
  outstanding: number;
  received: number;
  overpaid?: number;
  total: number;
  overdueAmount?: number;
  nextDueDate?: string | null;
  cancelled?: boolean;
}

export interface CustomerPaymentAction {
  type: "awaiting_down" | "remaining" | "done";
  amount: number;
  label: string;
}

const PAYABLE_STATUSES = new Set(["awaiting payment", "pending", "confirmed"]);

function readView(raw: unknown): CustomerPaymentView | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  const n = (x: unknown) => (x === null || x === undefined || x === "" ? NaN : Number(x));
  const out = { amountDue: n(v.amountDue), outstanding: n(v.outstanding), received: n(v.received), total: n(v.total) };
  if (![out.amountDue, out.outstanding, out.received, out.total].every(Number.isFinite)) return null;
  return { ...(v as object), ...out } as CustomerPaymentView;
}

/**
 * The action the customer's Payments list shows for a booking, from the server's
 * `paymentView`. Returns null when the booking carries no usable view, is
 * cancelled, or is in a status this list does not treat as payable (rejected,
 * expired...): the caller then keeps its legacy derivation unchanged.
 */
export function customerPaymentFromView(booking: {
  status?: string | null;
  paymentView?: unknown;
}): CustomerPaymentAction | null {
  const v = readView(booking?.paymentView);
  if (!v || v.cancelled) return null;
  const status = norm(booking.status);
  if (status === "completed") return { type: "done", amount: v.total, label: "Paid" };
  if (!PAYABLE_STATUSES.has(status)) return null;
  // Nothing left to pay on a priced booking: history, whatever the flag says.
  if (v.total > 0 && v.outstanding <= 0) return { type: "done", amount: v.total, label: "Paid" };
  const amount = v.amountDue > 0 ? v.amountDue : v.outstanding;
  const remaining = v.paymentType === "remaining" || v.received > 0;
  return remaining
    ? { type: "remaining", amount, label: "Pay remaining" }
    : { type: "awaiting_down", amount, label: "Pay now" };
}
