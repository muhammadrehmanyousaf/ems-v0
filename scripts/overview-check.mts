/**
 * Guard — the vendor Overview's chart arithmetic and the words its rows use.
 *
 * ── The defects this pins (docs/PORTAL-ISSUES.md, entries 1 and 2) ────────
 *
 * Revenue chart: month labels printed as "September 2026" under every point
 * and ran into each other; months that had not started were plotted and
 * averaged; "1Y" was February to December (11 months); "Kul is saal" and
 * "Ausat / mahina" shared a divisor that included the future; the line was a
 * spline that rounded off real peaks; the axis ticked at 0 / 17.9 / 35.7 / 54.1.
 *
 * Event cards: an "upcoming" list of past events; the same record on two cards
 * with two meanings; "Awaiting Payment" in English beside Roman Urdu, on rows
 * that did not say whether they were bookings or leads; a right-hand card whose
 * rows stacked and right-aligned because they used a class the shell styles as
 * `text-align:right`.
 *
 * This repo has no unit runner, so like its sibling guards this drives the REAL
 * modules under plain node. The server-side rules (which record is upcoming, how
 * a month is bucketed) are pinned in the backend's
 * tests/unit/vendorOverviewService.test.js and tests/http/vendorOverview.http.test.js;
 * this half pins what the screen does with what it is sent.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/overview-check.mts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  MONTHS_SHORT,
  LABEL_PX,
  monthShort,
  monthLong,
  lastMonths,
  summariseRange,
  periodLabel,
  niceScale,
  formatTick,
  labelIndices,
  layoutChart,
  type MonthPoint,
} from "../lib/utils/overview-chart.ts";
import {
  pk,
  fmtDay,
  whenText,
  payBar,
  bookingRowVm,
  leadRowVm,
  enquiryBanner,
  attentionIsClear,
  kpiCards,
} from "../lib/utils/overview-model.ts";
import { bookingStatusLabel, bookingStatusTone } from "../lib/booking-status-label.ts";
import { leadStageOf } from "../lib/lead-stage.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");

let failures = 0;
const check = (ok: boolean, name: string, detail = "") => {
  console.log("  " + (ok ? "PASS " : "*** FAIL ***") + "  " + name + (detail ? "  — " + detail : ""));
  if (!ok) failures++;
};
const section = (t: string) => console.log("\n" + t);
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const TODAY = "2026-10-09";

/* ── a 12-month series ending October 2026, in the shape the server sends ── */
const KEYS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
const series = (values: number[]): MonthPoint[] => KEYS.map((key, i) => ({ key, value: values[i] ?? 0 }));
// Rupees. Peaks in June and August, like the screenshot.
const SHOT = series([0, 0, 180000, 1250000, 640000, 910000, 560000, 5400000, 2100000, 4900000, 1500000, 358100]);

/* ── 1. ranges ───────────────────────────────────────────────────────────── */
section("1. 3M / 6M / 1Y are exactly that many months ending this month");
for (const n of [3, 6, 12]) {
  const r = lastMonths(SHOT, n);
  check(r.length === n, `${n}M has exactly ${n} months`, `got ${r.length}`);
  check(r[r.length - 1].key === "2026-10", `${n}M ends in the current month`, r[r.length - 1].key);
  check(r.every((p) => p.key <= "2026-10"), `${n}M contains no month after the current one`);
}
check(lastMonths(SHOT, 12)[0].key === "2025-11", "1Y starts in November 2025 (not February)");
check(eq(lastMonths(SHOT, 3).map((p) => p.key), ["2026-08", "2026-09", "2026-10"]), "3M is Aug, Sep, Oct");
check(lastMonths(SHOT, 40).length === 12, "asking for more than exists returns the series, never pads");

