/**
 * What the vendor Overview SAYS about the records the server sent it.
 *
 * The server decides which records belong on which card and in what order
 * (backend: services/vendorOverviewService.js). This file decides only how a
 * record is worded, and it does that once, for every card, so that:
 *
 *  - a booking reads the same on "Aane wale events", on "Tawajjo chahiye" and on
 *    the Bookings list — the status text and colour come from the same two
 *    functions the Bookings screen calls (lib/booking-status-label.ts);
 *  - a lead reads the same on the Overview and on the Leads screen — the stage
 *    text comes from lib/lead-stage.ts;
 *  - a row always says whether it is a Booking or a Lead, with its number;
 *  - dates are written one way ("12 Oct", plus the year only when it differs),
 *    where the right-hand card used to print raw "2026-10-05".
 *
 * Pure: strings and numbers in, strings and numbers out, so it is checked by
 * scripts/overview-check.mts rather than by reading a screenshot.
 */

import type { DashboardOverview, OverviewBookingRow, OverviewEnquiry } from "@/lib/api/analytics";
import { bookingStatusLabel, bookingStatusTone, type StatusTone } from "@/lib/booking-status-label";
import { leadStageOf } from "@/lib/lead-stage";
import { MONTHS_SHORT, monthLong } from "@/lib/utils/overview-chart";

/** Pakistani digit grouping: 18,45,000 (identical to artifact-shell's pkNum). */
export function pk(v: number): string {
  const s = Math.round(Math.abs(v)).toString();
  if (s.length <= 3) return (v < 0 ? "-" : "") + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return (v < 0 ? "-" : "") + rest + "," + last3;
}

export const initialsOf = (s?: string | null): string =>
  (s || "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

const cap = (s?: string | null): string => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "");

/** "2026-10-12" → "12 Oct", or "12 Oct 2027" when the year is not today's. */
export function fmtDay(ymd: string | null | undefined, today: string): string {
  if (!ymd || ymd.length < 10) return "—";
  const m = Number(ymd.slice(5, 7)) - 1;
  if (!(m >= 0 && m < 12)) return "—";
  const day = Number(ymd.slice(8, 10));
  const base = `${day} ${MONTHS_SHORT[m]}`;
  return ymd.slice(0, 4) === today.slice(0, 4) ? base : `${base} ${ymd.slice(0, 4)}`;
}

/** How far a date is from today, in the words a vendor says. */
export function whenText(daysFromToday: number): string {
  if (daysFromToday === 0) return "aaj";
  if (daysFromToday === 1) return "kal";
  if (daysFromToday > 1) return `${daysFromToday} din baad`;
  return `${-daysFromToday} din pehle`;
}

export interface PayBar {
  show: boolean;
  pct: number;
  zero: boolean;
  caption: string;
}

/**
 * Payment progress from the AMOUNTS, never the paymentStatus flag (the flag
 * disagrees with the money on real rows — see backend utils/bookingMoney.js).
 */
export function payBar(row: Pick<OverviewBookingRow, "total" | "received" | "outstanding">): PayBar {
  if (!(row.total > 0)) return { show: false, pct: 0, zero: true, caption: "" };
  const pct = Math.max(0, Math.min(100, Math.round((row.received / row.total) * 100)));
  if (row.received >= row.total - 1) return { show: true, pct: 100, zero: false, caption: "Poora mila" };
  if (row.received > 0) return { show: true, pct, zero: false, caption: `Rs ${pk(row.received)} aaya` };
  return { show: true, pct: 0, zero: true, caption: "Abhi kuch nahi aaya" };
}

export interface RowVm {
  kind: "Booking" | "Lead";
  href: string;
  ini: string;
  title: string;
  pill: { label: string; tone: StatusTone | string };
  /** "Booking #123" / "Lead #45" — the record's type and number. */
  ref: string;
  /** Event type and venue, when known. */
  what: string;
  /** "12 Oct · 3 din baad" */
  when: string;
  amount: number | null;
  amountCap: { text: string; tone: "due" | "ok" | "" };
  bar: PayBar;
  /** The event is today. */
  isToday: boolean;
}

export function bookingRowVm(row: OverviewBookingRow, today: string): RowVm {
  const what = [cap(row.eventType), row.venueName].filter(Boolean).join(" · ");
  const owes = row.outstanding > 0.5;
  return {
    kind: "Booking",
    href: `/dashboard/bookings/${row.id}`,
    ini: initialsOf(row.customerName),
    title: row.customerName || `Booking #${row.id}`,
    pill: { label: bookingStatusLabel({ status: row.status, vendorApprovedAt: row.vendorApprovedAt }), tone: bookingStatusTone(row.status) },
    ref: `Booking #${row.id}`,
    what,
    when: `${fmtDay(row.bookingDate, today)} · ${whenText(row.daysFromToday)}`,
    amount: row.total > 0 ? row.total : null,
    amountCap: owes
      ? { text: `Rs ${pk(row.outstanding)} baqaya`, tone: "due" }
      : row.total > 0 && row.received >= row.total - 1
        ? { text: "poora mila", tone: "ok" }
        : { text: "", tone: "" },
    bar: payBar(row),
    isToday: row.daysFromToday === 0,
  };
}

