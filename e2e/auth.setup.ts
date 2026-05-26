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

function loadCreds(): CredFile {
  if (!fs.existsSync(credPath)) {
    throw new Error(
      `Missing ${credPath}. Run: cd event-planner-api && node scripts/e2eAccounts.js create`,
    );
  }
  return JSON.parse(fs.readFileSync(credPath, "utf8"));
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
  const creds = loadCreds();
  await loginAndSave(page, creds.superadmin, path.join(authDir, "superadmin.json"));
});

setup("authenticate vendor", async ({ page }) => {
  const creds = loadCreds();
  await loginAndSave(page, creds.vendor, path.join(authDir, "vendor.json"));
});
