/**
 * Guardrails for a suite that runs against the live system.
 *
 * These specs point at production. That is not a shortcut — there is no local
 * server on this project and the standing instruction is not to run the
 * backend — but it means an ordinary `cypress run` is one careless `.click()`
 * away from cancelling somebody's real booking.
 *
 * So writing is opt-in, per block, and visible in the spec source.
 */

/** Vendor-facing routes only. Admin gates are asserted separately. */
export const isProduction = () =>
  /weddingwala\.pk/i.test(Cypress.config("baseUrl") ?? "");

/**
 * A block of tests that CHANGES SERVER STATE.
 *
 * Skipped unless CYPRESS_ALLOW_MUTATION=1. The skip is loud: the block still
 * appears in the report as pending, so nobody mistakes "did not run" for
 * "passed". Use for create/update/delete flows, and clean up in an `after`.
 *
 *   describeMutating("Leads — create and delete", () => { ... })
 */
export function describeMutating(title: string, fn: () => void): void {
  const allowed = Cypress.env("ALLOW_MUTATION") === true;
  if (!allowed) {
    describe(`${title} [mutating — set CYPRESS_ALLOW_MUTATION=1 to run]`, () => {
      it("skipped: writes to the live system", function () {
        this.skip();
      });
    });
    return;
  }
  describe(`${title} [MUTATING — live writes enabled]`, fn);
}

/**
 * Money is never written by a test, gate or no gate.
 *
 * Call before anything that could reach a payment, refund, payout or invoice
 * endpoint. A booking that gets as far as a PaymentIntent has already cost
 * somebody a Stripe object and, if the keys are ever switched to live, real
 * money.
 */
export function refuseMoneyWrites(): void {
  cy.intercept({ method: "POST", url: /\/(payments|refunds|payouts|invoices)\b/ }, (req) => {
    throw new Error(
      `A test tried to POST ${req.url}. Money endpoints are never written by ` +
        `this suite — see cypress/support/safety.ts.`,
    );
  });
}

/**
 * Records created during a spec so `after` can remove them.
 *
 * Deliberately not automatic: a test that creates something has to say what it
 * created and how to remove it, because a generic cleanup that guesses is how
 * a suite ends up deleting a real vendor's row.
 */
export function trackForCleanup(kind: string, id: number | string, remove: () => Cypress.Chainable) {
  cy.log(`**cleanup registered** ${kind} ${id}`);
  Cypress.once("test:after:run", () => {
    remove();
  });
}
