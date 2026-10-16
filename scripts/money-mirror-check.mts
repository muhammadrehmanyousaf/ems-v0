/**
 * Guard: the web half of the payments hardening that landed after WP14a (WP14b).
 *
 * Pins the client rules that mirror a server contract, driving the REAL modules:
 *   - parseUrduAmount never guesses (PAY-CLOCK-018): "1,5 lakh" and "1.500" are unreadable, Urdu digits read;
 *   - the CSV cell guard neutralises = + - @ tab CR (PAY-REPORTS-024);
 *   - the customer's Payments list takes its figure from the server's `paymentView` (PAY-UI_CUSTOMER-002);
 *   - 409 IN_PROGRESS / RETRY mean "re-send the SAME key", never "new intent" (WP00a);
 *   - CLAIM_REQUIRED shows the server's hint (WP09);
 *   - the web money mirror reads cancelled from the STATUS only (WP06 Q7).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/money-mirror-check.mts
 */
import { parseUrduAmount } from "../lib/urdu-amount.ts";
import { neutraliseFormula, escapeCsv } from "../lib/utils/csv-escape.ts";
import { customerPaymentFromView, paymentNotDueYet, customerDepositLine } from "../lib/payment-status.ts";
import { isAmbiguousFailure, isRetrySameKey, refusalCode } from "../lib/utils/idempotency.ts";
import { claimRequiredMessage } from "../lib/utils/api-error.ts";
import { isCancelledBooking, outstandingOn } from "../lib/utils/booking-money.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const eq = (name: string, got: unknown, want: unknown) => check(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ── parseUrduAmount: PAY-CLOCK-018 ──
eq("plain", parseUrduAmount("50000"), 50000);
eq("lakh grouping", parseUrduAmount("1,50,000"), 150000);
eq("western grouping", parseUrduAmount("1,500,000"), 1500000);
eq("space grouping", parseUrduAmount("50 000"), 50000);
eq("hazaar", parseUrduAmount("50 hazaar"), 50000);
eq("2.5 lakh", parseUrduAmount("2.5 lakh"), 250000);
eq("compound", parseUrduAmount("2 lakh 50 hazaar"), 250000);
eq("compound with a bare tail", parseUrduAmount("2 lakh 50000"), 250000);
eq("rs prefix", parseUrduAmount("Rs. 25,000"), 25000);
eq("'1,5 lakh' is unreadable (was 500015)", parseUrduAmount("1,5 lakh"), null);
eq("'1.500' is unreadable (was 2)", parseUrduAmount("1.500"), null);
eq("Arabic-Indic digits read (was null -> Rs 0)", parseUrduAmount("١٢٠٠"), 1200);
eq("Persian digits read", parseUrduAmount("۱۲۰۰"), 1200);
eq("Urdu digits + unit", parseUrduAmount("٢ لاکھ"), 200000);
eq("an unknown unit is not dropped silently", parseUrduAmount("2 lakh 50 foo"), null);
eq("a stray number is not summed", parseUrduAmount("50000 2 lakh"), null);
eq("garbage", parseUrduAmount("abc"), null);
eq("empty", parseUrduAmount(""), null);
eq("negative number", parseUrduAmount(-5), null);

// ── CSV formula guard: PAY-REPORTS-024 ──
for (const lead of ["=", "+", "-", "@", "\t", "\r"]) {
  check(`csv cell starting ${JSON.stringify(lead)} is prefixed`, neutraliseFormula(`${lead}cmd|' /C calc'!A0`).startsWith("'"));
}
eq("a plain cell is untouched", neutraliseFormula("Ali Khan"), "Ali Khan");
eq("a negative number is untouched", neutraliseFormula("-1500"), "-1500");
check("escapeCsv quotes the neutralised cell", escapeCsv("=HYPERLINK(\"x\")").startsWith("\"'="));

