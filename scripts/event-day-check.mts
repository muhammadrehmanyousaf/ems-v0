/**
 * Guard - an event TODAY is not over; "past" compares Pakistan calendar DAYS (WP24, follow-up of
 * owner bugs 5 and 6).
 *
 * The defect: a booking's date is a day ("2026-10-16"). `new Date("2026-10-16")` is UTC midnight =
 * 05:00 PKT, so any `new Date(bookingDate) < now` / `d.getTime() >= Date.now()` read the event as
 * already over from 05:00 PKT on the event day itself. Comparing with the browser's own midnight is
 * right in Lahore and wrong for a viewer in Los Angeles or Auckland. The backend half is pinned in
 * tests/unit/eventDayWp24.test.js and tests/http/eventDayWp24.http.test.js.
 *
 * What this holds:
 *   1. lib/utils/event-day.ts answers the table below at the boundary instants (23:59:59 PKT =
 *      18:59:59Z still today, 00:00:00 PKT = 19:00:00Z next day), IDENTICALLY when the process zone
 *      is UTC, Asia/Karachi, America/Los_Angeles, Pacific/Auckland and Pacific/Kiritimati
 *      (child processes);
 *   2. the screens that DECIDE on the event day use that rule (no private instant compare):
 *      customer postpone gate, customer reschedule minimum, the lead's "guzar gayi", the booking
 *      flow's and the venue pages' date pickers, the vendor/hold/function-sheet default day;
 *   3. no web file compares `new Date(<bookingDate|eventDate|...>)` with the clock (heuristic scan
 *      of app, components, lib, hooks; the allow-list below carries a reason per entry).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/event-day-check.mts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { isEventDayPast, isEventDayUpcoming, daysUntilEventDay, pktTodayCell } from "../lib/utils/event-day.ts";
import { canMarkCompleted } from "../lib/utils/booking-completion.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const ZONES = ["UTC", "Asia/Karachi", "America/Los_Angeles", "Pacific/Auckland", "Pacific/Kiritimati"];
const EVENT = "2026-10-16";
// [label, instant, past?, days until the event day, PKT day of the picker's "today" cell]
const TABLE: Array<[string, string, boolean, number, string]> = [
  ["15 Oct 23:59:59 PKT", "2026-10-15T18:59:59Z", false, 1, "2026-10-15"],
  ["16 Oct 00:00:00 PKT", "2026-10-15T19:00:00Z", false, 0, "2026-10-16"],
  ["16 Oct 04:59:59 PKT", "2026-10-15T23:59:59Z", false, 0, "2026-10-16"],
  ["16 Oct 05:00:00 PKT (= midnight UTC, the old cut-over)", "2026-10-16T00:00:00Z", false, 0, "2026-10-16"],
  ["16 Oct 10:00 PKT", "2026-10-16T05:00:00Z", false, 0, "2026-10-16"],
  ["16 Oct 23:59 PKT", "2026-10-16T18:59:00Z", false, 0, "2026-10-16"],
  ["16 Oct 23:59:59 PKT", "2026-10-16T18:59:59Z", false, 0, "2026-10-16"],
  ["17 Oct 00:00:00 PKT", "2026-10-16T19:00:00Z", true, -1, "2026-10-17"],
  ["17 Oct 05:00 PKT", "2026-10-17T00:00:00Z", true, -1, "2026-10-17"],
];

const cellDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function probe(): string {
  const rows: string[] = [];
  for (const [, iso] of TABLE) {
    const now = new Date(iso);
    rows.push([
      isEventDayPast(EVENT, now),
      isEventDayPast(`${EVENT}T00:00:00.000Z`, now),
      isEventDayUpcoming(EVENT, now),
      daysUntilEventDay(EVENT, now),
      cellDay(pktTodayCell(now)),
      canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, now),
    ].join("|"));
  }
  return rows.join("\n");
}

if (process.argv.includes("--probe")) {
  console.log(probe());
  process.exit(0);
}

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  results.push(`${ok ? "  ok  " : "FAIL  "}${name}${!ok && detail ? `\n        ${detail}` : ""}`);
}

// ── 1. the rule, at the boundaries, in every zone ───────────────────────────
const expected = TABLE.map(([, , past, days, cell], i) => [past, past, !past, days, cell, TABLE[i][1] >= "2026-10-15T19:00:00Z"].join("|")).join("\n");
for (const tz of ZONES) {
  const r = spawnSync(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "--probe"], { env: { ...process.env, TZ: tz }, encoding: "utf8" });
  const out = (r.stdout || "").trim();
  check(`the event-day table holds under TZ=${tz}`, out === expected, `${r.stderr || ""}\n        got:\n${out}\n        want:\n${expected}`);
}
check("a missing / unreadable day is neither past nor upcoming", !isEventDayPast(null) && !isEventDayUpcoming("soon") && daysUntilEventDay(undefined) === null);
check("the vendor 'Mark completed' gate and 'past' agree: markable from the event day, 'past' only after it",
  canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, new Date("2026-10-16T05:00:00Z")) && !isEventDayPast(EVENT, new Date("2026-10-16T05:00:00Z")));

// ── 2. the deciding screens use the rule ────────────────────────────────────
const postpone = read("components/bookings/postpone-booking-dialog.tsx");
check("customer postpone gate: event day today or later (the server refuses only days before today)",
  /isEventDayUpcoming\(eventDate\)/.test(postpone) && !/Date\.now\(\)\s*-\s*24/.test(postpone));
const resched = read("components/bookings/reschedule-booking-dialog.tsx");
check("customer reschedule minimum is today in Pakistan, not the UTC day", /const todayStr = todayInKarachi\(\)/.test(resched) && !/toDateInput\(new Date\(\)\.toISOString\(\)\)/.test(resched));
const lead = read("components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx");
check("lead event date: 'guzar gayi' only after the day, today reads 'aaj'", /daysUntilEventDay\(/.test(lead) && /"aaj"/.test(lead) && !/Date\.now\(\)\) \/ 86400000/.test(lead));
const leadsOld = read("components/dashboard/mainScreens/leads/redesigned/leads-redesigned-view.tsx");
check("leads (unrouted view) uses the same 'past' rule", /isEventDayPast\(/.test(leadsOld) && !/today\.setHours\(0, 0, 0, 0\)/.test(leadsOld));
const flow = read("components/booking/steps-v2/date-time-step.tsx");
check("booking flow picker: 'today' is today in Pakistan", /const today = pktTodayCell\(\)/.test(flow) && !/const today = startOfDay\(new Date\(\)\)/.test(flow));
const vd = read("components/VendorDetails/VendorDetails.tsx");
check("venue page picker (desktop): past = before today in Pakistan", /const today = pktTodayCell\(\)/.test(vd) && !/startOfToday\(\)/.test(vd.replace(/import[^\n]*startOfToday[^\n]*/g, "")));
const vdm = read("components/VendorDetails/VendorDetailsMobile.tsx");
check("venue page picker (mobile): past = before today in Pakistan", (vdm.match(/pktTodayCell\(\)/g) || []).length >= 2 && !/const today = new Date\(\);\s*today\.setHours\(0, 0, 0, 0\)/.test(vdm));
const bf = read("components/dashboard/mainScreens/artifact/booking-form.ts");
check("'Nayi booking' default day is today in Pakistan, not the UTC day", /: todayInKarachi\(\)/.test(bf) && !/new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(bf));
const holds = read("components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx");
check("hold date default is today in Pakistan", /const todayIso = \(\) => todayInKarachi\(\)/.test(holds));
const fsh = read("components/dashboard/mainScreens/function-sheets/artifact/function-sheets-artifact.tsx");
check("new function sheet default event day is today in Pakistan", /d\.value = todayInKarachi\(\)/.test(fsh));

