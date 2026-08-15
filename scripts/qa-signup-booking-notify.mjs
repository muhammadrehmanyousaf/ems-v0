/**
 * U2 (registration → verified account) + X8 booking-lifecycle notification.
 *
 * The KEY discovery: signup (`authController.createEmployee`) auto-sets
 * `emailVerified:true, phoneVerified:true` ("OTP services aren't live yet —
 * auto-verify"). So a new account is fully verified with NO OTP — U2 was never
 * really OTP-blocked. And because the account is auto-`phoneVerified`, it passes
 * `requirePhoneVerifiedForBooking()`, which unblocks the X8 booking-notification
 * path too.
 *
 *   U2  — sign up a fresh ZZ-QA customer → account is verified → it can log in
 *         and read its own authed surfaces immediately.
 *   X8  — that customer books the QA vendor (booking.userId = the customer) →
 *         vendor APPROVES → `NotificationService.booking.approved` fires to
 *         booking.userId → the customer's unread/notification count goes UP
 *         (right party), and NOT the vendor's from their own approval.
 *
 * No OTP, no real SMS. Everything ZZ-QA-marked; the booking is cancelled and
 * 3365 re-suspended at the end. The new User row is logged for teardown.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const API = process.env.E2E_API_URL || "https://ems-v0-backend-production.up.railway.app/api/v1";
const env = JSON.parse(readFileSync(join(root, "cypress.env.json"), "utf8"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
const login = async (email, password) => (await call("POST", "/auth/login", { body: { email, password } })).json?.data?.token || null;
function check(id, what, expected, actual, pass, note = "") {
  results.push({ id, what, expected, actual, pass, note });
  console.log(`  [${pass === null ? "SKIP" : pass ? "PASS" : "FAIL"}] ${id}  ${what}`);
  if (pass === false) console.log(`         expected ${expected} · got ${actual}${note ? ` · ${note}` : ""}`);
}
const unread = async (t) => {
  const r = await call("GET", "/notifications/unread-count", { token: t });
  const n = r.json?.data?.count ?? r.json?.data?.unread ?? r.json?.data ?? 0;
  return typeof n === "number" ? n : Number(n) || 0;
};

const BIZ = 3365, SLOT = 280;
const stamp = Date.now().toString().slice(-8);
const custEmail = `zzqa.cust.${stamp}@weddingwala-qa.test`;
const custPass = "ZzQaCust!2026#x";
const custPhone = `0300${stamp}`.slice(0, 11);

const vt = await login(env.qaVendor.email, env.qaVendor.password);
const st = await login(env.accounts.superadmin.email, env.accounts.superadmin.password);
console.log(`\nvendor:${!!vt} superadmin:${!!st} · new customer: ${custEmail} / ${custPhone}\n`);

// ════ U2 · signup → verified account ════════════════════════════════════════
console.log("── U2 · signup → verified account (no OTP) ───────────────────");
let newUserId = null, custToken = null;
{
  const su = await call("POST", "/auth/signup", {
    body: { fullName: "ZZ QA Signup Customer", email: custEmail, phoneNumber: custPhone, password: custPass, isVendor: false },
  });
  newUserId = su.json?.data?.user?.id ?? su.json?.data?.id ?? null;
  const verified = (su.json?.data?.user?.emailVerified ?? su.json?.data?.emailVerified) === true;
  check("U2-01", "signup creates an account", "2xx", String(su.status), su.status < 300,
    su.status >= 300 ? String(su.json?.message || "").slice(0, 90) : `id ${newUserId}`);
  check("U2-02", "account is auto-verified (no OTP)", "emailVerified true", verified ? "verified" : "unverified", verified,
    !verified ? "signup did not auto-verify — OTP may now be live" : "");

  await sleep(500);
  custToken = await login(custEmail, custPass);
  check("U2-03", "the new account can log in immediately", "token", custToken ? "token" : "none", !!custToken);

  if (custToken) {
    const me = await call("GET", "/notifications", { token: custToken });
    check("U2-04", "the new account can reach its authed surfaces", "200", String(me.status), me.status === 200);
  }

  // duplicate-email guard
  const dup = await call("POST", "/auth/signup", {
    body: { fullName: "ZZ QA Dup", email: custEmail, phoneNumber: custPhone, password: custPass, isVendor: false },
  });
  check("U2-05", "duplicate email refused", "400", String(dup.status), dup.status === 400);
}

// ════ X8 · booking-lifecycle notification to the right party ════════════════
console.log("\n── X8 · booking → approve → customer notified ────────────────");
let bookingId = null;
if (custToken) {
  const bk = await call("POST", "/bookings", {
    token: custToken,
    body: {
      customerName: "ZZ QA Signup Customer",
      customerEmail: custEmail,
      customerPhone: custPhone,
      bookingDate: "2027-11-20",
      bookingTime: "18:00",
      vendors: [{ businessId: BIZ, slotTemplateId: SLOT, totalAmount: 50000, downPayment: 0 }],
    },
  });
  bookingId = bk.json?.data?.booking?.id ?? bk.json?.data?.id ?? bk.json?.data?.bookings?.[0]?.id ?? null;
  check("X8B-01", "new customer books the QA vendor", "2xx", String(bk.status), bk.status < 300,
    bk.status >= 300 ? String(bk.json?.message || "").slice(0, 90) : `booking ${bookingId}`);

  if (bookingId) {
    await sleep(600);
    const custBefore = await unread(custToken);
    const vendBefore = await unread(vt);

    const appr = await call("PATCH", `/bookings/${bookingId}/approve`, { token: vt, body: {} });
    check("X8B-02", "vendor approves the booking", "2xx", String(appr.status), appr.status < 300,
      appr.status >= 300 ? String(appr.json?.message || "").slice(0, 80) : "");
    await sleep(1500);

    const custAfter = await unread(custToken);
    const vendAfter = await unread(vt);
    check("X8B-03", "the CUSTOMER (booking.userId) is notified of approval", `> ${custBefore}`, String(custAfter), custAfter > custBefore,
      custAfter <= custBefore ? "customer NOT notified of their booking approval" : `${custBefore}→${custAfter}`);
    check("X8B-04", "the approving vendor is not self-notified", `<= ${vendBefore}`, String(vendAfter), vendAfter <= vendBefore,
      vendAfter > vendBefore ? "approver got a self-notify bump" : `${vendBefore}→${vendAfter}`);

    // confirm the notification content targets this booking
    const notifs = await call("GET", "/notifications", { token: custToken });
    const rows = notifs.json?.data?.notifications || notifs.json?.data?.rows || notifs.json?.data || [];
    const hit = (Array.isArray(rows) ? rows : []).some((n) => JSON.stringify(n).includes(String(bookingId)) || /appro/i.test(JSON.stringify(n)));
    check("X8B-05", "an approval notification is present for the customer", "present", hit ? "present" : "absent", hit);
  }
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
if (bookingId) {
  const c = await call("POST", `/bookings/${bookingId}/cancel`, { token: vt, body: { reason: "ZZ QA teardown" } });
  // cancel path may differ; try PATCH status fallback
  let s = c.status;
  if (s >= 400) { const c2 = await call("PATCH", `/bookings/${bookingId}/status`, { token: vt, body: { status: "Cancelled", reason: "ZZ QA teardown" } }); s = c2.status; }
  console.log(`  cancel booking ${bookingId} → ${s}`);
}
if (st) { const r = await call("POST", `/admin/vendor-queue/${BIZ}/suspend`, { token: st, body: { reason: "ZZ QA — re-suspend after test" } }); console.log(`  re-suspend 3365 → ${r.status}`); }
console.log(`  NOTE for teardown: new QA User ${newUserId} (${custEmail}) + booking ${bookingId}`);

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ U2 + X8 booking: ${pass} passed · ${fail} failed ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "signup-booking-notify.json"), JSON.stringify({ newUserId, custEmail, bookingId, results }, null, 2));
console.log("\nwritten: qa-out/signup-booking-notify.json");