// ── customer Payments list reads the server's paymentView: PAY-UI_CUSTOMER-002 ──
const view = (o: Record<string, unknown>) => ({ amountDue: 0, outstanding: 0, received: 0, total: 0, ...o });
const due = customerPaymentFromView({ status: "Awaiting Payment", paymentView: view({ amountDue: 30000, outstanding: 100000, total: 100000, paymentType: "down_payment" }) });
check("advance due: Pay now of the server's amountDue", due?.type === "awaiting_down" && due.amount === 30000 && due.label === "Pay now");
const rem = customerPaymentFromView({ status: "Confirmed", paymentView: view({ amountDue: 70000, outstanding: 70000, received: 30000, total: 100000, paymentType: "remaining" }) });
check("part paid: Pay remaining", rem?.type === "remaining" && rem.amount === 70000);
const paid = customerPaymentFromView({ status: "Confirmed", paymentView: view({ outstanding: 0, received: 100000, total: 100000 }) });
check("paid up by the ledger: history, whatever the flag says", paid?.type === "done" && paid.amount === 100000);
eq("a cancelled view is not payable", customerPaymentFromView({ status: "Confirmed", paymentView: view({ cancelled: true, outstanding: 5, total: 10 }) }), null);
eq("no view: the caller keeps its own derivation", customerPaymentFromView({ status: "Confirmed" }), null);
eq("a malformed view is ignored", customerPaymentFromView({ status: "Confirmed", paymentView: { amountDue: "x" } }), null);
eq("a rejected booking is not turned into a payable one", customerPaymentFromView({ status: "Rejected", paymentView: view({ outstanding: 100, total: 100 }) }), null);

// ── PAY-UI_CUSTOMER-010: a venue that asks no advance is not "Pay now" ──
const zeroAdv = customerPaymentFromView({ status: "Confirmed", paymentView: view({ amountDue: 700000, dueNow: 0, outstanding: 700000, total: 700000, paymentType: "full_payment", nextDueDate: "2027-08-27" }) });
check("zero advance, nothing due today: 'Next payment', not 'Pay now'", zeroAdv?.label === "Next payment" && zeroAdv.amount === 700000);
const dueTodayV = customerPaymentFromView({ status: "Confirmed", paymentView: view({ amountDue: 30000, dueNow: 30000, outstanding: 100000, total: 100000, paymentType: "down_payment" }) });
check("something due today stays 'Pay now'", dueTodayV?.label === "Pay now");
const overdueV = customerPaymentFromView({ status: "Confirmed", paymentView: view({ amountDue: 30000, dueNow: 0, overdueAmount: 30000, outstanding: 100000, total: 100000, paymentType: "down_payment" }) });
check("an overdue amount is never softened", overdueV?.label === "Pay now");
const part = { paymentType: "full_payment", amountDue: 700000, amountReceived: 0, overdueAmount: 0, installments: [{ state: "upcoming", remaining: 700000 }], nextInstallment: { dueDate: "2027-08-27" } };
eq("one upcoming qist, nothing received: not due yet", paymentNotDueYet(part)?.dueDate, "2027-08-27");
eq("...with the amount the server quoted", paymentNotDueYet(part)?.amount, 700000);
eq("an advance due today is due", paymentNotDueYet({ ...part, installments: [{ state: "due_today", remaining: 15000 }, { state: "upcoming", remaining: 135000 }] }), null);
eq("an overdue qist is due", paymentNotDueYet({ ...part, installments: [{ state: "overdue", remaining: 15000 }] }), null);
eq("overdueAmount > 0 is due", paymentNotDueYet({ ...part, overdueAmount: 1 }), null);
eq("money already received: the server figure stands", paymentNotDueYet({ ...part, amountReceived: 1000 }), null);
eq("received not stated: the server figure stands", paymentNotDueYet({ ...part, amountReceived: undefined }), null);
eq("no schedule to read: the server figure stands", paymentNotDueYet({ ...part, installments: [] }), null);
eq("a waived qist does not count as open", paymentNotDueYet({ ...part, installments: [{ state: "waived", remaining: 5000, waived: true }] }), null);
eq("nothing payable", paymentNotDueYet({ ...part, paymentType: null }), null);

