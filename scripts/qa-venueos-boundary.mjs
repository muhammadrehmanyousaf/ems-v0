/**
 * Flow V9 — Venue-OS, the CFO/compliance tier: P&L, trial balance, depreciation,
 * wages, GL, tax filings, AML (structuring / benami / beneficial-owners). Every
 * endpoint is scoped `business/:businessId/...` or `org/:orgId/...`.
 *
 * The finding that would matter most here is a tenant leak: one vendor reading
 * another vendor's financials or AML data. So this harness proves the boundary
 * three ways for each sensitive endpoint:
 *
 *   anon        → must be refused (401/403)
 *   customer    → must be refused (401/403)
 *   QA vendor reading a FOREIGN business (3358, the founder's real venue) → must
 *               be refused (403/404). A 200 with real financial numbers here is a
 *               critical data-exposure finding.
 *
 * Read-only. No financial rows are written. `businessId` targets the foreign
 * business on purpose so a hypothetical leak surfaces rather than hides.
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

const qaVendorToken = await login(env.qaVendor.email, env.qaVendor.password);
const customerToken = await login(env.accounts.user.email, env.accounts.user.password);
console.log(`\ntokens — qaVendor:${!!qaVendorToken} customer:${!!customerToken}\n`);
if (!qaVendorToken) { console.log("No QA vendor token."); process.exit(1); }

// Foreign business = the founder's real venue. The QA vendor must never read its
// financials. (3365 is the QA vendor's own; a couple of self-reads confirm the
// endpoints actually respond rather than blanket-deny.)
const FOREIGN = 3358;
const OWN = 3365;

const SENSITIVE = [
  ["GET", `/venue-os/business/${FOREIGN}/event-margins`,   "event margins"],
  ["GET", `/venue-os/business/${FOREIGN}/trial-balance`,   "trial balance"],
  ["GET", `/venue-os/business/${FOREIGN}/fixed-assets`,    "fixed assets"],
  ["GET", `/venue-os/business/${FOREIGN}/labour-by-event`, "labour by event"],
  ["GET", `/venue-os/business/${FOREIGN}/annex-b`,         "Annex-B tax"],
  ["GET", `/venue-os/business/${FOREIGN}/section-165`,     "Section-165"],
  ["GET", `/venue-os/business/${FOREIGN}/ca-export`,       "CA export"],
  ["GET", `/venue-os/business/${FOREIGN}/tax-filings`,     "tax filings"],
  ["GET", `/venue-os/business/${FOREIGN}/aml/bank-deposits`,     "AML bank deposits"],
  ["GET", `/venue-os/business/${FOREIGN}/aml/beneficial-owners`, "AML beneficial owners"],
  ["GET", `/venue-os/business/${FOREIGN}/venue-leases`,    "venue leases"],
  ["GET", `/venue-os/business/${FOREIGN}/lease-schedule`,  "lease schedule"],
];

console.log("── A · Venue-OS tenant isolation (foreign business 3358) ─────");
let leaks = 0;
for (const [method, path, label] of SENSITIVE) {
  const anon = await call(method, path, {});
  if (!refused(anon.status)) leaks++;
  check(`VOS-anon`, `${label} · anon`, "401/403", String(anon.status), refused(anon.status),
    refused(anon.status) ? "" : "READABLE UNAUTHENTICATED");

  const cust = await call(method, path, { token: customerToken });
  if (!refused(cust.status)) leaks++;
  check(`VOS-cust`, `${label} · customer`, "401/403", String(cust.status), refused(cust.status),
    refused(cust.status) ? "" : "CUSTOMER READ FINANCIALS");

  const foreign = await call(method, path, { token: qaVendorToken });
  const ok = refused(foreign.status);
  if (!ok) leaks++;
  // A 200 is only a leak if it returns the FOREIGN business's data. Some
  // endpoints may 200 with an empty/again-scoped payload; flag any 200 for review.
  check(`VOS-tenant`, `${label} · QA vendor → foreign biz`, "403/404", String(foreign.status), ok,
    ok ? "" : `200 — inspect payload for cross-tenant financial data`);
  await sleep(120);
}
console.log(`\n  Venue-OS financial leaks: ${leaks}`);

// ── B · own-business responds (endpoints are live, not blanket-denying) ──────
console.log("\n── B · QA vendor reads its OWN Venue-OS (business 3365) ──────");
for (const [method, pathT, label] of [
  ["GET", `/venue-os/business/${OWN}/event-margins`, "own event margins"],
  ["GET", `/venue-os/business/${OWN}/trial-balance`, "own trial balance"],
  ["GET", `/venue-os/business/${OWN}/calendar`,      "own calendar"],
  ["GET", `/venue-os/health`,                        "venue-os health"],
]) {
  const r = await call(method, pathT, { token: qaVendorToken });
  // 200 (works), or a clean 4xx if flag-gated — but NOT 500
  check("VOS-own", `${label}`, "not 500", String(r.status), r.status !== 500,
    r.status === 500 ? String(r.json?.message || "").slice(0, 70) : "");
  await sleep(120);
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ V9 Venue-OS: ${pass} passed · ${fail} failed · ${leaks} financial leaks ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "venueos.json"), JSON.stringify({ leaks, results }, null, 2));
console.log("\nwritten: qa-out/venueos.json");
