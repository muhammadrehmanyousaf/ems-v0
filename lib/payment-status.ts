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
  // PAY-UI_CUSTOMER-010: the server quotes the next qist as `amountDue` even when nothing is due today
  // (`dueNow` 0). With no money received yet that is a venue that asks no advance: not "Pay now".
  if (v.amountDue > 0 && v.dueNow === 0 && v.received <= 0 && !(Number(v.overdueAmount) > 0)) {
    return { type: "awaiting_down", amount, label: "Next payment" };
  }
  const remaining = v.paymentType === "remaining" || v.received > 0;
  return remaining
    ? { type: "remaining", amount, label: "Pay remaining" }
    : { type: "awaiting_down", amount, label: "Pay now" };
}

/**
 * PAY-UI_CUSTOMER-010 - a venue that asks no advance has ONE qist (the whole
 * bill, due near the event). The server's `amountDue` falls back to the next
 * qist when nothing is due today, so the booking and pay pages asked the
 * customer to move the entire balance weeks or months early while the review
 * step said "Advance Rs 0".
 *
 * Reads only what the server states about the schedule: nothing has been
 * received, a qist is still open, and none of the open ones is overdue or due
 * today. Anything else (money already received, no schedule to read, an
 * overdue qist) returns null and the caller keeps the server's figure.
 */
export interface NotDueYetInput {
  paymentType?: string | null;
  amountDue?: number;
  /** WP17 additive: what is due TODAY and what it is. Present = the server states it; absent = older server. */
  dueNow?: number;
  basis?: string | null;
  amountReceived?: number;
  overdueAmount?: number;
  installments?: Array<{ state?: string; remaining?: number; waived?: boolean }>;
  nextInstallment?: { dueDate?: string } | null;
}

export function paymentNotDueYet(i: NotDueYetInput | null | undefined): { amount: number; dueDate: string | null } | null {
  if (!i || !i.paymentType || !(Number(i.amountDue) > 0)) return null;
  if (!(Number(i.amountReceived) === 0)) return null; // unstated or already paying: server figure stands
  if (Number(i.overdueAmount) > 0) return null;
  // WP17: the server now says it outright. `basis: "none"` with `dueNow: 0` = nothing is due today (the
  // figure quoted is only the NEXT qist). Anything else is due. No schedule needs to be read.
  if (typeof i.basis === "string" && i.basis !== "" && i.dueNow !== undefined && i.dueNow !== null) {
    // WP37 (CUSTOMER-007): `awaiting_approval` = the venue has not accepted yet, so nothing is due today either.
    if ((i.basis !== "none" && i.basis !== "awaiting_approval") || Number(i.dueNow) > 0) return null;
    return { amount: Number(i.amountDue), dueDate: i.nextInstallment?.dueDate ?? null };
  }
  // Older server (no dueNow / basis): read the schedule states, as before.
  const open = (Array.isArray(i.installments) ? i.installments : []).filter((q) => !q.waived && Number(q.remaining) > 0);
  if (open.length === 0) return null; // no schedule to read
  if (open.some((q) => q.state === "overdue" || q.state === "due_today")) return null;
  return { amount: Number(i.amountDue), dueDate: i.nextInstallment?.dueDate ?? null };
}

/**
 * PAY-UI_CUSTOMER-015 (WP17) - a multi-venue booking pays each venue separately. The server now sends every
 * venue's own share (`vendors[].amountDue`); this returns them, or null when there is nothing to split (one
 * venue, or an older server that states no shares), in which case the screen keeps ONE whole-booking claim.
 */
export interface VenueShareInput {
  businessId: number;
  businessName?: string | null;
  name?: string | null;
  amountDue?: number;
  accounts?: unknown[];
}
export interface VenueShare { businessId: number; name: string; amountDue: number; hasAccounts: boolean }

export function venueClaimShares(vendors: VenueShareInput[] | null | undefined): VenueShare[] | null {
  if (!Array.isArray(vendors) || vendors.length < 2) return null;
  if (!vendors.every((v) => typeof v.amountDue === "number" && Number.isFinite(v.amountDue))) return null;
  return vendors.map((v) => ({
    businessId: Number(v.businessId),
    name: v.name || v.businessName || "The venue",
    amountDue: Number(v.amountDue),
    hasAccounts: Array.isArray(v.accounts) && v.accounts.length > 0,
  }));
}

/**
 * PAY-UI_CUSTOMER-011 - the customer's read-only line for the refundable deposit.
 *
 * The review step promises "Refundable deposit Rs 40,000 (separate)" and then no
 * customer screen mentioned it again. `GET /bookings/:id/deposit` is readable by
 * the customer (WP04); this turns that position into one amount and one
 * sentence. Returns null when no deposit was ever taken. It states what the
 * server states and does nothing else: answering a claim is not offered here.
 */
export interface DepositPositionLike {
  deposit?: number;
  status?: string | null;
  claimed?: number;
  deducted?: number;
  returnable?: number;
  openClaims?: number;
  disputedClaims?: number;
  acceptedClaims?: number;
}

export function customerDepositLine(pos: DepositPositionLike | null | undefined): { amount: number; note: string } | null {
  const amount = Number(pos?.deposit);
  if (!pos || !Number.isFinite(amount) || amount <= 0) return null;
  const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString()}`;
  const live = Number(pos.openClaims || 0) + Number(pos.disputedClaims || 0) + Number(pos.acceptedClaims || 0);
  const status = String(pos.status || "pending");
  let note: string;
  if (status === "returned") note = "Returned to you.";
  else if (status === "partially_returned") note = `Part returned; ${rs(Number(pos.deducted || 0))} was kept for damage.`;
  else if (status === "forfeited") note = "Kept by the venue.";
  else if (status === "void") note = "Not charged: the booking was cancelled.";
  else if (live > 0) {
    note = `The venue has raised a damage claim of ${rs(Number(pos.claimed || 0))}. The deposit is returned once it is settled.`;
  } else {
    note = "Separate from your booking total. Returned after the event if nothing is damaged.";
  }
  return { amount, note };
}
