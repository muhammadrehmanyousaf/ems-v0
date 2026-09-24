/**
 * Which cancellation endpoint a booking must use.
 *
 * There are two, and they are not interchangeable:
 *
 *   DELETE /bookings/:id/cancel-pending — removes a booking nobody has paid for.
 *   PATCH  /bookings/:id/cancel         — the refund path: cancels, freezes the
 *                                         policy calc and raises the RefundRequest
 *                                         the customer is owed.
 *
 * The server refuses the delete the moment any money has been received:
 *
 *   'Cannot delete a booking with paymentStatus="Partial". Use the refund flow instead.'
 *
 * This choice used to be made from `booking.status` alone. A deposit-paid booking
 * sits at status "Awaiting Payment" with paymentStatus "Partial", so it took the
 * delete path, the server answered 400, and the caller's catch swallowed it — the
 * customer was shown a correct refund figure, pressed confirm, and nothing at all
 * happened: no cancellation, no obligation, no error. Deposit-paid-but-not-settled
 * is the most common state a cancelling customer is actually in.
 *
 * So the deciding fact is whether money has been received, not what the booking
 * status happens to say. Both the list and the detail screen import from here so
 * the rule cannot drift apart again — the duplication is what allowed the bug.
 */

/** The fields this decision needs. Deliberately narrow so any booking shape fits. */
export interface CancellableBooking {
  status?: string | null;
  paymentStatus?: string | null;
  downPayment?: number | string | null;
}

/** Lowercase, collapse separators — "Awaiting_Payment" and "awaiting payment" agree. */
function norm(value?: string | null): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

/** Payment states that mean nothing has been collected yet. */
const NO_MONEY = new Set(["", "pending", "unpaid", "none", "awaiting payment", "not paid"]);

/**
 * Has any money reached the vendor for this booking?
 *
 * Checked two ways on purpose. `paymentStatus` is the flag the server sets, and
 * `downPayment` is the amount actually recorded against the booking; a refund is
 * owed if EITHER says money moved. Trusting the flag alone is what the money-path
 * bugs in this codebase keep coming back to.
 */
export function hasMoneyReceived(booking: CancellableBooking | null | undefined): boolean {
  if (!booking) return false;

  const pay = norm(booking.paymentStatus);
  if (pay && !NO_MONEY.has(pay)) return true;

  const paid = Number(booking.downPayment ?? 0);
  return Number.isFinite(paid) && paid > 0;
}

/**
 * "delete"  — no money involved, the booking row can simply go.
 * "refund"  — money was received, so it must run the refund flow.
 */
export type CancelRoute = "delete" | "refund";

export function cancelRouteFor(booking: CancellableBooking | null | undefined): CancelRoute {
  if (!booking) return "refund"; // unknown shape → take the safe, non-destructive path
  return norm(booking.status) === "awaiting payment" && !hasMoneyReceived(booking)
    ? "delete"
    : "refund";
}

/**
 * The server's own words, when it bothered to say something useful.
 *
 * A cancellation can fail for reasons the customer can act on ("the venue's
 * notice period has closed"), and reporting every one of them as the same
 * "Failed to cancel booking." is how a 400 stayed invisible through an entire
 * release. Prefer the server's message; fall back only when there isn't one.
 */
export function cancelErrorMessage(error: unknown, fallback = "Failed to cancel booking."): string {
  const res = (error as { response?: { data?: { message?: string } } })?.response;
  const msg = res?.data?.message;
  return typeof msg === "string" && msg.trim() ? msg : fallback;
}

/** The server code meaning "this one has money on it — use the refund flow". */
export const PAYMENT_ALREADY_RECEIVED = "payment_already_received";

/** True when a failed delete is telling us it should have been a refund. */
export function isPaymentAlreadyReceived(error: unknown): boolean {
  const data = (error as { response?: { data?: { data?: { code?: string } } } })?.response?.data?.data;
  return data?.code === PAYMENT_ALREADY_RECEIVED;
}
