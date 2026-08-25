import { test as setup, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Logs each seeded test role in through the real login UI and saves its
 * storageState, so the authenticated specs start already signed in.
 *
 * Credentials come from e2e/.auth/credentials.json, written by the BE seed:
 *   cd event-planner-api && node scripts/e2eAccounts.js create
 * (gitignored — never committed).
 */

type Creds = { email: string; password: string };
type CredFile = {
  superadmin: Creds;
  vendor: Creds;
  vendors?: Record<string, Creds>;
};

const authDir = path.join(__dirname, ".auth");
const credPath = path.join(authDir, "credentials.json");

type Role = "superadmin" | "vendor";

function fromEnv(role: Role): Creds | null {
  const prefix = role === "superadmin" ? "WW_SA" : "WW_VENDOR";
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  return email && password ? { email, password } : null;
}

/**
 * Credentials come from the environment first — WW_SA_EMAIL/WW_SA_PASSWORD and
 * WW_VENDOR_EMAIL/WW_VENDOR_PASSWORD — and are never written to disk. These are
 * real production logins, so the gitignored credentials.json stays only as a
 * fallback for the seeded-account flow.
 */
function loadCreds(role: Role): Creds {
  const env = fromEnv(role);
  if (env) return env;

  const prefix = role === "superadmin" ? "WW_SA" : "WW_VENDOR";
  if (!fs.existsSync(credPath)) {
    throw new Error(
      `No credentials for "${role}". Set ${prefix}_EMAIL and ${prefix}_PASSWORD in the ` +
        `environment, or create ${credPath} via: cd event-planner-api && node scripts/e2eAccounts.js create`,
    );
  }
  const file: CredFile = JSON.parse(fs.readFileSync(credPath, "utf8"));
  const creds = file[role];
  if (!creds?.email || !creds?.password) {
    throw new Error(`credentials.json has no "${role}" entry, and ${prefix}_EMAIL is unset.`);
  }
  return creds;
}

async function loginAndSave(page: any, creds: Creds, outFile: string) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 30_000 }),
    page.getByRole("button", { name: /sign in|log ?in|login|continue/i }).click(),
  ]);
  // Confirm we actually reached an authenticated shell.
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: outFile });
}

setup("authenticate super-admin", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });
  await loginAndSave(page, loadCreds("superadmin"), path.join(authDir, "superadmin.json"));
});

/**
 * A role with no credentials SKIPS rather than fails.
 *
 * The setup project is a dependency of every authenticated project, so a hard
 * throw here took the whole super-admin suite down with it — 17 tests reported
 * as "did not run" because a different role was unconfigured. A skip is
 * reported as pending, so "not configured" still cannot be misread as "passed".
 */
setup("authenticate vendor", async ({ page }) => {
  const configured = !!fromEnv("vendor") || fs.existsSync(credPath);
  setup.skip(!configured, "No vendor credentials: set WW_VENDOR_EMAIL / WW_VENDOR_PASSWORD.");
  fs.mkdirSync(authDir, { recursive: true });
  await loginAndSave(page, loadCreds("vendor"), path.join(authDir, "vendor.json"));
});
