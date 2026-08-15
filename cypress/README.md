# Wedding Wala — Cypress suite

One spec file per module, plus regression specs that pin defects already found
and fixed on production.

## Read this first: these specs run against production

There is no local server on this project. `next dev` needs the production API,
and the standing instruction is not to run the backend. So `baseUrl` is a
**deployed origin** — in practice `https://www.weddingwala.pk`, the live system
that takes real bookings and real money.

Everything about the suite's design follows from that:

| rule | where it is enforced |
|---|---|
| Specs are read-only by default | `describeMutating()` skips write blocks unless `CYPRESS_ALLOW_MUTATION=1` |
| Money endpoints are never written | `refuseMoneyWrites()` throws on POST to payments/refunds/payouts/invoices |
| Anything created is deleted, and the deletion is asserted | each mutating spec's `after` hook |

A skipped mutating block still appears in the report as **pending**, so nobody
can mistake "did not run" for "passed".

## Setup

Credentials live in `cypress.env.json` at the repo root. It is **gitignored and
must stay that way** — these are real logins, not seeded test rows.

```json
{
  "accounts": {
    "vendor":     { "email": "…", "password": "…" },
    "user":       { "email": "…", "password": "…" },
    "superadmin": { "email": "…", "password": "…" }
  }
}
```

`cy.loginAs("vendor" | "user" | "superadmin")` signs in through the real login
form once per role and caches the session across specs. It caches localStorage
as well as cookies, because the app keeps its JWT in `localStorage.auth_token` —
a cookie-only cache looks signed in and then 401s on the first API call.

## Running

```bash
npm run cy:inventory     # regenerate the module list from the app's routes
npm run cy:smoke         # harness only — run this first
npm run cy:modules       # every module's contract
npm run cy:regression    # the defects that must never come back
npm run cy:run           # everything
npm run cy:open          # interactive

CYPRESS_ALLOW_MUTATION=1 npm run cy:run    # deliberately enables live writes
E2E_BASE_URL=https://staging.example npm run cy:run
```

## Layout

```
cypress/
  e2e/
    00-harness/     does the harness itself work — run first, alone
    02-regression/  one spec per defect found on production
    03-functional/  deep hand-written flows (leads, booking, …)
    10-modules/     one file per module, 67 of them
  fixtures/
    modules.json    GENERATED — never edit by hand
  support/
    commands.ts     loginAs, visitModule, consoleErrors, apiRequest
    module-suite.ts the contract every module must satisfy
    safety.ts       the production guardrails
```

## The module list is generated, never hand-written

```
app routes → scripts/ux-inventory.mjs → qa/UX-INVENTORY.json
           → scripts/cypress-module-inventory.mjs → cypress/fixtures/modules.json
           → scripts/cypress-generate-module-specs.mjs → cypress/e2e/10-modules/*.cy.ts
```

A hand-kept list stops matching the app the first time somebody adds a route,
and then the suite reports green on a product it is no longer covering — worse
than no suite, because it buys confidence that is not there.

The spec generator **never overwrites an existing file**, so hand-written depth
is safe. Re-run it after adding a route; it only fills in what is missing.

## What "covered" does not mean

`moduleSuite()` is a **floor**, not a test plan. It proves a screen is not
broken — it reaches, it renders, it logs nothing, it does not overflow, its
controls have names. It does not prove the feature works.

That distinction is not academic on this codebase. Every one of these rendered
perfectly while being wrong:

- the booking calendar offered every date the venue had blocked
- the pay button read `Rs 32,500` while Stripe was charging `Rs 35,000`
- Notifications drew 50 delete buttons that were invisible on a phone
- the touch-target rule shipped into a stylesheet the portal never imports, so
  it applied to 105 controls and matched nothing

A module whose file contains only the shared contract is **covered, not
tested**. `03-functional/leads.cy.ts` is the depth each module is heading
towards: hostile input, empty submits, double-click, reload-and-re-read.

## Relationship to the Playwright suite in `e2e/`

Both are kept. Playwright already had auth setup and render smoke; Cypress
covers per-module depth. Check both before adding a case so the same ground is
not covered twice and maintained never.
