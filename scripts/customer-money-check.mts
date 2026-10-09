/**
 * Guard: the customer's money screens use ONE rule.
 *
 * The defect this pins (docs/PORTAL-ISSUES.md entry 8): a customer's booking page showed "Now due Rs. 2,100" over a
 * button reading "Pay Rs. 0". The money columns arrive from the API as strings ("0.00"), a non-empty string is truthy,
 * so `booking.downPayment || booking.totalAmount` printed "0.00". `downPayment` also changed meaning (it now holds money
 * RECEIVED), yet three customer pages still computed amounts from it three different ways.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/customer-money-check.mts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { bookingMoney, outstandingOn, receivedOn } from "../lib/utils/booking-money.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };

// ── the arithmetic, with the string amounts the API really sends ──
const unpaid = { totalAmount: "2100.00", downPayment: "0.00", status: "Awaiting Payment" };
check("unpaid: nothing received", receivedOn(unpaid) === 0);
check("unpaid: all of it outstanding", outstandingOn(unpaid) === 2100);
check("unpaid: status Pending", bookingMoney(unpaid).status === "Pending");
const part = { totalAmount: "2100.00", downPayment: "1500.00", status: "Confirmed" };
check("part paid: 1500 received", receivedOn(part) === 1500);
check("part paid: 600 outstanding", outstandingOn(part) === 600);
check("part paid: status Partial (from the amounts, not a flag)", bookingMoney(part).status === "Partial");
const paid = { totalAmount: "2100.00", downPayment: "2100.00", status: "Confirmed" };
check("paid: 0 outstanding and Paid", outstandingOn(paid) === 0 && bookingMoney(paid).status === "Paid");
check("cancelled owes nothing", outstandingOn({ totalAmount: "2100.00", downPayment: "0.00", status: "Cancelled" }) === 0);
check("null/undefined amounts are zero, not NaN", bookingMoney({ totalAmount: null, downPayment: undefined }).outstanding === 0);
check("the truthiness trap this guard exists for", ("0.00" as unknown as number || 2100) !== 2100, "if this fails the language changed");

// ── source scan: no truthiness fallback on money in the customer screens ──
const FORBIDDEN: Array<[RegExp, string]> = [
  [/downPayment\s*\|\|/, "`downPayment ||` (a \"0.00\" string is truthy)"],
  [/\.amount\s*\|\|\s*0\)?\s*-/, "arithmetic on `amount ||`"],
  [/Number\(\s*[\w.?]*downPayment\s*\|\|\s*0\s*\)/, "`Number(x.downPayment || 0)` instead of bookingMoney()"],
];
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    const st = statSync(p);
    if (st.isDirectory()) { if (n === "node_modules" || n === ".next") continue; walk(p, out); }
    else if (/\.(tsx?|ts)$/.test(n)) out.push(p);
  }
  return out;
}
const scanDirs = [path.join(ROOT, "app", "(main)", "user"), path.join(ROOT, "components", "bookings")];
for (const d of scanDirs) {
  for (const f of walk(d)) {
    const text = readFileSync(f, "utf8");
    for (const [re, why] of FORBIDDEN) check(`${path.relative(ROOT, f)}: no ${why}`, !re.test(text));
  }
}
const detail = readFileSync(path.join(ROOT, "app", "(main)", "user", "bookings", "[id]", "page.tsx"), "utf8");
check("detail page uses bookingMoney", /bookingMoney\(/.test(detail));
check("detail page asks the server what is due", /PaymentInstructionsAPI\.get\(/.test(detail));
check("detail page never builds the Pay label from downPayment", !/Pay \$\{fmt\(booking\.downPayment/.test(detail));

if (failures.length) { console.error(`FAILED ${failures.length} of ${passed + failures.length}:`); failures.forEach((f) => console.error("  - " + f)); process.exit(1); }
console.log(`customer-money guard: ${passed} checks passed`);
