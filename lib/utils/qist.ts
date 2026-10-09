/**
 * One vocabulary, one date format and one "Rs" format for the qist schedule, shared
 * by the vendor's Payments card and the customer's schedule card.
 *
 *   Qist       a scheduled instalment of the booking total
 *   Mil chuka  money received
 *   Baqaya     the OUTSTANDING TOTAL only (total - received) - never a single qist
 *
 * A qist's own remainder is "lena hai" (to collect); it is never called baqaya,
 * because the owner could not tell which number to collect when one word meant the
 * total, the second instalment and a history step all at once.
 *
 * Every number here arrives from the server already parsed (see
 * `BookingSchedule`); nothing is derived in the browser. Money values elsewhere in
 * the API are strings, and a string is truthy - `"0.00" || total` is how a "Pay
 * Rs. 0" button was shipped - so `moneyOf` is the ONE way this file reads a value
 * that could still be a string, and a test pins that "0", "0.00" and 0 are zero.
 */

import type { BookingInstallment, QistState } from "@/lib/api/bookings"

/** Parse once; "0.00", 0 and null are all zero. Never NaN, never truthiness. */
export function moneyOf(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Pakistani digit grouping: 18,45,000. */
export function groupPk(value: unknown): string {
  const v = Math.round(moneyOf(value))
  const s = Math.abs(v).toString()
  const body = s.length <= 3 ? s : s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3)
  return (v < 0 ? "-" : "") + body
}

/** "Rs 1,500" - the one text form of money on a qist screen. */
export function rsText(value: unknown): string {
  return `Rs ${groupPk(value)}`
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * "9 Oct 2026" - the one date format on a qist screen. Takes a calendar day
 * (`YYYY-MM-DD`, the server's `dueDate`) and formats it WITHOUT going through a
 * timezone, so a viewer west of UTC cannot see the previous day.
 */
export function dayText(day: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(day || ""))
  if (!m) return "—"
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ""} ${m[1]}`
}

type Tone = "ok" | "warn" | "info" | "bad" | "mut" | "acc"

export interface QistStateView {
  tone: Tone
  /** Short pill text. */
  label: string
  /** Longer explanation under the row. */
  detail: string
}

const plural = (n: number) => (n === 1 ? "din" : "din")

/** The vendor's wording (Roman Urdu), exact days, exact remainder. */
export function qistStateVendor(q: Pick<BookingInstallment, "state" | "daysOverdue" | "daysUntilDue" | "dueDate" | "remaining" | "amountPaid">): QistStateView {
  const left = moneyOf(q.remaining)
  const due = dayText(q.dueDate)
  switch (q.state as QistState) {
    case "overdue": {
      const d = Math.max(1, moneyOf(q.daysOverdue))
      return { tone: "bad", label: `${d} ${plural(d)} late`, detail: `${rsText(left)} lena hai · ${due} ko deni thi` }
    }
    case "due_today":
      return { tone: "warn", label: "Aaj due", detail: `${rsText(left)} lena hai · aaj` }
    case "part_paid":
      return { tone: "info", label: "Kuch mila", detail: `${rsText(left)} lena hai · ${due} tak` }
    case "paid":
      return { tone: "ok", label: "Mil gaya", detail: "" }
    case "waived":
      return { tone: "mut", label: "Maaf", detail: "" }
    case "cancelled":
      return { tone: "mut", label: "Cancel", detail: "Booking cancel ho chuki" }
    default: {
      const n = q.daysUntilDue == null ? null : moneyOf(q.daysUntilDue)
      return { tone: "acc", label: "Aane wali", detail: `${rsText(left)} lena hai · ${due}${n != null ? ` (${n} ${plural(n)} mein)` : ""}` }
    }
  }
}

/** The customer's wording (English, as the rest of that page). */
export function qistStateCustomer(q: Pick<BookingInstallment, "state" | "daysOverdue" | "dueDate" | "remaining">): QistStateView {
  const left = moneyOf(q.remaining)
  const due = dayText(q.dueDate)
  switch (q.state as QistState) {
    case "overdue": {
      const d = Math.max(1, moneyOf(q.daysOverdue))
      return { tone: "bad", label: `Overdue by ${d} day${d === 1 ? "" : "s"}`, detail: `${rsText(left)} was due ${due}` }
    }
    case "due_today":
      return { tone: "warn", label: "Due today", detail: `${rsText(left)} due today` }
    case "part_paid":
      return { tone: "info", label: "Part paid", detail: `${rsText(left)} left · due ${due}` }
    case "paid":
      return { tone: "ok", label: "Paid", detail: "" }
    case "waived":
      return { tone: "mut", label: "Waived", detail: "Not payable — waived by the venue" }
    case "cancelled":
      return { tone: "mut", label: "Cancelled", detail: "Booking cancelled" }
    default:
      return { tone: "acc", label: "Upcoming", detail: `${rsText(left)} due ${due}` }
  }
}

/** "Qist 2 · Aakhri qist" for the vendor; the title alone when the label is custom ("Qist 2"). */
export function qistHeading(q: Pick<BookingInstallment, "order" | "title" | "label">): string {
  const title = q.title || q.label
  if (q.order == null) return title
  return /^qist\s*\d+$/i.test(String(title).trim()) ? `Qist ${q.order}` : `Qist ${q.order} · ${title}`
}

/** True when a due day sits after the event (the vendor is warned, not blocked). */
export function dueAfterEvent(q: Pick<BookingInstallment, "warnings">): boolean {
  return (q.warnings || []).includes("due_after_event")
}
