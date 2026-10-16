/**
 * Guard — a booking's time is its STANDARD SLOT, worded one way, and never the
 * clock part of a date (owner bug 6, WP23).
 *
 * ── The defect this pins ──────────────────────────────────────────────────
 *
 * The vendor bookings list printed `new Date(b.bookingDate).toLocaleTimeString()`
 * under every date. `bookingDate` is a DATE, so that is UTC midnight = "5:00 am"
 * in Pakistan, on every row, whatever slot the booking was sold against. Around
 * it the product named the same booking a dozen ways: raw "18:00", "Evening",
 * "6:00 PM", nothing.
 *
 * What this guard holds:
 *   1. the slot rule (lib/booking/slot-vocabulary.ts) answers the shared case
 *      table (lib/booking/slot-label-cases.json, byte-identical to the backend's
 *      tests/unit/fixtures/slotLabelCases.json, which pins src/utils/slotLabel.js);
 *   2. `bookingDate` never changes the answer, and the answer and the day text
 *      (lib/utils/ymd.ts) are identical when the process zone is UTC,
 *      Asia/Karachi, America/Los_Angeles and Pacific/Auckland (child processes);
 *   3. no web file that handles `bookingDate` formats a time of day (the
 *      "5:00 am" can only come back through one of those calls);
 *   4. no web file turns a date-only booking day into a Date and prints it in
 *      the browser zone (the "15 Oct for a 16 Oct wedding" family).
 *
 * This repo has no unit runner, so like its sibling guards this drives the REAL
 * modules under plain node:
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/slot-label-check.mts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { describeSlot, slotText, slotTextFor, slotFromBooking, bookingSlotText } from "../lib/booking/slot-vocabulary.ts";
import { fmtYmd, ymdOf, pickedDayOf, dateOnlyOf } from "../lib/utils/ymd.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const cases = JSON.parse(readFileSync(path.join(ROOT, "lib/booking/slot-label-cases.json"), "utf8")) as {
  cases: { name: string; row: Record<string, unknown>; full: string; label: string; hint: string; kind: string; source: string }[];
  audience: { full: string; vendor: string; customer: string }[];
};

const DATES: unknown[] = [undefined, "2026-10-16", "2026-10-16T00:00:00.000Z", "2026-10-15T19:00:00.000Z"];

// ── probe mode: print everything that must not depend on the zone ───────────
if (process.argv.includes("--probe")) {
  const out: string[] = [];
  for (const c of cases.cases) {
    for (const bd of DATES) out.push(JSON.stringify([c.name, describeSlot(slotFromBooking({ ...c.row, bookingDate: bd }))]));
  }
  for (const v of ["2026-10-16", "2026-10-16T00:00:00.000Z", "2026-01-01", "2026-12-31", "2026-03-29", "2026-02-30", "", null, "16 Oct"]) {
    out.push(JSON.stringify(["ymd", v, ymdOf(v), fmtYmd(v), fmtYmd(v, "long"), fmtYmd(v, "weekday"), fmtYmd(v, "dayMonth"), fmtYmd(v, "numeric")]));
  }
  // the booking flow: a picker Date at local midnight + the slot hour, stored as toISOString(), sent as the PICKED day
  const evening = new Date(2026, 9, 16); evening.setHours(19, 0, 0, 0);
  const midnight = new Date(2026, 9, 16);
  out.push(["pick", pickedDayOf(evening), pickedDayOf(evening.toISOString()), pickedDayOf(midnight.toISOString()), pickedDayOf("2026-10-16"), pickedDayOf(null) ?? "", dateOnlyOf("2026-10-16T00:00:00.000Z"), dateOnlyOf("2026-10-15T19:00:00.000Z") ?? ""].join("|"));
  process.stdout.write(out.join("\n"));
  process.exit(0);
}

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  results.push(`${ok ? "  ok  " : "FAIL  "}${name}${!ok && detail ? `\n        ${detail}` : ""}`);
}

// ── 1. the shared case table ─────────────────────────────────────────────────
for (const c of cases.cases) {
  const d = describeSlot(slotFromBooking(c.row));
  const got = { full: d.full, label: d.label, hint: d.hint, kind: d.kind, source: d.source };
  const want = { full: c.full, label: c.label, hint: c.hint, kind: c.kind, source: c.source };
  check(`case: ${c.name}`, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
}
for (const a of cases.audience) {
  const row = a.full ? { bookingTime: "18:00" } : { bookingTime: "" };
  check(`audience: "${a.full || "(nothing chosen)"}"`, slotTextFor(slotFromBooking(row), "vendor") === a.vendor && slotTextFor(slotFromBooking(row), "customer") === a.customer);
}
check("bookingSlotText reads a Booking row (snapshot) and an API row (slotLabel)", bookingSlotText({ bookingTime: "19:00", slotTemplateSnapshotJson: { label: "Dinner event", startTime: "19:00", endTime: "23:00" } }) === "Dinner event · 7 PM to 11 PM"
  && bookingSlotText({ bookingTime: "19:00", slotLabel: "Dinner event", slotStartTime: "19:00", slotEndTime: "23:00" }) === "Dinner event · 7 PM to 11 PM");
check("the vendor sees a clear fallback, never a made-up time", bookingSlotText({ bookingTime: "00:00", bookingDate: "2026-10-16" }, "vendor") === "Slot nahi chuna" && bookingSlotText({ bookingTime: "00:00" }, "customer") === "");

// ── 2. bookingDate never decides the time; zone independence ─────────────────
{
  let bad = 0;
  for (const c of cases.cases) {
    const base = slotText(slotFromBooking({ ...c.row, bookingDate: undefined }));
    for (const bd of DATES) if (slotText(slotFromBooking({ ...c.row, bookingDate: bd })) !== base) bad += 1;
  }
  check("bookingDate (date-only, UTC midnight, Karachi 05:00) never changes the slot text", bad === 0, `${bad} differ`);
}
{
  const run = (tz: string) => {
    const r = spawnSync(process.execPath, [...process.execArgv, fileURLToPath(import.meta.url), "--probe"], { env: { ...process.env, TZ: tz }, encoding: "utf8" });
    return r.status === 0 ? r.stdout : `FAILED ${tz}: ${r.stderr}`;
  };
  const base = run("UTC");
  check("the picked day is sent as YYYY-MM-DD in every zone (an evening slot used to become the next day for a customer abroad)", base.includes("pick|2026-10-16|2026-10-16|2026-10-16|2026-10-16||2026-10-16|"), base.split("\n").filter((l) => l.startsWith("pick")).join(""));
  check("probe runs", base.length > 200 && !base.startsWith("FAILED"), base.slice(0, 200));
  for (const tz of ["Asia/Karachi", "America/Los_Angeles", "Pacific/Auckland", "Pacific/Kiritimati"]) {
    check(`slot text and day text are identical under TZ=${tz}`, run(tz) === base);
  }
  check("fmtYmd prints the day it was given, not a neighbour", fmtYmd("2026-10-16") === "16 Oct 2026" && fmtYmd("2026-10-16T00:00:00.000Z") === "16 Oct 2026" && fmtYmd("2026-01-01", "dayMonth") === "1 Jan");
  check("fmtYmd refuses an impossible day and falls back", fmtYmd("2026-02-30") === "—" && fmtYmd("", "short", "n/a") === "n/a" && fmtYmd("soon", "short", null) === "soon");
}

// ── 3 + 4. source guards over the web app ────────────────────────────────────
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "cypress", "e2e", "scripts", "public", "docs", "content"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name) && !/\.d\.ts$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).split(path.sep).join("/");
const files = ["app", "components", "lib", "hooks"].flatMap((d) => walk(path.join(ROOT, d))).filter((f) => !/lib\/content\//.test(rel(f)) && !/lib\/blog\//.test(rel(f)));
const src = new Map(files.map((f) => [rel(f), readFileSync(f, "utf8")]));

/** A time of day being PRINTED (not a date). */
const TIME_FORMAT = /toLocaleTimeString|\bhour12\b|\bhour:\s*["'`](?:numeric|2-digit)["'`]|\btimeStyle\b|\.getHours\s*\(|\bformat\([^)]*["'`][^"'`]*\b[hH]{1,2}:mm/;
/** Files that handle a booking's event date AND format a time of day. Each needs a reason it is a real timestamp. */
const TIME_ON_DATE_ALLOW: Record<string, string> = {
  "components/dashboard/mainScreens/leads/lead-detail-view.tsx": "fmtWhen formats the lead's createdAt / follow-up timestamps; the linked booking prints its date only",
  "components/booking/steps-v2/date-time-step.tsx": "toLocaleTimeString of holdFailedUntil, the instant a slot hold expires (a real timestamp, not the booking day)",
  "components/booking/steps/date-selection-step.tsx": "toLocaleTimeString of holdFailedUntil, the instant a slot hold expires (a real timestamp, not the booking day)",
};
{
  const offenders: string[] = [];
  for (const [f, t] of src) {
    if (!/\bbookingDate\b/.test(t)) continue;
    if (!TIME_FORMAT.test(t)) continue;
    if (TIME_ON_DATE_ALLOW[f]) continue;
    offenders.push(f);
  }
  check("no web file that handles bookingDate formats a time of day", offenders.length === 0, offenders.join(", "));
  const stale = Object.keys(TIME_ON_DATE_ALLOW).filter((f) => !src.has(f) || !TIME_FORMAT.test(src.get(f)!));
  check("the allow-list has no stale entries", stale.length === 0, stale.join(", "));
}
{
  // `new Date(<a booking day>)` printed through toLocale*/toDateString in the browser zone.
  const DAY_FIELD = /new Date\(\s*[^()]*\b(bookingDate|holdDate)\b[^()]*\)\s*\.\s*(toLocaleDateString|toLocaleString|toDateString|getDate|getMonth|getFullYear|getDay)\b/;
  const offenders: string[] = [];
  for (const [f, t] of src) {
    t.split("\n").forEach((line, i) => { if (DAY_FIELD.test(line)) offenders.push(`${f}:${i + 1}`); });
  }
  check("no web file prints a booking day through new Date(...) in the browser zone (use fmtYmd)", offenders.length === 0, offenders.slice(0, 40).join("\n        "));
}

{
  // The booking flow must SEND the picked day, never the UTC instant of "that day at the slot hour".
  const bf = src.get("components/booking/booking-form.tsx") || "";
  check("the booking flow sends the picked day (pickedDayOf), not toISOString()", /bookingDate:\s*pickedDayOf\(currentForm\.bookingDate\)/.test(bf) && !/bookingDate:\s*currentForm\.bookingDate,/.test(bf) && !/currentForm\.bookingDate\.toISOString\(\)/.test(bf));
}

console.log(results.join("\n"));
console.log(failures ? `\n${failures} check(s) FAILED` : `\nall ${results.length} checks passed`);
process.exit(failures ? 1 : 0);
