/**
 * "The function is over" - when a vendor may close a booking, and which Bookings
 * list tab a status belongs to (WP22, owner bug #5).
 *
 * The server completes a Confirmed booking by itself the PKT day AFTER its event
 * day (src/services/bookingCompletionService.js), whatever the payment state. This
 * is the human's half: the vendor can mark it completed from the event day itself
 * (the owner's screenshot: the function was today, the booking still read
 * "Confirmed"). Completion is a fact about the EVENT, never about money: an unpaid
 * completed booking keeps its balance (Baqaya due) everywhere.
 *
 * One rule for the list's row menu and the booking page, so the two cannot
 * disagree. The day is the Pakistan calendar day (lib/utils/pk-date.ts), never the
 * browser's: at 02:00 PKT a UTC `new Date().toISOString().slice(0,10)` still reads
 * yesterday.
 */

import { todayInKarachi } from "@/lib/utils/pk-date"

/** The statuses a vendor may close: the BK-081 ladder allows both, "Pending" (never answered) is not theirs to assert. */
const COMPLETABLE = new Set(["confirmed", "awaiting payment"])

/**
 * May the vendor mark this booking completed now?
 * Yes from the event day onward, for a Confirmed / Awaiting Payment booking. No for
 * a future event, an already Completed or Cancelled one, or a bare Pending request.
 */
export function canMarkCompleted(
  b: { status?: string | null; bookingDate?: string | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!b || !b.bookingDate) return false
  if (!COMPLETABLE.has(String(b.status ?? "").trim().toLowerCase())) return false
  const eventDay = String(b.bookingDate).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDay)) return false
  return eventDay <= todayInKarachi(now)
}

export type StatusBucket = "confirmed" | "pending" | "done"

/**
 * The Bookings list tab a status counts under. "Ho gaya" (done) is the booking
 * that is over: Completed, and also Cancelled (it is finished too). Everything the
 * vendor still has to act on or that has not happened yet is confirmed / pending.
 */
export function statusBucket(status?: string | null): StatusBucket {
  const v = (status || "").toLowerCase()
  if (v.includes("complete") || v.includes("cancel")) return "done"
  if (v.includes("confirm")) return "confirmed"
  return "pending"
}
