/**
 * Flow V8b — staff shifts, attendance and shift payroll, live on the seeded
 * vendor. This is the money half of V8, and the reason the disposable vendor
 * exists: every assertion here writes a pay row, so none of it could be run
 * against the founder's real account.
 *
 * Oracles, all read from utils/staffHelpers.js before writing a line of this:
 *
 *   computeShiftPay
 *     gross = dihariRate + overtimeHours×overtimeRate + bonus
 *     net   = max(0, gross − deduction)          — rounded to whole rupees
 *
 *   shiftPaymentTransition — the behaviour that matters most:
 *     marking a shift "paid" for LESS than netPayable does not record "paid".
 *     It lands on "partial", with the balance still owed. Tolerance is
 *     max(1, round(netPayable × 2%)), which absorbs real cash rounding at a
 *     Pakistani event without absorbing a genuine shortfall.
 *     WW-227 — paying MORE than netPayable + tolerance is refused outright.
 *     WW-155 — a confirmed no-show ('absent') cannot be paid at all.
 *
 *   staffAttendanceTransition — orthogonal to payment:
 *     scheduled → checked_in → completed, with absent/excused/replaced and
 *     the deliberate undo edges (completed → checked_in, replaced → scheduled).
 *
 * Every row created is deleted at the end, and anything that could not be
 * removed is reported rather than passed over in silence.
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

const iso = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const v = env.qaVendor;
const token = await login(v.email, v.password);
if (!token) { console.log("QA vendor sign-in failed."); process.exit(1); }
const bizId = (v.businesses || [])[0]?.id || 3365;
console.log(`\nQA vendor · business ${bizId}\n`);

// A staff member to hang shifts on.
let memberId = null;
{
  const { json } = await call("POST", "/staff/members", {
    token, body: { businessId: bizId, fullName: "ZZ QA Payroll Subject", role: "waiter" },
  });
  memberId = json?.data?.member?.id ?? null;
  if (memberId) madeStaff.push(memberId);
  console.log(`staff member ${memberId}\n`);
}
if (!memberId) { console.log("BLOCKED: could not create a staff member."); process.exit(1); }

/** Create a shift and return { id, netPayable } as the server computed it. */
async function newShift(fields = {}) {
  const body = {
    businessId: bizId, staffMemberId: memberId, shiftDate: iso(3),
    dihariRate: 2000, ...fields,
  };
  const { status, json } = await call("POST", "/staff/shifts", { token, body });
  const s = json?.data?.shift || {};
  if (s.id) madeShifts.push(s.id);
  else console.log(`     (shift not created: ${status} ${String(json?.message || "").slice(0, 120)})`);
  return { id: s.id ?? null, net: Number(s.netPayable), gross: Number(s.grossPayable), row: s, status };
}
const move = async (id, body) => {
  const { status, json } = await call("POST", `/staff/shifts/${id}/transition`, { token, body });
  return { status, code: json?.data?.code || null, shift: json?.data?.shift || {} };
};
const attend = async (id, body) => {
  const { status, json } = await call("POST", `/staff/shifts/${id}/attendance`, { token, body });
  return { status, code: json?.data?.code || null, shift: json?.data?.shift || {} };
};

// ════ A · pay arithmetic ════════════════════════════════════════════════════
console.log("── A · pay arithmetic ────────────────────────────────────────");
{
  // base only
  const a = await newShift({ dihariRate: 2000 });
  check("SHF-01", "base only → net 2000", "2000", String(a.net), a.net === 2000);
  await sleep(250);

  // base + overtime
  const b = await newShift({ dihariRate: 2000, overtimeHours: 3, overtimeRate: 500 });
  check("SHF-02", "2000 + 3h×500 → gross 3500", "3500", String(b.gross), b.gross === 3500);
  await sleep(250);

  // full formula: 2000 + 2×400 + 1000 − 300 = 3500
  const c = await newShift({
    dihariRate: 2000, overtimeHours: 2, overtimeRate: 400,
    bonusAmount: 1000, deductionAmount: 300,
  });
  check("SHF-03", "2000 + 800 + 1000 − 300 → net 3500", "3500", String(c.net), c.net === 3500);
  await sleep(250);

  // deduction larger than gross must floor at 0, never go negative
  const d = await newShift({ dihariRate: 1000, deductionAmount: 5000 });
  check("SHF-04", "deduction over gross floors at 0", "0", String(d.net), d.net === 0);
  await sleep(250);
}

