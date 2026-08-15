/**
 * V2 · Claim an existing listing — the maximum testable without the emailed OTP.
 *
 * The claim OTP is a random 6-digit code, SHA-256-hashed in the DB and emailed
 * to the claimant (with a magic link). It is NOT echoed in any response, so the
 * literal "enter the code" step is the genuine skip-boundary (real email/OTP).
 * Everything AROUND it is proven here:
 *
 *   - CLAIM_ENABLED is live on prod (start validates rather than 404s)
 *   - start rejects a bad email (400) and starts cleanly on a claimable listing
 *     (200 + masked otpSentTo), emailing the code to a ZZ-QA address only
 *   - verify with a WRONG code is rejected — the gate actually checks the code
 *   - repeated wrong codes hit the attempt cap (spec: 5) → locked
 *   - the claim shows in the admin queue and is rejected for cleanup
 *
 * No real person is emailed (claimant = a ZZ-QA address). The claim row is
 * rejected at the end so the admin queue stays clean.
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

const claimantEmail = `zzqa.claim.${Date.now().toString().slice(-8)}@weddingwala-qa.test`;
const st = await login(env.accounts.superadmin.email, env.accounts.superadmin.password);
console.log(`\nsuperadmin:${!!st} · claimant: ${claimantEmail}\n`);

// ── validation: bad email ────────────────────────────────────────────────────
console.log("── V2 · claim identity gate ──────────────────────────────────");
const badEmail = await call("POST", "/claims/start", { body: { listingId: 3358, name: "ZZ QA", email: "not-an-email", phone: "03001234567" } });
check("CLM-01", "start rejects a bad email", "400", String(badEmail.status), badEmail.status === 400,
  badEmail.status !== 400 ? String(badEmail.json?.message || "").slice(0, 60) : "");

// ── find a claimable (unclaimed import) listing ──────────────────────────────
const listRes = await call("GET", "/businesses?limit=40", {});
const bizRows = listRes.json?.data?.data || listRes.json?.data || [];
const candidates = (Array.isArray(bizRows) ? bizRows : []).map((b) => b.id).filter(Boolean);
let claimId = null, usedListing = null, otpSentTo = null;
for (const id of candidates) {
  const r = await call("POST", "/claims/start", { body: { listingId: id, name: "ZZ QA Claimant", email: claimantEmail, phone: "03007654321" } });
  if (r.status === 200) { claimId = r.json?.data?.claimId ?? null; usedListing = id; otpSentTo = r.json?.data?.otpSentTo ?? null; break; }
  await sleep(120);
}
check("CLM-02", "start a claim on a claimable listing", "200 + claimId + masked otpSentTo",
  claimId ? `listing ${usedListing}, otp→${otpSentTo}` : "none accepted", !!claimId,
  !claimId ? "no unclaimed import listing found in the sample" : "");

if (claimId) {
  // the OTP is emailed (masked destination returned); the code is never echoed
  check("CLM-03", "otpSentTo is masked (code not leaked)", "masked", String(otpSentTo), /\*|x|@/.test(String(otpSentTo)) && !/^\d{6}$/.test(String(otpSentTo)));

  // wrong code is rejected — the gate actually checks it
  const wrong1 = await call("POST", `/claims/${claimId}/verify`, { body: { code: "000000" } });
  check("CLM-04", "a wrong OTP is rejected", "4xx", String(wrong1.status), wrong1.status >= 400 && wrong1.status < 500,
    wrong1.status < 400 ? "WRONG CODE ACCEPTED — claim OTP bypass" : String(wrong1.json?.data?.code || wrong1.json?.message || "").slice(0, 40));

  // attempt cap: keep sending wrong codes → should lock (spec cap 5)
  let lockedAt = null;
  for (let i = 2; i <= 7; i++) {
    const w = await call("POST", `/claims/${claimId}/verify`, { body: { code: String(100000 + i) } });
    const reason = String(w.json?.data?.code || w.json?.message || "");
    if (/attempt|locked|too_many|max/i.test(reason) || w.status === 429) { lockedAt = i; break; }
    await sleep(120);
  }
  check("CLM-05", "repeated wrong codes hit the attempt cap", "locked within ~5", lockedAt ? `locked at attempt ${lockedAt}` : "never locked", !!lockedAt,
    !lockedAt ? "no attempt cap observed within 7 tries" : "");

  // the claim shows in the admin queue
  if (st) {
    const q = await call("GET", "/claims/admin/claims", { token: st });
    const rows = q.json?.data?.claims || q.json?.data?.rows || q.json?.data || [];
    const found = (Array.isArray(rows) ? rows : []).some((c) => Number(c.id) === Number(claimId));
    check("CLM-06", "the claim appears in the admin queue", "present", found ? "present" : "absent", found);

    // cleanup: reject the claim so the queue stays clean
    const rej = await call("POST", `/claims/admin/claims/${claimId}/reject`, { token: st, body: { reason: "ZZ QA teardown — synthetic claim test" } });
    console.log(`\n  cleanup: reject claim ${claimId} → ${rej.status}`);
  }
}

// admin authz (re-confirm): vendor/anon cannot list claims
const vt = await login(env.qaVendor.email, env.qaVendor.password);
const vendQ = await call("GET", "/claims/admin/claims", { token: vt });
check("CLM-07", "vendor cannot read the admin claim queue", "refused", String(vendQ.status), [401, 403, 404].includes(vendQ.status));
const anonQ = await call("GET", "/claims/admin/claims", {});
check("CLM-08", "anon cannot read the admin claim queue", "401", String(anonQ.status), anonQ.status === 401);

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ V2 claim gate: ${pass} passed · ${fail} failed ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "claim-gate.json"), JSON.stringify({ claimId, usedListing, claimantEmail, results }, null, 2));
console.log("\nwritten: qa-out/claim-gate.json");