/* ── 2. one period, one divisor ──────────────────────────────────────────── */
section("2. 'Kul' and 'Ausat / mahina' share a period and a denominator");
for (const n of [3, 6, 12]) {
  const s = summariseRange(lastMonths(SHOT, n));
  const sum = lastMonths(SHOT, n).reduce((a, p) => a + p.value, 0);
  check(s.total === sum, `${n}M total is the sum of the months shown`);
  check(s.months === n && s.average === sum / n, `${n}M average = total / ${n}`, `avg ${s.average}`);
}
{
  const s = summariseRange(lastMonths(SHOT, 12));
  check(s.total / 11 !== s.average, "the old divisor (11, with two future months) is not what is used");
  check(periodLabel(s) === "Nov 25 – Oct 26", "the period is named", periodLabel(s));
  check(s.best?.key === "2026-06" && s.best.value === 5400000, "best month is the highest in the range", JSON.stringify(s.best));
}
{
  const empty = summariseRange(lastMonths(series([]), 12));
  check(!empty.hasData && empty.average === null && empty.best === null, "no money at all: no average, no best month (no 'Rs 0 average')");
  check(empty.total === 0 && empty.months === 12, "…and the total is a plain zero over 12 months");
}
{
  const s = summariseRange(lastMonths(SHOT, 3));
  check(s.best?.key === "2026-08", "best month respects the selected range (3M → Aug)");
  const tie = summariseRange([{ key: "2026-09", value: 5 }, { key: "2026-10", value: 5 }]);
  check(tie.best?.key === "2026-10", "a tie names the more recent month");
}

/* ── 3. the axis ─────────────────────────────────────────────────────────── */
section("3. Y-axis ticks land on round numbers");
check(eq(niceScale(54.1).ticks, [0, 20, 40, 60]), "54.1 lakh → 0, 20, 40, 60", JSON.stringify(niceScale(54.1).ticks));
check(eq(niceScale(12.4).ticks, [0, 5, 10, 15]), "12.4 lakh → 0, 5, 10, 15", JSON.stringify(niceScale(12.4).ticks));
check(eq(niceScale(3.58).ticks, [0, 1, 2, 3, 4]), "3.58 lakh → 0 … 4", JSON.stringify(niceScale(3.58).ticks));
check(eq(niceScale(0.45).ticks.map((t) => formatTick(t, niceScale(0.45).step)), ["0.0", "0.2", "0.4", "0.6"]), "under a lakh keeps one decimal", JSON.stringify(niceScale(0.45).ticks));
check(eq(niceScale(0).ticks, [0, 1]), "an empty chart still has a sane axis");
{
  let ok = true, why = "";
  for (let i = 0; i < 4000; i++) {
    const max = Math.pow(10, Math.random() * 5 - 2) * (0.1 + Math.random());
    const s = niceScale(max);
    const mant = s.step / Math.pow(10, Math.floor(Math.log10(s.step)));
    const roundStep = [1, 2, 5].some((m) => Math.abs(mant - m) < 1e-6);
    const onGrid = s.ticks.every((t, k) => Math.abs(t - k * s.step) < 1e-6);
    if (!(s.ticks[0] === 0 && s.max >= max - 1e-9 && s.ticks.length >= 2 && s.ticks.length <= 6 && roundStep && onGrid)) {
      ok = false; why = `max ${max} → ${JSON.stringify(s)}`; break;
    }
  }
  check(ok, "4,000 random maxima: starts at 0, covers the data, ≤ 6 ticks, step is 1/2/5 × 10ⁿ", why);
}

/* ── 4. labels never overlap ─────────────────────────────────────────────── */
section("4. Month labels never overlap, at any width, and the current month is always named");
{
  let ok = true, why = "";
  for (let width = 280; width <= 1000; width += 7) {
    for (const n of [3, 6, 12]) {
      const L = layoutChart(lastMonths(SHOT, n), width);
      const at = L.labelAt;
      if (at[at.length - 1] !== n - 1) { ok = false; why = `w${width} n${n}: current month unlabeled`; break; }
      for (let k = 1; k < at.length; k++) {
        const gap = L.xs[at[k]] - L.xs[at[k - 1]];
        if (gap < LABEL_PX + 8) { ok = false; why = `w${width} n${n}: labels ${at[k - 1]},${at[k]} only ${gap.toFixed(1)}px apart`; break; }
      }
      const lastRight = L.xs[n - 1] + LABEL_PX / 2;
      if (lastRight > L.width) { ok = false; why = `w${width} n${n}: last label runs off the right edge`; break; }
      const firstLeft = L.xs[at[0]] - LABEL_PX / 2;
      if (firstLeft < 0) { ok = false; why = `w${width} n${n}: first label runs off the left edge`; break; }
    }
    if (!ok) break;
  }
  check(ok, `widths 280–1000 px × 3M/6M/1Y: ≥ ${LABEL_PX + 8} px between labels, none clipped, last month named`, why);
  // The measured chart widths in the real console: 611 px card at a 1,280 window, 772 px at 1,536.
  const w1280 = layoutChart(lastMonths(SHOT, 12), 611 - 28);
  check(w1280.labelAt.length === 12, "1,280 px window: all twelve months of 1Y are named, 11+ px apart", `${w1280.labelAt.length} labels`);
  const w1536 = layoutChart(lastMonths(SHOT, 12), 772 - 28);
  check(w1536.labelAt.length === 12, "1,536 px window: all twelve months of 1Y are named", `${w1536.labelAt.length} labels`);
  const w1100 = layoutChart(lastMonths(SHOT, 12), 480);
  check(w1100.labelAt.length >= 6 && w1100.labelAt.length < 12, "a narrower card thins instead of overlapping", `${w1100.labelAt.length} labels`);
  const phone = layoutChart(lastMonths(SHOT, 12), 320);
  check(phone.labelAt.length < 12 && phone.labelAt.includes(11), "on a phone it thins instead of overlapping", `${phone.labelAt.length} labels`);
  check(monthShort("2026-10") === "Oct 26" && monthShort("2025-12") === "Dec 25", "labels are short: 'Oct 26'");
  check(monthLong("2026-09") === "September 2026", "the tooltip name is the long one");
  check(MONTHS_SHORT.every((m) => m.length === 3), "short month names are always three letters (never 'Sept')");
}

