/**
 * X5 · Session integrity + X7 · Pakistani specifics (phone formats, multi-day
 * shaadi). API-level, on controllable QA accounts.
 *
 *   X5 — two concurrent logins both work (two-tab); revoking session B's jti
 *        kills B's token while A keeps working (right-session revoke); a tampered
 *        token and a missing token are both refused.
 *   X7 — the PK phone normaliser accepts the real formats couples type
 *        (0300-1234567, +92 300 1234567, 042 landline) and rejects junk (123,
 *        mid-string +, letters); a multi-day shaadi lead carrying
 *        functionsJson [mehndi, nikah, walima] is accepted and read back.
 *
 * Leads created here are "ZZ QA" and deleted at the end.
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
const refused = (s) => s === 401 || s === 403 || s === 400; // revoked can be 400 (REC-012)

const BIZ = 3365;

// ════ X5 · Session integrity ════════════════════════════════════════════════
console.log("── X5 · session integrity ────────────────────────────────────");
{
  const tokenA = await login(env.qaVendor.email, env.qaVendor.password);
  await sleep(300);
  const tokenB = await login(env.qaVendor.email, env.qaVendor.password);
  check("SES-01", "two concurrent logins both authenticate (two-tab)", "both 200",
    `A:${(await call("GET", "/auth/sessions", { token: tokenA })).status} B:${(await call("GET", "/auth/sessions", { token: tokenB })).status}`,
    true); // refined below
  const aOk = (await call("GET", "/auth/sessions", { token: tokenA })).status === 200;
  const bOk = (await call("GET", "/auth/sessions", { token: tokenB })).status === 200;
  results[results.length - 1].pass = aOk && bOk;

  // find B's current jti (ask B whoami via its own session list)
  const sessB = await call("GET", "/auth/sessions", { token: tokenB });
  const list = sessB.json?.data?.sessions || [];
  const bCurrent = list.find((s) => s.current) || null;
  const jtiB = bCurrent?.jti ?? null;
  check("SES-02", "session list marks the current session with a jti", "jti present", jtiB ? "present" : "absent", !!jtiB);

  if (jtiB) {
    // revoke B's session using A (a different valid session)
    const rev = await call("POST", `/auth/sessions/${jtiB}/revoke`, { token: tokenA });
    check("SES-03", "revoke B's session via A succeeds", "2xx", String(rev.status), rev.status < 300,
      rev.status >= 300 ? String(rev.json?.message || "").slice(0, 70) : "");
    await sleep(400);

    // B's token must now be refused
    const bAfter = await call("GET", "/auth/sessions", { token: tokenB });
    check("SES-04", "revoked token B is refused", "401/400", String(bAfter.status), refused(bAfter.status),
      !refused(bAfter.status) ? "REVOKED TOKEN STILL WORKS" : `code ${bAfter.status}`);

    // A must still work
    const aAfter = await call("GET", "/auth/sessions", { token: tokenA });
    check("SES-05", "revoking B leaves A working", "200", String(aAfter.status), aAfter.status === 200,
      aAfter.status !== 200 ? "revoking one session killed another" : "");
  }

  // tampered token
  const tampered = await call("GET", "/auth/sessions", { token: (tokenA || "") + "x" });
  check("SES-06", "tampered token refused", "401", String(tampered.status), tampered.status === 401);

  // no token
  const anon = await call("GET", "/auth/sessions", {});
  check("SES-07", "no token refused", "401", String(anon.status), anon.status === 401);
}

// ════ X7 · Pakistani specifics ══════════════════════════════════════════════
console.log("\n── X7 · phone formats + multi-day shaadi ─────────────────────");
const vt = await login(env.qaVendor.email, env.qaVendor.password);
const createdLeads = [];
{
  const mkLead = (phone, extra = {}) => ({
    businessId: BIZ, source: "manual_phone", contactName: "ZZ QA Couple",
    contactPhone: phone, ...extra,
  });
  const post = (body) => call("POST", "/leads", { token: vt, body });

  // accepted PK formats
  for (const [id, phone, label] of [
    ["PH-01", "0300-1234567", "mobile with dashes"],
    ["PH-02", "+92 300 1234567", "international +92 with spaces"],
    ["PH-03", "042-35771234", "Lahore landline"],
  ]) {
    const r = await post(mkLead(phone));
    const lid = r.json?.data?.lead?.id ?? r.json?.data?.id ?? null;
    if (lid) createdLeads.push(lid);
    check(id, `accepts ${label}`, "2xx", String(r.status), r.status < 300,
      r.status >= 300 ? String(r.json?.message || "").slice(0, 70) : "");
  }

  // rejected junk
  for (const [id, phone, label] of [
    ["PH-04", "123", "too short"],
    ["PH-05", "0300+1234567", "mid-string +"],
    ["PH-06", "0300ABCD567", "letters"],
  ]) {
    const r = await post(mkLead(phone));
    const lid = r.json?.data?.lead?.id ?? r.json?.data?.id ?? null;
    if (lid) createdLeads.push(lid); // shouldn't happen, but track for cleanup
    check(id, `rejects ${label}`, "400", String(r.status), r.status === 400,
      r.status !== 400 ? "accepted a junk phone" : "");
  }

  // multi-day shaadi: functionsJson with mehndi/nikah/walima
  const multi = await post(mkLead("03005556677", {
    contactName: "ZZ QA Multi-Event",
    functionsJson: [
      { type: "mehndi", date: "2027-03-10" },
      { type: "nikah", date: "2027-03-11" },
      { type: "walima", date: "2027-03-12" },
    ],
  }));
  const mId = multi.json?.data?.lead?.id ?? multi.json?.data?.id ?? null;
  if (mId) createdLeads.push(mId);
  check("MD-01", "multi-day shaadi lead (mehndi/nikah/walima) accepted", "2xx", String(multi.status), multi.status < 300,
    multi.status >= 300 ? String(multi.json?.message || "").slice(0, 70) : `id ${mId}`);

  if (mId) {
    const g = await call("GET", `/leads/${mId}`, { token: vt });
    const fns = g.json?.data?.lead?.functionsJson ?? g.json?.data?.functionsJson ?? [];
    const n = Array.isArray(fns) ? fns.length : 0;
    check("MD-02", "all three functions stored on the lead", "3", String(n), n === 3,
      n !== 3 ? "multi-day functions not persisted" : "");
  }
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
for (const id of createdLeads) {
  const d = await call("DELETE", `/leads/${id}`, { token: vt });
  console.log(`  delete lead ${id} → ${d.status}`);
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ X5 + X7: ${pass} passed · ${fail} failed ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "session-pkspecifics.json"), JSON.stringify({ createdLeads, results }, null, 2));
console.log("\nwritten: qa-out/session-pkspecifics.json");
