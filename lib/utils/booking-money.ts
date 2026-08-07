/**
 * The client-side half of the one money rule. Mirrors
 * `event-planner-api/src/utils/bookingMoney.js` exactly — read that file for
 * the full reasoning and the live figures it reconciles to.
 *
 * Short version: what a customer has paid is the amount column, and what they
 * still owe is arithmetic on the two amounts. `paymentStatus` is a label ABOUT
 * that arithmetic and is never an input to it.
 *
 * Trusting the flag instead is how the Record Payment dialog came to print
 * *"Remaining balance is Rs 350,000"* to a vendor whose customer had already
 * handed over Rs 35,000 and owed Rs 315,000 — with the customer standing at the
 * counter (WWL-040). The same inversion showed a Rs 1,546,000 booking with
 * Rs 386,500 received as `Remaining Rs 0` (WWL-037), and exported that figure
 * into the vendor's accounting file (WWL-047).
 *
 * The correct derivation was already in the product — the order editor at the
 * bottom of the same page gets it right. This is that derivation, shared.
 */

const CANCELLED = new Set(['Cancelled', 'Canceled', 'cancelled', 'canceled']);

/** A booking line or booking, loosely typed — callers pass whatever they hold. */
export type MoneyRow = {
  totalAmount?: number | string | null;
  downPayment?: number | string | null;
  status?: string | null;
  orderStage?: string | null;
  bookingDetails?: Array<{
    totalAmount?: number | string | null;
    downPayment?: number | string | null;
  }> | null;
};

function amount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function isCancelledBooking(row: MoneyRow | null | undefined): boolean {
  if (!row) return false;
  return CANCELLED.has(String(row.status ?? '')) || CANCELLED.has(String(row.orderStage ?? ''));
}

/**
 * What the booking is worth.
 *
 * Prefers the sum of the per-business lines when they carry a value: a booking's
 * own `totalAmount` can legitimately be 0 on multi-vendor bookings, where the
 * money lives on `bookingDetails`.
 */
export function bookedOn(row: MoneyRow | null | undefined): number {
  if (!row) return 0;
  const lines = row.bookingDetails || [];
  const fromLines = lines.reduce((sum, d) => sum + amount(d?.totalAmount), 0);
  return Math.max(0, fromLines > 0 ? fromLines : amount(row.totalAmount));
}

/** Money actually received. The amount column, never the flag. */
export function receivedOn(row: MoneyRow | null | undefined): number {
  if (!row) return 0;
  const lines = row.bookingDetails || [];
  const fromLines = lines.reduce((sum, d) => sum + amount(d?.downPayment), 0);
  return Math.max(0, fromLines > 0 ? fromLines : amount(row.downPayment));
}

/** What is still owed. A cancelled booking owes nothing. */
export function outstandingOn(row: MoneyRow | null | undefined): number {
  if (isCancelledBooking(row)) return 0;
  return Math.max(0, bookedOn(row) - receivedOn(row));
}

/** Money received beyond the total. 0 in the normal case. */
export function overpaidOn(row: MoneyRow | null | undefined): number {
  return Math.max(0, receivedOn(row) - bookedOn(row));
}

export type DerivedPaymentStatus = 'Paid' | 'Partial' | 'Pending' | 'Cancelled';

/**
 * The label that honestly describes the amounts above it, so a stale flag can
 * never again contradict the numbers printed on the same row. One-rupee
 * tolerance — these are NUMERIC(12,2) and paid-to-the-paisa must read as Paid.
 */
export function derivedPaymentStatus(row: MoneyRow | null | undefined): DerivedPaymentStatus {
  if (isCancelledBooking(row)) return 'Cancelled';
  const booked = bookedOn(row);
  const received = receivedOn(row);
  if (booked > 0 && received >= booked - 1) return 'Paid';
  if (received > 0) return 'Partial';
  return 'Pending';
}

/** Convenience: everything a money block needs, in one call. */
export function bookingMoney(row: MoneyRow | null | undefined) {
  return {
    booked: bookedOn(row),
    received: receivedOn(row),
    outstanding: outstandingOn(row),
    overpaid: overpaidOn(row),
    status: derivedPaymentStatus(row),
    isCancelled: isCancelledBooking(row),
  };
}