// ── PAY-UI_CUSTOMER-011: the customer's deposit line ──
eq("no deposit, no line", customerDepositLine({ deposit: 0 }), null);
eq("no position, no line", customerDepositLine(null), null);
check("pending deposit: amount and the return promise", customerDepositLine({ deposit: 40000, status: "pending" })?.amount === 40000 && /Returned after the event/.test(customerDepositLine({ deposit: 40000, status: "pending" })!.note));
check("an open claim is named with its amount", /damage claim of Rs\. 15,000/.test(customerDepositLine({ deposit: 40000, status: "held", claimed: 15000, openClaims: 1 })!.note));
check("returned says returned", /Returned to you/.test(customerDepositLine({ deposit: 40000, status: "returned" })!.note));
check("part returned names the deduction", /Rs\. 15,000 was kept/.test(customerDepositLine({ deposit: 40000, status: "partially_returned", deducted: 15000 })!.note));
check("a cancelled booking's deposit was never charged", /Not charged/.test(customerDepositLine({ deposit: 40000, status: "void" })!.note));

// ── idempotency semantics: WP00a ──
const resp = (status: number, code?: string) => ({ response: { status, data: { status: false, message: "m", data: code ? { code } : null } } });
check("409 IN_PROGRESS keeps the key", isRetrySameKey(resp(409, "IN_PROGRESS")) && isAmbiguousFailure(resp(409, "IN_PROGRESS")));
check("409 RETRY keeps the key", isRetrySameKey(resp(409, "RETRY")) && isAmbiguousFailure(resp(409, "RETRY")));
check("503 BUSY keeps the key", isRetrySameKey(resp(503, "BUSY")));
check("a plain 409 refusal is NOT ambiguous (new key next time)", !isAmbiguousFailure(resp(409, "OUTSTANDING_CHANGED")));
check("a 400 is not ambiguous", !isAmbiguousFailure(resp(400, "VALIDATION")));
check("no answer is ambiguous", isAmbiguousFailure({ message: "Network Error" }));
eq("refusalCode reads data.code", refusalCode(resp(409, "STATE_CONFLICT")), "STATE_CONFLICT");

// ── CLAIM_REQUIRED: WP09 ──
const claim = { response: { status: 403, data: { status: false, message: "Only the customer can add requirements", data: { code: "CLAIM_REQUIRED", hint: "Ask the venue for a claim link." } } } };
check("CLAIM_REQUIRED shows message and hint", claimRequiredMessage(claim) === "Only the customer can add requirements Ask the venue for a claim link.");
eq("another 403 is not CLAIM_REQUIRED", claimRequiredMessage(resp(403, "FORBIDDEN")), null);

// ── web money mirror: WP06 Q7 ──
check("an order-stage 'cancelled' on a Confirmed booking is not cancelled", !isCancelledBooking({ status: "Confirmed", orderStage: "cancelled" }));
check("a Cancelled status is", isCancelledBooking({ status: "Cancelled" }));
eq("a stage-cancelled booking still owes its balance", outstandingOn({ status: "Confirmed", orderStage: "cancelled", totalAmount: "1000", downPayment: "400" }), 600);

