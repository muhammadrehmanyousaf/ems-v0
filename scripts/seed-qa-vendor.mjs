/**
 * Creates a disposable vendor for QA, and removes it again.
 *
 *   node scripts/seed-qa-vendor.mjs create     # make the account + business
 *   node scripts/seed-qa-vendor.mjs teardown   # cancel bookings, deactivate, report
 *   node scripts/seed-qa-vendor.mjs status     # what exists right now
 *
 * WHY THIS EXISTS (REC-007). Every test so far has run against the founder's
 * real vendor account, which owns real listings and real bookings. That caps the
 * campaign at read-only: 61 destructive controls across 22 screens were skipped
 * rather than clicked, PDC transitions move real money, and the booking →
 * payment → cancellation → refund chain cannot be run end to end. It also means
 * a mistake lands on Rehman Grand Marquee.
 *
 * The two open money bugs BOTH need this to close:
 *   BUG-014  every cancellation policy refunds Rs 0 — needs a booking driven
 *            through payment to prove whether the live path reproduces it
 *   BUG-015  Rs 2.8m shown owed on paid bookings — only seen on seeded rows so
 *            far, so the live path is unproven either way
 *
 * WHAT IT CREATES, and what that costs you: a real vendor account and a real
 * business row on live production. Until an admin approves it in the vendor
 * queue it should not appear in public search — but it IS a real row, and it is
 * named so nobody mistakes it for a customer:
 *
 *   business : "ZZ QA TEST VENDOR — DO NOT BOOK"
 *   email    : qa-vendor+<stamp>@weddingwala-qa.test
 *
 * It writes credentials to cypress.env.json (gitignored) under `qaVendor`.
 *
 * SAFETY
 *   - refuses to run unless CONFIRM=yes is set, so it cannot fire by accident
 *   - never touches an existing account; the email is stamped per run
 *   - teardown cancels every booking it finds before deactivating
 *   - teardown reports anything it could not remove instead of staying silent
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const API = process.env.E2E_API_URL || "https://ems-v0-backend-production.up.railway.app/api/v1";
const envPath = join(root, "cypress.env.json");
const mode = process.argv[2] || "status";

const readEnv = () => (existsSync(envPath) ? JSON.parse(readFileSync(envPath, "utf8")) : {});
const writeEnv = (o) => writeFileSync(envPath, JSON.stringify(o, null, 2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const login = async (email, password) => {
  const { json } = await call("POST", "/auth/login", { body: { email, password } });
  return json?.data?.token || json?.token || null;
};

// ── create ───────────────────────────────────────────────────────────────────
async function create() {
  const env = readEnv();
  if (env.qaVendor?.email) {
    console.log(`A QA vendor already exists: ${env.qaVendor.email}`);
    console.log("Run `teardown` first if you want a fresh one.");
    return;
  }
  // Stamped, so a re-run never collides with a previous account.
  const stamp = process.env.QA_STAMP || String(Math.floor(Number(process.env.QA_SEED || "0")) || 1).padStart(3, "0");
  const email = `qa-vendor+${stamp}@weddingwala-qa.test`;
  const password = "QaVendor!2026#seed";
  const payload = {
    fullName: "ZZ QA Test Vendor",
    email,
    password,
    phoneNumber: "03001112233",
    vendorType: "Wedding venue",
    businessName: "ZZ QA TEST VENDOR — DO NOT BOOK",
    city: "Lahore",
    address: "QA Test Address, Lahore",
    minimumPrice: 100000,
    description:
      "Automated QA fixture. Not a real business. Created by scripts/seed-qa-vendor.mjs. " +
      "Safe to delete at any time.",
  };

  console.log(`creating ${email} …`);
  const { status, json } = await call("POST", "/businesses/create-business-with-vendor", { body: payload });
  console.log(`  → ${status} ${String(json?.message || "").slice(0, 120)}`);
  if (status >= 400) {
    console.log("  full response:", JSON.stringify(json).slice(0, 400));
    console.log("\nNot created. Nothing to clean up.");
    return;
  }

  await sleep(1500);
  const token = await login(email, password);
  if (!token) {
    console.log("Created, but could not sign in — sign-in OTP may be back on. Check LOGIN_EMAIL_OTP.");
  }
  const mine = token ? await call("GET", "/businesses/user-business", { token }) : { json: {} };
  const list = mine.json?.data?.businesses || mine.json?.data || [];
  const businesses = (Array.isArray(list) ? list : [list]).filter(Boolean).map((b) => ({ id: b.id, name: b.businessName }));

  env.qaVendor = { email, password, businesses, createdAt: new Date().toISOString() };
  writeEnv(env);

  console.log("\ncredentials written to cypress.env.json under `qaVendor` (gitignored)");
  console.log(`  email     ${email}`);
  console.log(`  businesses ${businesses.map((b) => `${b.id} "${b.name}"`).join(", ") || "(none returned yet)"}`);
  console.log("\nNEXT: an admin must approve it in the vendor queue before it is publicly bookable.");
  console.log("Then re-run the campaign with --role qaVendor to exercise the destructive paths.");
}

// ── teardown ─────────────────────────────────────────────────────────────────
async function teardown() {
  const env = readEnv();
  const v = env.qaVendor;
  if (!v?.email) return console.log("No qaVendor in cypress.env.json — nothing to tear down.");
  const token = await login(v.email, v.password);
  if (!token) return console.log(`Could not sign in as ${v.email}. Remove it manually.`);

  const leftovers = [];
  const { json: bj } = await call("GET", "/bookings?limit=100", { token });
  const bookings = bj?.data?.data || [];
  console.log(`bookings found: ${bookings.length}`);
  for (const b of bookings) {
    if (/cancelled/i.test(String(b.status))) continue;
    await sleep(400);
    const r = await call("PATCH", `/bookings/${b.id}/vendor-cancel`, {
      token, body: { reason: "QA fixture teardown" },
    });
    console.log(`  cancel booking ${b.id} → ${r.status}`);
    if (r.status >= 400) leftovers.push(`booking ${b.id} (${r.status})`);
  }

  for (const biz of v.businesses || []) {
    await sleep(400);
    const r = await call("DELETE", `/businesses/${biz.id}`, { token });
    console.log(`  delete business ${biz.id} → ${r.status}`);
    if (r.status >= 400) leftovers.push(`business ${biz.id} (${r.status}) — deactivate via admin`);
  }

  delete env.qaVendor;
  writeEnv(env);
  console.log("\nqaVendor removed from cypress.env.json");
  if (leftovers.length) {
    console.log("\nCOULD NOT REMOVE — do these by hand:");
    leftovers.forEach((l) => console.log(`  - ${l}`));
  } else {
    console.log("Everything this script created has been removed.");
  }
}

// ── status ───────────────────────────────────────────────────────────────────
async function status() {
  const v = readEnv().qaVendor;
  if (!v?.email) return console.log("No QA vendor configured. Run: CONFIRM=yes node scripts/seed-qa-vendor.mjs create");
  console.log(`email      ${v.email}`);
  console.log(`created    ${v.createdAt}`);
  console.log(`businesses ${(v.businesses || []).map((b) => `${b.id} "${b.name}"`).join(", ") || "(none)"}`);
  const token = await login(v.email, v.password);
  console.log(`sign-in    ${token ? "OK" : "FAILED — is LOGIN_EMAIL_OTP back on?"}`);
  if (token) {
    const { json } = await call("GET", "/bookings?limit=100", { token });
    console.log(`bookings   ${(json?.data?.data || []).length}`);
  }
}

if (mode === "create" || mode === "teardown") {
  if (process.env.CONFIRM !== "yes") {
    console.log(`Refusing to ${mode} without confirmation — this writes to LIVE production.`);
    console.log(`Run:  CONFIRM=yes node scripts/seed-qa-vendor.mjs ${mode}`);
    process.exit(1);
  }
}

if (mode === "create") await create();
else if (mode === "teardown") await teardown();
else await status();