// ════ B · pay validation bounds ═════════════════════════════════════════════
console.log("\n── B · typo guards ───────────────────────────────────────────");
{
  const cases = [
    ["SHF-05", "dihariRate over Rs 1 lakh", { dihariRate: 200000 }],
    ["SHF-06", "negative dihariRate", { dihariRate: -500 }],
    ["SHF-07", "missing dihariRate", { dihariRate: undefined }],
    ["SHF-08", "overtime over 24h", { dihariRate: 2000, overtimeHours: 30, overtimeRate: 100 }],
    ["SHF-09", "overtime rate over Rs 50k/h", { dihariRate: 2000, overtimeHours: 1, overtimeRate: 60000 }],
    ["SHF-10", "bonus over Rs 10 lakh", { dihariRate: 2000, bonusAmount: 2000000 }],
    ["SHF-11", "deduction over Rs 10 lakh", { dihariRate: 2000, deductionAmount: 2000000 }],
    ["SHF-12", "invalid shiftDate", { dihariRate: 2000, shiftDate: "not-a-date" }],
  ];
  for (const [id, what, fields] of cases) {
    const body = { businessId: bizId, staffMemberId: memberId, shiftDate: iso(3), dihariRate: 2000, ...fields };
    if (fields.dihariRate === undefined) delete body.dihariRate;
    const { status, json } = await call("POST", "/staff/shifts", { token, body });
    const nid = json?.data?.shift?.id ?? null;
    if (nid) madeShifts.push(nid);
    check(id, `${what} rejected`, "400", String(status), status === 400,
      status < 400 ? "ACCEPTED — should not have been" : "");
    await sleep(250);
  }
}

// ════ C · the partial-payment state ═════════════════════════════════════════
console.log("\n── C · partial payment ───────────────────────────────────────");
{
  // net 5000, tolerance = max(1, 100) = 100
  // C1 short payment marked "paid" must LAND on partial
  const s1 = await newShift({ dihariRate: 5000 });
  if (s1.id) {
    const r = await move(s1.id, { to: "paid", paidAmount: 3000, paidVia: "cash" });
    check("SHF-13", "marking 3000 of 5000 'paid' lands on partial", "partial",
      String(r.shift.paymentStatus), r.shift.paymentStatus === "partial",
      "this is the headline behaviour — a shortfall must not read as paid");
    check("SHF-14", "the amount actually paid is recorded", "3000",
      String(r.shift.paidAmount), Number(r.shift.paidAmount) === 3000);

    // C2 top up the balance → now genuinely paid
    await sleep(300);
    const r2 = await move(s1.id, { to: "paid", paidAmount: 5000, paidVia: "cash" });
    check("SHF-15", "topping up to 5000 lands on paid", "paid",
      String(r2.shift.paymentStatus), r2.shift.paymentStatus === "paid");
  }
  await sleep(300);

  // C3 within tolerance (5000 net, pay 4950 — 50 short, tolerance 100) → paid
  const s2 = await newShift({ dihariRate: 5000 });
  if (s2.id) {
    const r = await move(s2.id, { to: "paid", paidAmount: 4950, paidVia: "cash" });
    check("SHF-16", "50 short of 5000 is within 2% tolerance → paid", "paid",
      String(r.shift.paymentStatus), r.shift.paymentStatus === "paid",
      "cash rounding at an event must not be called a shortfall");
  }
  await sleep(300);

  // C4 just outside tolerance (150 short) → partial
  const s3 = await newShift({ dihariRate: 5000 });
  if (s3.id) {
    const r = await move(s3.id, { to: "paid", paidAmount: 4850, paidVia: "cash" });
    check("SHF-17", "150 short of 5000 is outside tolerance → partial", "partial",
      String(r.shift.paymentStatus), r.shift.paymentStatus === "partial");
  }
  await sleep(300);

  // C5 WW-227 — overpayment refused
  const s4 = await newShift({ dihariRate: 5000 });
  if (s4.id) {
    const r = await move(s4.id, { to: "paid", paidAmount: 50000, paidVia: "cash" });
    check("SHF-18", "paying 50,000 on a 5,000 shift refused", "400 / PAID_EXCEEDS_NETPAYABLE",
      `${r.status} / ${r.code}`, r.status === 400 && r.code === "PAID_EXCEEDS_NETPAYABLE");
  }
}

