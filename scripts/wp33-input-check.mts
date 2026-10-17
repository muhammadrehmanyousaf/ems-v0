/**
 * Guard: WP33 - authorization doors and input rules on the web side.
 *
 *  1. LEADS-060  the ?new= calendar deep link reaches the lead drawer's date input only as a real YYYY-MM-DD, attribute-escaped
 *               (a reflected DOM XSS in the vendor's session); the shared booking form does the same.
 *  2. LEADS-061  the "Assign to" picker sends USER ids: owner + staff with a login, never a StaffMember id.
 *  3. PUBLIC-002 safeRedirect refuses control characters / smuggled hosts (a post-login open redirect).
 *  4. PUBLIC-005 /review/[token] and /wedding/[token] read the route param with useParams, not React use(params).
 *  5. PUBLIC-003/004 analytics runs only with analytics consent, never on a route whose URL is a one-time secret.
 *  6. BOOKINGS-003/005/014 the Nayi booking drawer checks phone / name / e-mail / past date / per-head guests before it sends.
 *  7. CUSTOMER-008 a payment proof is checked (8 MB, image or PDF) before upload.
 *  8. SETUP-056 / VENDORTYPES-035 the profile and package rules.
 *  9. ACCESS-015 a role named "admin" gets no admin chrome; PUBLIC-010 the queue dialog needs a reason; FLAGGED-048 proof links.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/wp33-input-check.mts
 */
import { safeRedirect } from "../lib/auth/safe-redirect.ts";
import { safeDateValue, assignableReps } from "../lib/lead-form-safety.ts";
import { phoneIssue, nameIssue, emailIssue, dateIssue, maxBookingDay, guestsRequired, bookingErrorMessage } from "../lib/booking-input.ts";
import { isSensitivePath, analyticsAllowed } from "../lib/analytics-consent.ts";
import { proofFileIssue, PROOF_MAX_BYTES } from "../lib/proof-file.ts";
import { profileIssue, serverMessageOf } from "../lib/profile-input.ts";
import { packagePriceIssue, fleetIssues } from "../lib/package-input.ts";
import { getDashboardRole } from "../lib/dashboard-role.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const eq = (name: string, got: unknown, want: unknown) => check(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ── 1. LEADS-060 ──
eq("a real day passes", safeDateValue("2030-05-17"), "2030-05-17");
eq("Feb 29 on a leap year", safeDateValue("2028-02-29"), "2028-02-29");
eq("Feb 29 on a non-leap year", safeDateValue("2027-02-29"), "");
eq("month 13", safeDateValue("2030-13-01"), "");
eq("the audit's payload", safeDateValue('"><img src=x onerror="window.__audXss=1">'), "");
for (const bad of ['" autofocus', "2030-05-17\"onfocus=\"1", "<svg onload=1>", "javascript:alert(1)", "2030-5-7", " ", "", null, undefined, 20300517]) {
  eq(`not a date: ${JSON.stringify(bad)}`, safeDateValue(bad), "");
}
{
  const leads = src("components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx");
  check("leads drawer date goes through safeDateValue + escHtml", /escHtml\(.*safeDateValue\(prefillDate\)\)/.test(leads));
  check("leads drawer no longer writes the raw prefill", !/prefillDate \|\| ""\)/.test(leads));
  const form = src("components/dashboard/mainScreens/artifact/booking-form.ts");
  check("booking form date goes through safeDateValue + escHtml", /safeDateValue\(p\.bookingDate\)/.test(form) && /escHtml\(picked \? picked/.test(form));
  check("booking form no longer slices a raw date into the HTML", !/String\(p\.bookingDate\)\.slice\(0, 10\) : todayInKarachi/.test(form));
}

// ── 2. LEADS-061 ──
{
  const roster = [
    { id: 6, userId: null, fullName: "Ahmed waiter" },
    { id: 7, userId: 41, fullName: "Sana cashier" },
    { id: 8, userId: 41, fullName: "Sana duplicate row" },
    { id: 9, fullName: "Bilal cook" },
    { id: 10, userId: 5, fullName: "Owner as staff" },
  ];
  const reps = assignableReps(roster, { id: 5, name: "Waheed" });
  eq("owner first, then staff WITH a login", reps.map((r) => r.userId).join(","), "5,41");
  check("the option value is a user id, never the roster id", reps.every((r) => r.userId !== 6 && r.userId !== 7 && r.userId !== 9));
  eq("without a signed-in user only staff with logins", assignableReps(roster, null).map((r) => r.userId).join(","), "41,5");
  eq("an empty roster still offers the owner", assignableReps([], { id: 5 }).length, 1);
  const leads = src("components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx");
  check("the picker maps r.userId, not m.id", /value="\$\{r\.userId\}"/.test(leads) && !/value="\$\{m\.id\}"/.test(leads));
}

