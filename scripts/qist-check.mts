/**
 * Guard: the qist schedule speaks ONE vocabulary and never trusts a money string's truthiness.
 *
 * The defects this pins (docs/PORTAL-ISSUES.md entry 9): "Baqaya" meant the outstanding total, the second
 * instalment and a history step; "Baaqi lena" was a fourth spelling; the schedule swapped in a different number
 * ("receipts se") when its rows lagged the receipts; and a money string such as "0.00" is truthy.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/qist-check.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { dayText, dayTextCustomer, groupPk, moneyOf, qistHeading, qistStateCustomer, qistStateVendor, rsText, rsTextCustomer } from "../lib/utils/qist.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };

// ── money is parsed once; a string is never judged by truthiness ──
check('"0.00" is zero', moneyOf("0.00") === 0);
check('"2100.00" is 2100', moneyOf("2100.00") === 2100);
check("null / undefined / junk are zero, never NaN", [null, undefined, "", "abc", NaN].every((v) => moneyOf(v) === 0));
check("Pakistani grouping", groupPk(1845000) === "18,45,000" && groupPk("2100.00") === "2,100" && groupPk(0) === "0");
check("one Rs format (vendor)", rsText("1500.00") === "Rs 1,500");
check("customer page's own Rs format", rsTextCustomer("1500.00").startsWith("Rs. 1"));

// ── one date format, no timezone shift ──
check("vendor date: 9 Oct 2026", dayText("2026-10-09") === "9 Oct 2026");
check("customer date: Oct 9, 2026", dayTextCustomer("2026-10-09") === "Oct 9, 2026");
check("an instant is not turned into the previous day", dayText("2026-10-01") === "1 Oct 2026");
check("a missing date is a dash", dayText(null) === "—" && dayText("junk") === "—");

// ── every state, with its exact wording and remainder ──
const q = (state: string, extra: Record<string, unknown> = {}) => ({ state, daysOverdue: 0, daysUntilDue: 5, dueDate: "2026-10-12", remaining: 600, amountPaid: 1500, ...extra }) as never;
const o = qistStateVendor(q("overdue", { daysOverdue: 4, dueDate: "2026-10-05" }));
check("vendor: overdue says N din late, red, with the remainder and the date", o.tone === "bad" && o.label === "4 din late" && o.detail.includes("Rs 600 lena hai") && o.detail.includes("5 Oct 2026"));
check("vendor: due today", qistStateVendor(q("due_today")).label === "Aaj due");
check("vendor: part paid", qistStateVendor(q("part_paid")).label === "Kuch mila");
check("vendor: paid / waived / upcoming", qistStateVendor(q("paid")).label === "Mil gaya" && qistStateVendor(q("waived")).label === "Maaf" && qistStateVendor(q("upcoming")).label === "Aane wali");
check("vendor: a qist's remainder is 'lena hai', never 'baqaya'", !/baqaya|baaqi lena/i.test(qistStateVendor(q("upcoming")).detail + qistStateVendor(q("overdue", { daysOverdue: 2 })).detail));
const c = qistStateCustomer(q("overdue", { daysOverdue: 1, dueDate: "2026-10-05" }));
check("customer: Overdue by 1 day (singular)", c.label === "Overdue by 1 day");
check("customer: Overdue by 4 days", qistStateCustomer(q("overdue", { daysOverdue: 4 })).label === "Overdue by 4 days");
check("customer: part paid / due today / paid / waived", ["Part paid", "Due today", "Paid", "Waived"].every((l, i) => qistStateCustomer(q(["part_paid", "due_today", "paid", "waived"][i])).label === l));
check("heading: 'Qist 2 · Aakhri qist'", qistHeading({ order: 2, title: "Aakhri qist", label: "remaining" }) === "Qist 2 · Aakhri qist");
check("heading: a custom 'Qist 3' is not doubled", qistHeading({ order: 3, title: "Qist 3", label: "Qist 3" }) === "Qist 3");

// ── source scan ──
const card = readFileSync(path.join(ROOT, "components", "dashboard", "mainScreens", "bookings", "artifact", "qist-payments.ts"), "utf8");
const detail = readFileSync(path.join(ROOT, "components", "dashboard", "mainScreens", "bookings", "artifact", "booking-detail-artifact.tsx"), "utf8");
const custCard = readFileSync(path.join(ROOT, "components", "bookings", "installments-card.tsx"), "utf8");
const strip = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

for (const [name, text] of [["qist-payments.ts", strip(card)], ["booking-detail-artifact.tsx", strip(detail)]] as const) {
  check(`${name}: no 'Baaqi lena' (the fourth spelling)`, !/Baaqi lena/i.test(text));
  check(`${name}: no 'receipts se' (the swapped-in number)`, !/receipts se/i.test(text));
}
// Baqaya is the OUTSTANDING TOTAL only: it may head one summary cell, and nothing else on the qist rows.
const rowFn = strip(card).slice(strip(card).indexOf("function qistRowHtml"), strip(card).indexOf("function paymentRowHtml"));
check("qist rows never say Baqaya", !/Baqaya/i.test(rowFn));
check("the card says Baqaya exactly once, for the outstanding total", (strip(card).match(/Baqaya/g) || []).length === 1);
// no truthiness on money
const FORBIDDEN: Array<[RegExp, string]> = [
  [/\b(?:amount|amountPaid|remaining|outstanding|received|total)\s*\|\|/, "money `||` fallback"],
  [/!!\s*(?:q|m|view|money)\.(?:amount|amountPaid|remaining|outstanding|received|total)\b/, "money used as a flag"],
];
for (const [name, text] of [["qist-payments.ts", strip(card)], ["installments-card.tsx", strip(custCard)]] as const) {
  for (const [re, why] of FORBIDDEN) check(`${name}: no ${why}`, !re.test(text));
}
check("the detail screen reads ONE request for money + qists", /BookingAPI\.getSchedule\(/.test(detail) && !/getInstallments\(/.test(detail));
check("the old second card is gone", !/Qist schedule<\/h2>/.test(detail) && !/function installmentsCard/.test(detail));
check("the customer card has no arithmetic of its own", !/reduce\(/.test(strip(custCard)));

if (failures.length) {
  console.error(`qist-check: ${failures.length} failure(s)\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`qist-check: ${passed} checks passed`);
