/**
 * V10 (vendor insights / 2FA / chat) + S6 (moderation) + S7 (plans).
 *
 * Deliberately conservative on writes:
 *   · 2FA — we ENROLL only (returns a secret/otpauth) and assert the shape; we
 *     never CONFIRM (that needs a live TOTP and would lock the QA account out of
 *     password-only login). Disabling while not enabled must fail cleanly.
 *   · Chat — READ-ONLY. Sending a message would ping a real customer, so we only
 *     read conversations / unread / contacts and prove the anon + tenant guards.
 *   · Reports — read-only aggregates.
 *   · Moderation / plans — superadmin reads + the vendor-refused / anon-refused
 *     boundary. No queue mutation (approve/suspend/restore) here.
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

const vt = await login(env.qaVendor.email, env.qaVendor.password);
const ct = await login(env.accounts.user.email, env.accounts.user.password);
const st = await login(env.accounts.superadmin.email, env.accounts.superadmin.password);
console.log(`\nqaVendor:${!!vt} customer:${!!ct} superadmin:${!!st}\n`);
if (!vt) { console.log("No QA vendor token."); process.exit(1); }

// ════ V10-A · Insights & reports (read-only) ════════════════════════════════
console.log("── V10-A · insights / reports ────────────────────────────────");
for (const [id, path, label] of [
  ["INS-01", "/analytics/insights-advanced", "advanced insights"],
  ["INS-02", "/analytics/reputation", "reputation dashboard"],
  ["INS-03", "/analytics/seasonality", "seasonal demand"],
  ["INS-04", "/analytics/response-times", "response-time analytics"],
  ["INS-05", "/analytics/revenue-breakdowns", "revenue breakdowns"],
  ["INS-06", "/analytics/whatsapp-templates", "whatsapp template perf"],
]) {
  const r = await call("GET", path, { token: vt });
  check(id, `${label} answers for the vendor`, "200", String(r.status), r.status === 200,
    r.status !== 200 ? String(r.json?.message || "").slice(0, 70) : "");
  const anon = await call("GET", path, {});
  check(`${id}a`, `${label} refuses anon`, "401", String(anon.status), anon.status === 401);
  await sleep(70);
}

// ════ V10-B · 2FA enrolment (enroll only, never confirm) ════════════════════
console.log("\n── V10-B · 2FA (enroll only) ─────────────────────────────────");
{
  const enr = await call("POST", "/auth/2fa/enroll", { token: vt, body: {} });
  const d = enr.json?.data || {};
  const hasSecret = !!(d.secret || d.otpauthUrl || d.otpauth || d.qr || d.qrCode || d.otpauth_url);
  check("2FA-01", "enrol returns a TOTP secret/otpauth", "2xx + secret",
    `${enr.status} / ${hasSecret ? "secret" : "none"}`, enr.status < 300 && hasSecret,
    enr.status >= 300 ? String(enr.json?.message || "").slice(0, 70) : "");

  // confirm with a wrong code must be refused (proves the code is actually checked)
  const badConfirm = await call("POST", "/auth/2fa/confirm", { token: vt, body: { token: "000000", code: "000000" } });
  check("2FA-02", "confirm with a wrong code rejected", "4xx (not enabled)", String(badConfirm.status), badConfirm.status >= 400 && badConfirm.status < 500,
    badConfirm.status < 400 ? "WRONG CODE ACCEPTED — 2FA bypass" : "");

  // enroll must require auth
  const anon = await call("POST", "/auth/2fa/enroll", {});
  check("2FA-03", "enrol requires auth", "401", String(anon.status), anon.status === 401);
}

// ════ V10-C · Chat (read-only) ══════════════════════════════════════════════
console.log("\n── V10-C · chat (read-only) ──────────────────────────────────");
for (const [id, path, label] of [
  ["CHAT-01", "/chat/conversations", "conversation list"],
  ["CHAT-02", "/chat/unread-total", "unread total"],
  ["CHAT-03", "/chat/contacts", "chat contacts"],
]) {
  const r = await call("GET", path, { token: vt });
  check(id, `${label} answers for the vendor`, "200", String(r.status), r.status === 200,
    r.status !== 200 ? String(r.json?.message || "").slice(0, 70) : "");
  const anon = await call("GET", path, {});
  check(`${id}a`, `${label} refuses anon`, "401", String(anon.status), anon.status === 401);
  await sleep(70);
}

// ════ S7 · Plans / subscription ═════════════════════════════════════════════
console.log("\n── S7 · plans / subscription ─────────────────────────────────");
{
  const mine = await call("GET", "/subscriptions/me", { token: vt });
  check("PLAN-01", "vendor reads their own plan", "200", String(mine.status), mine.status === 200,
    mine.status !== 200 ? String(mine.json?.message || "").slice(0, 70) : "");

  // admin upgrade-requests: superadmin allowed, vendor refused, anon refused
  if (st) {
    const adm = await call("GET", "/subscriptions/admin/upgrade-requests", { token: st });
    check("PLAN-02", "superadmin lists upgrade requests", "200", String(adm.status), adm.status === 200,
      adm.status !== 200 ? String(adm.json?.message || "").slice(0, 70) : "");
  } else {
    check("PLAN-02", "superadmin lists upgrade requests", "200", "SKIP", null, "no superadmin token");
  }
  const vend = await call("GET", "/subscriptions/admin/upgrade-requests", { token: vt });
  check("PLAN-03", "vendor cannot list upgrade requests", "refused", String(vend.status), refused(vend.status),
    vend.status < 400 ? "VENDOR READ ADMIN QUEUE" : "");
  const anon = await call("GET", "/subscriptions/admin/upgrade-requests", {});
  check("PLAN-04", "anon cannot list upgrade requests", "401", String(anon.status), anon.status === 401);
}

// ════ S6 · Moderation (superadmin reads + boundary) ═════════════════════════
console.log("\n── S6 · moderation queue ─────────────────────────────────────");
for (const [id, path, label] of [
  ["MOD-01", "/admin/vendor-queue", "vendor moderation queue"],
  ["MOD-02", "/admin/documents", "document KYC queue"],
  ["MOD-03", "/admin/audit-logs", "audit logs"],
]) {
  if (st) {
    const r = await call("GET", path, { token: st });
    check(id, `superadmin reads ${label}`, "200", String(r.status), r.status === 200,
      r.status !== 200 ? String(r.json?.message || "").slice(0, 70) : "");
  } else {
    check(id, `superadmin reads ${label}`, "200", "SKIP", null, "no superadmin token");
  }
  const vend = await call("GET", path, { token: vt });
  check(`${id}b`, `vendor cannot read ${label}`, "refused", String(vend.status), refused(vend.status),
    vend.status < 400 ? "VENDOR READ MODERATION DATA" : "");
  const anon = await call("GET", path, {});
  check(`${id}c`, `anon cannot read ${label}`, "401", String(anon.status), anon.status === 401);
  await sleep(80);
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ insights/plans/moderation: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "insights-plans-moderation.json"), JSON.stringify({ results }, null, 2));
console.log("\nwritten: qa-out/insights-plans-moderation.json");