// ════ D · payment transition guards ═════════════════════════════════════════
console.log("\n── D · payment guards ────────────────────────────────────────");
{
  const s = await newShift({ dihariRate: 4000 });
  if (s.id) {
    const a = await move(s.id, { to: "paid", paidVia: "cash" });
    check("SHF-19", "pay with no amount refused", "400 / MISSING_PAID_AMOUNT",
      `${a.status} / ${a.code}`, a.status === 400 && a.code === "MISSING_PAID_AMOUNT");

    const b = await move(s.id, { to: "paid", paidAmount: 4000 });
    check("SHF-20", "pay with no method refused", "400 / MISSING_PAID_VIA",
      `${b.status} / ${b.code}`, b.status === 400 && b.code === "MISSING_PAID_VIA");

    const c = await move(s.id, { to: "paid", paidAmount: 4000, paidVia: "bitcoin" });
    check("SHF-21", "unknown payment method refused", "400 / INVALID_PAID_VIA",
      `${c.status} / ${c.code}`, c.status === 400 && c.code === "INVALID_PAID_VIA");

    const d = await move(s.id, { to: "paid", paidAmount: -500, paidVia: "cash" });
    check("SHF-22", "negative payment refused", "400 / MISSING_PAID_AMOUNT",
      `${d.status} / ${d.code}`, d.status === 400 && d.code === "MISSING_PAID_AMOUNT");

    const e = await move(s.id, { to: "disputed" });
    check("SHF-23", "dispute with no notes refused", "400 / MISSING_DISPUTE_NOTES",
      `${e.status} / ${e.code}`, e.status === 400 && e.code === "MISSING_DISPUTE_NOTES");

    const f = await move(s.id, { to: "disputed", disputeNotes: "Staffer says he worked longer" });
    check("SHF-24", "dispute with notes accepted", "disputed",
      String(f.shift.paymentStatus), f.shift.paymentStatus === "disputed");

    const g = await move(s.id, { to: "not-a-status" });
    check("SHF-25", "unknown payment status refused", "400 / INVALID_TO",
      `${g.status} / ${g.code}`, g.status === 400 && g.code === "INVALID_TO");
  }
  await sleep(300);

  // D8 jazzcash/easypaisa are legal PK methods and must be accepted
  const s2 = await newShift({ dihariRate: 3000 });
  if (s2.id) {
    const r = await move(s2.id, { to: "paid", paidAmount: 3000, paidVia: "easypaisa" });
    check("SHF-26", "easypaisa accepted as a payment method", "paid",
      String(r.shift.paymentStatus), r.shift.paymentStatus === "paid");
  }
}

