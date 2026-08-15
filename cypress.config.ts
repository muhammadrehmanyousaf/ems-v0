import { defineConfig } from "cypress";

/**
 * Wedding Wala — Cypress end-to-end configuration.
 *
 * ── Read this before running anything ────────────────────────────────────────
 *
 * There is NO local server. `next dev` needs the production API, and the
 * standing instruction on this project is not to run the backend. So these
 * specs run against a DEPLOYED origin, which in practice means PRODUCTION —
 * the same live system that takes real bookings and real money.
 *
 * Everything below follows from that one fact:
 *
 *   - Specs are read-only by default. Anything that writes is tagged and
 *     refuses to run unless CYPRESS_ALLOW_MUTATION=1 is set deliberately.
 *   - Money rows are never written. Not gated — never.
 *   - Anything a mutating spec creates, it deletes in an after hook, and the
 *     deletion is asserted, not assumed.
 *
 * Sits alongside the older Playwright suite in e2e/. Both are kept: Playwright
 * covers the auth-setup and render smoke it already had, Cypress covers the
 * per-module depth. Check both before adding a case, so coverage does not
 * quietly get written twice and maintained never.
 */

const BASE_URL = process.env.E2E_BASE_URL || "https://www.weddingwala.pk";

export default defineConfig({
  e2e: {
    baseUrl: BASE_URL,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",
    videosFolder: "cypress/.artifacts/videos",
    screenshotsFolder: "cypress/.artifacts/screenshots",
    downloadsFolder: "cypress/.artifacts/downloads",

    // A real network against a real deployment is not a local dev server:
    // Railway cold starts and Vercel edge misses are ordinary, not failures.
    defaultCommandTimeout: 12_000,
    pageLoadTimeout: 60_000,
    responseTimeout: 30_000,
    requestTimeout: 20_000,

    // One retry in run mode only. Enough to absorb a cold start; not enough to
    // let a genuinely flaky assertion pass and be believed. Zero in `open` so a
    // failure is visible while it is being written.
    retries: { runMode: 1, openMode: 0 },

    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1366,
    viewportHeight: 657, // a 15" laptop, which is what most PK vendors use

    // The portal is a long-lived authenticated app; the default 50 is not
    // enough to see how a failure was reached.
    numTestsKeptInMemory: 10,

    env: {
      /**
       * Off unless explicitly set. Read by `describeMutating()` in
       * cypress/support/safety.ts, which skips the whole block when it is off,
       * so a careless `cypress run` against production cannot write anything.
       */
      ALLOW_MUTATION: process.env.CYPRESS_ALLOW_MUTATION === "1",
      API_URL:
        process.env.E2E_API_URL ||
        "https://ems-v0-backend-production.up.railway.app/api/v1",
    },

    setupNodeEvents(on, config) {
      // Surface browser console output in the terminal. Without this a console
      // error is invisible in CI, and "no console errors" is one of the things
      // these suites assert.
      on("task", {
        log(message: string) {
          console.log(message);
          return null;
        },
        table(rows: unknown) {
          console.table(rows);
          return null;
        },
      });

      // Fail loudly rather than silently pointing at localhost.
      if (!/^https?:\/\//.test(config.baseUrl ?? "")) {
        throw new Error(`E2E_BASE_URL must be an absolute URL; got "${config.baseUrl}"`);
      }
      return config;
    },
  },
});
