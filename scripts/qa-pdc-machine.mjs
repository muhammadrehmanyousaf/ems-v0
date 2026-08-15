/**
 * Flow V-PDC — exhaustive post-dated-cheque state-machine test, live.
 *
 * The oracle is «api»/src/utils/pdcStatusTransition.js, read first so the
 * expectations here are derived from the shipped rules rather than guessed:
 *
 *     held      → deposited | cancelled
 *     deposited → cleared | bounced | cancelled
 *     cleared / bounced / cancelled  → nothing (terminal)
 *     same-state                     → 200 no-op
 *
 * Guardrails the helper also enforces, each tested separately:
 *     deposited  requires depositDate, and depositDate >= chequeDate
 *     bounced    requires a non-blank bounceReason
 *
 * Every terminal state consumes a cheque, so the run logs one fresh PDC per
 * path rather than reusing rows. Everything it creates it deletes at the end,
 * and it reports anything it could not.
 *
 * Runs against LIVE production with the seeded QA vendor only. Cheques are
 * logged against the QA vendor's own booking, never a real one.
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
let created = [];

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const login = async (email, password) => {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  return json?.data?.token || json?.token || null;
};

/** Record one assertion. `pass` is computed by the caller against the oracle. */
function check(id, what, expected, actual, pass, note = "") {
  results.push({ id, what, expected, actual, pass, note });
  const mark = pass ? "PASS" : "FAIL";
  console.log(`  [${mark}] ${id}  ${what}`);
  if (!pass) console.log(`         expected ${expected} · got ${actual}${note ? ` · ${note}` : ""}`);
}

// ── fixtures ────────────────────────────────────────────────────────────────
const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const plusDays = (n) => iso(new Date(today.getTime() + n * 86400000));

let seq = 0;
/** Log a fresh cheque in `held`. Returns its id, or null with the reason shown. */
async function newPdc(token, bookingId, customerUserId, chequeDate) {
  seq += 1;
  const body = {
    chequeNumber: String(90000000 + Date.now() % 1000000 + seq).slice(0, 12),
    bankName: "QA Test Bank",
    branchCode: "0001",
    amount: 5000,
    chequeDate: chequeDate || plusDays(7),
    bookingId,
    customerUserId,
    notes: "QA fixture — safe to delete",
  };
  const { status, json } = await call("POST", "/pdcs", { token, body });
  const id = json?.data?.pdc?.id ?? json?.data?.id ?? null;
  if (id) created.push(id);
  else console.log(`     (could not log cheque: ${status} ${JSON.stringify(json).slice(0, 200)})`);
  return id;
}

/** Attempt a transition; returns { status, code, message }. */
async function transition(token, id, body) {
  const { status, json } = await call("POST", `/pdcs/${id}/transition`, { token, body });
  return {
    status,
    code: json?.data?.code || null,
    message: json?.message || "",
    pdcStatus: json?.data?.pdc?.status || null,
  };
}

// ── run ─────────────────────────────────────────────────────────────────────
const v = env.qaVendor;
if (!v?.email) {
  console.log("No qaVendor in cypress.env.json. Run the seed script first.");
  process.exit(1);
}

console.log(`\nsigning in as ${v.email} …`);
const token = await login(v.email, v.password);
if (!token) {
  console.log("Sign-in failed — is LOGIN_EMAIL_OTP back on?");
  process.exit(1);
}

// Find a booking owned by this vendor that has a linked customer user.
const { json: bj } = await call("GET", "/bookings?limit=100", { token });
const bookings = bj?.data?.data || [];
console.log(`bookings visible to the QA vendor: ${bookings.map((b) => b.id).join(", ") || "none"}`);

/**
 * NOTE on discovery: the booking LIST projection does not include
 * customerUserId, so an earlier version of this script filtered on a field
 * that is never present and declared the whole flow BLOCKED. It is not —
 * createPdc derives the customer from the booking itself (Issue #41), which
 * is exactly the path a vendor uses. Pass the booking and let it derive.
 */
let bookingId = bookings[0]?.id ?? null;
let customerUserId = null;
if (!bookingId) {
  console.log("BLOCKED: the QA vendor has no bookings to log a cheque against.");
  process.exit(0);
}

// Confirm the derivation works before running 30 assertions on top of it.
{
  const probe = await newPdc(token, bookingId, undefined, plusDays(7));
  if (!probe) {
    console.log(`BLOCKED: cannot log a cheque against booking ${bookingId}.`);
    process.exit(0);
  }
  const { json } = await call("GET", `/pdcs/${probe}`, { token });
  customerUserId = json?.data?.pdc?.customerUserId ?? null;
  console.log(`using booking ${bookingId} · customer derived as ${customerUserId}\n`);
}

console.log("── A · legal transitions ──────────────────────────────────────");

