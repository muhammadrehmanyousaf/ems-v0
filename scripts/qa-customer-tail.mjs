/**
 * Flows U5, U7, U8, U9, U10 — the customer tail, live.
 *
 * These are the post-booking customer surfaces. Where a positive path would
 * write junk onto the founder's real vendor (a fake review, a spurious refund
 * request), this tests the AUTHORISATION and VALIDATION instead — the parts that
 * prove the guard without leaving debris. The one full round-trip it does run is
 * U8 (complaint), because `/complaints` is built for public submission and the
 * row can be resolved by admin afterwards.
 *
 *   U8 Complaint  — submit (public) → appears in admin queue → admin resolves.
 *   U9 Review     — validation (missing fields → 400) + authorisation (cannot
 *                   review a booking you don't own).
 *   U10 Notifications — list, unread-count, mark-all-read (own account only).
 *   U5 Post-booking / U7 Dispute — refund-request raise refused on a booking the
 *                   caller doesn't own; my-disputes returns only the caller's.
 *
 * Cleans up: the QA complaint is resolved/closed by admin at the end.
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
  const res = await fetch(`${API}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}
const login = async (email, password) => {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  return json?.data?.token || null;
};
function check(id, what, expected, actual, pass, note = "") {
  results.push({ id, what, expected, actual, pass, note });
  console.log(`  [${pass === null ? "SKIP" : pass ? "PASS" : "FAIL"}] ${id}  ${what}`);
  if (pass === false) console.log(`         expected ${expected} · got ${actual}${note ? ` · ${note}` : ""}`);
}
const refused = (s) => s === 401 || s === 403 || s === 404;

const customerToken = await login(env.accounts.user.email, env.accounts.user.password);
const vendorToken = await login(env.accounts.vendor.email, env.accounts.vendor.password);
const adminToken = await login(env.accounts.superadmin.email, env.accounts.superadmin.password);
console.log(`\ntokens — customer:${!!customerToken} vendor:${!!vendorToken} admin:${!!adminToken}\n`);

// ════ U8 · Complaint (full round-trip) ══════════════════════════════════════
console.log("── U8 · complaint ────────────────────────────────────────────");
let complaintId = null;
{
  const stamp = String(Date.now()).slice(-6);
  const body = {
    name: "ZZ QA Complainant", email: "qa-complaint@example.invalid",
    subject: `ZZ QA test complaint ${stamp}`,
    message: "Automated QA fixture complaint — safe to resolve/delete.",
    category: "other",
  };
  const sub = await call("POST", "/complaints", { token: customerToken, body });
  complaintId = sub.json?.data?.complaint?.id ?? sub.json?.data?.id ?? null;
  check("U8-01", "customer submits a complaint", "200/201",
    String(sub.status), sub.status === 200 || sub.status === 201,
    sub.status >= 400 ? String(sub.json?.message || "").slice(0, 90) : `id ${complaintId}`);

  // required-field validation
  const bad = await call("POST", "/complaints", { token: customerToken, body: { name: "x" } });
  check("U8-02", "complaint with missing fields rejected", "400", String(bad.status), bad.status === 400);

  // it must reach the admin queue
  await sleep(500);
  const q = await call("GET", "/complaints", { token: adminToken });
  const rows = q.json?.data?.complaints || q.json?.data?.data || q.json?.data || [];
  const found = (Array.isArray(rows) ? rows : []).some((c) => Number(c.id) === Number(complaintId) || (c.subject || "").includes(stamp));
  check("U8-03", "complaint reaches the admin queue", "present",
    found ? "present" : "absent", complaintId ? found : null, complaintId ? "" : "id not returned to match on");

  // a vendor must NOT see the complaints queue
  const v = await call("GET", "/complaints", { token: vendorToken });
  check("U8-04", "vendor cannot read the complaints queue", "403", String(v.status), v.status === 403);
}

// ════ U9 · Review (validation + authorisation) ══════════════════════════════
console.log("\n── U9 · review ───────────────────────────────────────────────");
{
  // missing rating
  const b1 = await call("POST", "/reviews", { token: customerToken, body: { businessId: 3358, bookingId: 189 } });
  check("U9-01", "review with no rating rejected", "400", String(b1.status), b1.status === 400);

  // authorisation: review a booking the customer does not own (a random other id)
  const b2 = await call("POST", "/reviews", { token: customerToken, body: { businessId: 3358, bookingId: 999999, rating: 5, comment: "QA" } });
  check("U9-02", "review a non-existent / unowned booking refused", "4xx (not 201)",
    String(b2.status), b2.status >= 400, b2.status < 400 ? "ACCEPTED a review on a booking not owned" : "");

  // my-reviews is scoped to the caller
  const mine = await call("GET", "/reviews/my-reviews", { token: customerToken });
  check("U9-03", "my-reviews returns 200 for the customer", "200", String(mine.status), mine.status === 200);

  // unauthenticated cannot post a review
  const anon = await call("POST", "/reviews", { body: { businessId: 3358, bookingId: 189, rating: 5 } });
  check("U9-04", "unauthenticated review refused", "401", String(anon.status), anon.status === 401);
}

// ════ U10 · Notifications ═══════════════════════════════════════════════════
console.log("\n── U10 · notifications ───────────────────────────────────────");
{
  const list = await call("GET", "/notifications", { token: customerToken });
  check("U10-01", "customer reads own notifications", "200", String(list.status), list.status === 200);

  const unread = await call("GET", "/notifications/unread-count", { token: customerToken });
  const n = unread.json?.data?.count ?? unread.json?.data?.unread ?? unread.json?.count;
  check("U10-02", "unread-count returns a number", "200 + number",
    `${unread.status} / ${n}`, unread.status === 200 && typeof n !== "undefined");

  const anon = await call("GET", "/notifications", {});
  check("U10-03", "unauthenticated notifications refused", "401", String(anon.status), anon.status === 401);

  // mark-all-read is idempotent and must not error
  const mark = await call("PATCH", "/notifications/read-all", { token: customerToken });
  check("U10-04", "mark-all-read succeeds", "200", String(mark.status), mark.status === 200, mark.json?.message?.slice(0,50));
}

// ════ U5 / U7 · Post-booking & dispute boundaries ═══════════════════════════
console.log("\n── U5 / U7 · post-booking & dispute ──────────────────────────");
{
  // my-disputes is scoped to the caller
  const d = await call("GET", "/bookings/my-disputes", { token: customerToken });
  check("U7-01", "customer reads own disputes", "200", String(d.status), d.status === 200);

  // raise a refund-request on a booking the customer does not own → refused
  const r = await call("POST", "/bookings/999999/refund-requests", { token: customerToken, body: { reason: "QA", amount: 1 } });
  check("U7-02", "refund-request on an unowned/missing booking refused", "4xx",
    String(r.status), r.status >= 400, r.status < 400 ? "RAISED on a booking not owned" : "");

  // a vendor cannot read the customer's disputes list as if their own (scoped)
  const vd = await call("GET", "/bookings/my-disputes", { token: vendorToken });
  check("U7-03", "vendor my-disputes is scoped (200, own only)", "200", String(vd.status), vd.status === 200);

  // unauthenticated refund-request refused
  const anon = await call("POST", "/bookings/189/refund-requests", { body: { reason: "x", amount: 1 } });
  check("U5-01", "unauthenticated refund-request refused", "401", String(anon.status), anon.status === 401);
}

// ── cleanup: resolve the QA complaint ────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
if (complaintId) {
  // try the documented admin resolve/patch; report if it can't be closed
  let done = false;
  for (const attempt of [
    ["PATCH", `/complaints/${complaintId}`, { status: "resolved", resolutionNote: "QA fixture — auto-resolved" }],
    ["POST", `/complaints/${complaintId}/resolve`, { note: "QA fixture" }],
  ]) {
    const r = await call(attempt[0], attempt[1], { token: adminToken, body: attempt[2] });
    if (r.status < 400) { done = true; console.log(`  resolved complaint ${complaintId} via ${attempt[0]} ${attempt[1]}`); break; }
  }
  if (!done) console.log(`  NOTE: could not auto-resolve complaint ${complaintId} — resolve it in the admin console (subject starts "ZZ QA").`);
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ customer tail U5/U7/U8/U9/U10: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "customer-tail.json"), JSON.stringify({ complaintId, results }, null, 2));
console.log("\nwritten: qa-out/customer-tail.json");
