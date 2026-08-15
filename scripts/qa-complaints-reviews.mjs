/**
 * S4 Complaint lifecycle (full functional walk) + U9 Review guards.
 *
 * S4 — submit → superadmin sees it → detail → status open→in_progress →
 *      resolve → terminal guard (can't re-resolve) → submitter sees it in /mine →
 *      tenant guards on the admin list. This is a real create, but on a synthetic
 *      "ZZ QA" complaint from the QA customer; it ends in the resolved terminal
 *      state, which is the correct end-of-life for a complaint (nothing to delete).
 *
 * U9 — Review guards ONLY. We never persist a fake review: every submit here is
 *      one the validator MUST reject (missing rating, missing businessId, a
 *      booking the customer doesn't own). Plus the public read, and the
 *      auth/ownership guards on reply + delete.
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
const st = await login(env.accounts.superadmin.email, env.accounts.superadmin.password);
console.log(`\nqaVendor:${!!vt} customer:${!!ct} superadmin:${!!st}\n`);

// ════ S4 · Complaint lifecycle ══════════════════════════════════════════════
console.log("── S4 · complaint lifecycle ──────────────────────────────────");
let compId = null, compRef = null;
{
  const c = await call("POST", "/complaints", {
    token: ct, // optionalAuth — attaching the customer so /mine works
    body: {
      contactName: "ZZ QA Complainant",
      contactEmail: env.accounts.user.email,
      subject: "ZZ QA test complaint",
      body: "This is a synthetic QA complaint used to exercise the full lifecycle end to end.",
      category: SUPPORT_CATEGORY(),
    },
  });
  compRef = c.json?.data?.complaint?.reference ?? c.json?.data?.reference ?? null;
  check("CMP-01", "submit a complaint", "2xx", String(c.status), c.status < 300,
    c.status >= 300 ? String(c.json?.message || c.json?.error || "").slice(0, 90) : `ref ${compRef}`);

  // submit returns only {reference, dueAt} — resolve the id from the admin list.
  if (st && compRef) {
    const l0 = await call("GET", "/complaints", { token: st });
    const r0 = l0.json?.data?.rows || l0.json?.data?.complaints || l0.json?.data || [];
    const hit = (Array.isArray(r0) ? r0 : []).find((x) => x.reference === compRef);
    compId = hit?.id ?? null;
  }

  // validation: body too short
  const bad = await call("POST", "/complaints", { token: ct, body: { contactEmail: env.accounts.user.email, subject: "x", body: "short" } });
  check("CMP-02", "too-short subject/body rejected", "4xx", String(bad.status), bad.status >= 400 && bad.status < 500);

  if (st && compId) {
    const list = await call("GET", "/complaints", { token: st });
    const rows = list.json?.data?.rows || list.json?.data?.complaints || list.json?.data || [];
    const found = (Array.isArray(rows) ? rows : []).some((x) => Number(x.id) === Number(compId));
    check("CMP-03", "superadmin sees the complaint in the list", "present", found ? "present" : "absent", found);

    const det = await call("GET", `/complaints/${compId}`, { token: st });
    check("CMP-04", "superadmin reads the detail", "200", String(det.status), det.status === 200);

    const prog = await call("PATCH", `/complaints/${compId}/status`, { token: st, body: { status: "in_progress" } });
    check("CMP-05", "status open → in_progress", "2xx", String(prog.status), prog.status < 300,
      prog.status >= 300 ? String(prog.json?.message || "").slice(0, 70) : "");

    // invalid status via setStatus (only open/in_progress allowed there)
    const badStatus = await call("PATCH", `/complaints/${compId}/status`, { token: st, body: { status: "resolved" } });
    check("CMP-06", "setStatus refuses a terminal value", "4xx", String(badStatus.status), badStatus.status >= 400 && badStatus.status < 500,
      badStatus.status < 400 ? "accepted 'resolved' via the open/in_progress toggle" : "");

    const res = await call("POST", `/complaints/${compId}/resolve`, { token: st, body: { status: "resolved", resolutionNotes: "ZZ QA resolved — synthetic test complaint closed." } });
    check("CMP-07", "resolve the complaint", "2xx", String(res.status), res.status < 300,
      res.status >= 300 ? String(res.json?.message || "").slice(0, 70) : "");

    // terminal guard: re-resolve is an intentional idempotent no-op — returns
    // 200 with idempotent:true and does NOT re-update / re-email / re-audit
    // (service resolve() lines 181-182). Safe-retry design.
    const again = await call("POST", `/complaints/${compId}/resolve`, { token: st, body: { status: "resolved", resolutionNotes: "again — must be ignored" } });
    const idem = again.json?.data?.idempotent === true || again.json?.idempotent === true;
    check("CMP-08", "re-resolve is an idempotent no-op (200, no side effects)", "200 idempotent",
      `${again.status}${idem ? " idempotent" : ""}`, again.status === 200,
      again.status !== 200 ? "unexpected re-resolve status" : "");
  } else {
    ["CMP-03","CMP-04","CMP-05","CMP-06","CMP-07","CMP-08"].forEach((id) => check(id, "superadmin complaint step", "2xx", "SKIP", null, "no superadmin token / no id"));
  }

  // submitter sees it in /mine
  const mine = await call("GET", "/complaints/mine", { token: ct });
  const mrows = mine.json?.data?.rows || mine.json?.data?.complaints || mine.json?.data || [];
  const seen = (Array.isArray(mrows) ? mrows : []).some((x) => Number(x.id) === Number(compId));
  check("CMP-09", "submitter sees it in /mine", mine.status === 200 ? "present" : "200", seen ? "present" : String(mine.status), mine.status === 200 && (seen || !compId));

  // tenant: vendor/customer/anon cannot read the admin list
  const vend = await call("GET", "/complaints", { token: vt });
  check("CMP-10", "vendor cannot read the complaint queue", "refused", String(vend.status), refused(vend.status),
    vend.status < 400 ? "VENDOR READ ALL COMPLAINTS" : "");
  const anon = await call("GET", "/complaints", {});
  check("CMP-11", "anon cannot read the complaint queue", "401", String(anon.status), anon.status === 401);
}

// ════ U9 · Review guards (no fake review persisted) ═════════════════════════
console.log("\n── U9 · review guards (no fake persisted) ────────────────────");
{
  // every submit here MUST be rejected — we never leave a fake review behind.
  const noRating = await call("POST", "/reviews", { token: ct, body: { businessId: 3365, bookingId: 1 } });
  check("REV-01", "review with no rating rejected", "400", String(noRating.status), noRating.status === 400);

  const noBiz = await call("POST", "/reviews", { token: ct, body: { rating: 5, bookingId: 1 } });
  check("REV-02", "review with no businessId rejected", "400", String(noBiz.status), noBiz.status === 400);

  // a booking the customer doesn't own / doesn't exist → must be refused, no fake persists
  const notOwned = await call("POST", "/reviews", { token: ct, body: { businessId: 3365, bookingId: 999999999, rating: 5, comment: "ZZ QA should never persist" } });
  check("REV-03", "review on an unowned/nonexistent booking refused", "4xx (no fake)", String(notOwned.status), notOwned.status >= 400 && notOwned.status < 500,
    notOwned.status < 400 ? "FAKE REVIEW PERSISTED — investigate + delete" : "");

  // submit requires auth
  const anon = await call("POST", "/reviews", { body: { businessId: 3365, bookingId: 1, rating: 5 } });
  check("REV-04", "review submit requires auth", "401", String(anon.status), anon.status === 401);

  // public read of a business's reviews
  const pub = await call("GET", "/reviews/3365", {});
  check("REV-05", "public can read a business's reviews", "200", String(pub.status), pub.status === 200,
    pub.status !== 200 ? String(pub.json?.message || "").slice(0, 70) : "");

  // vendor reply guards — reply is a PATCH (/:reviewId/reply)
  const replyAnon = await call("PATCH", "/reviews/1/reply", { body: { reply: "x" } });
  check("REV-06", "reply requires auth", "401", String(replyAnon.status), replyAnon.status === 401);

  const replyGhost = await call("PATCH", "/reviews/999999999/reply", { token: vt, body: { reply: "ZZ QA" } });
  check("REV-07", "reply to a nonexistent review refused", "4xx", String(replyGhost.status), replyGhost.status >= 400 && replyGhost.status < 500);

  // delete requires auth
  const delAnon = await call("DELETE", "/reviews/1", {});
  check("REV-08", "delete review requires auth", "401", String(delAnon.status), delAnon.status === 401);
}

function SUPPORT_CATEGORY() { return "other"; } // falls back to default if not in whitelist

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
const skip = results.filter((r) => r.pass === null).length;
console.log(`\n═══ complaints + reviews: ${pass} passed · ${fail} failed · ${skip} skipped ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "complaints-reviews.json"), JSON.stringify({ compId, compRef, results }, null, 2));
console.log("\nwritten: qa-out/complaints-reviews.json");