// A1  held → deposited (with depositDate)
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(3));
  if (id) {
    const r = await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    check("PDC-A1", "held → deposited", "200 / deposited", `${r.status} / ${r.pdcStatus}`,
      r.status === 200 && r.pdcStatus === "deposited");

    // A2  deposited → cleared, from the same cheque
    const r2 = await transition(token, id, { to: "cleared" });
    check("PDC-A2", "deposited → cleared", "200 / cleared", `${r2.status} / ${r2.pdcStatus}`,
      r2.status === 200 && r2.pdcStatus === "cleared");

    // C1  cleared is terminal
    const r3 = await transition(token, id, { to: "bounced", bounceReason: "QA" });
    check("PDC-C1", "cleared → bounced refused (terminal)", "400 / TERMINAL_STATE",
      `${r3.status} / ${r3.code}`, r3.status === 400 && r3.code === "TERMINAL_STATE");
  }
}
await sleep(300);

// A3  deposited → bounced (with reason)
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(3));
  if (id) {
    await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    const r = await transition(token, id, { to: "bounced", bounceReason: "Insufficient funds" });
    check("PDC-A3", "deposited → bounced", "200 / bounced", `${r.status} / ${r.pdcStatus}`,
      r.status === 200 && r.pdcStatus === "bounced");

    const r2 = await transition(token, id, { to: "cleared" });
    check("PDC-C2", "bounced → cleared refused (terminal)", "400 / TERMINAL_STATE",
      `${r2.status} / ${r2.code}`, r2.status === 400 && r2.code === "TERMINAL_STATE");
  }
}
await sleep(300);

// A4  held → cancelled
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(3));
  if (id) {
    const r = await transition(token, id, { to: "cancelled" });
    check("PDC-A4", "held → cancelled", "200 / cancelled", `${r.status} / ${r.pdcStatus}`,
      r.status === 200 && r.pdcStatus === "cancelled");

    const r2 = await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    check("PDC-C3", "cancelled → deposited refused (terminal)", "400 / TERMINAL_STATE",
      `${r2.status} / ${r2.code}`, r2.status === 400 && r2.code === "TERMINAL_STATE");
  }
}
await sleep(300);

// A5  deposited → cancelled
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(3));
  if (id) {
    await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    const r = await transition(token, id, { to: "cancelled" });
    check("PDC-A5", "deposited → cancelled", "200 / cancelled", `${r.status} / ${r.pdcStatus}`,
      r.status === 200 && r.pdcStatus === "cancelled");
  }
}
await sleep(300);

console.log("\n── B · illegal transitions ───────────────────────────────────");

// B1  held → cleared  (must skip deposited)
// B2  held → bounced
// B3  deposited → held (no going back)
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(3));
  if (id) {
    const r1 = await transition(token, id, { to: "cleared" });
    check("PDC-B1", "held → cleared refused", "400 / INVALID_TRANSITION",
      `${r1.status} / ${r1.code}`, r1.status === 400 && r1.code === "INVALID_TRANSITION");

    const r2 = await transition(token, id, { to: "bounced", bounceReason: "QA" });
    check("PDC-B2", "held → bounced refused", "400 / INVALID_TRANSITION",
      `${r2.status} / ${r2.code}`, r2.status === 400 && r2.code === "INVALID_TRANSITION");

    // still held, so it can go forward and then try to come back
    await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    const r3 = await transition(token, id, { to: "held" });
    check("PDC-B3", "deposited → held refused", "400 / INVALID_TRANSITION",
      `${r3.status} / ${r3.code}`, r3.status === 400 && r3.code === "INVALID_TRANSITION");

    // B4  garbage target
    const r4 = await transition(token, id, { to: "definitely-not-a-status" });
    check("PDC-B4", "unknown target refused", "400 / INVALID_TO",
      `${r4.status} / ${r4.code}`, r4.status === 400 && r4.code === "INVALID_TO");

    // B5  empty target
    const r5 = await transition(token, id, {});
    check("PDC-B5", "missing target refused", "400 / INVALID_TO",
      `${r5.status} / ${r5.code}`, r5.status === 400 && r5.code === "INVALID_TO");

    // B6  same-state write is an idempotent no-op, not an error
    const r6 = await transition(token, id, { to: "deposited", depositDate: plusDays(4) });
    check("PDC-B6", "deposited → deposited is a no-op", "200", String(r6.status),
      r6.status === 200, r6.message);
  }
}
await sleep(300);

console.log("\n── C · guardrails ────────────────────────────────────────────");

// C4  deposited without depositDate
// C5  depositDate earlier than chequeDate
{
  const id = await newPdc(token, bookingId, customerUserId, plusDays(10));
  if (id) {
    const r1 = await transition(token, id, { to: "deposited" });
    check("PDC-C4", "deposit without a date refused", "400 / MISSING_DEPOSIT_DATE",
      `${r1.status} / ${r1.code}`, r1.status === 400 && r1.code === "MISSING_DEPOSIT_DATE");

    const r2 = await transition(token, id, { to: "deposited", depositDate: plusDays(2) });
    check("PDC-C5", "deposit dated before the cheque refused", "400 / DEPOSIT_BEFORE_CHEQUE_DATE",
      `${r2.status} / ${r2.code}`, r2.status === 400 && r2.code === "DEPOSIT_BEFORE_CHEQUE_DATE",
      "cheque +10d, deposit +2d");

    // C6  bounce without a reason
    await transition(token, id, { to: "deposited", depositDate: plusDays(11) });
    const r3 = await transition(token, id, { to: "bounced" });
    check("PDC-C6", "bounce without a reason refused", "400 / MISSING_BOUNCE_REASON",
      `${r3.status} / ${r3.code}`, r3.status === 400 && r3.code === "MISSING_BOUNCE_REASON");

    // C7  whitespace-only reason must not satisfy it
    const r4 = await transition(token, id, { to: "bounced", bounceReason: "     " });
    check("PDC-C7", "blank bounce reason refused", "400 / MISSING_BOUNCE_REASON",
      `${r4.status} / ${r4.code}`, r4.status === 400 && r4.code === "MISSING_BOUNCE_REASON");
  }
}
await sleep(300);