// ── 3. PUBLIC-002 ──
for (const bad of ["/%09/example.org", "/%0a/example.org", "/%0d/example.org/x", "/\t/example.org", "//example.org", "/\\example.org", "https://example.org", "javascript:alert(1)", "/%5Cexample.org", "/%E0%A4%A", "//%2fexample.org"]) {
  eq(`open redirect refused: ${JSON.stringify(bad)}`, safeRedirect(bad), null);
}
eq("a normal path is kept", safeRedirect("/user/bookings?x=1"), "/user/bookings?x=1");
eq("an encoded normal path is kept", safeRedirect("%2Fvenues%2F12%3Ftab%3Dpay"), "/venues/12?tab=pay");
eq("a hash is kept", safeRedirect("/dashboard#bookings"), "/dashboard#bookings");
eq("login loops are refused", safeRedirect("/login?redirect=/x"), null);
eq("empty is null", safeRedirect(""), null);

// ── 4. PUBLIC-005 ──
for (const rel of ["app/(main)/review/[token]/page.tsx", "app/(main)/wedding/[token]/page.tsx"]) {
  const s = src(rel);
  check(`${rel} does not call use(params)`, !/=\s*use\(params\)/.test(s) && !/import \{[^}]*\buse\b[^}]*\} from 'react'/.test(s));
  check(`${rel} reads the token with useParams`, /useParams\(\)/.test(s));
}

// ── 5. PUBLIC-003 / 004 ──
for (const p of ["/reset-password", "/claim/set-password", "/claim/12", "/sign/abc", "/review/abc", "/wedding/abc"]) check(`sensitive path ${p}`, isSensitivePath(p));
for (const p of ["/", "/wedding-venues/lahore", "/venues/12", "/signup", "/reviews", "/weddings"]) check(`normal path ${p}`, !isSensitivePath(p));
check("no consent -> no analytics", !analyticsAllowed({ analyticsConsent: false, pathname: "/" }));
check("consent on a normal page -> analytics", analyticsAllowed({ analyticsConsent: true, pathname: "/venues/12" }));
check("consent but a token page -> no analytics", !analyticsAllowed({ analyticsConsent: true, pathname: "/review/abc" }));
{
  const ga = src("components/analytics/google-analytics.tsx");
  check("GoogleAnalytics reads the consent", /getConsent\(\)\?\.analytics === true/.test(ga));
  check("GoogleAnalytics renders nothing without consent", /if \(!load \|\| !consented\) return null/.test(ga));
  check("GoogleAnalytics sets the ga-disable kill-switch", /ga-disable-\$\{id\}/.test(ga));
  const cc = src("components/cookie-consent.tsx");
  check("the banner announces a saved choice", /ww-consent-change/.test(cc));
}

