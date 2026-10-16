/**
 * WP24 — "is the event over?" is a comparison of Pakistan calendar DAYS.
 *
 * `bookingDate` / `eventDate` is a calendar day ("2026-10-16"). `new Date("2026-10-16")` is UTC
 * midnight, which is 05:00 in Pakistan, so `new Date(bookingDate) < new Date()` turns true at 05:00
 * PKT ON the event day: a function happening today read as "guzar gayi" / "already passed" for the
 * rest of the day. The same slip with the browser's own midnight (`setHours(0,0,0,0)`) is right in
 * Lahore and wrong for a viewer in Los Angeles or Auckland, and `new Date().toISOString().slice(0,10)`
 * is the UTC day (yesterday until 05:00 PKT).
 *
 * The rule, in one place: the event is past only when its day is STRICTLY BEFORE today's day in
 * Pakistan (`todayInKarachi`). Today is today. The backend mirrors it in `src/utils/eventDay.js`.
 * Money windows (payout gate, refund bands, dispute window) are the server's and already use
 * Pakistan days; nothing here decides money.
 */

import { ymdOf } from "@/lib/utils/ymd"
import { todayInKarachi } from "@/lib/utils/pk-date"

/** True when the event day is strictly before today in Pakistan. Missing / unreadable: false. */
export function isEventDayPast(value: unknown, now: Date = new Date()): boolean {
  const day = ymdOf(value)
  return day ? day < todayInKarachi(now) : false
}

/** True when the event day is today or later in Pakistan ("Aane wala"). Missing / unreadable: false. */
export function isEventDayUpcoming(value: unknown, now: Date = new Date()): boolean {
  const day = ymdOf(value)
  return day ? day >= todayInKarachi(now) : false
}

/** Whole Pakistan days from today to the event day: 0 = today, 1 = tomorrow, -1 = yesterday. null when unreadable. */
export function daysUntilEventDay(value: unknown, now: Date = new Date()): number | null {
  const day = ymdOf(value)
  if (!day) return null
  const today = todayInKarachi(now)
  const ms = (s: string) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)))
  return Math.round((ms(day) - ms(today)) / 86400000)
}

/**
 * Today in Pakistan as a LOCAL-midnight Date, for a date picker whose cells are local-midnight Dates
 * (`new Date(y, m, d)`): `cell < pktTodayCell()` then means "before today in Pakistan" whatever zone
 * the browser is in (a viewer in Auckland at 02:00 on the 17th is still on the 16th in Pakistan, and
 * the server only refuses days before THAT).
 */
export function pktTodayCell(now: Date = new Date()): Date {
  const t = todayInKarachi(now)
  return new Date(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, Number(t.slice(8, 10)))
}
