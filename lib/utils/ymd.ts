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
export function fmtYmd(value: unknown, style: YmdStyle | Intl.DateTimeFormatOptions = "short", fallback: string | null = "—"): string {
  const ymd = ymdOf(value);
  if (!ymd) return fallback === null ? (value == null ? "" : String(value)) : fallback;
  const opts = typeof style === "string" ? STYLES[style] : style;
  const d = new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10))));
  return d.toLocaleDateString("en-PK", { ...opts, timeZone: "UTC" });
}

/** The calendar day as a UTC-midnight Date, for arithmetic / sorting. Never format it in a local zone. */
export function ymdToUtcDate(value: unknown): Date | null {
  const ymd = ymdOf(value);
  return ymd ? new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)))) : null;
}
