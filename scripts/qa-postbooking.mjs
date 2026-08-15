/**
 * U5 · Post-booking management — the operational surface a vendor works after a
 * booking exists, driven on the QA vendor's own bookings (safe test debris on
 * bookings already slated for teardown).
 *
 *   A · Booking timeline — create a task on a QA booking → it lists → flip its
 *       status → tenant guard (customer cannot read a vendor's booking timeline)
 *       → anon refused.
 *   B · Quote negotiation — the FEAT_QUOTE_NEGOTIATION surface. Flag-gated: dark
 *       ⇒ 404, lit ⇒ owner-scoped. Either way, accept/decline on a ghost quote
 *       must refuse and anon must be 401. We assert behaviour, not a flag state.
 *   C · Couple portal — the public token-auth read. A bogus token must refuse
 *       cleanly (not 500); the endpoint needs no login (that's the point).
 *
 * The function-sheet sign leg of U5 was already proven in V9
 * (scripts/qa-operational-writes.mjs). No foreign-tenant writes.
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
console.log(`\nqaVendor:${!!vt} customer:${!!ct}\n`);
if (!vt) { console.log("No QA vendor token."); process.exit(1); }

// a booking the QA vendor owns (list is vendor-scoped, so any row is ownable)
let bookingId = null;
{
  // list shape is { data: { data: [...bookings], filters } } — the projection
  // carries vendorIds, not businessId (see BUG-025).
  const b = await call("GET", "/bookings?limit=50", { token: vt });
  const rows = b.json?.data?.data || b.json?.data?.bookings || [];
  const arr = Array.isArray(rows) ? rows : [];
  bookingId = arr[0]?.id ?? null;
  console.log(`  QA vendor booking for timeline: ${bookingId ?? "none"} (of ${arr.length})\n`);
}

// ════ A · Booking timeline ══════════════════════════════════════════════════
console.log("── A · booking timeline ──────────────────────────────────────");
let taskId = null;
if (bookingId) {
  const c = await call("POST", `/bookings/${bookingId}/timeline`, {
    token: vt,
    body: { label: "ZZ QA timeline task", dueDate: "2027-01-01", type: "generic" },
  });
  taskId = c.json?.data?.task?.id ?? c.json?.data?.id ?? null;
  check("TL-01", "create a timeline task on a QA booking", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${taskId}`);

  const g = await call("GET", `/bookings/${bookingId}/timeline`, { token: vt });
  const trows = g.json?.data?.tasks || g.json?.data?.timeline || g.json?.data || [];
  const found = taskId ? (Array.isArray(trows) ? trows : []).some((x) => Number(x.id) === Number(taskId)) : g.status === 200;
  check("TL-02", "the task lists on the booking timeline", g.status === 200 ? "present" : "200", found ? "present" : String(g.status), g.status === 200 && found);

  if (taskId) {
    const s = await call("POST", `/timeline-tasks/${taskId}/status`, { token: vt, body: { status: "done" } });
    check("TL-03", "flip the task status", "2xx", String(s.status), s.status < 300,
      s.status >= 300 ? String(s.json?.message || "").slice(0, 70) : "");
  }

  // tenant: customer cannot read a vendor's booking timeline
  const xt = await call("GET", `/bookings/${bookingId}/timeline`, { token: ct });
  check("TL-04", "customer cannot read a vendor's booking timeline", "refused", String(xt.status), refused(xt.status),
    xt.status < 400 ? "CUSTOMER READ VENDOR TIMELINE" : "");

  // anon
  const anon = await call("GET", `/bookings/${bookingId}/timeline`, {});
  check("TL-05", "anon cannot read a booking timeline", "401", String(anon.status), anon.status === 401);
} else {
  ["TL-01","TL-02","TL-03","TL-04","TL-05"].forEach((id) => check(id, "timeline step", "2xx", "SKIP", null, "no QA booking"));
}

// ════ B · Quote negotiation (flag-gated) ════════════════════════════════════
console.log("\n── B · quote negotiation (FEAT_QUOTE_NEGOTIATION) ────────────");
{
  const mine = await call("GET", "/quotes/mine", { token: vt });
  const dark = mine.status === 404;
  check("Q-01", "quotes/mine behaves (200 lit / 404 dark, not 500)", "200 or 404", String(mine.status), mine.status === 200 || mine.status === 404,
    mine.status === 500 ? "500 on the quote surface" : (dark ? "flag dark (404)" : "flag lit (200)"));

  // accept/decline on a ghost quote must refuse either way
  const acc = await call("POST", "/quotes/999999999/accept", { token: ct, body: {} });
  check("Q-02", "accept a nonexistent quote refused", "refused", String(acc.status), refused(acc.status));

  const dec = await call("POST", "/quotes/999999999/decline", { token: ct, body: {} });
  check("Q-03", "decline a nonexistent quote refused", "refused", String(dec.status), refused(dec.status));

  // anon must never touch a quote
  const anon = await call("GET", "/quotes/mine", {});
  check("Q-04", "quotes require auth", "401", String(anon.status), anon.status === 401);
}

// ════ C · Public couple portal (token-auth) ═════════════════════════════════
console.log("\n── C · public couple portal ──────────────────────────────────");
{
  const bad = await call("GET", "/public/wedding-umbrellas/portal/ZZ-QA-bogus-token-000", {});
  check("CP-01", "bogus portal token refused cleanly (not 500)", "4xx", String(bad.status), bad.status >= 400 && bad.status < 500,
    bad.status === 500 ? "500 on a bad portal token" : "");
  check("CP-02", "portal read needs no login (public by design)", "no 401", String(bad.status), bad.status !== 401,
    bad.status === 401 ? "portal demands a session — should be token-only" : "");
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ post-booking (U5): ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "postbooking.json"), JSON.stringify({ bookingId, taskId, results }, null, 2));
console.log("\nwritten: qa-out/postbooking.json");
