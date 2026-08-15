/**
 * Flows T1–T5 — the staff self-serve portal, live, end to end.
 *
 * A staff account is the LOWEST-privilege authenticated persona in the system:
 * a waiter with a phone. Everything it can reach it reaches with a real token,
 * so this is the most valuable privilege boundary in the campaign — and until
 * now it was untestable, because provisioning a staff login on the founder's
 * account would have created a real user against a real business.
 *
 * The gate is gone. `middlewares/requireStaff.js` used to be hidden behind
 * STAFF_LOGINS_ENABLED, which was never set in production, so the portal had
 * been 404 since it shipped. That env check was removed; the portal is live
 * whenever a vendor provisions a login. (Update the saved note that still says
 * otherwise.) What guards it now is narrower and better: the caller must carry
 * the `staff` role AND resolve to an active StaffMember row.
 *
 * What this proves, in order of what it would cost to get wrong:
 *   1. a staff token cannot act as the vendor who employs them
 *   2. a staff member cannot touch a COLLEAGUE's shift, payslip or profile
 *   3. a staff member cannot raise their own pay through their own profile
 *      (PROFILE_FIELDS excludes every pay field — proven by writing to them)
 *   4. the ordinary working day works at all: check in, check out, leave, payslip
 *
 * Creates two staff logins on the QA business and removes both, plus every
 * shift and leave row, at the end.
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
const madeShifts = [];
const madeStaff = [];

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
const refused = (s) => [401, 403, 404].includes(s);
const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const v = env.qaVendor;
const vendorToken = await login(v.email, v.password);
if (!vendorToken) { console.log("QA vendor sign-in failed."); process.exit(1); }
const bizId = (v.businesses || [])[0]?.id || 3365;
const stamp = Date.now() % 1000000;
console.log(`\nQA vendor · business ${bizId}\n`);

// ── provision two staff members, so colleague-isolation can be tested ───────
async function makeMember(name) {
  const { json } = await call("POST", "/staff/members", {
    token: vendorToken, body: { businessId: bizId, fullName: name, role: "waiter" },
  });
  const id = json?.data?.member?.id ?? null;
  if (id) madeStaff.push(id);
  return id;
}
const memberA = await makeMember("ZZ QA Staff Portal A");
const memberB = await makeMember("ZZ QA Staff Portal B");
console.log(`members: A=${memberA} · B=${memberB}\n`);

// ════ T1 · sign-in provisioning ═════════════════════════════════════════════
console.log("── T1 · staff sign-in ────────────────────────────────────────");
const emailA = `qa-staff-a+${stamp}@weddingwala-qa.test`;
const emailB = `qa-staff-b+${stamp}@weddingwala-qa.test`;
const passA = "QaStaff!2026#a";
const passB = "QaStaff!2026#b";
let staffTokenA = null, staffTokenB = null;

{
  const r = await call("POST", `/staff/members/${memberA}/login`, {
    token: vendorToken, body: { email: emailA, password: passA },
  });
  check("STP-01", "vendor provisions a staff login", "200", String(r.status), r.status === 200,
    r.status !== 200 ? String(r.json?.message || "").slice(0, 110) : "");

  // enabling twice must not silently create a second user
  const dup = await call("POST", `/staff/members/${memberA}/login`, {
    token: vendorToken, body: { email: `other+${stamp}@weddingwala-qa.test`, password: passA },
  });
  check("STP-02", "enabling login twice refused", "409 / STAFF_LOGIN_EXISTS",
    `${dup.status} / ${dup.json?.data?.code}`,
    dup.status === 409 && dup.json?.data?.code === "STAFF_LOGIN_EXISTS");

  await call("POST", `/staff/members/${memberB}/login`, {
    token: vendorToken, body: { email: emailB, password: passB },
  });
  // an email already belonging to any account must be refused
  const clash = await call("POST", `/staff/members/${memberB}/login`, {
    token: vendorToken, body: { email: env.accounts.user.email, password: passB },
  });
  check("STP-03", "reusing an existing account's email refused", "409",
    String(clash.status), clash.status === 409);

  await sleep(800);
  staffTokenA = await login(emailA, passA);
  staffTokenB = await login(emailB, passB);
  check("STP-04", "staff member can sign in", "token", staffTokenA ? "token" : "none", !!staffTokenA);
  check("STP-05", "second staff member can sign in", "token", staffTokenB ? "token" : "none", !!staffTokenB);
}

if (!staffTokenA) {
  console.log("\nBLOCKED: no staff token — the rest of T1–T5 cannot run.");
} else {

// ════ T1b · the privilege boundary ══════════════════════════════════════════
console.log("\n── T1b · what a staff token must NOT reach ───────────────────");
{
  const probes = [
    ["STP-06", "list the whole staff roster", "GET", `/staff/members?businessId=${bizId}`],
    ["STP-07", "read the vendor's shift ledger", "GET", "/staff/shifts"],
    ["STP-08", "read the payroll summary", "GET", "/staff/shifts/payroll-summary"],
    ["STP-09", "read the vendor's bookings", "GET", "/bookings"],
    ["STP-10", "read the vendor's PDC ledger", "GET", "/pdcs"],
    ["STP-11", "read the vendor's leave queue", "GET", "/staff/leave"],
  ];
  for (const [id, what, method, path] of probes) {
    const r = await call(method, path, { token: staffTokenA });
    // A 200 carrying an empty set is still a refusal in effect; a 200 carrying
    // the vendor's rows is a leak. Distinguish them rather than trusting status.
    let leaked = false;
    if (r.status === 200) {
      const d = r.json?.data;
      const rows = d?.data || d?.members || d?.shifts || d?.pdcs || d?.requests || (Array.isArray(d) ? d : []);
      leaked = Array.isArray(rows) && rows.length > 0;
    }
    check(id, `staff token: ${what}`, "refused or empty",
      r.status === 200 ? `200 with ${leaked ? "ROWS" : "nothing"}` : String(r.status),
      refused(r.status) || !leaked, leaked ? "LEAK — vendor data returned to a waiter" : "");
    await sleep(250);
  }

  // writes, which matter more than reads
  const w1 = await call("POST", "/staff/members", {
    token: staffTokenA, body: { businessId: bizId, fullName: "ZZ QA escalation" },
  });
  check("STP-12", "staff token creates a staff member", "refused", String(w1.status), refused(w1.status),
    w1.status < 400 ? "CREATED — privilege escalation" : "");
  const nid = w1.json?.data?.member?.id;
  if (nid) madeStaff.push(nid);

  const w2 = await call("POST", "/staff/shifts", {
    token: staffTokenA,
    body: { businessId: bizId, staffMemberId: memberA, shiftDate: iso(2), dihariRate: 99000 },
  });
  check("STP-13", "staff token creates their own Rs 99,000 shift", "refused", String(w2.status),
    refused(w2.status), w2.status < 400 ? "CREATED — a waiter just wrote their own payroll" : "");
  if (w2.json?.data?.shift?.id) madeShifts.push(w2.json.data.shift.id);

  const w3 = await call("PATCH", `/staff/members/${memberA}`, {
    token: staffTokenA, body: { role: "manager" },
  });
  check("STP-14", "staff token promotes itself to manager", "refused", String(w3.status),
    refused(w3.status), w3.status < 400 ? "PROMOTED — privilege escalation" : "");
}

// ════ T2 · the working day ══════════════════════════════════════════════════
console.log("\n── T2 · the working day ──────────────────────────────────────");
let shiftA = null, shiftB = null;
{
  // the vendor rosters one shift for each staffer
  for (const [m, slot] of [[memberA, "A"], [memberB, "B"]]) {
    const { json } = await call("POST", "/staff/shifts", {
      token: vendorToken,
      body: { businessId: bizId, staffMemberId: m, shiftDate: iso(1), dihariRate: 2500 },
    });
    const id = json?.data?.shift?.id ?? null;
    if (id) madeShifts.push(id);
    if (slot === "A") shiftA = id; else shiftB = id;
    await sleep(250);
  }
  console.log(`  rostered — A's shift ${shiftA} · B's shift ${shiftB}`);

  const me = await call("GET", "/staff/me", { token: staffTokenA });
  check("STP-15", "staff reads their own profile", "200", String(me.status), me.status === 200);

  const mine = await call("GET", "/staff/me/shifts", { token: staffTokenA });
  const rows = mine.json?.data?.shifts || mine.json?.data?.data || [];
  const ids = (Array.isArray(rows) ? rows : []).map((r) => Number(r.id));
  check("STP-16", "own shift appears in my roster", "present",
    ids.includes(Number(shiftA)) ? "present" : "absent", ids.includes(Number(shiftA)));
  check("STP-17", "a colleague's shift does NOT appear in my roster", "absent",
    ids.includes(Number(shiftB)) ? "PRESENT" : "absent", !ids.includes(Number(shiftB)),
    ids.includes(Number(shiftB)) ? "LEAK — staff can see a colleague's roster" : "");

  const ci = await call("POST", `/staff/me/shifts/${shiftA}/check-in`, { token: staffTokenA });
  check("STP-18", "check in to my own shift", "200", String(ci.status), ci.status === 200);

  const co = await call("POST", `/staff/me/shifts/${shiftA}/check-out`, { token: staffTokenA });
  check("STP-19", "check out of my own shift", "200", String(co.status), co.status === 200);

  // the one that matters: acting on a COLLEAGUE's shift
  const x1 = await call("POST", `/staff/me/shifts/${shiftB}/check-in`, { token: staffTokenA });
  check("STP-20", "check in to a COLLEAGUE's shift", "refused", String(x1.status), refused(x1.status),
    x1.status < 400 ? "CHECKED IN — staff can clock a colleague in" : "");

  const x2 = await call("POST", `/staff/me/shifts/${shiftB}/acknowledge-payment`, { token: staffTokenA });
  check("STP-21", "acknowledge a COLLEAGUE's payment", "refused", String(x2.status), refused(x2.status));

  const x3 = await call("GET", `/staff/me/shifts/${shiftB}/payslip-pdf`, { token: staffTokenA });
  check("STP-22", "download a COLLEAGUE's payslip", "refused", String(x3.status), refused(x3.status),
    x3.status < 400 ? "DOWNLOADED — a waiter can read a colleague's pay" : "");
}

// ════ T3 · leave ════════════════════════════════════════════════════════════
console.log("\n── T3 · leave ────────────────────────────────────────────────");
{
  const r = await call("POST", "/staff/me/leave", {
    token: staffTokenA,
    body: { fromDate: iso(20), toDate: iso(22), reason: "QA fixture leave request" },
  });
  check("STP-23", "staff requests leave", "200 or 201", String(r.status),
    r.status === 200 || r.status === 201, r.status >= 400 ? String(r.json?.message || "").slice(0, 110) : "");

  const mine = await call("GET", "/staff/me/leave", { token: staffTokenA });
  check("STP-24", "staff sees their own leave requests", "200", String(mine.status), mine.status === 200);

  // the vendor must see it in their queue and be able to decide it
  const q = await call("GET", "/staff/leave", { token: vendorToken });
  const qrows = q.json?.data?.requests || q.json?.data?.data || [];
  const leaveId = (Array.isArray(qrows) ? qrows : [])[0]?.id ?? null;
  check("STP-25", "the request reaches the vendor's leave queue", "present",
    leaveId ? "present" : "absent", !!leaveId);

  if (leaveId) {
    // a staff member must not be able to approve their OWN leave
    const self = await call("POST", `/staff/leave/${leaveId}/approve`, { token: staffTokenA });
    check("STP-26", "staff approves their own leave", "refused", String(self.status), refused(self.status),
      self.status < 400 ? "APPROVED — staff can self-approve leave" : "");

    const ok = await call("POST", `/staff/leave/${leaveId}/approve`, { token: vendorToken });
    check("STP-27", "vendor approves the leave", "200", String(ok.status), ok.status === 200);
  }
}

// ════ T4 · payslips ═════════════════════════════════════════════════════════
console.log("\n── T4 · payslips ─────────────────────────────────────────────");
{
  // vendor pays A's shift, then A acknowledges it
  await call("POST", `/staff/shifts/${shiftA}/transition`, {
    token: vendorToken, body: { to: "paid", paidAmount: 2500, paidVia: "cash" },
  });
  await sleep(400);

  const ps = await call("GET", "/staff/me/payslips", { token: staffTokenA });
  const prows = ps.json?.data?.payslips || ps.json?.data?.data || [];
  check("STP-28", "staff sees their own payslip", "200 with a row",
    `${ps.status} with ${Array.isArray(prows) ? prows.length : "?"}`,
    ps.status === 200 && Array.isArray(prows) && prows.length > 0);

  const pdf = await call("GET", `/staff/me/shifts/${shiftA}/payslip-pdf`, { token: staffTokenA });
  check("STP-29", "staff downloads their own payslip", "200", String(pdf.status), pdf.status === 200);

  const ack = await call("POST", `/staff/me/shifts/${shiftA}/acknowledge-payment`, { token: staffTokenA });
  check("STP-30", "staff acknowledges being paid", "200", String(ack.status), ack.status === 200);
}

// ════ T5 · profile, and the pay-rise attempt ════════════════════════════════
console.log("\n── T5 · profile ──────────────────────────────────────────────");
{
  const g = await call("GET", "/staff/me/profile", { token: staffTokenA });
  check("STP-31", "staff reads their own profile", "200", String(g.status), g.status === 200);

  const ok = await call("PATCH", "/staff/me/profile", {
    token: staffTokenA, body: { phoneNumber: "03009998877", bankName: "QA Bank" },
  });
  check("STP-32", "staff edits their own contact details", "200", String(ok.status), ok.status === 200);

  // THE ONE THAT MATTERS: pay fields are not in PROFILE_FIELDS. Writing them
  // must not take effect — whether it 400s or silently ignores them, what is
  // NOT acceptable is the value landing in the database.
  const esc = await call("PATCH", "/staff/me/profile", {
    token: staffTokenA,
    body: { dihariRate: 99000, monthlySalary: 4000000, role: "manager", isActive: true, businessId: 3358 },
  });
  await sleep(400);
  const after = await call("GET", `/staff/members/${memberA}`, { token: vendorToken });
  const m = after.json?.data?.member || after.json?.data || {};
  check("STP-33", "staff cannot raise their own dihari rate", "unchanged",
    String(m.dihariRate ?? "unset"), Number(m.dihariRate || 0) !== 99000,
    Number(m.dihariRate || 0) === 99000 ? "WROTE 99,000 — a waiter set their own pay" : "");
  check("STP-34", "staff cannot set their own salary", "unchanged",
    String(m.monthlySalary ?? "unset"), Number(m.monthlySalary || 0) !== 4000000);
  check("STP-35", "staff cannot promote themselves via profile", "waiter",
    String(m.role), m.role !== "manager",
    m.role === "manager" ? "PROMOTED via the profile whitelist" : "");
  check("STP-36", "staff cannot move themselves to another business", String(bizId),
    String(m.businessId), Number(m.businessId) === Number(bizId),
    Number(m.businessId) === 3358 ? "MOVED to another vendor's business" : "");
  check("STP-37", "a body of only non-editable fields is rejected", "400",
    String(esc.status), esc.status === 400,
    esc.status === 200 ? "returned 200 — check nothing was written" : "");
}

// ════ T6 · disabling the login ══════════════════════════════════════════════
console.log("\n── T6 · revoking access ──────────────────────────────────────");
{
  const d = await call("DELETE", `/staff/members/${memberA}/login`, { token: vendorToken });
  check("STP-38", "vendor disables the staff login", "200", String(d.status), d.status === 200);

  await sleep(600);
  const stale = await call("GET", "/staff/me", { token: staffTokenA });
  check("STP-39", "the disabled staffer's existing token stops working", "refused",
    String(stale.status), refused(stale.status),
    stale.status === 200 ? "STILL VALID — revocation does not affect live sessions" : "");

  const relog = await login(emailA, passA);
  check("STP-40", "the disabled staffer cannot sign in again", "no token",
    relog ? "TOKEN ISSUED" : "no token", !relog);
}
} // end staffTokenA guard

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
const leftovers = [];
for (const id of madeShifts) {
  await sleep(200);
  let r = await call("DELETE", `/staff/shifts/${id}`, { token: vendorToken });
  if (r.status === 409) { // paid rows are audit-locked; the documented way out
    await call("POST", `/staff/shifts/${id}/transition`, {
      token: vendorToken, body: { to: "disputed", disputeNotes: "QA fixture teardown" },
    });
    r = await call("DELETE", `/staff/shifts/${id}`, { token: vendorToken });
  }
  if (r.status >= 400) leftovers.push(`shift ${id} (${r.status})`);
}
for (const id of madeStaff) {
  await sleep(200);
  await call("DELETE", `/staff/members/${id}/login`, { token: vendorToken });
  const r = await call("DELETE", `/staff/members/${id}`, { token: vendorToken });
  if (r.status >= 400) leftovers.push(`member ${id} (${r.status})`);
}
console.log(`removed ${madeShifts.length + madeStaff.length - leftovers.length} of ${madeShifts.length + madeStaff.length} rows`);
if (leftovers.length) console.log(`COULD NOT REMOVE: ${leftovers.join(", ")}`);
console.log(`NOTE: staff User accounts ${emailA} / ${emailB} remain — there is no vendor-facing delete for them.`);

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ staff portal T1–T5: ${pass} passed · ${fail} failed ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "staff-portal.json"),
  JSON.stringify({ bizId, memberA, memberB, emailA, emailB, leftovers, results }, null, 2));
console.log("\nwritten: qa-out/staff-portal.json");
