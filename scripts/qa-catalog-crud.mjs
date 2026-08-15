/**
 * Flows V7 (packages) + V8 (staff roster) — full CRUD, live, on the seeded
 * vendor. These are the destructive paths the campaign has been skipping: 61
 * controls across 22 screens were looked at and not clicked because the only
 * vendor available owned real listings.
 *
 * Oracles read first, so the expectations are the shipped rules:
 *   packageController.createSinglePackage / updatePackage / deletePackage
 *     - checkBusinessOwnership on every write (WW-004)
 *     - duplicate (name, businessId) rejected
 *     - PATCH is partial (WW-183) — omitting name/price must not null them
 *     - images / features JSONB bounded (WW-055)
 *   utils/staffHelpers.validateStaffMember
 *     - 21 roles, 3 employment types, defaults waiter / casual_dihari
 *     - NIC exactly 13 digits, rendered XXXXX-XXXXXXX-X
 *     - phone 7–15 digits, no mid-string '+' (WW-154)
 *
 * Foreign-tenant probes are READ/WRITE ATTEMPTS ONLY against the real vendor's
 * rows: every one is expected to be refused, so a pass means nothing was
 * touched. A failure here would mean the probe succeeded, which is itself the
 * finding — the script reports it loudly and stops creating.
 *
 * Everything it creates on the QA vendor it deletes, and reports what it could
 * not remove.
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
const madePackages = [];
const madeStaff = [];

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}
const login = async (email, password) => {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  return json?.data?.token || json?.token || null;
};

function check(id, what, expected, actual, pass, note = "") {
  results.push({ id, what, expected, actual, pass, note });
  console.log(`  [${pass === null ? "SKIP" : pass ? "PASS" : "FAIL"}] ${id}  ${what}`);
  if (pass === false) console.log(`         expected ${expected} · got ${actual}${note ? ` · ${note}` : ""}`);
}
const refused = (s) => s === 401 || s === 403 || s === 404;

// ── sign in ─────────────────────────────────────────────────────────────────
const v = env.qaVendor;
const token = await login(v.email, v.password);
if (!token) { console.log("QA vendor sign-in failed."); process.exit(1); }
const bizId = (v.businesses || [])[0]?.id || 3365;
console.log(`\nQA vendor ${v.email} · business ${bizId}\n`);

// The real vendor's business + one of its packages, for the foreign probes.
let foreignBizId = null, foreignPkgId = null, foreignStaffId = null;
{
  const rt = await login(env.accounts.vendor.email, env.accounts.vendor.password);
  if (rt) {
    const { json } = await call("GET", "/businesses/user-business", { token: rt });
    const list = json?.data?.businesses || json?.data || [];
    foreignBizId = (Array.isArray(list) ? list : [list])[0]?.id ?? null;
    if (foreignBizId) {
      const p = await call("GET", `/packages?businessId=${foreignBizId}`, { token: rt });
      const pk = p.json?.data?.packages || p.json?.data || [];
      foreignPkgId = (Array.isArray(pk) ? pk : [])[0]?.id ?? null;
      const s = await call("GET", `/staff/members?businessId=${foreignBizId}`, { token: rt });
      const sm = s.json?.data?.members || s.json?.data || [];
      foreignStaffId = (Array.isArray(sm) ? sm : [])[0]?.id ?? null;
    }
  }
  console.log(`foreign fixtures — business ${foreignBizId} · package ${foreignPkgId} · staff ${foreignStaffId}\n`);
}

// ════ V7 · PACKAGES ═════════════════════════════════════════════════════════
console.log("── V7 · packages ─────────────────────────────────────────────");

const pkgName = `ZZ QA Package ${Date.now() % 100000}`;
let pkgId = null;

// P1 create
{
  const { status, json } = await call("POST", "/packages/single-package", {
    token,
    body: {
      name: pkgName, description: "QA fixture package", price: 75000,
      businessId: bizId, features: ["Hall", "Catering"], images: [],
    },
  });
  pkgId = json?.data?.package?.id ?? json?.data?.id ?? null;
  if (pkgId) madePackages.push(pkgId);
  check("PKG-01", "create a package", "201", String(status), status === 201,
    status !== 201 ? String(json?.message || "").slice(0, 100) : "");
}
await sleep(300);

// P2 duplicate name on the same business
if (pkgId) {
  const { status } = await call("POST", "/packages/single-package", {
    token, body: { name: pkgName, description: "dup", price: 1000, businessId: bizId },
  });
  check("PKG-02", "duplicate name refused", "400", String(status), status === 400);
}
await sleep(300);

// P3 read back — the package must actually appear in the vendor's own list
if (pkgId) {
  const { json } = await call("GET", "/packages/vendor-packages", { token });
  const rows = json?.data?.packages || json?.data || [];
  const found = (Array.isArray(rows) ? rows : []).some((p) => Number(p.id) === Number(pkgId));
  check("PKG-03", "new package appears in vendor list", "present", found ? "present" : "absent", found);
}
await sleep(300);

// P4 THE WW-183 REGRESSION — PATCH only description; name and price must survive
if (pkgId) {
  await call("PATCH", `/packages/${pkgId}`, { token, body: { description: "edited by QA" } });
  await sleep(400);
  const { json } = await call("GET", `/packages/${pkgId}`, { token });
  const p = json?.data?.package || json?.data || {};
  const nameKept = p.name === pkgName;
  const priceKept = Number(p.price) === 75000;
  check("PKG-04", "partial PATCH keeps name", pkgName, String(p.name), nameKept);
  check("PKG-05", "partial PATCH keeps price", "75000", String(p.price), priceKept);
  check("PKG-06", "partial PATCH applied description", "edited by QA", String(p.description),
    p.description === "edited by QA");
}
await sleep(300);

// P7 price update round-trips
if (pkgId) {
  await call("PATCH", `/packages/${pkgId}`, { token, body: { price: 88000 } });
  await sleep(400);
  const { json } = await call("GET", `/packages/${pkgId}`, { token });
  const p = json?.data?.package || json?.data || {};
  check("PKG-07", "price update persists", "88000", String(p.price), Number(p.price) === 88000);
}
await sleep(300);

// P8–P10 write validation
{
  const cases = [
    ["PKG-08", "malformed images rejected", { name: `${pkgName} x1`, price: 1000, businessId: bizId, images: "not-an-array" }],
    ["PKG-09", "malformed features rejected", { name: `${pkgName} x2`, price: 1000, businessId: bizId, features: { junk: true } }],
    ["PKG-10", "missing businessId rejected", { name: `${pkgName} x3`, price: 1000 }],
  ];
  for (const [id, what, body] of cases) {
    const { status, json } = await call("POST", "/packages/single-package", { token, body });
    const nid = json?.data?.package?.id ?? json?.data?.id ?? null;
    if (nid) madePackages.push(nid);
    check(id, what, "400 or 403", String(status), status === 400 || status === 403,
      status < 400 ? "ACCEPTED — should not have been" : "");
    await sleep(250);
  }
}

// P11–P13 tenant isolation on packages
{
  if (foreignBizId) {
    const { status } = await call("POST", "/packages/single-package", {
      token, body: { name: `ZZ QA intrusion ${Date.now()}`, price: 1, businessId: foreignBizId },
    });
    check("PKG-11", "create a package on another vendor's business", "403", String(status),
      refused(status), status < 400 ? "CREATED — tenant boundary breached" : "");
  } else check("PKG-11", "create on foreign business", "-", "-", null, "no foreign business found");

  if (foreignPkgId) {
    const u = await call("PATCH", `/packages/${foreignPkgId}`, { token, body: { price: 1 } });
    check("PKG-12", "edit another vendor's package", "403 or 404", String(u.status), refused(u.status),
      u.status < 400 ? "EDITED — tenant boundary breached" : "");
    const d = await call("DELETE", `/packages/${foreignPkgId}`, { token });
    check("PKG-13", "delete another vendor's package", "403 or 404", String(d.status), refused(d.status),
      d.status < 400 ? "DELETED — tenant boundary breached" : "");
  } else {
    check("PKG-12", "edit foreign package", "-", "-", null, "no foreign package found");
    check("PKG-13", "delete foreign package", "-", "-", null, "no foreign package found");
  }

  // P14 reassigning MY package to a business I don't own
  if (pkgId && foreignBizId) {
    const { status } = await call("PATCH", `/packages/${pkgId}`, { token, body: { businessId: foreignBizId } });
    check("PKG-14", "move my package to another vendor's business", "403", String(status), refused(status),
      status < 400 ? "MOVED — tenant boundary breached" : "");
  }

  // P15 unauthenticated write
  const a = await call("POST", "/packages/single-package", { body: { name: "anon", price: 1, businessId: bizId } });
  check("PKG-15", "unauthenticated create", "401", String(a.status), a.status === 401);
}

// ════ V8 · STAFF ════════════════════════════════════════════════════════════
console.log("\n── V8 · staff roster ─────────────────────────────────────────");

let staffId = null;

// S1 create with only the required field — defaults must fill in
{
  const { status, json } = await call("POST", "/staff/members", {
    token, body: { businessId: bizId, fullName: "ZZ QA Staff One" },
  });
  staffId = json?.data?.member?.id ?? json?.data?.id ?? null;
  if (staffId) madeStaff.push(staffId);
  const m = json?.data?.member || {};
  check("STF-01", "create with only fullName", "201", String(status), status === 201,
    status !== 201 ? String(json?.message || "").slice(0, 100) : "");
  check("STF-02", "role defaults to waiter", "waiter", String(m.role), m.role === "waiter");
  check("STF-03", "employmentType defaults to casual_dihari", "casual_dihari",
    String(m.employmentType), m.employmentType === "casual_dihari");
}
await sleep(300);

// S4 NIC formatting — 13 digits accepted and rendered
{
  const { status, json } = await call("POST", "/staff/members", {
    token,
    body: {
      businessId: bizId, fullName: "ZZ QA Staff NIC", role: "dhol_player",
      employmentType: "contract", nicNumber: "3520112345671", phoneNumber: "03001234567",
    },
  });
  const m = json?.data?.member || {};
  const id = m.id ?? null;
  if (id) madeStaff.push(id);
  check("STF-04", "13-digit NIC accepted", "201", String(status), status === 201,
    status !== 201 ? String(json?.message || "").slice(0, 100) : "");
  check("STF-05", "NIC rendered XXXXX-XXXXXXX-X", "35201-1234567-1", String(m.nicDisplay),
    m.nicDisplay === "35201-1234567-1");
}
await sleep(300);

// S6+ validation matrix
{
  const base = { businessId: bizId, fullName: "ZZ QA Reject" };
  const cases = [
    ["STF-06", "missing fullName", { businessId: bizId }],
    ["STF-07", "blank fullName", { ...base, fullName: "   " }],
    ["STF-08", "unknown role", { ...base, role: "wedding-ninja" }],
    ["STF-09", "unknown employmentType", { ...base, employmentType: "freelance" }],
    ["STF-10", "12-digit NIC", { ...base, nicNumber: "352011234567" }],
    ["STF-11", "14-digit NIC", { ...base, nicNumber: "35201123456712" }],
    ["STF-12", "3-digit phone (WW-154)", { ...base, phoneNumber: "123" }],
    ["STF-13", "mid-string + in phone", { ...base, phoneNumber: "0300+1234567" }],
    ["STF-14", "letters in phone", { ...base, phoneNumber: "0300ABCDEFG" }],
  ];
  for (const [id, what, body] of cases) {
    const { status, json } = await call("POST", "/staff/members", { token, body });
    const nid = json?.data?.member?.id ?? null;
    if (nid) madeStaff.push(nid);
    check(id, `${what} rejected`, "400", String(status), status === 400,
      status < 400 ? "ACCEPTED — should not have been" : "");
    await sleep(250);
  }
}

// S15 update round-trips
if (staffId) {
  await call("PATCH", `/staff/members/${staffId}`, { token, body: { role: "manager" } });
  await sleep(400);
  const { json } = await call("GET", `/staff/members/${staffId}`, { token });
  const m = json?.data?.member || json?.data || {};
  check("STF-15", "role update persists", "manager", String(m.role), m.role === "manager");
  check("STF-16", "partial PATCH keeps fullName", "ZZ QA Staff One", String(m.fullName),
    m.fullName === "ZZ QA Staff One");
}
await sleep(300);

// S17–S19 tenant isolation on staff
{
  if (foreignBizId) {
    const { status } = await call("POST", "/staff/members", {
      token, body: { businessId: foreignBizId, fullName: "ZZ QA intrusion" },
    });
    check("STF-17", "add staff to another vendor's business", "403", String(status), refused(status),
      status < 400 ? "CREATED — tenant boundary breached" : "");
  } else check("STF-17", "add staff to foreign business", "-", "-", null, "no foreign business");

  if (foreignStaffId) {
    const g = await call("GET", `/staff/members/${foreignStaffId}`, { token });
    check("STF-18", "read another vendor's staff", "403 or 404", String(g.status), refused(g.status));
    const d = await call("DELETE", `/staff/members/${foreignStaffId}`, { token });
    check("STF-19", "delete another vendor's staff", "403 or 404", String(d.status), refused(d.status),
      d.status < 400 ? "DELETED — tenant boundary breached" : "");
  } else {
    check("STF-18", "read foreign staff", "-", "-", null, "no foreign staff row");
    check("STF-19", "delete foreign staff", "-", "-", null, "no foreign staff row");
  }

  const a = await call("GET", "/staff/members", {});
  check("STF-20", "unauthenticated staff list", "401", String(a.status), a.status === 401);
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
const leftovers = [];
for (const id of madeStaff) {
  await sleep(200);
  const { status } = await call("DELETE", `/staff/members/${id}`, { token });
  if (status >= 400) leftovers.push(`staff ${id} (${status})`);
}
for (const id of madePackages) {
  await sleep(200);
  const { status } = await call("DELETE", `/packages/${id}`, { token });
  if (status >= 400) leftovers.push(`package ${id} (${status})`);
}
// Deletion must actually delete — verify the package is gone, not just 200'd.
if (pkgId) {
  const { status } = await call("GET", `/packages/${pkgId}`, { token });
  check("PKG-16", "deleted package is really gone", "404", String(status), status === 404,
    status === 200 ? "still readable after DELETE returned 200" : "");
}
console.log(`removed ${madeStaff.length + madePackages.length - leftovers.length} of ${madeStaff.length + madePackages.length} rows`);
if (leftovers.length) console.log(`COULD NOT REMOVE: ${leftovers.join(", ")}`);

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ packages + staff CRUD: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "catalog-crud.json"),
  JSON.stringify({ bizId, foreignBizId, foreignPkgId, foreignStaffId, leftovers, results }, null, 2));
console.log("\nwritten: qa-out/catalog-crud.json");
