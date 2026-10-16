/**
 * WP23 (owner bug 6) — a DATE is not an instant.
 *
 * `bookingDate` (and `eventDate`, `holdDate`, ...) is a calendar day: no time, no
 * zone. The API sends it as "2026-10-16", occasionally as the ISO instant of that
 * day's UTC midnight ("2026-10-16T00:00:00.000Z"). Feeding either to `new Date()`
 * and formatting in the BROWSER zone is wrong twice over:
 *
 *   • the clock part is meaningless: UTC midnight is 05:00 in Pakistan, which is
 *     the "5:00 am" the owner saw under every booking date;
 *   • west of Greenwich the same call prints the PREVIOUS day (a vendor or a
 *     customer abroad sees 15 Oct for a 16 Oct wedding).
 *
 * Everything here reads the day off the string and formats it with
 * `timeZone: "UTC"` on a UTC-midnight Date, so the output is the same in every
 * browser zone. There is no time of day in the result, by construction.
 *
 * The time of a booking is its SLOT: `lib/booking/slot-vocabulary.ts`.
 */

const YMD = /^(\d{4})-(\d{2})-(\d{2})/;

/** "2026-10-16" | "2026-10-16T00:00:00.000Z" -> "2026-10-16"; anything else -> null. */
export function ymdOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = YMD.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const probe = new Date(Date.UTC(y, mo - 1, d));
  // 2026-02-30 rolls over: refuse it rather than print another day.
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export type YmdStyle = "short" | "long" | "weekday" | "dayMonth" | "numeric";

const STYLES: Record<YmdStyle, Intl.DateTimeFormatOptions> = {
  short: { day: "numeric", month: "short", year: "numeric" },
  long: { day: "numeric", month: "long", year: "numeric" },
  weekday: { weekday: "short", day: "numeric", month: "short", year: "numeric" },
  dayMonth: { day: "numeric", month: "short" },
  numeric: { day: "2-digit", month: "2-digit", year: "numeric" },
};

/**
 * Format a calendar day for display. `fallback` is returned for an empty or
 * unreadable value (default "—"); pass `null` to get the input back as text.
 */
export function fmtYmd(value: unknown, style: YmdStyle | Intl.DateTimeFormatOptions = "short", fallback: string | null = "—", locale = "en-PK"): string {
  const ymd = ymdOf(value);
  if (!ymd) return fallback === null ? (value == null ? "" : String(value)) : fallback;
  const opts = typeof style === "string" ? STYLES[style] : style;
  const d = new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10))));
  return d.toLocaleDateString(locale, { ...opts, timeZone: "UTC" });
}

/** The calendar day as a UTC-midnight Date, for arithmetic / sorting. Never format it in a local zone. */
export function ymdToUtcDate(value: unknown): Date | null {
  const ymd = ymdOf(value);
  return ymd ? new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)))) : null;
}

/**
 * The calendar day a person PICKED, as "YYYY-MM-DD", for sending to the server.
 *
 * A date picker hands back a Date at local midnight, and the booking flow adds the slot's hour to it
 * (`setHours(19, 0)`) and stores `toISOString()`. That ISO string is the UTC instant, and the
 * server reads an instant as its PAKISTAN day: a customer in Los Angeles who picks 16 Oct, evening,
 * sends 17 Oct 02:00Z = 17 Oct in Karachi, and books the wrong day. The day they picked is the
 * LOCAL calendar day of that Date, which this returns. A value that is already "YYYY-MM-DD" is
 * returned unchanged.
 */
export function pickedDayOf(value: unknown): string | null {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return ymdOf(value);
  const d = value instanceof Date ? value : typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * "2026-10-16" or the UTC midnight of that day ("2026-10-16T00:00:00.000Z"): the two shapes the API
 * uses for a DATE column. Anything else is a real instant (a timestamp with a time of day), which
 * is formatted in the viewer's zone as before. Use this in a helper that formats BOTH kinds.
 */
export function dateOnlyOf(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}(T00:00:00(\.0+)?Z)?$/.test(s)) return null;
  return ymdOf(s);
}
