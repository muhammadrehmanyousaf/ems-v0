/**
 * Guard: the web half of the portal audit's money leftovers (WP37, package P6).
 *
 *   - CUSTOMER-006: the Review step's advance is the SERVER's rule (default advance included): `effectiveAdvance`
 *     mirrors ems-v0-backend pricingService.computeDownPayment; the same table is pinned in the backend test
 *     (tests/unit/advanceMirrorWp37.test.js), so neither side can move alone.
 *   - BOOKINGS-001: the typed "Tay raqam" is always `negotiatedAmount` (the server's `agreedAmount` is only a rescue
 *     for a venue with no price); the booked total is read back from the response.
 *   - MONEY-026: a payments-history row (bookingDetails as an OBJECT) must not throw in the money util.
 *   - CUSTOMER-007: `awaiting_approval` means nothing is due today.
 *   - MONEY-014 / BOOKINGS-043: money forms default to the Pakistan day, never the UTC day.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/wp37-money-check.mts
 */
import { effectiveAdvance } from "../lib/booking/advance.ts";
import { agreedPriceField, bookedTotalFromSaved } from "../components/dashboard/mainScreens/artifact/booking-form-payload.ts";
import { bookingMoney, bookedOn, receivedOn } from "../lib/utils/booking-money.ts";
import { paymentNotDueYet } from "../lib/payment-status.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const eq = (name: string, got: unknown, want: unknown) => check(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ── CUSTOMER-006: the advance table (identical to the backend's advanceMirrorWp37.test.js) ──
const ADVANCE_CASES: Array<[string, { downPaymentType?: string | null; downPayment?: number | string | null }, number, number]> = [
  ["percentage 25 of 100000", { downPaymentType: "Percentage", downPayment: 25 }, 100000, 25000],
  ["percent (lower) 10 of 150000", { downPaymentType: "percent", downPayment: "10" }, 150000, 15000],
  ["Fixed Amount 50000", { downPaymentType: "Fixed Amount", downPayment: 50000 }, 400000, 50000],
  ["Fixed Amount 0 = no advance", { downPaymentType: "Fixed Amount", downPayment: 0 }, 400000, 0],
  ["Percentage 0 = no advance", { downPaymentType: "Percentage", downPayment: 0 }, 400000, 0],
  ["never configured (null, null) = the platform default 10%", { downPaymentType: null, downPayment: null }, 700000, 70000],
  ["null type, 0 value = unconfigured = 10%", { downPaymentType: null, downPayment: 0 }, 700000, 70000],
  ["null type with a positive value is a flat amount", { downPaymentType: null, downPayment: 20 }, 480000, 0], // 20 < Rs 150: collected at the venue
  ["null type with 20000 is a flat Rs 20000", { downPaymentType: null, downPayment: 20000 }, 480000, 20000],
  ["a flat advance is never more than the total", { downPaymentType: "Fixed Amount", downPayment: 900000 }, 100000, 100000],
  ["an advance below Rs 150 is collected at the venue", { downPaymentType: "Percentage", downPayment: 1 }, 5000, 0],
  ["no total, no advance", { downPaymentType: null, downPayment: null }, 0, 0],
];
for (const [name, venue, total, want] of ADVANCE_CASES) eq(`advance: ${name}`, effectiveAdvance(venue, total), want);
eq("advance: no venue", effectiveAdvance(null, 100000), 0 + Math.round(100000 * 0.1));

// ── BOOKINGS-001 ──
eq("agreed: a typed figure is negotiatedAmount", JSON.stringify(agreedPriceField(700000)), JSON.stringify({ negotiatedAmount: 700000 }));
eq("agreed: nothing typed sends nothing", JSON.stringify(agreedPriceField(0)), "{}");
eq("agreed: NaN sends nothing", JSON.stringify(agreedPriceField(Number.NaN)), "{}");
eq("booked total from data.booking", bookedTotalFromSaved({ data: { booking: { totalAmount: "100000.00" } } }), 100000);
eq("booked total from booking", bookedTotalFromSaved({ booking: { totalAmount: 5 } }), 5);
eq("booked total unknown", bookedTotalFromSaved({ data: {} }), null);
const bf = src("components/dashboard/mainScreens/artifact/booking-form.ts");
check("booking-form never sends vendor.agreedAmount any more", !/vendor\.agreedAmount\s*=/.test(bf));
check("booking-form reads the booked total back", /bookedTotalFromSaved\(res\)/.test(bf));

// ── MONEY-026 ──
let threw = false;
let m: ReturnType<typeof bookingMoney> | null = null;
try { m = bookingMoney({ status: "Confirmed", paymentStatus: "Paid", totalAmount: 90000, downPayment: 90000, bookingDetails: { customerName: "x", businesses: [] } as never } as never); } catch { threw = true; }
check("a history row with bookingDetails as an object does not throw", !threw);
eq("...and is worth its header total", m ? m.booked : -1, 90000);
eq("bookedOn: lines win over a NULL header", bookedOn({ totalAmount: null, bookingDetails: [{ totalAmount: 750000 }] } as never), 750000);
eq("receivedOn with an object bookingDetails", receivedOn({ downPayment: 5, bookingDetails: {} as never } as never), 5);

// ── CUSTOMER-007 ──
const awaiting = paymentNotDueYet({ paymentType: "down_payment", amountDue: 10000, dueNow: 0, basis: "awaiting_approval", amountReceived: 0, nextInstallment: { dueDate: "2026-12-01" } });
check("awaiting_approval is 'not due yet'", !!awaiting && awaiting.amount === 10000);
check("a real advance due today is still due", paymentNotDueYet({ paymentType: "down_payment", amountDue: 10000, dueNow: 10000, basis: "advance", amountReceived: 0 }) === null);

// ── MONEY-014 / BOOKINGS-043 ──
for (const rel of [
  "components/dashboard/mainScreens/artifact/record-payment.ts",
  "components/dashboard/mainScreens/artifact/phantom-advance.ts",
  "components/dashboard/mainScreens/receipts/artifact/receipts-artifact.tsx",
  "components/dashboard/mainScreens/pdcs/artifact/pdcs-artifact.tsx",
  "components/dashboard/mainScreens/expenses/artifact/expenses-artifact.tsx",
  "components/dashboard/mainScreens/field/artifact/field-artifact.tsx",
  "components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx",
]) {
  const text = src(rel);
  check(`${rel}: no UTC-day default`, !/new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/.test(text));
}
check("holds: the date cannot be in the past", /id="h-date"[^>]*min="\$\{todayIso\(\)\}"/.test(src("components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx")));

// ── LOGIC-029 / FLAGGED-040 ──
check("the damage-claim button is hidden until the customer screen exists", /const DAMAGE_CLAIM_BUTTON = false/.test(src("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx")));
check("the Khata tile says the refund is recorded, not that it was handed over", /Wapsi \(record ho gayi\)/.test(src("components/dashboard/mainScreens/money/artifact/khata-artifact.tsx")));

if (failures.length) {
  console.error(`wp37-money-check: ${failures.length} failed, ${passed} passed`);
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}
console.log(`wp37-money-check: ${passed} passed`);