/* ── 5. geometry ─────────────────────────────────────────────────────────── */
section("5. The line is straight, honest, and inside the plot");
{
  const L = layoutChart(lastMonths(SHOT, 12), 700);
  check(L.hasData, "a series with money has data");
  check(/^M [\d. -]+( L [\d. -]+)+$/.test(L.linePath), "the path is straight segments only: M then L, no curve commands", L.linePath.slice(0, 60));
  check(L.linePath.split("L").length - 1 === 11, "twelve points = one M and eleven L");
  check(L.xs.every((x, i) => i === 0 || x > L.xs[i - 1]), "points run left to right in order");
  check(L.ys.every((y) => y >= L.padT - 1e-6 && y <= L.baseY + 1e-6), "every point is inside the plot area");
  check(Math.abs(L.ys[0] - L.baseY) < 1e-6, "a month with no money sits ON the zero line", `y ${L.ys[0]} vs base ${L.baseY}`);
  check(L.scale.max * 100000 >= Math.max(...SHOT.map((p) => p.value)), "the axis reaches above the highest month");
  const peakJune = L.ys[7], neighbours = [L.ys[6], L.ys[8]];
  check(peakJune < Math.min(...neighbours), "June's peak is a real peak: higher than both neighbours on screen");
  const none = layoutChart(lastMonths(series([]), 12), 700);
  check(!none.hasData, "no money: hasData is false so the screen shows its empty message instead of a flat line");
  const one = layoutChart([{ key: "2026-10", value: 100000 }], 400);
  check(one.xs.length === 1 && Number.isFinite(one.xs[0]), "a single point does not divide by zero");
  check(!JSON.stringify(layoutChart(lastMonths(SHOT, 3), 500)).includes("NaN"), "no NaN in a 3M layout");
}

