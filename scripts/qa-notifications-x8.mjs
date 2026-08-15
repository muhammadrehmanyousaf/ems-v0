/**
 * X8 · Notifications — "every state change that should notify, does — to the
 * RIGHT party." Proven on a fully-controlled pair of test accounts (QA vendor +
 * QA customer, both synthetic), so no real user is pinged.
 *
 *   The vendor opens a conversation with the QA customer and sends one message.
 *   Assertion: the CUSTOMER's chat-unread total goes UP (recipient notified),
 *   while the SENDER's own unread does NOT move (no self-notify). That is the
 *   core "right party" property. Then the message is confirmed to persist in the
 *   thread (read-back), and the customer's unread is cleared afterwards.
 *
 * Uses the REST send-message companion (POST /chat/conversations/:id/messages),
 * the same path the app falls back to when the socket is unreachable.
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
async function loginFull(email, password) {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  const token = json?.data?.token || null;
  const uid = json?.data?.user?.id ?? json?.data?.id ?? json?.data?.userId ?? null;
  return { token, uid };
}
function check(id, what, expected, actual, pass, note = "") {
  results.push({ id, what, expected, actual, pass, note });
  console.log(`  [${pass === null ? "SKIP" : pass ? "PASS" : "FAIL"}] ${id}  ${what}`);
  if (pass === false) console.log(`         expected ${expected} · got ${actual}${note ? ` · ${note}` : ""}`);
}
const unread = async (t) => {
  const r = await call("GET", "/chat/unread-total", { token: t });
  // shape is { data: { count } }
  const n = r.json?.data?.count ?? r.json?.data?.total ?? r.json?.data?.unread ?? r.json?.data ?? 0;
  return typeof n === "number" ? n : Number(n) || 0;
};

const vendor = await loginFull(env.qaVendor.email, env.qaVendor.password);
const customer = await loginFull(env.accounts.user.email, env.accounts.user.password);
console.log(`\nvendor uid:${vendor.uid} token:${!!vendor.token} · customer uid:${customer.uid} token:${!!customer.token}\n`);
if (!vendor.token || !customer.token) { console.log("missing token"); process.exit(1); }
if (!customer.uid) { console.log("could not resolve customer uid from login — aborting"); process.exit(1); }

// 1 · vendor opens a conversation with the QA customer
const conv = await call("POST", "/chat/conversations", { token: vendor.token, body: { otherUserId: customer.uid } });
const convId = conv.json?.data?.conversation?.id ?? conv.json?.data?.id ?? null;
check("X8-01", "vendor opens a conversation with the QA customer", "2xx + id",
  `${conv.status}/${convId ? "id" : "none"}`, conv.status < 300 && !!convId,
  conv.status >= 300 ? String(conv.json?.message || "").slice(0, 70) : "");

if (convId) {
  const custBefore = await unread(customer.token);
  const vendBefore = await unread(vendor.token);

  // 2 · vendor sends one message
  const marker = "ZZ QA X8 notify test — please ignore";
  const send = await call("POST", `/chat/conversations/${convId}/messages`, { token: vendor.token, body: { content: marker } });
  check("X8-02", "vendor sends a message (REST send path)", "2xx", String(send.status), send.status < 300,
    send.status >= 300 ? String(send.json?.message || "").slice(0, 70) : "");
  await sleep(1200);

  const custAfter = await unread(customer.token);
  const vendAfter = await unread(vendor.token);

  // 3 · the RIGHT party (recipient) is notified
  check("X8-03", "recipient (customer) unread increases", `> ${custBefore}`, String(custAfter), custAfter > custBefore,
    custAfter <= custBefore ? "recipient was NOT notified of the message" : `${custBefore}→${custAfter}`);

  // 4 · the sender is NOT self-notified
  check("X8-04", "sender (vendor) unread does not increase", `<= ${vendBefore}`, String(vendAfter), vendAfter <= vendBefore,
    vendAfter > vendBefore ? "sender got an unread bump from their own message" : `${vendBefore}→${vendAfter}`);

  // 5 · the message persists in the thread (read-back by the recipient)
  const msgs = await call("GET", `/chat/conversations/${convId}/messages`, { token: customer.token });
  const rows = msgs.json?.data?.messages || msgs.json?.data?.rows || msgs.json?.data || [];
  const seen = (Array.isArray(rows) ? rows : []).some((m) => String(m.content || "").includes("X8 notify test"));
  check("X8-05", "recipient can read the message in the thread", "present", seen ? "present" : "absent", seen);

  // 6 · anon cannot read the unread total
  const anon = await call("GET", "/chat/unread-total", {});
  check("X8-06", "unread total requires auth", "401", String(anon.status), anon.status === 401);

  // cleanup: mark the customer's chat/notifications read so the QA account is tidy
  await call("PATCH", "/notifications/read-all", { token: customer.token });
  console.log(`\n  cleaned: customer notifications marked read`);
}

const pass = results.filter((r) => r.pass === true).length;
const fail = results.filter((r) => r.pass === false).length;
console.log(`\n═══ X8 notifications: ${pass} passed · ${fail} failed ═══`);
if (fail) {
  console.log("\nFAILURES:");
  results.filter((r) => r.pass === false).forEach((r) =>
    console.log(`  ${r.id}  ${r.what}\n      expected ${r.expected} · got ${r.actual}${r.note ? `\n      ${r.note}` : ""}`));
}
writeFileSync(join(root, "qa-out", "notifications-x8.json"), JSON.stringify({ convId, results }, null, 2));
console.log("\nwritten: qa-out/notifications-x8.json");