// ════ E · attendance, and WW-155 ════════════════════════════════════════════
console.log("\n── E · attendance ────────────────────────────────────────────");
{
  const s = await newShift({ dihariRate: 3000 });
  if (s.id) {
    const a = await attend(s.id, { to: "checked_in" });
    check("SHF-27", "scheduled → checked_in", "checked_in",
      String(a.shift.attendanceStatus), a.shift.attendanceStatus === "checked_in");

    const b = await attend(s.id, { to: "completed" });
    check("SHF-28", "checked_in → completed", "completed",
      String(b.shift.attendanceStatus), b.shift.attendanceStatus === "completed");

    const c = await attend(s.id, { to: "checked_in" });
    check("SHF-29", "completed → checked_in (undo) allowed", "checked_in",
      String(c.shift.attendanceStatus), c.shift.attendanceStatus === "checked_in");

    const d = await attend(s.id, { to: "excused" });
    check("SHF-30", "checked_in → excused refused", "400 / INVALID_TRANSITION",
      `${d.status} / ${d.code}`, d.status === 400 && d.code === "INVALID_TRANSITION");
  }
  await sleep(300);

  // E5 WW-155 — a confirmed no-show cannot be paid
  const s2 = await newShift({ dihariRate: 3000 });
  if (s2.id) {
    const a = await attend(s2.id, { to: "absent" });
    check("SHF-31", "scheduled → absent", "absent",
      String(a.shift.attendanceStatus), a.shift.attendanceStatus === "absent");

    const b = await move(s2.id, { to: "paid", paidAmount: 3000, paidVia: "cash" });
    check("SHF-32", "paying a confirmed no-show refused (WW-155)", "400 / NO_SHOW_CANNOT_BE_PAID",
      `${b.status} / ${b.code}`, b.status === 400 && b.code === "NO_SHOW_CANNOT_BE_PAID");

    // an excused absence stays payable — the guard must be narrow
    const c = await attend(s2.id, { to: "excused" });
    const d = await move(s2.id, { to: "paid", paidAmount: 3000, paidVia: "cash" });
    check("SHF-33", "an excused staffer is still payable", "paid",
      `${c.shift.attendanceStatus} → ${d.shift.paymentStatus}`,
      d.shift.paymentStatus === "paid",
      "the no-show block must not catch excused absences");
  }
}

// ════ F · isolation ═════════════════════════════════════════════════════════
console.log("\n── F · isolation ─────────────────────────────────────────────");
{
  const other = await login(env.accounts.vendor.email, env.accounts.vendor.password);
  const target = madeShifts[0];
  const refused = (s) => [401, 403, 404].includes(s);
  if (other && target) {
    const g = await call("GET", `/staff/shifts/${target}`, { token: other });
    check("SHF-34", "another vendor reads my shift", "403 or 404", String(g.status), refused(g.status));
    const p = await call("POST", `/staff/shifts/${target}/transition`, {
      token: other, body: { to: "paid", paidAmount: 1, paidVia: "cash" },
    });
    check("SHF-35", "another vendor pays my shift", "403 or 404", String(p.status), refused(p.status),
      p.status < 400 ? "PAID — tenant boundary breached" : "");
    const d = await call("DELETE", `/staff/shifts/${target}`, { token: other });
    check("SHF-36", "another vendor deletes my shift", "403 or 404", String(d.status), refused(d.status));
  } else {
    check("SHF-34", "cross-vendor shift probes", "-", "-", null, "no second vendor token");
  }
  const u = await call("GET", "/staff/shifts", {});
  check("SHF-37", "unauthenticated shift list", "401", String(u.status), u.status === 401);
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
const leftovers = [];
for (const id of madeShifts) {
  await sleep(200);
  const { status } = await call("DELETE", `/staff/shifts/${id}`, { token });
  if (status >= 400) leftovers.push(`shift ${id} (${status})`);
}
for (const id of madeStaff) {
  await sleep(200);
  const { status } = await call("DELETE", `/staff/members/${id}`, { token });
  if (status >= 400) leftovers.push(`member ${id} (${status})`);
}
console.log(`removed ${madeShifts.length + madeStaff.length - leftovers.length} of ${madeShifts.length + madeStaff.length} rows`);
if (leftovers.length) console.log(`COULD NOT REMOVE: ${leftovers.join(", ")}`);

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ shifts + payroll: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "shift-payroll.json"),
  JSON.stringify({ bizId, memberId, leftovers, results }, null, 2));
console.log("\nwritten: qa-out/shift-payroll.json");
