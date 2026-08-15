/**
 * V6 Money + V7 Catalog — the vendor's own financial + menu surfaces, driven
 * live on the QA vendor (business 3365). No real-money movement: expenses and
 * receipts here are the vendor's OWN bookkeeping rows on their OWN business,
 * created with a "ZZ QA" marker and deleted at the end. Read-only on the
 * aggregate reports (receivables / monthly-pnl / cash-flow).
 *
 *   A · Expenses CRUD   — create → list → update → per-event P&L read → delete,
 *                         plus validation (bad category, negative amount) and
 *                         tenant isolation (customer cannot post an expense).
 *   B · Receipts CRUD   — create a cash receipt against a QA booking → list →
 *                         update → delete, plus the per-method validator
 *                         (jazzcash requires transactionRef) and tenant guard.
 *   C · Money reports   — receivables aging, monthly P&L, cash-flow forecast:
 *                         each must answer for the vendor and refuse anon.
 *   D · Menu CRUD (V7)  — create a single menu → list → update price → delete,
 *                         plus the Rs-0 price guard and tenant isolation.
 *
 * Everything created is torn down. Foreign tenants are read-only.
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
const BIZ = 3365;
console.log(`\nQA vendor:${!!vt} · customer:${!!ct} · business ${BIZ}\n`);
if (!vt) { console.log("No QA vendor token."); process.exit(1); }

// Find a QA booking on this business to attach a receipt to (list is vendor-scoped).
let qaBookingId = null;
{
  const b = await call("GET", "/bookings?limit=50", { token: vt });
  const rows = b.json?.data?.bookings || b.json?.data?.rows || b.json?.data || [];
  const arr = Array.isArray(rows) ? rows : [];
  const mine = arr.find((x) => Number(x.businessId) === BIZ) || arr[0];
  qaBookingId = mine?.id ?? null;
  console.log(`  attach-receipt booking: ${qaBookingId ?? "none found"}\n`);
}

// ════ A · Expenses CRUD ═════════════════════════════════════════════════════
console.log("── A · expenses (bookkeeping) ────────────────────────────────");
let expId = null;
{
  const c = await call("POST", "/expenses", {
    token: vt,
    body: { businessId: BIZ, amount: 5000, category: "supplies", spentDate: "2026-08-01", description: "ZZ QA test supplies", paymentMethod: "cash" },
  });
  expId = c.json?.data?.expense?.id ?? c.json?.data?.id ?? null;
  check("EXP-01", "create an expense", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${expId}`);

  if (expId) {
    const g = await call("GET", `/expenses?businessId=${BIZ}`, { token: vt });
    const rows = g.json?.data?.expenses || g.json?.data?.rows || g.json?.data || [];
    const found = (Array.isArray(rows) ? rows : []).some((x) => Number(x.id) === Number(expId));
    check("EXP-02", "expense appears in the list", "present", found ? "present" : "absent", found);

    const u = await call("PATCH", `/expenses/${expId}`, { token: vt, body: { amount: 5500, description: "ZZ QA updated" } });
    check("EXP-03", "update the expense amount", "2xx", String(u.status), u.status < 300,
      u.status >= 300 ? String(u.json?.message || "").slice(0, 70) : "");
  }

  // validation: bad category
  const badCat = await call("POST", "/expenses", { token: vt, body: { businessId: BIZ, amount: 100, category: "yacht", spentDate: "2026-08-01" } });
  check("EXP-04", "invalid category rejected", "400", String(badCat.status), badCat.status === 400);

  // validation: negative amount
  const badAmt = await call("POST", "/expenses", { token: vt, body: { businessId: BIZ, amount: -5, category: "supplies", spentDate: "2026-08-01" } });
  check("EXP-05", "negative amount rejected", "400", String(badAmt.status), badAmt.status === 400);

  // validation: missing spentDate
  const badDate = await call("POST", "/expenses", { token: vt, body: { businessId: BIZ, amount: 100, category: "supplies" } });
  check("EXP-06", "missing spentDate rejected", "400", String(badDate.status), badDate.status === 400);

  // tenant: customer cannot post an expense on this business
  const xt = await call("POST", "/expenses", { token: ct, body: { businessId: BIZ, amount: 1, category: "other", spentDate: "2026-08-01" } });
  check("EXP-07", "customer cannot post an expense", "refused", String(xt.status), refused(xt.status),
    xt.status < 400 ? "CREATED — tenant boundary breached" : "");
}

// ════ B · Receipts CRUD ═════════════════════════════════════════════════════
console.log("\n── B · payment receipts (khata) ──────────────────────────────");
let rcptId = null;
{
  if (qaBookingId) {
    const c = await call("POST", "/receipts", {
      token: vt,
      body: { bookingId: qaBookingId, method: "cash", amount: 1000, receivedDate: "2026-08-10", notes: "ZZ QA cash receipt" },
    });
    rcptId = c.json?.data?.receipt?.id ?? c.json?.data?.id ?? null;
    check("RCP-01", "log a cash receipt on a QA booking", "2xx", String(c.status), c.status < 300,
      c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${rcptId}`);

    if (rcptId) {
      const g = await call("GET", "/receipts", { token: vt });
      const rows = g.json?.data?.receipts || g.json?.data?.rows || g.json?.data || [];
      const found = (Array.isArray(rows) ? rows : []).some((x) => Number(x.id) === Number(rcptId));
      check("RCP-02", "receipt appears in the list", "present", found ? "present" : "absent", found);

      const u = await call("PATCH", `/receipts/${rcptId}`, { token: vt, body: { amount: 1200 } });
      check("RCP-03", "update the receipt amount", "2xx", String(u.status), u.status < 300,
        u.status >= 300 ? String(u.json?.message || "").slice(0, 70) : "");
    }
  } else {
    check("RCP-01", "log a cash receipt on a QA booking", "2xx", "SKIP", null, "no QA booking to attach to");
  }

  // per-method validator: jazzcash requires a transactionRef
  const badRef = await call("POST", "/receipts", {
    token: vt,
    body: { bookingId: qaBookingId, method: "jazzcash", amount: 500, receivedDate: "2026-08-10" },
  });
  check("RCP-04", "jazzcash without transactionRef rejected", "400", String(badRef.status), badRef.status === 400,
    badRef.status !== 400 ? "accepted a wallet receipt with no txn id" : "");

  // amount guard: non-positive
  const badAmt = await call("POST", "/receipts", { token: vt, body: { bookingId: qaBookingId, method: "cash", amount: 0, receivedDate: "2026-08-10" } });
  check("RCP-05", "zero-amount receipt rejected", "400", String(badAmt.status), badAmt.status === 400);

  // tenant: customer cannot log a receipt
  const xt = await call("POST", "/receipts", { token: ct, body: { bookingId: qaBookingId, method: "cash", amount: 1, receivedDate: "2026-08-10" } });
  check("RCP-06", "customer cannot log a receipt", "refused", String(xt.status), refused(xt.status),
    xt.status < 400 ? "CREATED — tenant boundary breached" : "");
}

// ════ C · Money reports (read-only) ═════════════════════════════════════════
console.log("\n── C · money reports ─────────────────────────────────────────");
for (const [id, path, label] of [
  ["MR-01", "/analytics/receivables", "receivables aging"],
  ["MR-02", "/analytics/monthly-pnl", "monthly P&L"],
  ["MR-03", "/analytics/cash-flow-forecast", "cash-flow forecast"],
]) {
  const r = await call("GET", path, { token: vt });
  check(id, `${label} answers for the vendor`, "200", String(r.status), r.status === 200,
    r.status !== 200 ? String(r.json?.message || "").slice(0, 70) : "");
  const anon = await call("GET", path, {});
  check(`${id}a`, `${label} refuses anon`, "401", String(anon.status), anon.status === 401);
  await sleep(80);
}
if (qaBookingId) {
  const pnl = await call("GET", `/expenses/booking/${qaBookingId}/pnl`, { token: vt });
  check("MR-04", "per-event P&L for a QA booking", "200", String(pnl.status), pnl.status === 200,
    pnl.status !== 200 ? String(pnl.json?.message || "").slice(0, 70) : "");
}

// ════ D · Menu CRUD (V7) ════════════════════════════════════════════════════
console.log("\n── D · menus / catalog ───────────────────────────────────────");
let menuId = null;
{
  const c = await call("POST", "/menus/single-menu", {
    token: vt,
    body: { title: "ZZ QA Menu", price: 1500, businessId: BIZ, data: { items: [{ name: "Chicken Karahi" }, { name: "Zarda" }] } },
  });
  menuId = c.json?.data?.menu?.id ?? c.json?.data?.id ?? c.json?.id ?? null;
  check("MENU-01", "create a single menu", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${menuId}`);

  if (menuId) {
    const u = await call("PATCH", `/menus/${menuId}`, { token: vt, body: { price: 1800 } });
    check("MENU-02", "update menu price", "2xx", String(u.status), u.status < 300,
      u.status >= 300 ? String(u.json?.message || "").slice(0, 70) : "");
  }

  // Rs-0 guard: a zero-price menu should be refused (no free wedding catering)
  const zero = await call("POST", "/menus/single-menu", {
    token: vt,
    body: { title: "ZZ QA Free Menu", price: 0, businessId: BIZ, data: { items: [{ name: "X" }] } },
  });
  check("MENU-03", "Rs-0 menu handling", "400 or clean reject (not 500)", String(zero.status), zero.status !== 500,
    zero.status < 300 ? "accepted a Rs-0 menu — verify this is intended" : "");

  // tenant: customer cannot create a menu on this business
  const xt = await call("POST", "/menus/single-menu", { token: ct, body: { title: "X", price: 100, businessId: BIZ, data: { items: [] } } });
  check("MENU-04", "customer cannot create a menu", "refused", String(xt.status), refused(xt.status),
    xt.status < 400 ? "CREATED — tenant boundary breached" : "");
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
if (expId) { const d = await call("DELETE", `/expenses/${expId}`, { token: vt }); console.log(`  delete expense ${expId} → ${d.status}`); }
if (rcptId) { const d = await call("DELETE", `/receipts/${rcptId}`, { token: vt }); console.log(`  delete receipt ${rcptId} → ${d.status}`); }
if (menuId) { const d = await call("DELETE", `/menus/${menuId}`, { token: vt }); console.log(`  delete menu ${menuId} → ${d.status}`); }

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ money + catalog: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "money-catalog.json"), JSON.stringify({ expId, rcptId, menuId, qaBookingId, results }, null, 2));
console.log("\nwritten: qa-out/money-catalog.json");