/* ── 6. wording of rows ──────────────────────────────────────────────────── */
section("6. A booking reads the same wherever it appears");
const row = (over: Record<string, unknown> = {}) => ({
  id: 311, customerName: "Rizwan Anjum", eventType: "walima", bookingDate: "2026-10-12", bookingTime: "18:00",
  status: "Awaiting Payment", vendorApprovedAt: null, venueName: "Rehman Grand Marquee",
  total: 2596400, received: 0, outstanding: 2596400, daysFromToday: 3, ...over,
});
{
  const undecided = bookingRowVm(row() as never, TODAY);
  const approved = bookingRowVm(row({ vendorApprovedAt: "2026-10-02T05:00:00.000Z" }) as never, TODAY);
  const confirmed = bookingRowVm(row({ status: "Confirmed" }) as never, TODAY);
  check(undecided.pill.label === "Pending approval", "an undecided request says 'Pending approval', as the Bookings list does", undecided.pill.label);
  check(approved.pill.label === "Awaiting payment", "an accepted, unpaid booking says 'Awaiting payment'", approved.pill.label);
  check(confirmed.pill.label === "Confirmed", "Confirmed stays Confirmed");
  check(undecided.pill.label === bookingStatusLabel({ status: "Awaiting Payment", vendorApprovedAt: null }), "label is the Bookings list's own function");
  check(undecided.pill.tone === bookingStatusTone("Awaiting Payment"), "colour is the Bookings list's own function");
  check(![undecided, approved, confirmed].some((r) => r.pill.label === "Awaiting Payment"), "the stored value 'Awaiting Payment' is never printed");
  check(undecided.ref === "Booking #311" && undecided.kind === "Booking", "the row says it is a Booking, with its number");
  check(undecided.when === "12 Oct · 3 din baad", "one date format, with distance from today", undecided.when);
  check(undecided.what === "Walima · Rehman Grand Marquee", "event type and venue", undecided.what);
  check(undecided.href === "/dashboard/bookings/311", "opens the booking");
  check(undecided.amountCap.text === "Rs 25,96,400 baqaya" && undecided.amountCap.tone === "due", "outstanding is stated in rupees with Pakistani grouping", undecided.amountCap.text);
  const paid = bookingRowVm(row({ received: 2596400, outstanding: 0 }) as never, TODAY);
  check(paid.amountCap.text === "poora mila" && paid.bar.pct === 100, "fully paid reads 'poora mila'");
  const part = bookingRowVm(row({ received: 500000, outstanding: 2096400 }) as never, TODAY);
  check(part.bar.pct === 19 && part.bar.caption === "Rs 5,00,000 aaya", "part-paid shows the true percentage and amount", `${part.bar.pct}% ${part.bar.caption}`);
  check(bookingRowVm(row({ daysFromToday: 0 }) as never, TODAY).isToday, "today's event is flagged");
  const past = bookingRowVm(row({ bookingDate: "2026-10-05", daysFromToday: -4 }) as never, TODAY);
  check(past.when === "5 Oct · 4 din pehle", "a past event says how long ago", past.when);
  check(payBar({ total: 0, received: 0, outstanding: 0 }).show === false, "no amount, no bar");
  check(fmtDay("2027-01-03", TODAY) === "3 Jan 2027", "a different year is spelled out");
  check(whenText(0) === "aaj" && whenText(1) === "kal" && whenText(-1) === "1 din pehle" && whenText(21) === "21 din baad", "relative days");
  check(pk(2419131) === "24,19,131" && pk(999) === "999", "Pakistani digit grouping");
}

section("7. A lead reads the same on the Overview as on the Leads screen");
{
  const l = leadRowVm({ id: 45, contactName: "Ayesha Khan", eventType: "nikah", eventDate: "2026-12-20", status: "new", createdAt: "2026-10-01T00:00:00Z", daysWaiting: 8 }, TODAY);
  check(l.pill.label === "Naya" && l.pill.label === leadStageOf("new").label, "stage text comes from the Leads screen's table: 'Naya', not 'New'", l.pill.label);
  check(l.kind === "Lead" && l.ref === "Lead #45", "the row says it is a Lead, with its number");
  check(l.what === "Nikah · shaadi 20 Dec", "event and date", l.what);
  check(l.waiting === "8 din se jawab ka intezar", "how long it has waited", l.waiting);
  check(l.href === "/dashboard/leads/45", "opens the lead");
  check(leadStageOf("quoted").label === "Quote bheja" && leadStageOf(undefined).label === "Naya", "stage table, with the Leads screen's fallback");
}

section("8. The unanswered-enquiries strip");
{
  check(enquiryBanner({ unanswered: 0, stale: 0, oldestHours: 0 }) === null, "none unanswered: no strip");
  const b = enquiryBanner({ unanswered: 61, stale: 48, oldestHours: 127 * 24 });
  check(!!b && b.headline === "61 puchh-gichh (leads) ka jawab nahi diya", "the strip names them leads", b?.headline);
  check(b?.oldest === "sab se purani 127 din se", "oldest, in days", b?.oldest);
  check(!!b?.stale && b.stale.includes("48"), "the stale ones are counted and a way out is suggested", b?.stale);
  check(enquiryBanner({ unanswered: 2, stale: 0, oldestHours: 5 })?.oldest === "sab se purani 5 ghante se", "recent: in hours");
  check(enquiryBanner({ unanswered: 2, stale: 0, oldestHours: 5 })?.stale === "", "no stale note when none are stale");
}

