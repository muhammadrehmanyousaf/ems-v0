/**
 * F10 / WWL-062, 112, 158, 165, 181, 285, 300, 318, 338, 354 — dates defaulted
 * and capped in UTC while every user of this product is in Pakistan (UTC+5).
 *
 * The concrete failure, driven live: for the first five hours of every Pakistani
 * day, `new Date().toISOString().slice(0,10)` still returns *yesterday*. The
 * receipt dialog therefore opened pre-filled with yesterday's date AND set
 * `max` to yesterday, so a vendor recording cash at 2am on the 6th could not
 * enter the 6th at all — the native input rejected the only correct answer.
 * The same pattern was found on cheque dates, expense dates, deposit dates,
 * permit valid-from, certificate issue dates and the A/P overdue day-count.
 *
 * Everything here works in Asia/Karachi. There is no DST in Pakistan, so a
 * fixed +5 offset is exact — but `Intl` is used rather than arithmetic so this
 * stays correct if that ever changes.
 */

const KARACHI = "Asia/Karachi";

/** `YYYY-MM-DD` for "today" as a person standing in Lahore would say it. */
export function todayInKarachi(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the <input type="date"> value.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KARACHI,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** `YYYY-MM-DD` for a date `days` before/after today in Karachi. */
export function karachiDateOffset(days: number, now: Date = new Date()): string {
  return todayInKarachi(new Date(now.getTime() + days * 86400000));
}

/** Convert any Date / ISO string to its `YYYY-MM-DD` in Karachi. */
export function toKarachiDateString(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return todayInKarachi(d);
}

/**
 * Whole days between a date and today, counted in Karachi — so an invoice that
 * fell due yesterday reads 1, not 0 or 2 depending on the hour.
 * Positive = in the past (overdue by N days).
 */
export function daysOverdueInKarachi(due: Date | string, now: Date = new Date()): number {
  const dueStr = toKarachiDateString(due);
  if (!dueStr) return 0;
  const todayStr = todayInKarachi(now);
  const a = Date.UTC(
    Number(dueStr.slice(0, 4)),
    Number(dueStr.slice(5, 7)) - 1,
    Number(dueStr.slice(8, 10)),
  );
  const b = Date.UTC(
    Number(todayStr.slice(0, 4)),
    Number(todayStr.slice(5, 7)) - 1,
    Number(todayStr.slice(8, 10)),
  );
  return Math.round((b - a) / 86400000);
}

/**
 * `YYYY-MM-DD` read straight off a Date's own calendar fields, with no
 * timezone conversion at all.
 *
 * Use this — NOT `toKarachiDateString` — for a Date that came out of a date
 * PICKER or was built with `new Date(y, m, d)`. Those carry a wall-clock
 * intent ("the square the vendor clicked"), not an instant, and converting
 * them shifts the day: a `<Calendar>` hands back local midnight, so east of
 * Greenwich `toISOString()` lands on the previous evening and `.slice(0,10)`
 * silently returns YESTERDAY. That is how the dashboard filter reported the
 * wrong day for every Pakistani vendor, all day, every day.
 */
export function calendarDateString(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Last calendar day of a `YYYY-MM` period, as `YYYY-MM-DD`.
 *
 * `new Date(y, m, 0).toISOString().slice(0,10)` is the tempting one-liner and
 * it is wrong east of Greenwich for the same reason as above — it returns the
 * second-to-last day, quietly truncating every month-end report by one day.
 */
export function lastDayOfPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return "";
  return calendarDateString(new Date(y, m, 0));
}

/** Add (or subtract) whole days to a `YYYY-MM-DD` string without touching timezones. */
export function addDaysToDateString(dateStr: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) return "";
  const d = new Date(
    Date.UTC(
      Number(dateStr.slice(0, 4)),
      Number(dateStr.slice(5, 7)) - 1,
      Number(dateStr.slice(8, 10)),
    ),
  );
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Clock time in Karachi, e.g. `4:12 pm` — for "as of" freshness disclosures. */
export function karachiTimeLabel(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: KARACHI,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * The `max` for a date input that must not accept the future — today in
 * Karachi, never yesterday.
 */
export const maxTodayKarachi = todayInKarachi;

/**
 * The `min` for a date input that must not accept the past.
 * Same value; named separately so call sites read as intent.
 */
export const minTodayKarachi = todayInKarachi;
