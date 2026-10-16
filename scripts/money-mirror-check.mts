/**
 * Guard: the web half of the payments hardening that landed after WP14a (WP14b).
 *
 * WP14d adds: the additive `dueNow` / `basis` of payment-instructions (UI_CUSTOMER-010), per-venue shares and the
 * per-venue claim (UI_CUSTOMER-015, 409 CLAIM_ALREADY_OPEN shows the open claim), 503 MONEY_WRITES_PAUSED is a
 * definite refusal and 400 BOOKING_NOT_PAYABLE / bad_date print a sentence (WP16), the cancel preview's
 * `unledgeredAdvance`, the Nayi booking drawer / dialog advance wording and record call (INT-followups).
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
import { customerPaymentFromView, paymentNotDueYet, customerDepositLine, venueClaimShares } from "../lib/payment-status.ts";
import { isAmbiguousFailure, isRetrySameKey, refusalCode } from "../lib/utils/idempotency.ts";
import { claimRequiredMessage, claimAlreadyOpen, errorMessage } from "../lib/utils/api-error.ts";
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

// ── WP17 / UI_CUSTOMER-010: the server's own `dueNow` + `basis` decide "nothing due yet" when present ──
const stated = { ...part, dueNow: 0, basis: "none" };
eq("basis none + dueNow 0: not due yet", paymentNotDueYet(stated)?.dueDate, "2027-08-27");
eq("...even when no schedule rows came with it", paymentNotDueYet({ ...stated, installments: [] })?.amount, 700000);
eq("basis advance + dueNow > 0: due", paymentNotDueYet({ ...stated, dueNow: 15000, basis: "advance" }), null);
eq("basis installment (a qist due today): due", paymentNotDueYet({ ...stated, dueNow: 135000, basis: "installment" }), null);
eq("basis none but dueNow > 0 is contradictory: due", paymentNotDueYet({ ...stated, dueNow: 5 }), null);
eq("the server's word does not override money already received", paymentNotDueYet({ ...stated, amountReceived: 1000 }), null);
eq("the server's word does not override an overdue amount", paymentNotDueYet({ ...stated, overdueAmount: 1 }), null);
eq("basis stated 'advance' beats a schedule that looks upcoming", paymentNotDueYet({ ...part, dueNow: 700000, basis: "advance" }), null);
eq("only one of dueNow / basis stated: the schedule decides (older server)", paymentNotDueYet({ ...part, basis: "none" })?.dueDate, "2027-08-27");

// ── WP17 / UI_CUSTOMER-015: each venue's own share ──
const two = [
  { businessId: 7, name: "Hall A", businessName: "Hall A", amountDue: 200000, accounts: [{}] },
  { businessId: 6, name: "Hall B", businessName: "Hall B", amountDue: 138750, accounts: [] },
];
const sh = venueClaimShares(two);
check("two venues: one share each, with their amounts", sh?.length === 2 && sh[0].amountDue === 200000 && sh[1].amountDue === 138750);
check("...and whether the venue has an account", sh?.[0].hasAccounts === true && sh?.[1].hasAccounts === false);
eq("one venue: nothing to split, the claim stays whole-booking", venueClaimShares([two[0]]), null);
eq("an older server that states no shares: the claim stays whole-booking", venueClaimShares([{ businessId: 7 }, { businessId: 6 }]), null);
eq("one share missing: do not guess", venueClaimShares([two[0], { businessId: 6 }]), null);
eq("no vendors", venueClaimShares(undefined), null);

// ── WP17 / UI_CUSTOMER-019: 409 CLAIM_ALREADY_OPEN carries the open claim ──
const open409 = { response: { status: 409, data: { message: "You've already reported this payment.", data: { code: "CLAIM_ALREADY_OPEN", claim: { id: 9, amount: 15000, transactionRef: "TX123" } } } } };
eq("the open claim is handed back", (claimAlreadyOpen(open409) as { id: number } | null)?.id, 9);
eq("another 409 is not a claim conflict", claimAlreadyOpen({ response: { status: 409, data: { data: { code: "STATE_CONFLICT" } } } }), null);
eq("a 400 with the code is not a claim conflict", claimAlreadyOpen({ response: { status: 400, data: { data: { code: "CLAIM_ALREADY_OPEN" } } } }), null);
eq("a conflict that names no claim still counts", JSON.stringify(claimAlreadyOpen({ response: { status: 409, data: { data: { code: "CLAIM_ALREADY_OPEN" } } } })), "{}");
eq("no error", claimAlreadyOpen(null), null);

// ── WP16: MONEY_WRITES_PAUSED, BOOKING_NOT_PAYABLE, bad_date ──
const paused = { response: { status: 503, data: { message: "Money changes are temporarily paused while the platform is being checked. Nothing was saved. Please try again in a little while.", data: { code: "MONEY_WRITES_PAUSED" } } } };
eq("MONEY_WRITES_PAUSED is a definite refusal, not 'may have gone through'", isAmbiguousFailure(paused), false);
eq("...its code reads", refusalCode(paused), "MONEY_WRITES_PAUSED");
eq("a plain 503 with no code is still ambiguous", isAmbiguousFailure({ response: { status: 503, data: {} } }), true);
eq("503 BUSY is still the re-send-same-key case", isAmbiguousFailure({ response: { status: 503, data: { data: { code: "BUSY" } } } }), true);
eq("the server's sentence wins", errorMessage(paused, "x"), paused.response.data.message);
check("a dropped message still reads for MONEY_WRITES_PAUSED", /paused/i.test(errorMessage({ response: { status: 503, data: { data: { code: "MONEY_WRITES_PAUSED" } } } }, "x")));
check("a dropped message still reads for BOOKING_NOT_PAYABLE", /can't take a payment/i.test(errorMessage({ response: { status: 400, data: { data: { code: "BOOKING_NOT_PAYABLE" } } } }, "x")));
check("a dropped message still reads for bad_date", /isn't a real date/i.test(errorMessage({ response: { status: 400, data: { data: { code: "bad_date" } } } }, "x")));
eq("the server's bad_date sentence wins", errorMessage({ response: { status: 400, data: { message: "Qist 2: taareekh sahi nahi.", data: { code: "bad_date" } } } }, "x"), "Qist 2: taareekh sahi nahi.");
// the web outbox keeps every queued entry when the batch answers 503 (nothing removed in the catch)
const outboxSync = src("lib/outbox-sync.ts");
const flushCatch = outboxSync.slice(outboxSync.indexOf("} catch {"), outboxSync.indexOf("} finally {"));
check("outbox flush: a thrown 503 keeps the queue (no removeOp / recordConflict in the catch)", flushCatch.includes("return null") && !flushCatch.includes("removeOp") && !flushCatch.includes("recordConflict"));

// ── WP17 / UI_CUSTOMER-009: a vendor's Default is per method ──
const bankMgr = src("components/dashboard/mainScreens/businessSettings/redesigned/bank-accounts-manager.tsx");
check("vendor bank screen: the default checkbox names the method, not 'the payout account'", !bankMgr.includes("Make this the default payout account") && bankMgr.includes('"JazzCash" : (form.accountType ?? "bank") === "easypaisa"'));
check("vendor bank screen: says each type has its own default", bankMgr.includes("each have their own default"));
check("vendor bank screen: every account row keeps its own Default pill and Set default", bankMgr.includes("{a.isActive && <StatusPill") && bankMgr.includes("{!a.isActive && <Button"));
check("vendor bank screen: no longer says a customer sees only a verified account", !bankMgr.includes("Shown only once we've verified the account"));

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
check("transfer screen: the claim names the venue chosen (businessId) only when shares are stated", bank.includes("...(selected ? { businessId: selected.businessId } : {})") && bank.includes("venueClaimShares(allVendors)"));
check("transfer screen: each venue block shows its own amount", bank.includes("{shareOf(vendor.businessId) && ("));
check("transfer screen: 409 CLAIM_ALREADY_OPEN shows the open claim", bank.includes("claimAlreadyOpen<Partial<PaymentClaim>>(e)") && bank.includes("You&apos;ve already reported this payment"));
check("claim API type admits businessId and the claim row carries it", /businessId\?: number;/.test(src("lib/api/paymentInstructions.ts")) && src("lib/api/paymentInstructions.ts").includes("businessId?: number | null;"));
check("payment-instructions type carries dueNow, basis and the per-venue amounts", ["dueNow?: number;", "basis?:", "amountDue?: number;", "outstanding?: number;"].every((s) => src("lib/api/paymentInstructions.ts").includes(s)));
check("cancel dialog: one line for an advance the venue never recorded", bookingPage.includes("(refundPreview.unledgeredAdvance ?? 0) > 0 && (") && bookingPage.includes("data-unledgered-advance") && src("lib/api/bookingOrder.ts").includes("unledgeredAdvance?: number;"));
check("vendor refund preview: the unledgered advance is a row of the existing breakdown", src("components/bookings/refund-preview-card.tsx").includes("data.unledgeredAdvance"));
// ── INT-followups: the Nayi booking drawer records exactly what was typed ──
const nayi = src("components/dashboard/mainScreens/artifact/booking-form.ts");
check("Nayi booking: a typed advance travels as downPayment with its method; none typed sends neither", nayi.includes('if (adv) vendor.downPayment = adv') && nayi.includes("if (method && adv) payload.paymentMethod = method"));
check("Nayi booking: the advance field no longer reads like the venue's required advance", !nayi.includes('placeholder="booking advance"') && nayi.includes("khali = kuch record nahi"));
const offDlg = src("components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog.tsx");
check("offline dialog: the 'advance received' tick records it (down_payment, chosen method, fresh key) before it says so", /recordPayment\(newBookingId, 'down_payment', advanceMethod, undefined,/.test(offDlg) && offDlg.indexOf("recordPayment(newBookingId") < offDlg.indexOf("toast.success('Advance recorded')"));
check("offline dialog: a failed advance is reported, never claimed as recorded", offDlg.includes("record the advance from the booking"));
const planPay = src("app/(main)/user/plan/[id]/pay/page.tsx");
check("the plan pay screen no longer promises card retries or 'charged'", !/card is declined|is charged on its own|confirms each\s+vendor/i.test(planPay));

if (failures.length) { console.error(`FAILED ${failures.length} of ${passed + failures.length}:`); failures.forEach((f) => console.error("  - " + f)); process.exit(1); }
console.log(`money-mirror guard: ${passed} checks passed`);
