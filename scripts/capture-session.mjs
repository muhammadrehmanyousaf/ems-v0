/**
 * Signs a role in once, through the real login form, and saves the resulting
 * session so the test suite never has to log in again.
 *
 *   node scripts/capture-session.mjs vendor
 *
 * Why this exists: a vendor login is held at an OTP step, and an OTP cannot be
 * automated — the code goes to a real inbox and expires. But the token behind
 * it is long-lived, so the code only has to be typed ONCE. After that the suite
 * injects the token and skips the login form entirely.
 *
 * How the wait works: when the OTP screen appears this script polls
 * `cypress/.sessions/otp-<role>.txt` until a code shows up, then types it. So
 * whoever is running it can paste the code into that file at their leisure —
 * the browser is still sitting on the step, holding the attempt open, instead
 * of having timed out ten minutes ago.
 *
 * Output: cypress/.sessions/<role>.json — gitignored. Contains a real access
 * token; treat it exactly like the password.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const role = process.argv[2] || "vendor";
const BASE = process.env.E2E_BASE_URL || "https://www.weddingwala.pk";
const API =
  process.env.E2E_API_URL || "https://ems-v0-backend-production.up.railway.app/api/v1";

const sessionDir = resolve(root, "cypress/.sessions");
mkdirSync(sessionDir, { recursive: true });
const otpFile = resolve(sessionDir, `otp-${role}.txt`);
const outFile = resolve(sessionDir, `${role}.json`);

const accounts = JSON.parse(readFileSync(resolve(root, "cypress.env.json"), "utf8")).accounts;
const acct = accounts?.[role];
if (!acct) throw new Error(`No "${role}" in cypress.env.json`);

/** Poll a file until a 4-8 digit code appears in it, or give up. */
async function waitForOtp(page, timeoutMs = 15 * 60 * 1000) {
  rmSync(otpFile, { force: true });
  console.log(`\n  >>> OTP required for "${role}".`);
  console.log(`  >>> Put the code in: ${otpFile}`);
  console.log(`  >>> Waiting up to ${Math.round(timeoutMs / 60000)} minutes...\n`);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (existsSync(otpFile)) {
      const code = readFileSync(otpFile, "utf8").trim();
      if (/^\d{4,8}$/.test(code)) {
        rmSync(otpFile, { force: true });
        return code;
      }
    }
    await page.waitForTimeout(2000);
  }
  throw new Error("No OTP arrived in time.");
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 657 } });
const page = await ctx.newPage();

try {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 90_000 });

  // The consent banner renders over the form and eats the submit click.
  const consent = page.getByRole("button", { name: /accept all|essential only/i }).first();
  if (await consent.count()) await consent.click({ timeout: 8000 }).catch(() => {});

  await page.locator("#email").waitFor({ timeout: 30_000 });
  await page.locator("#email").fill(acct.email);
  await page.locator("#password").fill(acct.password);
  // Exact label: a loose /sign in/i also matches the heading copy.
  await page.getByRole("button", { name: "Sign In", exact: true }).click({ timeout: 20_000 });

  // Either we land on the dashboard, or we are held at OTP.
  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 30_000 }).catch(() => {}),
    page.waitForTimeout(12_000),
  ]);

  if (!/\/dashboard/.test(page.url())) {
    const text = await page.evaluate(() => document.body.innerText);
    if (/otp|verification code|verify|6-digit|code sent/i.test(text)) {
      const code = await waitForOtp(page);
      // The step renders either one box or one-per-digit; handle both.
      const boxes = page.locator("input[inputmode='numeric'], input[maxlength='1'], input[type='tel']");
      const count = await boxes.count();
      if (count > 1) {
        for (let i = 0; i < Math.min(count, code.length); i++) await boxes.nth(i).fill(code[i]);
      } else {
        const single = page.locator("input:visible").first();
        await single.fill(code);
      }
      const submit = page
        .getByRole("button", { name: /verify|continue|submit|confirm/i })
        .first();
      if (await submit.count()) await submit.click({ timeout: 20_000 }).catch(() => {});
      await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    } else {
      throw new Error(`Stuck at ${new URL(page.url()).pathname}: ${text.replace(/\s+/g, " ").slice(0, 200)}`);
    }
  }

  await page.waitForTimeout(4000);
  const token = await page.evaluate(() => localStorage.getItem("auth_token"));
  if (!token) throw new Error("Signed in but no auth_token was written.");

  const status = await page.evaluate(
    async (api) =>
      (await fetch(`${api}/users/profile/me`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("auth_token") },
      })).status,
    API,
  );
  if (status !== 200 && status !== 304) throw new Error(`Token rejected by the API (${status}).`);

  const local = await page.evaluate(() =>
    Object.fromEntries(Object.entries(localStorage).map(([k, v]) => [k, String(v)])),
  );

  // How long this session is good for, read from the token rather than assumed.
  let expiresAt = null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    if (payload.exp) expiresAt = new Date(payload.exp * 1000).toISOString();
  } catch {}

  writeFileSync(
    outFile,
    JSON.stringify({ role, capturedFrom: BASE, expiresAt, localStorage: local }, null, 2),
  );

  console.log(`\n  session saved: ${outFile}`);
  console.log(`  api check:     ${status}`);
  console.log(`  expires:       ${expiresAt ?? "unknown"}\n`);
} finally {
  await browser.close();
}