// ── 6. BOOKINGS-003 / 005 / 014 ──
for (const bad of ["abc", "1", "12ab34", "+++", "", "   ", "1234567890123456789"]) check(`phone refused: ${JSON.stringify(bad)}`, phoneIssue(bad) !== null);
for (const ok of ["03001234567", "0300 555 0002", "+92 300 1234567", "0092-300-1234567", "(042) 111-222-333"]) check(`phone ok: ${ok}`, phoneIssue(ok) === null);
check("name empty refused", nameIssue("  ") !== null);
check("name with markup refused", nameIssue("<b>x</b>") !== null);
check("name 121 chars refused", nameIssue("x".repeat(121)) !== null);
check("name ok", nameIssue("Ayesha Khan") === null);
check("email blank ok", emailIssue("") === null);
check("email abc refused", emailIssue("abc") !== null);
check("email ok", emailIssue("a@b.pk") === null);
check("past date refused", dateIssue("2020-01-01", "2026-10-17") !== null);
check("today ok", dateIssue("2026-10-17", "2026-10-17") === null);
check("future ok", dateIssue("2027-01-01", "2026-10-17") === null);
check("not a date refused", dateIssue("", "2026-10-17") !== null);
eq("max day is three years ahead", maxBookingDay("2026-10-17"), "2029-10-17");
check("per-head with no guests needs guests", guestsRequired([{ unit: "per_head" }], 0));
check("per-head with a guarantee does not", !guestsRequired([{ unit: "per_head", minGuarantee: 150 }], 0));
check("per-head with guests does not", !guestsRequired([{ unit: "per_head" }], 200));
check("flat package never needs guests", !guestsRequired([{ unit: "per_event" }], 0));
check("event_date_in_past has a message", bookingErrorMessage("event_date_in_past") !== null);
{
  const form = src("components/dashboard/mainScreens/artifact/booking-form.ts");
  check("date input has min and max", /id="bf-date" min="\$\{minDay\}" max="\$\{maxBookingDay\(minDay\)\}"/.test(form));
  check("phone input is type=tel, email is type=email", /id="bf-phone" type="tel"/.test(form) && /id="bf-email" type="email"/.test(form));
  check("submit runs the issue checks", /phoneIssue\(phone\)/.test(form) && /dateIssue\(/.test(form) && /guestsRequired\(/.test(form));
  const holds = src("components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx");
  check("holds date input has a min", /id="h-date" min="\$\{todayIso\(\)\}"/.test(holds));
}

// ── 7. CUSTOMER-008 ──
eq("8 MB constant", PROOF_MAX_BYTES, 8 * 1024 * 1024);
check("9 MB pdf refused", proofFileIssue({ size: 9 * 1024 * 1024, type: "application/pdf" }) !== null);
check("exe refused", proofFileIssue({ size: 1000, type: "application/x-msdownload" }) !== null);
check("png ok", proofFileIssue({ size: 1000, type: "image/png" }) === null);
check("pdf ok", proofFileIssue({ size: 1000, type: "application/pdf" }) === null);
check("no file ok", proofFileIssue(null) === null);
{
  const s = src("components/booking/steps/bank-transfer-screen.tsx");
  check("the pay screen checks the file on selection", /proofFileIssue\(f\)/.test(s));
  check("a failed attachment can be retried", /bank-claim-proof-retry/.test(s));
}

// ── 8. SETUP-056 / VENDORTYPES-035 ──
check("profile: empty name refused", profileIssue({ fullName: "" })?.field === "fullName");
check("profile: hello number refused", profileIssue({ primaryContactNumber: "hello" })?.field === "primaryContactNumber");
check("profile: javascript website refused", profileIssue({ website: "javascript:alert(1)" })?.field === "website");
check("profile: valid passes", profileIssue({ fullName: "Ayesha Malik", primaryContactNumber: "0300-1234567", website: "https://x.pk/a" }) === null);
check("profile: clearing optional passes", profileIssue({ website: "", secondaryContactNumber: "" }) === null);
eq("server message is shown when short", serverMessageOf({ response: { data: { message: "Website must be a link" } } }, "fallback"), "Website must be a link");
eq("generic fallback otherwise", serverMessageOf(new Error("boom"), "fallback"), "fallback");
for (const bad of [-100, "-100", 0, "0", "abc", 1e12]) check(`package price refused: ${JSON.stringify(bad)}`, packagePriceIssue(bad) !== null);
for (const ok of [1, 15000, "15000", "1500.50"]) check(`package price ok: ${ok}`, packagePriceIssue(ok) === null);
{
  const now = new Date("2026-10-17T00:00:00Z");
  check("fleet: year 1800", !!fleetIssues({ year: ["1800"] }, now).year);
  check("fleet: -5 seats", !!fleetIssues({ seatingCapacity: ["-5 Seats"] }, now).seatingCapacity);
  check("fleet: 0 units", !!fleetIssues({ unitsAvailable: ["0 Units"] }, now).unitsAvailable);
  check("fleet: sane car", Object.keys(fleetIssues({ year: ["2022"], seatingCapacity: ["4 Seats"], unitsAvailable: ["3 Units"] }, now)).length === 0);
  const cr = src("components/VendorStepForms/newVendorRegisterationForm/CarRental/components/validations.tsx");
  check("car-rental wizard runs the price + fleet rules", /packagePriceIssue\(pkg\.price\)/.test(cr) && /fleetIssues\(/.test(cr));
  const venue = src("components/VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations.tsx");
  check("venue wizard refuses a non-positive price", /Number\(pkg\.price\) <= 0/.test(venue));
}

// ── 9. ACCESS-015 / PUBLIC-010 / FLAGGED-048 ──
eq("a role named 'admin' is NOT admin chrome", getDashboardRole({ roles: [{ name: "admin" }] }), "none");
eq("a role named 'Administrator' is NOT admin chrome", getDashboardRole({ roles: [{ name: "Administrator" }], isVendor: true }), "vendor");
eq("super admin is unchanged", getDashboardRole({ roles: [{ name: "super admin" }] }), "superAdmin");
eq("vendor is unchanged", getDashboardRole({ isVendor: true }), "vendor");
{
  const d = src("components/dashboard/mainScreens/vendor-queue/redesigned/vendor-queue-action-dialog.tsx");
  check("the queue dialog needs a reason for reject / changes / suspend", /reasonOk = !reasonRequired \|\| notes\.trim\(\)\.length >= 3/.test(d) && /disabled=\{submitting \|\| !reasonOk\}/.test(d));
  const v = src("components/dashboard/mainScreens/vendor-queue/redesigned/vendor-queue-redesigned-view.tsx");
  check("the queue knows changes_requested", /changes_requested: "warning"/.test(v) && /case "changes_requested":/.test(v));
  const claims = src("components/dashboard/mainScreens/bookings/bookingListing/components/payment-claims-panel.tsx");
  check("the claims panel only links http(s) proofs", /\^https\?:\\\/\\\//.test(claims) || /https\?:/.test(claims));
  const drafts = src("lib/api/businessDrafts.ts");
  check("draft save presents the held resume token", /resumeToken: held/.test(drafts));
  const rc = src("components/dashboard/mainScreens/receipts/artifact/receipts-artifact.tsx");
  check("the receipt booking select is disabled on edit", /<select id="r-booking"\$\{r \? ' disabled/.test(rc));
}

console.log(`wp33-input-check: ${passed} checks passed${failures.length ? `, ${failures.length} FAILED` : ""}`);
if (failures.length) {
  for (const f of failures) console.error("  FAIL " + f);
  process.exit(1);
}