export interface LeadRowVm {
  kind: "Lead";
  href: string;
  ini: string;
  title: string;
  pill: { label: string; tone: string };
  ref: string;
  what: string;
  waiting: string;
}

export function leadRowVm(e: OverviewEnquiry, today: string): LeadRowVm {
  const stage = leadStageOf(e.status);
  const shaadi = e.eventDate ? `shaadi ${fmtDay(e.eventDate, today)}` : "";
  return {
    kind: "Lead",
    href: e.id ? `/dashboard/leads/${e.id}` : "/dashboard/leads",
    ini: initialsOf(e.contactName),
    title: e.contactName || "Lead",
    pill: { label: stage.label, tone: stage.tone },
    ref: `Lead #${e.id}`,
    what: [cap(e.eventType), shaadi].filter(Boolean).join(" · "),
    waiting: e.daysWaiting <= 0 ? "aaj aayi" : e.daysWaiting === 1 ? "kal aayi" : `${e.daysWaiting} din se jawab ka intezar`,
  };
}

/** The headline on the unanswered-enquiries strip, or null when there are none. */
export function enquiryBanner(e: Pick<DashboardOverview["enquiries"], "unanswered" | "stale" | "oldestHours">): { headline: string; oldest: string; stale: string } | null {
  if (!(e.unanswered > 0)) return null;
  const oldest =
    e.oldestHours <= 0 ? "" : e.oldestHours >= 48 ? `sab se purani ${Math.floor(e.oldestHours / 24)} din se` : `sab se purani ${Math.max(1, Math.round(e.oldestHours))} ghante se`;
  return {
    headline: `${e.unanswered} puchh-gichh (leads) ka jawab nahi diya`,
    oldest,
    stale: e.stale > 0 ? `Inme se ${e.stale} ek mahine se purani hain — jo ab kaam ki nahi, unhein Leads mein Khoya ya Archive kar dein.` : "",
  };
}

/** True when the "Tawajjo chahiye" card has nothing to say at all. */
export function attentionIsClear(o: Pick<DashboardOverview, "needsClosing" | "deliveredUnpaid" | "enquiries">): boolean {
  return !o.needsClosing.count && !o.deliveredUnpaid.count && !(o.enquiries.unanswered > 0);
}

/** "+3 aur" style tail for a list that shows fewer rows than exist. */
export function moreCount(total: number, shown: number): number {
  return Math.max(0, total - shown);
}

export interface KpiVm {
  label: string;
  /** null = could not be loaded: show a dash, never a zero. */
  value: number | null;
  kind: "count" | "money";
  note: string;
  /** Percent change vs the previous comparable period; null = nothing to compare. */
  delta: number | null;
  /** A text chip used when there is no delta (e.g. "chase"). */
  tag: string;
  /** Mini-bar series, or null when none is honest for this tile. */
  spark: number[] | null;
  href?: string;
}

const lastN = <T>(a: readonly T[], n: number): T[] => (a.length > n ? a.slice(a.length - n) : a.slice());

/** A mini-bar series is only worth drawing if something in it is non-zero. */
const sparkOrNull = (a: number[]): number[] | null => (a.some((v) => v > 0) ? a : null);

/**
 * The four tiles. `baqaya` is the Khata receivables total, passed in rather than
 * recomputed so the tile IS the Khata number; null when that section failed.
 */
export function kpiCards(o: DashboardOverview, baqaya: { total: number; customers: number } | null): KpiVm[] {
  const k = o.kpis;
  return [
    {
      label: "Is mahine bookings",
      kind: "count",
      value: k.bookingsThisMonth.value,
      note: `${monthLong(k.bookingsThisMonth.month)} ke events · cancel ke bina`,
      delta: k.bookingsThisMonth.delta,
      tag: "",
      spark: sparkOrNull(lastN(o.bookingsByMonth.map((m) => m.count), 6)),
    },
    {
      label: "Khata — aya paisa",
      kind: "money",
      value: k.receivedYtd.value,
      note: "1 Jan se aaj tak · Khata ke barabar",
      delta: k.receivedYtd.delta,
      tag: "",
      spark: sparkOrNull(lastN(o.revenue.months.map((m) => m.received), 6)),
    },
    {
      label: "Baqaya — vasool karna",
      kind: "money",
      value: baqaya ? baqaya.total : null,
      note: baqaya ? `${baqaya.customers} customer${baqaya.customers === 1 ? "" : "s"} par · Khata ke barabar` : "Abhi load nahi hua",
      delta: null,
      tag: "chase",
      spark: null,
      href: "/dashboard/receivables",
    },
    {
      label: "Aane wale (7 din)",
      kind: "count",
      value: k.upcomingNext7Days.value,
      note: `aaj se agle 7 din · kul aane wale ${o.upcoming.count}`,
      delta: null,
      tag: "7d",
      spark: sparkOrNull(o.upcomingByMonth.map((m) => m.count)),
      href: "/dashboard/calendar",
    },
  ];
}
