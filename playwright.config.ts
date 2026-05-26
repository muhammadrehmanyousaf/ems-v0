import { defineConfig, devices } from "@playwright/test";

/**
 * E2E harness for the Wedding Wala portal.
 *
 * Runs against a DEPLOYED url (set E2E_BASE_URL) — there is no separate
 * test DB, so authenticated/CRUD specs must be self-cleaning and scoped to
 * vendor-internal, non-notifying entities. Public render smoke needs no auth.
 *
 *   E2E_BASE_URL   — the deployed FE origin, e.g. https://app.weddingwala.pk
 *   Credentials    — read from e2e/.auth/credentials.json (created by the
 *                    BE seed script `node scripts/e2eAccounts.js create`),
 *                    gitignored.
 *
 * Projects:
 *   setup      — logs each role in via the UI, saves storageState
 *   public     — no-auth render smoke of marketing pages
 *   superadmin — uses the super-admin storageState
 *   vendor     — uses the vendor storageState
 */

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "./e2e",
  // Live site + self-cleaning CRUD → run serially to avoid cross-test races.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "public",
      testMatch: /public\..*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "superadmin",
      testMatch: /superadmin\..*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/superadmin.json" },
    },
    {
      name: "vendor",
      testMatch: /vendor\..*\.spec\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/vendor.json" },
    },
  ],
});
