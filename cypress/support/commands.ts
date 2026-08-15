/// <reference types="cypress" />

/**
 * Shared commands.
 *
 * The important one is `cy.loginAs`. Everything else in the suite depends on a
 * real authenticated session, and the portal's ordinary customer login sends an
 * OTP — which cannot be automated. What makes this possible at all is the
 * seeded e2e accounts (`@weddingwala-e2e.test`, one per vendor type plus a
 * superadmin) created by `event-planner-api/scripts/e2eAccounts.js create`.
 * Those sign in with email and password.
 */

type Role = "vendor" | "user" | "superadmin";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      loginAs(role?: Role): Chainable<void>;
      /** Visit a dashboard route and wait until the shell has actually rendered. */
      visitModule(route: string): Chainable<void>;
      /** Every console error raised since the page loaded. */
      consoleErrors(): Chainable<string[]>;
      /** Assert the document does not scroll sideways at the current width. */
      shouldNotOverflowHorizontally(): Chainable<void>;
      /** Switch the emulated pointer to coarse (a finger) for the current page. */
      useCoarsePointer(): Chainable<void>;
      apiRequest(method: string, path: string, body?: unknown): Chainable<Cypress.Response<any>>;
    }
  }
}

/**
 * Accounts come from cypress.env.json, which is GITIGNORED and must stay that
 * way — these are real production logins, not seeded test rows. See
 * cypress/README.md for the shape.
 *
 * That is also why every spec is read-only unless CYPRESS_ALLOW_MUTATION=1:
 * this vendor account owns real listings and real bookings.
 */
function account(role: Role): { email: string; password: string } {
  const accounts = Cypress.env("accounts") as Record<string, { email: string; password: string }> | undefined;
  const found = accounts?.[role];
  if (!found?.email || !found?.password) {
    throw new Error(
      `No "${role}" account configured. Create cypress.env.json (gitignored):\n` +
        `  { "accounts": { "${role}": { "email": "...", "password": "..." } } }`,
    );
  }
  return found;
}

/**
 * Logs in once per role and reuses the session for every later spec.
 *
 * `cy.session` caches cookies AND localStorage, which matters here because the
 * app keeps its JWT in localStorage under `auth_token`, not a cookie — a
 * cookie-only cache would look logged in and then 401 on the first API call.
 */
Cypress.Commands.add("loginAs", (role: Role = "vendor") => {
  cy.then(() => {
    const acct = account(role);

    cy.session(
      ["ww", role, acct.email],
      () => {
        cy.visit("/login");

        /**
         * The consent banner renders over the form and eats the submit click.
         * Found by driving this exact flow against production: the click timed
         * out with the button plainly on screen, because "Accept all" was on
         * top of it. Dismissed first, and tolerated when absent so the command
         * still works once consent is remembered.
         */
        cy.get("body").then(($b) => {
          const consent = $b.find("button:contains('Accept all'), button:contains('Essential only')");
          if (consent.length) cy.wrap(consent.first()).click({ force: true });
        });

        cy.get("#email", { timeout: 30_000 }).should("be.visible").type(acct.email);
        cy.get("#password").type(acct.password, { log: false });
        // Exact label. The loose regex also matched "Sign in to continue your
        // shaadi journey" — heading copy, not a control.
        cy.contains("button", /^\s*Sign In\s*$/i).click();

        /**
         * OTP: measured on production, the superadmin account signs straight
         * through, but a VENDOR account is held at an OTP step that no test can
         * satisfy — the code goes to a real inbox. Automating a vendor session
         * needs an account exempted from OTP; see cypress/README.md.
         *
         * Failing here with that sentence is deliberate. A silent timeout on
         * `/dashboard` would send whoever runs this hunting through selectors
         * for a problem that is not in the selectors.
         */
        cy.location("pathname", { timeout: 45_000 }).then((path) => {
          if (!/\/dashboard/.test(path)) {
            cy.get("body")
              .invoke("text")
              .then((text) => {
                const otp = /otp|verification code|verify your|6-digit/i.test(text);
                throw new Error(
                  otp
                    ? `"${role}" is held at an OTP step, which cannot be automated. Use an ` +
                      `OTP-exempt account for this role — see cypress/README.md.`
                    : `"${role}" did not reach /dashboard (stopped at ${path}). ` +
                      `Check the credentials in cypress.env.json.`,
                );
              });
          }
        });
        cy.location("pathname", { timeout: 45_000 }).should("match", /\/dashboard/);
        // The redirect can land before the token is written; the session is
        // only worth caching once the thing every API call needs is present.
        cy.window().its("localStorage.auth_token").should("be.a", "string").and("have.length.gt", 20);
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          // Re-validating against the API rather than a rendered page: a stale
          // token still renders the shell and then fails every request.
          cy.window().then((win) => {
            const token = win.localStorage.getItem("auth_token");
            expect(token, "cached auth_token").to.be.a("string");
          });
        },
      },
    );
  });
});

Cypress.Commands.add("visitModule", (route: string) => {
  cy.visit(route, { failOnStatusCode: false });
  // The dashboard shell is client-rendered; without waiting for it, every
  // assertion races the first paint and the suite becomes a flake generator.
  cy.get("body", { timeout: 40_000 }).should("be.visible");
  cy.document().its("readyState").should("eq", "complete");
});

/**
 * Console errors are collected by a hook in e2e.ts and parked on the window, so
 * a spec can assert on them without re-instrumenting each time.
 */
Cypress.Commands.add("consoleErrors", () => {
  return cy.window().then((win) => ((win as any).__cyConsoleErrors ?? []) as string[]);
});

Cypress.Commands.add("shouldNotOverflowHorizontally", () => {
  cy.document().then((doc) => {
    const el = doc.documentElement;
    // `scrollWidth` can exceed `clientWidth` by the scrollbar gutter the
    // dashboard reserves on purpose (see dashboard-styles.css), so a small
    // tolerance is correct here — anything real is far larger than 20px.
    const overflow = el.scrollWidth - el.clientWidth;
    expect(
      overflow,
      `horizontal overflow (scrollWidth ${el.scrollWidth} - clientWidth ${el.clientWidth})`,
    ).to.be.lessThan(20);
  });
});

Cypress.Commands.add("useCoarsePointer", () => {
  // Cypress has no device emulation, so `pointer: coarse` cannot be emulated
  // the way CDP does it. Overriding matchMedia is honest about what it is: it
  // proves the app's own JS branches correctly, and CSS-level coarse behaviour
  // is asserted separately by reading the compiled rule out of the stylesheet.
  cy.window().then((win) => {
    const original = win.matchMedia.bind(win);
    (win as any).matchMedia = (q: string) =>
      /pointer:\s*coarse/.test(q)
        ? ({ matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false } as MediaQueryList)
        : original(q);
  });
});

Cypress.Commands.add("apiRequest", (method: string, path: string, body?: unknown) => {
  return cy.window().then((win) => {
    const token = win.localStorage.getItem("auth_token");
    return cy.request({
      method,
      url: `${Cypress.env("API_URL")}${path}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: body as any,
      failOnStatusCode: false,
    });
  });
});

export {};
