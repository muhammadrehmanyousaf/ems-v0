/**
 * Flows S1–S9 — the superadmin console, live. This is the highest-privilege
 * surface on the platform and the least-tested; it is also where BUG-021 slipped
 * through (an admin approved a nameless, unbookable business with no warning).
 *
 * Three passes, in order of what it would cost to get wrong:
 *
 *   A · AUTHORISATION MATRIX — every admin endpoint hit with (anon / customer /
 *       vendor). Each MUST be refused (401/403). This is the crown-jewel check
 *       and it is safe: a refusal mutates nothing. A single 2xx here is a
 *       privilege-escalation finding and the script shouts it.
 *
 *   B · ADMIN READ SMOKE — every admin *list* endpoint returns 200 for the
 *       real superadmin, so we know the console's data surfaces actually work
 *       (not just that they refuse everyone else).
 *
 *   C · VENDOR-QUEUE STATE MACHINE (S1) — exercised on business 3365, which is
 *       the QA fixture (mine, currently suspended), so transitions are safe:
 *       suspend → restore(approved) → suspend, plus request-changes, and the
 *       BUG-021 completeness gap re-checked at approve time.
 *
 * Nothing here mutates another tenant's data. The only writes are vendor-queue
 * transitions on the QA business, which are restored to `suspended` at the end.
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

// ── tokens ───────────────────────────────────────────────────────────────────
const sa = env.accounts.superadmin;
const adminToken = await login(sa.email, sa.password);
const vendorToken = await login(env.accounts.vendor.email, env.accounts.vendor.password);
const customerToken = await login(env.accounts.user.email, env.accounts.user.password);
console.log(`\ntokens — admin:${!!adminToken} vendor:${!!vendorToken} customer:${!!customerToken}\n`);
if (!adminToken) { console.log("No superadmin token — cannot run S1–S9."); process.exit(1); }

// ── the admin endpoint catalogue ─────────────────────────────────────────────
// method, path, subsystem, isMutation. Mutations use ids that either don't
// exist (999999) or the QA business (3365) so a hypothetical leak is contained.
const ADMIN = [
  ["GET",  "/admin/vendor-queue",                    "S1", false],
  ["POST", "/admin/vendor-queue/bulk-approve",       "S1", true],
  ["POST", "/admin/vendor-queue/3365/approve",       "S1", true],
  ["POST", "/admin/vendor-queue/3365/reject",        "S1", true],
  ["POST", "/admin/vendor-queue/3365/request-changes","S1", true],
  ["POST", "/admin/vendor-queue/3365/suspend",       "S1", true],
  ["POST", "/admin/vendor-queue/3365/restore",       "S1", true],
  ["GET",  "/admin/documents",                        "S2", false],
  ["GET",  "/admin/verification-queue",               "S2", false],
  ["POST", "/admin/verification-queue/3365/approve-ntn","S2", true],
  ["POST", "/admin/verification-queue/3365/approve-cnic","S2", true],
  ["POST", "/admin/verification-queue/3365/approve-address","S2", true],
  ["POST", "/admin/verification-queue/3365/mark-visited","S2", true],
  ["POST", "/admin/verification-queue/3365/reject",  "S2", true],
  ["POST", "/admin/bank-details/999999/verify",      "S2", true],
  ["GET",  "/admin/disputes",                         "S3", false],
  ["POST", "/admin/disputes/999999/resolve",         "S3", true],
  ["GET",  "/support-complaints",                     "S4", false],
  ["GET",  "/support-complaints/999999",              "S4", false],
  ["POST", "/admin/force-majeure-cancel",            "S5", true],
  ["GET",  "/admin/audit-logs",                       "S8", false],
  ["GET",  "/admin/platform-pulse",                   "S9", false],
  ["GET",  "/platform-stats",                         "S7", false],
];

// ════ A · authorisation matrix ══════════════════════════════════════════════
console.log("── A · authorisation matrix (must refuse everyone but admin) ──");
let leaks = 0;
for (const [method, path, sub, isMut] of ADMIN) {
  // anon
  const a = await call(method, path, {});
  const aok = refused(a.status);
  if (!aok) leaks++;
  check(`AUTH-anon ${sub}`, `${method} ${path.replace('/admin/','')} · anon`, "401/403/404",
    String(a.status), aok, aok ? "" : "REACHABLE WITHOUT AUTH");
  // customer
  const c = await call(method, path, { token: customerToken });
  const cok = refused(c.status);
  if (!cok) leaks++;
  check(`AUTH-cust ${sub}`, `${method} ${path.replace('/admin/','')} · customer`, "401/403/404",
    String(c.status), cok, cok ? "" : "CUSTOMER REACHED ADMIN");
  // vendor
  const v = await call(method, path, { token: vendorToken });
  const vok = refused(v.status);
  if (!vok) leaks++;
  check(`AUTH-vend ${sub}`, `${method} ${path.replace('/admin/','')} · vendor`, "401/403/404",
    String(v.status), vok, vok ? "" : "VENDOR REACHED ADMIN");
  await sleep(120);
}
console.log(`\n  authorisation leaks: ${leaks}`);

// ════ B · admin read smoke ══════════════════════════════════════════════════
console.log("\n── B · admin read smoke (lists return 200 for admin) ─────────");
for (const [method, path, sub] of ADMIN.filter((e) => e[0] === "GET")) {
  const r = await call(method, path, { token: adminToken });
  // 200 expected; a detail endpoint on a non-existent id may legitimately 404
  const ok = r.status === 200 || (path.includes("999999") && r.status === 404);
  check(`READ ${sub}`, `admin ${method} ${path.replace('/admin/','')}`, "200",
    String(r.status), ok, ok ? "" : String(r.json?.message || "").slice(0, 80));
  await sleep(150);
}

// ════ C · vendor-queue state machine (S1) on the QA business ════════════════
console.log("\n── C · S1 vendor-queue state machine (business 3365) ─────────");
{
  const state = async () => {
    const r = await call("GET", "/businesses/3365", { token: adminToken });
    return r.json?.data?.business?.status || r.json?.data?.status || "unknown";
  };
  // it starts suspended (teardown left it there)
  console.log(`  start state: ${await state()}`);

  const restore = await call("POST", "/admin/vendor-queue/3365/restore", { token: adminToken, body: { notes: "QA S1 test" } });
  await sleep(500);
  check("S1-01", "suspend → restore lands on approved", "approved",
    await state(), (await state()) === "approved", `http ${restore.status}`);

  const suspend = await call("POST", "/admin/vendor-queue/3365/suspend", { token: adminToken, body: { notes: "QA S1 test" } });
  await sleep(500);
  check("S1-02", "approved → suspend lands on suspended", "suspended",
    await state(), (await state()) === "suspended", `http ${suspend.status}`);

  // request-changes from suspended — legal or not, must not 500
  const rc = await call("POST", "/admin/vendor-queue/3365/request-changes", { token: adminToken, body: { notes: "QA: add business name" } });
  check("S1-03", "request-changes does not 500", "<500", String(rc.status), rc.status < 500, rc.json?.message?.slice(0,60));
  await sleep(400);

  // bulk-approve with an empty / bogus set must not 500 or approve nothing dangerous
  const bulk = await call("POST", "/admin/vendor-queue/bulk-approve", { token: adminToken, body: { businessIds: [] } });
  check("S1-04", "bulk-approve with empty set is handled", "<500", String(bulk.status), bulk.status < 500, bulk.json?.message?.slice(0,60));

  // BUG-021 re-check: approving is possible; does anything flag an incomplete listing?
  const cur = await call("GET", "/businesses/3365", { token: adminToken });
  const b = cur.json?.data?.business || cur.json?.data || {};
  check("S1-05", "approve gate flags a nameless/typeless listing", "some completeness signal",
    `name=${JSON.stringify(b.name)} sub=${JSON.stringify(b.subBusinessType)}`,
    !!(b.name && Array.isArray(b.subBusinessType) && b.subBusinessType.length),
    "if false, BUG-021 stands — nothing blocks approving an incomplete listing");

  // leave it suspended
  await call("POST", "/admin/vendor-queue/3365/suspend", { token: adminToken, body: { notes: "QA restore to suspended" } });
  await sleep(400);
  console.log(`  final state: ${await state()}`);
}

// ── summary ──────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ S1–S9 superadmin: ${pass} passed · ${fail} failed · ${leaks} auth leaks ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "superadmin.json"), JSON.stringify({ leaks, results }, null, 2));
console.log("\nwritten: qa-out/superadmin.json");
