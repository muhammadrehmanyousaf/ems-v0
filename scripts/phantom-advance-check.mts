/**
 * Guard - "phantom advance": a booking that says Rs X was received while no receipt backs it (WP31).
 *
 * The server (WP02) refuses money writes on such a booking with 409 ADVANCE_UNLEDGERED until the vendor
 * settles it with ONE of two explicit taps, and WP31 added both doors:
 *   POST /bookings/:id/adopt-advance   "Haan, ye mila tha"        one receipt of exactly the gap
 *   POST /bookings/:id/void-advance    "Yeh advance mila hi nahi" the received figure comes down to the receipts
 * The server half is pinned in the backend (tests/http/phantomAdvanceWp31.http.test.js,
 * tests/integration/phantomReadersAgreeWp31.integration.test.js). This half pins what the screens do:
 *   1. the 409 is recognised from the one shape the server sends, and nothing else is mistaken for it;
 *   2. the wording is the one wording (notice, button labels) everywhere;
 *   3. EVERY live screen that can meet the 409 (record-payment drawer = Khata / Payments / Receivables / Today /
 *      Bookings / chat / qist rows, Receipts, Cheques, the booking page's Payments card and its cancel drawer)
 *      offers the two taps instead of a bare toast;
 *   4. the amount is never typed on the client (the server's figure is sent back as `expectedUnledgered`),
 *      ZERO needs a reason and a confirmation, both carry an Idempotency-Key.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/phantom-advance-check.mts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { unledgered409, phantomNoticeText, PHANTOM_STALE_CODES, ADOPT_BUTTON, ZERO_BUTTON } from "../lib/utils/phantom-advance.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  results.push(`${ok ? "  ok  " : "FAIL  "}${name}${!ok && detail ? `\n        ${detail}` : ""}`);
}
const err409 = (data: Record<string, unknown>, status = 409) => ({ response: { status, data: { message: "m", data } } });

// ── 1. the 409 is read from the one shape the server sends ────────────────────
const real = unledgered409(err409({ code: "ADVANCE_UNLEDGERED", bookingId: 12, unledgered: 50000, received: 50000, ledger: 0 }));
check("ADVANCE_UNLEDGERED is recognised with its figures", !!real && real.bookingId === 12 && real.unledgered === 50000 && real.received === 50000 && real.ledger === 0);
check("another 409 (OUTSTANDING_CHANGED, DUPLICATE_REFERENCE) is not mistaken for it", unledgered409(err409({ code: "OUTSTANDING_CHANGED", unledgered: 5 })) === null && unledgered409(err409({ code: "DUPLICATE_REFERENCE" })) === null);
check("the same code on a 400 / 500 is not it", unledgered409(err409({ code: "ADVANCE_UNLEDGERED", unledgered: 5 }, 400)) === null && unledgered409(err409({ code: "ADVANCE_UNLEDGERED", unledgered: 5 }, 500)) === null);
check("a zero / missing gap is not a phantom", unledgered409(err409({ code: "ADVANCE_UNLEDGERED", unledgered: 0 })) === null && unledgered409(err409({ code: "ADVANCE_UNLEDGERED" })) === null);
check("no response / garbage never throws", unledgered409(null) === null && unledgered409(undefined) === null && unledgered409(new Error("x")) === null && unledgered409({ response: {} }) === null);
check("a string amount from the API is read as a number", unledgered409(err409({ code: "ADVANCE_UNLEDGERED", unledgered: "30000.00" }))?.unledgered === 30000);
check("the two 'situation changed' codes match the server's", [...PHANTOM_STALE_CODES].sort().join() === "NO_UNLEDGERED_ADVANCE,UNLEDGERED_CHANGED");

// ── 2. one wording ────────────────────────────────────────────────────────────
check("the notice says what is wrong and offers Adopt / Zero", phantomNoticeText(50000) === "Is booking par Rs 50,000 ka advance ledger mein darj nahi hai: Adopt ya Zero karein.");
check("a cancelled booking is offered Zero only (no receipt can be written on it)", /Zero karein/.test(phantomNoticeText(50000, true)) && !/Adopt ya Zero/.test(phantomNoticeText(50000, true)));
check("the two buttons carry the owner's words", ADOPT_BUTTON === "Adopt: haan, mila tha" && ZERO_BUTTON === "Yeh advance mila hi nahi");

// ── 3. every live screen that can meet the 409 offers the two taps ────────────
const shared = src("components/dashboard/mainScreens/artifact/phantom-advance.ts");
check("the shared drawer module exports both taps and the panel", ["export function openAdoptDrawer", "export function openZeroDrawer", "export function phantomPanelHtml", "export function prependPhantomPanel", "export function openPhantomDrawer"].every((s) => shared.includes(s)));

const rp = src("components/dashboard/mainScreens/artifact/record-payment.ts");
check("record-payment drawer (the one every screen opens): 409 shows the panel, and a settled phantom reopens a fresh drawer", rp.includes("unledgered409(err)") && rp.includes("phantomPanelHtml(") && rp.includes("wirePhantomButtons(") && rp.includes('id="rp-phantom"'));
const rc = src("components/dashboard/mainScreens/receipts/artifact/receipts-artifact.tsx");
check("Receipts: a refused save shows the panel inside the form; a refused delete opens the panel drawer", rc.includes("prependPhantomPanel(") && rc.includes("openPhantomDrawer(") && rc.includes("unledgered409(err)"));
const pdc = src("components/dashboard/mainScreens/pdcs/artifact/pdcs-artifact.tsx");
check("Cheques: a refused clear opens the panel drawer", pdc.includes("openPhantomDrawer(") && pdc.includes("unledgered409(err)"));
const q = src("components/dashboard/mainScreens/bookings/artifact/qist-payments.ts");
check("booking page Payments card: the notice carries both buttons, Adopt hidden on a cancelled booking", q.includes("data-q-phantom") && q.includes("data-q-adopt") && q.includes("data-q-zero") && q.includes("phantomNoticeText(m.unledgered, cancelled)") && /cancelled \? "" : `<button class="btn btn-ghost" data-q-adopt/.test(q));
check("booking page: Adopt opens the adopt drawer (not the record drawer with a typed amount)", q.includes("openAdoptDrawer(s, p)") && q.includes("openZeroDrawer(s, p)") && !/data-q-adopt[\s\S]{0,300}openRecordPaymentDrawer/.test(q));
const bd = src("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx");
check("booking page cancel drawer: says so and offers the two taps before the vendor cancels", bd.includes("cancelBookingHtml(Number(cx.dataset.bkCancel), gap)") && bd.includes("wirePhantomButtons(s, body"));

// any LIVE screen (the shadow-shell artifacts) that writes a receipt / clears a cheque must handle the 409
const files: string[] = [];
const walk = (dir: string) => {
  for (const e of readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${e}`;
    if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
    else if (/\/artifact\/.+\.(ts|tsx)$/.test(rel)) files.push(rel);
  }
};
walk("components/dashboard/mainScreens");
const writers = files.filter((f) => /ReceiptsAPI\.(create|update|remove)\(|PdcAPI\.transition\(|BookingsAPI\.recordPayment\(/.test(src(f)));
const unhandled = writers.filter((f) => !src(f).includes("unledgered409"));
check("every live artifact screen that writes a receipt or clears a cheque handles the 409", writers.length >= 3 && unhandled.length === 0, `unhandled: ${unhandled.join(", ")} (writers: ${writers.length})`);

// ── 4. the amount is the server's; zero asks why; both are idempotent ─────────
const api = src("lib/api/bookings.ts");
check("API: adopt and void post to the two doors with an Idempotency-Key", api.includes("/adopt-advance`") && api.includes("/void-advance`") && (api.match(/idempotencyConfig\(opts\?\.idempotencyKey\)/g) || []).length >= 2);
const adoptType = api.slice(api.indexOf("export interface AdoptAdvanceInput"), api.indexOf("export interface VoidAdvanceInput"));
check("API: the adopt body has NO amount field (the server derives it)", !/\bamount\??:/.test(adoptType) && adoptType.includes("expectedUnledgered: number"));
check("zero: a reason of at least 3 characters, and a confirmation dialog, before anything is sent", shared.includes("Array.from(reason).length < 3") && /openConfirm\(shadow, \{[\s\S]{0,400}danger: true/.test(shared));
check("both taps mint one SubmitKey per drawer open and read the booking back after a lost answer", (shared.match(/new SubmitKey\(\)/g) || []).length >= 2 && shared.includes("isAmbiguousFailure(err)") && shared.includes("BookingAPI.getSchedule"));
check("a settlement that finds the booking changed refreshes instead of settling another figure", shared.includes("PHANTOM_STALE_CODES") && shared.includes("ctx.onStale"));

console.log(results.join("\n"));
if (failures) {
  console.error(`\nphantom-advance guard: ${failures} check(s) FAILED`);
  process.exit(1);
}
console.log(`\nphantom-advance guard: all ${results.length} checks passed`);