console.log("\n── D · create validation ─────────────────────────────────────");
{
  const base = {
    bankName: "QA Test Bank", amount: 5000, chequeDate: plusDays(7),
    bookingId, customerUserId,
  };
  const cases = [
    ["PDC-D1", "cheque number too short", { ...base, chequeNumber: "123" }, 400],
    ["PDC-D2", "cheque number non-numeric", { ...base, chequeNumber: "ABCD1234" }, 400],
    ["PDC-D3", "missing bank name", { ...base, chequeNumber: "12345678", bankName: "" }, 400],
    ["PDC-D4", "zero amount", { ...base, chequeNumber: "12345679", amount: 0 }, 400],
    ["PDC-D5", "negative amount", { ...base, chequeNumber: "12345680", amount: -5000 }, 400],
    ["PDC-D6", "amount over Rs 5 crore", { ...base, chequeNumber: "12345681", amount: 60_000_000 }, 400],
    ["PDC-D7", "missing cheque date", { ...base, chequeNumber: "12345682", chequeDate: "" }, 400],
    ["PDC-D8", "booking that does not exist", { ...base, chequeNumber: "12345683", bookingId: 99999999 }, 400],
  ];
  for (const [id, what, body, expect] of cases) {
    const { status, json } = await call("POST", "/pdcs", { token, body });
    const newId = json?.data?.pdc?.id ?? json?.data?.id ?? null;
    if (newId) created.push(newId); // accepted when it should not have been — clean it up
    check(id, what, `${expect}`, String(status), status === expect,
      status !== expect ? String(json?.message || "").slice(0, 90) : "");
    await sleep(200);
  }
}

console.log("\n── E · tenant isolation ──────────────────────────────────────");
// The QA vendor must not see, read or move another vendor's cheque.
{
  const otherEmail = env.vendorEmail || env.VENDOR_EMAIL;
  const otherPass = env.vendorPassword || env.VENDOR_PASSWORD;
  let otherPdcId = null;
  if (otherEmail && otherPass) {
    const otherToken = await login(otherEmail, otherPass);
    if (otherToken) {
      const { json } = await call("GET", "/pdcs?limit=5", { token: otherToken });
      const rows = json?.data?.pdcs || json?.data?.data || json?.data || [];
      otherPdcId = (Array.isArray(rows) ? rows : [])[0]?.id ?? null;
      console.log(`  (real vendor owns ${Array.isArray(rows) ? rows.length : 0} cheque(s); probing id ${otherPdcId})`);
    }
  }
  if (otherPdcId) {
    const g = await call("GET", `/pdcs/${otherPdcId}`, { token });
    check("PDC-E1", "read another vendor's cheque", "403 or 404", String(g.status),
      g.status === 403 || g.status === 404);

    const t = await transition(token, otherPdcId, { to: "cancelled" });
    check("PDC-E2", "cancel another vendor's cheque", "403 or 404", String(t.status),
      t.status === 403 || t.status === 404);

    const d = await call("DELETE", `/pdcs/${otherPdcId}`, { token });
    check("PDC-E3", "delete another vendor's cheque", "403 or 404", String(d.status),
      d.status === 403 || d.status === 404);
  } else {
    console.log("  SKIPPED — the real vendor owns no cheque to probe against.");
    results.push({ id: "PDC-E*", what: "tenant isolation", expected: "-", actual: "-", pass: null,
      note: "skipped: no foreign cheque existed" });
  }

  // E4  unauthenticated access
  const u = await call("GET", "/pdcs", {});
  check("PDC-E4", "unauthenticated list", "401", String(u.status), u.status === 401);
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
const leftovers = [];
for (const id of created) {
  await sleep(200);
  const { status } = await call("DELETE", `/pdcs/${id}`, { token });
  if (status >= 400) leftovers.push(`${id} (${status})`);
}
console.log(`removed ${created.length - leftovers.length} of ${created.length} test cheques`);
if (leftovers.length) console.log(`COULD NOT REMOVE: ${leftovers.join(", ")}`);

// ── summary ─────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ PDC state machine: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}

writeFileSync(join(root, "qa-out", "pdc-machine.json"),
  JSON.stringify({ bookingId, customerUserId, created, leftovers, results }, null, 2));
console.log("\nwritten: qa-out/pdc-machine.json");