// ── wiring (source scan): the rules above are only worth anything if the screens use them ──
const shell = src("components/dashboard/mainScreens/artifact/artifact-shell.tsx");
check("the shared console CSV export neutralises formulas", shell.includes("neutraliseFormula("));
check("the halls CSV export neutralises formulas", src("components/dashboard/mainScreens/insights/artifact/reports-artifact.tsx").includes("neutraliseFormula("));
const bookingsApi = src("lib/api/bookings.ts");
for (const door of ["/deposit/return", "/damage-claims`", "/damage-claims/${claimId}/settle", "/damage-claims/${claimId}/withdraw", "/settle`", "/headcount-lock"]) {
  const at = bookingsApi.indexOf(door);
  check(`${door}: the door sends the Idempotency-Key`, at > 0 && bookingsApi.slice(at, at + 220).includes("idempotencyConfig(opts?.idempotencyKey)"));
}
const detail = src("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx");
for (const call of ['keyFor("hc-lock"', 'keyFor("settle-bill"', 'keyFor("dmg-claim"', "keyFor(depName", "keyFor(clName", "keyFor(wdName"]) {
  check(`booking page keeps a per-submit key: ${call}`, detail.includes(call));
}
check("a cleared cheque can still be bounced (WP03 Q10)", src("components/dashboard/mainScreens/pdcs/artifact/pdcs-artifact.tsx").includes('c.status === "cleared") acts +='));
check("the redesigned cheque dialog allows cleared -> bounced", src("components/dashboard/mainScreens/pdcs/redesigned/pdc-dialogs.tsx").includes('cleared: ["bounced"]'));
const khata = src("components/dashboard/mainScreens/money/artifact/khata-artifact.tsx");
check("Khata reads the server's grossIn / refunds / net", khata.includes("flow.year?.grossIn") && khata.includes("flow.all?.refunds") && khata.includes("flow.month?.net"));
check("the ledger-row type admits moneySource 'ledger'", src("lib/api/bookingOrder.ts").includes('moneySource: "ledger"'));
check("/user/payments resolves its action from paymentView", src("app/(main)/user/payments/page.tsx").includes("customerPaymentFromView(") && src("lib/api/payments.ts").includes("customerPaymentFromView("));
check("an unreadable typed amount stops the Booking Shield save", src("components/dashboard/mainScreens/migrate/migration-sprint-view.tsx").includes("parseUrduAmount(r.rakam) == null"));

// ── PAY-UI_CUSTOMER-006 / RD-7: the cancel dialog stays open on the two answers that change what it asks ──
const bookingPage = src("app/(main)/user/bookings/[id]/page.tsx");
const winAt = bookingPage.indexOf('code === "CANCEL_WINDOW_CLOSED"');
check("CANCEL_WINDOW_CLOSED keeps the dialog open", winAt > 0 && bookingPage.slice(winAt, winAt + 400).includes("keepDialogOpen = true"));
const refAt = bookingPage.indexOf('code === "REFUND_CHANGED"');
check("REFUND_CHANGED keeps the dialog open", refAt > 0 && bookingPage.slice(refAt, winAt).includes("keepDialogOpen = true"));
const actAt = bookingPage.indexOf("<AlertDialogAction");
check("the dialog action prevents Radix's auto-close before anything else", actAt > 0 && /onClick=\{\(e\) => \{[\s\S]{0,500}?e\.preventDefault\(\);\s*if \(windowClosed\)/.test(bookingPage.slice(actAt, actAt + 900)));
// ── PAY-UI_CUSTOMER-010 / -011 / -015 / -019 / -001 (copy): wiring ──
check("the booking page asks paymentNotDueYet and shows the deposit line", bookingPage.includes("paymentNotDueYet(d)") && bookingPage.includes("customerDepositLine(deposit)"));
check("the pay page asks paymentNotDueYet before it offers a transfer", src("app/(main)/user/bookings/[id]/pay/page.tsx").includes("paymentNotDueYet(instructions)"));
const bank = src("components/booking/steps/bank-transfer-screen.tsx");
check("a venue with no published account is still named on a multi-venue booking", bank.includes("vendorsWithoutAccounts") && bank.includes("allVendors.length > 1"));
check("the claim body cannot carry a customer-chosen paymentType", !/paymentType\?\s*:/.test(src("lib/api/paymentInstructions.ts").split("static async claim(")[1].split("Promise<{ claim")[0]) && !/claim\([\s\S]{0,260}paymentType/.test(bank));
const planPay = src("app/(main)/user/plan/[id]/pay/page.tsx");
check("the plan pay screen no longer promises card retries or 'charged'", !/card is declined|is charged on its own|confirms each\s+vendor/i.test(planPay));

if (failures.length) { console.error(`FAILED ${failures.length} of ${passed + failures.length}:`); failures.forEach((f) => console.error("  - " + f)); process.exit(1); }
console.log(`money-mirror guard: ${passed} checks passed`);