/* ── 9. the KPI tiles are the lists' own numbers ─────────────────────────── */
section("9. KPI tiles");
const overview = {
  today: TODAY, hasBusiness: true, truncated: false, scope: null, rules: { openStatuses: [], timezone: "Asia/Karachi" },
  counts: { total: 9, upcoming: 4, needsClosing: 2, closed: 2, cancelled: 1 },
  kpis: {
    bookingsThisMonth: { value: 5, previous: 4, delta: 25, month: "2026-10" },
    receivedYtd: { value: 1200000, refunded: 0, previous: 0, delta: null, since: "2026-01-01" },
    upcomingNext7Days: { value: 2, until: "2026-10-15" },
  },
  revenue: { basis: "receipt_date" as const, months: KEYS.map((key, i) => ({ key, received: i * 1000, refunded: 0 })) },
  bookingsByMonth: KEYS.map((key, i) => ({ key, count: i })),
  upcomingByMonth: ["2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"].map((key, i) => ({ key, count: i })),
  upcoming: { count: 4, next7Days: 2, items: [] },
  needsClosing: { count: 2, items: [] },
  deliveredUnpaid: { count: 0, total: 0, items: [] },
  enquiries: { unanswered: 0, stale: 0, oldestHours: 0, items: [] },
};
{
  const k = kpiCards(overview as never, { total: 1230000, customers: 3 });
  check(k.length === 4, "four tiles");
  check(k[3].value === overview.kpis.upcomingNext7Days.value && k[3].note.includes(String(overview.upcoming.count)), "'Aane wale (7 din)' is the server's 7-day count and names the full count too", k[3].note);
  check(k[0].value === 5 && k[0].delta === 25 && k[0].note.includes("October 2026"), "bookings tile names its month (no more 'is mahine' over 'is saal')", k[0].note);
  check(k[1].value === 1200000 && k[1].delta === null, "money tile: no fake percentage when last year had nothing");
  check(k[2].value === 1230000 && k[2].note.startsWith("3 customers"), "Baqaya is the Khata total");
  check(kpiCards(overview as never, null)[2].value === null, "Baqaya that failed to load is a dash (null), not Rs 0");
  check(k[0].spark?.length === 6 && k[1].spark?.length === 6 && k[3].spark?.length === 6, "sparklines show six months");
  check(k[2].spark === null, "the Baqaya tile draws no mini-bars rather than invent some");
  const flat = kpiCards({
    ...overview,
    bookingsByMonth: KEYS.map((key) => ({ key, count: 0 })),
    revenue: { basis: "receipt_date" as const, months: KEYS.map((key) => ({ key, received: 0, refunded: 0 })) },
    upcomingByMonth: overview.upcomingByMonth.map((m) => ({ ...m, count: 0 })),
  } as never, { total: 0, customers: 0 });
  check(flat[0].spark === null && flat[1].spark === null && flat[3].spark === null, "a vendor with nothing yet gets no mini-bars (an all-zero series is not a trend)");
  check(flat[2].value === 0 && flat[2].note.startsWith("0 customers"), "…and a real zero Baqaya is a zero, not a dash");
  check(attentionIsClear({ needsClosing: { count: 0, items: [] }, deliveredUnpaid: { count: 0, total: 0, items: [] }, enquiries: { unanswered: 0, stale: 0, oldestHours: 0, items: [] } }), "nothing to flag: the card says all clear");
  check(!attentionIsClear(overview as never), "something to close: it does not");
}

/* ── 10. the screen's own source ─────────────────────────────────────────── */
section("10. The screen is wired to the shared pieces");
{
  const src = readFileSync(path.join(ROOT, "components/dashboard/mainScreens/dashboard/artifact/overview-artifact.tsx"), "utf8");
  check(!/class="r"\s+data-nav/.test(src), "no row uses the bare class 'r' (the shell styles it text-align:right — the stacked-card bug)");
  check(!/getActionSummary|BusinessHealthAPI|LeadAPI\.list/.test(src), "does not assemble itself from the flag-gated / unscoped side endpoints");
  check(/bookingRowVm/.test(src) && /leadRowVm/.test(src), "both cards draw rows through the shared row model");
  check(!/\.toLocaleDateString\("en-PK",\s*\{\s*day:\s*"numeric",\s*month:\s*"short"\s*\}\)/.test(src), "dates are not formatted ad hoc per card");
  check(/getOverviewBundle/.test(src), "reads the single overview request");
  check(/errorBannerHtml/.test(src) && /loadwrap/.test(src), "has the console's error and loading states");
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll overview checks passed");
process.exit(failures ? 1 : 0);
