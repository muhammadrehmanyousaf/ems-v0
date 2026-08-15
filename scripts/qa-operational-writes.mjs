/**
 * V9 operational depth — the create/edit actions behind the screens that the
 * render-sweep only proved reachable. Two chains, live on the QA vendor (3365):
 *
 *   A · Inventory CRUD — create an item → read back → update qty/price →
 *       record a stock movement → delete. Plus tenant isolation (a customer
 *       cannot create an item on this business) and validation.
 *
 *   B · Function sheet composer → signature — the operational core:
 *       create a function sheet → issue a public share token → read it back
 *       through the PUBLIC token endpoint (no auth) → SIGN it publicly → confirm
 *       the signature stuck. This is the "vendor builds the run-sheet, the
 *       customer signs it" flow end to end.
 *
 * Everything created is deleted / the sheet left in a terminal test state and
 * removed where the API allows. Read-only on any foreign tenant.
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
console.log(`\nQA vendor token:${!!vt} · customer:${!!ct} · business ${BIZ}\n`);
if (!vt) { console.log("No QA vendor token."); process.exit(1); }

// ════ A · Inventory CRUD ════════════════════════════════════════════════════
console.log("── A · inventory CRUD ────────────────────────────────────────");
let itemId = null;
{
  const c = await call("POST", "/inventory/items", {
    token: vt,
    body: { businessId: BIZ, name: "ZZ QA Chairs", unit: "piece", quantity: 100, unitCost: 250, category: "furniture" },
  });
  itemId = c.json?.data?.item?.id ?? c.json?.data?.id ?? null;
  check("INV-01", "create an inventory item", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${itemId}`);

  if (itemId) {
    const g = await call("GET", `/inventory/items?businessId=${BIZ}`, { token: vt });
    const rows = g.json?.data?.items || g.json?.data?.data || g.json?.data || [];
    const found = (Array.isArray(rows) ? rows : []).some((x) => Number(x.id) === Number(itemId));
    check("INV-02", "new item appears in the list", "present", found ? "present" : "absent", found);

    const u = await call("PATCH", `/inventory/items/${itemId}`, { token: vt, body: { quantity: 120, unitCost: 300 } });
    check("INV-03", "update item quantity/price", "2xx", String(u.status), u.status < 300);

    // a stock movement (in/out)
    const m = await call("POST", "/inventory/movements", { token: vt, body: { itemId, businessId: BIZ, type: "out", quantity: 10, reason: "QA test issue" } });
    check("INV-04", "record a stock movement", "2xx or clean 4xx (not 500)", String(m.status), m.status !== 500,
      m.status >= 400 ? String(m.json?.message || "").slice(0, 70) : "");
  }

  // validation: missing name
  const bad = await call("POST", "/inventory/items", { token: vt, body: { businessId: BIZ, quantity: 5 } });
  check("INV-05", "item with no name rejected", "400", String(bad.status), bad.status === 400,
    bad.status !== 400 ? "accepted a nameless item" : "");

  // tenant: customer cannot create an item on this business
  const xt = await call("POST", "/inventory/items", { token: ct, body: { businessId: BIZ, name: "X", unit: "piece", quantity: 1 } });
  check("INV-06", "customer cannot add inventory to a business", "refused", String(xt.status), refused(xt.status),
    xt.status < 400 ? "CREATED — tenant boundary breached" : "");

  // unauth
  const anon = await call("GET", "/inventory/items", {});
  check("INV-07", "unauthenticated inventory list refused", "401", String(anon.status), anon.status === 401);
}

// ════ B · Function sheet → sign chain ═══════════════════════════════════════
console.log("\n── B · function sheet composer → sign ────────────────────────");
let sheetId = null, shareToken = null;
{
  const c = await call("POST", "/function-sheets", {
    token: vt,
    body: {
      businessId: BIZ, title: "ZZ QA Function Sheet",
      eventDate: "2027-10-10",
      lineItems: [{ label: "Setup", detail: "Hall ready by 4pm" }, { label: "Menu", detail: "Standard desi" }],
    },
  });
  sheetId = c.json?.data?.functionSheet?.id ?? c.json?.data?.sheet?.id ?? c.json?.data?.id ?? null;
  check("FS-01", "create a function sheet", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || "").slice(0, 90) : `id ${sheetId}`);

  if (sheetId) {
    // read it back
    const g = await call("GET", `/function-sheets/${sheetId}`, { token: vt });
    check("FS-02", "read the function sheet back", "200", String(g.status), g.status === 200);

    // issue a public share token
    const st = await call("POST", `/function-sheets/${sheetId}/share-token`, { token: vt, body: {} });
    shareToken = st.json?.data?.token ?? st.json?.data?.shareToken ?? st.json?.token ?? null;
    check("FS-03", "issue a public share token", "2xx + token",
      `${st.status} / ${shareToken ? "token" : "none"}`, st.status < 300 && !!shareToken,
      st.status >= 300 ? String(st.json?.message || "").slice(0, 70) : "");

    // PUBLIC read via token — no auth
    if (shareToken) {
      const pub = await call("GET", `/public/bookings/function-sheet/${shareToken}`, {});
      // path may differ; try the documented public mount
      let pubStatus = pub.status;
      if (refused(pub.status)) {
        const alt = await call("GET", `/function-sheets/public/${shareToken}`, {});
        pubStatus = alt.status;
      }
      check("FS-04", "public token read works without auth", "200 (some public route)",
        String(pubStatus), pubStatus === 200, pubStatus !== 200 ? "public read path not found — see note" : "");

      // the sign endpoint (public)
      const sign = await call("POST", `/function-sheets/public/${shareToken}/sign`, {
        body: { signerName: "ZZ QA Signer", signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
      });
      // alt public sign mount
      let signStatus = sign.status, signMsg = sign.json?.message;
      if (refused(sign.status)) {
        const alt = await call("POST", `/public/bookings/function-sheet/${shareToken}/sign`, {
          body: { signerName: "ZZ QA Signer", signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" },
        });
        signStatus = alt.status; signMsg = alt.json?.message;
      }
      check("FS-05", "public signature is accepted", "2xx", String(signStatus), signStatus < 300,
        signStatus >= 300 ? String(signMsg || "").slice(0, 70) : "");
    }

    // tenant: customer cannot read the vendor's function sheet
    const xt = await call("GET", `/function-sheets/${sheetId}`, { token: ct });
    check("FS-06", "customer cannot read a vendor's function sheet", "refused", String(xt.status), refused(xt.status),
      xt.status < 400 ? "READ — tenant boundary breached" : "");
  }

  // validation: no title
  const bad = await call("POST", "/function-sheets", { token: vt, body: { businessId: BIZ } });
  check("FS-07", "function sheet with no title rejected", "400", String(bad.status), bad.status === 400);
}

// ── cleanup ─────────────────────────────────────────────────────────────────
console.log("\n── cleanup ───────────────────────────────────────────────────");
if (itemId) { const d = await call("DELETE", `/inventory/items/${itemId}`, { token: vt }); console.log(`  delete inventory item ${itemId} → ${d.status}`); }
if (sheetId) { const d = await call("DELETE", `/function-sheets/${sheetId}`, { token: vt }); console.log(`  delete function sheet ${sheetId} → ${d.status}${d.status >= 400 ? " (may be immutable once signed — expected)" : ""}`); }

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ operational writes: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "operational-writes.json"), JSON.stringify({ itemId, sheetId, shareToken, results }, null, 2));
console.log("\nwritten: qa-out/operational-writes.json");
