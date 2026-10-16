/**
 * Guard - "Ho gaya": a booking whose function is over reads Completed, the vendor can close it
 * from the event day, and an unpaid completed booking still owes its balance (WP22, owner bug #5).
 *
 * The owner's screenshot: Bookings, 16 Oct, the function is today, the booking is Confirmed,
 * 100% paid, and "Ho gaya 0". The server half (the nightly sweeper completes a Confirmed,
 * non-cancelled booking the PKT day AFTER its event day whatever the payment state; the manual
 * PATCH door) is pinned in the backend: tests/integration/bookingCompletionWp22.integration.test.js
 * and tests/http/bookingCompleteDoorWp22.http.test.js. This half pins what the screens do:
 *   1. one rule says when the vendor may close a booking (from the event day, Pakistan day);
 *   2. one rule says which list tab a status counts under, and "Ho gaya" counts Completed;
 *   3. the list's row menu and the booking page use those rules (no private copy of them);
 *   4. completed does not mean paid: the unpaid one keeps its balance (Baqaya due).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/booking-completion-check.mts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { canMarkCompleted, completionHold, completionHoldNote, statusBucket } from "../lib/utils/booking-completion.ts";
import { outstandingOn, receivedOn } from "../lib/utils/booking-money.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  results.push(`${ok ? "  ok  " : "FAIL  "}${name}${!ok && detail ? `\n        ${detail}` : ""}`);
}

// ── 1. when the vendor may close a booking ──────────────────────────────────
const EVENT = "2026-10-16";
const T = (iso: string) => new Date(iso);
// 15 Oct 23:59:59 PKT = 18:59:59Z; 16 Oct 00:00:00 PKT = 19:00:00Z
check("the day before the event (23:59:59 PKT): not yet", !canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, T("2026-10-15T18:59:59Z")));
check("from the event day's first second (00:00 PKT): yes", canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, T("2026-10-15T19:00:00Z")));
check("on the event day, late evening (22:00 PKT): yes", canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, T("2026-10-16T17:00:00Z")));
check("the day after: yes", canMarkCompleted({ status: "Confirmed", bookingDate: EVENT }, T("2026-10-17T05:00:00Z")));
check("a date-time string is read by its day", canMarkCompleted({ status: "Confirmed", bookingDate: "2026-10-16T00:00:00.000Z" }, T("2026-10-16T05:00:00Z")));
check("Awaiting Payment can be closed too (the vendor already accepted)", canMarkCompleted({ status: "Awaiting Payment", bookingDate: EVENT }, T("2026-10-17T05:00:00Z")));
for (const st of ["Pending", "Completed", "Cancelled", "", undefined as unknown as string]) {
  check(`status ${JSON.stringify(st)} is never offered`, !canMarkCompleted({ status: st, bookingDate: EVENT }, T("2026-10-17T05:00:00Z")));
}
check("no event date: not offered", !canMarkCompleted({ status: "Confirmed", bookingDate: null }, T("2026-10-17T05:00:00Z")));
check("garbage date: not offered", !canMarkCompleted({ status: "Confirmed", bookingDate: "soon" }, T("2026-10-17T05:00:00Z")));
check("nothing: not offered", !canMarkCompleted(null) && !canMarkCompleted(undefined));

// ── 2. the list tabs, on the screenshot's case ───────────────────────────────
const paid = { id: 777, status: "Confirmed", bookingDate: EVENT, totalAmount: 150000, downPayment: 150000, bookingDetails: [] };
const unpaid = { id: 778, status: "Confirmed", bookingDate: EVENT, totalAmount: 150000, downPayment: 0, bookingDetails: [] };
const counts = (rows: { status: string }[]) => {
  const c = { all: rows.length, confirmed: 0, pending: 0, done: 0 };
  rows.forEach((b) => { c[statusBucket(b.status)] += 1; });
  return c;
};
const before = counts([paid, unpaid]);
check("before: both are Confirmed, Ho gaya is 0 (the screenshot)", before.confirmed === 2 && before.done === 0, JSON.stringify(before));
const after = counts([{ ...paid, status: "Completed" }, { ...unpaid, status: "Completed" }]);
check("after: both are Ho gaya, Confirmed is 0", after.done === 2 && after.confirmed === 0, JSON.stringify(after));
check("tab buckets: Completed and Cancelled are done; Confirmed confirmed; Awaiting Payment / Pending pending",
  statusBucket("Completed") === "done" && statusBucket("Cancelled") === "done" && statusBucket("Confirmed") === "confirmed" &&
  statusBucket("Awaiting Payment") === "pending" && statusBucket("Pending") === "pending" && statusBucket(undefined) === "pending");

// ── 4. completed is not paid ─────────────────────────────────────────────────
const unpaidDone = { ...unpaid, status: "Completed" };
const paidDone = { ...paid, status: "Completed" };
check("an unpaid COMPLETED booking still owes its whole balance (Baqaya due)", outstandingOn(unpaidDone) === 150000, String(outstandingOn(unpaidDone)));
check("a paid completed booking owes nothing and shows what was received", outstandingOn(paidDone) === 0 && receivedOn(paidDone) === 150000);

// ── 3. the screens use the shared rules ──────────────────────────────────────
const list = read("components/dashboard/mainScreens/bookings/artifact/bookings-artifact.tsx");
const detail = read("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx");
check("the list takes its tab buckets from the shared rule (no private copy)", /import \{[^}]*statusBucket[^}]*\} from "@\/lib\/utils\/booking-completion"/.test(list) && !/function bucket\(/.test(list));
check("the list's row menu offers Mark completed from canMarkCompleted, through the one transition door",
  /canMarkCompleted\(b\)/.test(list) && /data-pop-done/.test(list) && /BookingsAPI\.markCompleted/.test(list));
check("the list confirms first (completion is forward-only) and refreshes every money screen after", /openConfirm\(s, \{\s*title: "Event ho gaya\?"/.test(list) && /invalidateMoney\(\{ bookingId/.test(list));
check("the booking page uses the same rule (no browser-local date compare)", /canMarkCompleted\(/.test(detail) && !/setHours\(0, 0, 0, 0\) < new Date\(\)\.setHours/.test(detail));

// ── 5. WP26 / V4-8: a booking the sweeper holds says why ─────────────────────
// mirrors bookingCompletionService.holdReason: an open dispute, or a refund request RAISED / APPROVED, holds a CONFIRMED
// booking whose event day is over (the PKT day before today)
const NOW = T("2026-10-17T05:00:00Z"); // 17 Oct 10:00 PKT
const OVER = { status: "Confirmed", bookingDate: "2026-10-16" };
check("hold: an open refund request (RAISED) is named", completionHold(OVER, { refundRequests: [{ state: "RAISED" }] }, NOW) === "refund_open");
check("hold: an APPROVED refund request is named too", completionHold(OVER, { refundRequests: [{ state: "APPROVED" }] }, NOW) === "refund_open");
for (const st of ["APPLIED", "PAID_BY_VENDOR", "DISPUTED", "ACKNOWLEDGED", "REJECTED", "WITHDRAWN"]) {
  check(`hold: a ${st} refund request does not hold the sweeper, so no hint`, completionHold(OVER, { refundRequests: [{ state: st }] }, NOW) === null);
}
check("hold: an open dispute is named", completionHold(OVER, { dispute: { status: "open" } }, NOW) === "dispute_open");
check("hold: a resolved dispute is not", completionHold(OVER, { dispute: { status: "resolved_refund" } }, NOW) === null);
check("hold: both are named together", completionHold(OVER, { refundRequests: [{ state: "RAISED" }], dispute: { status: "open" } }, NOW) === "both");
check("hold: nothing open, no hint", completionHold(OVER, { refundRequests: [], dispute: null }, NOW) === null && completionHold(OVER, {}, NOW) === null);
check("hold: the event day itself is not 'passed' (the sweeper waits for the day after)", completionHold({ status: "Confirmed", bookingDate: "2026-10-17" }, { dispute: { status: "open" } }, NOW) === null);
check("hold: a future event has no hint", completionHold({ status: "Confirmed", bookingDate: "2026-10-18" }, { dispute: { status: "open" } }, NOW) === null);
check("hold: the day rolls on the Pakistan clock (00:30 PKT on the 17th is already after the 16th)", completionHold(OVER, { dispute: { status: "open" } }, T("2026-10-16T19:30:00Z")) === "dispute_open");
check("hold: only Confirmed bookings are swept, so only they get the hint", ["Completed", "Cancelled", "Pending", "Awaiting Payment"].every((st) => completionHold({ status: st, bookingDate: "2026-10-16" }, { dispute: { status: "open" } }, NOW) === null));
check("hold: the sentence names the reason in the product's Roman Urdu and what to do",
  completionHoldNote("refund_open") === "Event guzar gaya hai; refund request khuli hai, usay band karein tab booking Ho gaya hogi." &&
  /dispute khuli hai/.test(completionHoldNote("dispute_open")) && /refund request aur dispute khuli hain, unhe band karein/.test(completionHoldNote("both")));
check("the booking page renders the hint from the shared rule and loads the dispute only for a held candidate",
  /completionHold\(booking, \{ refundRequests: refundReqs, dispute \}\)/.test(detail) && /data-completion-hold/.test(detail) && /enabled: valid && holdCandidate/.test(detail));
check("the sweeper itself is untouched by this screen change (the hint reads, never completes)", !/autoCompleteDue|completeOne/.test(detail));

console.log(results.join("\n"));
console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`} (${results.length} checks)`);
process.exit(failures === 0 ? 0 : 1);