// ── 3. nobody compares a booking/event day with the clock ───────────────────
// Heuristic: `new Date(<...bookingDate|eventDate|weddingDate|holdDate>` followed within 7 lines by the
// clock (Date.now(), new Date(), setHours(0, startOf*) AND a < / > comparison. Allow-list = reason.
const ALLOW: Record<string, string> = {
  "components/dashboard/mainScreens/bookings/redesigned/bookings-redesigned-view.tsx": "unrouted (nothing imports it); compares a month, not a day",
};
const files: string[] = [];
(function walk(d: string) {
  for (const n of readdirSync(d)) {
    if (n === "node_modules" || n === ".next" || n === ".git") continue;
    const p = path.join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(n)) files.push(p);
  }
})(ROOT);
const START = /new Date\(\s*[\w$.?\[\]"']*?(bookingDate|eventDate|weddingDate|holdDate|bDate)\b/;
const offenders: string[] = [];
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join("/");
  if (!/^(app|components|lib|hooks)\//.test(rel) || ALLOW[rel] || rel === "lib/utils/event-day.ts") continue;
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((l, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(l) || !START.test(l)) return;
    const win = lines.slice(i, i + 7).join("\n");
    const clock = /(Date\.now\(\)|new Date\(\)|setHours\(0|startOfToday|startOfDay)/.test(win);
    const cmp = /[<>]=?/.test(win.replace(/=>/g, "").replace(/<\/?[a-zA-Z]/g, ""));
    if (clock && cmp) offenders.push(`${rel}:${i + 1}: ${l.trim().slice(0, 120)}`);
  });
}
check("no file compares new Date(bookingDate | eventDate | weddingDate | holdDate) with the clock", offenders.length === 0, offenders.join("\n        "));

console.log(results.join("\n"));
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`} (${results.length} checks)`);
process.exit(failures === 0 ? 0 : 1);
