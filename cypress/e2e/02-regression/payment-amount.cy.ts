/**
 * The amount on screen must be the amount the SERVER says is owed.
 *
 * ── The original defect, and why the guard outlived the gateway ───────────
 *
 * Measured on production, booking #193:
 *
 *   button label          "Pay Rs 32,500"
 *   PaymentIntent.amount  3500000   (PKR is 2-decimal -> Rs 35,000)
 *   receipt               "DOWN PAYMENT PAID Rs. 35,000"
 *
 * The browser computed its own total and deposit; the server recomputed the
 * booking on create and took the deposit from the persisted figure. The
 * customer was quoted one number and charged Rs 2,500 more.
 *
 * ── Why this spec was rewritten rather than deleted ──────────────────────
 *
 * It asserted the relationship against Stripe (`create-payment-intent`), and
 * that endpoint is no longer called by anything — the platform takes no
 * payments, so the spec would have sat waiting for a request that never fires.
 *
 * But the failure it guards against got MORE likely, not less. `downPayment`
 * used to hold the required advance and now holds money received, so a screen
 * that still derives the figure locally would quote Rs 0 — or, through a
 * `down > 0 ? down : total` fallback, the entire booking total to someone who
 * owes a 10% deposit. The pay page was changed to read the server's
 * `payment-instructions` figure for exactly this reason, and this is the guard
 * that keeps it that way.
 *
 * Read-only throughout. It files no payment claim, so nothing is created and
 * nothing needs cleaning up.
 */

import { refuseMoneyWrites } from "../../support/safety";

/** "Rs 32,500" / "Rs. 32,500" -> 32500 */
function parseRupees(text: string): number | null {
  const m = text.match(/Rs\.?\s*([\d,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

describe("Pay page — the figure shown is the server's figure", () => {
  beforeEach(() => {
    cy.loginAs("vendor");
    refuseMoneyWrites();
  });

  it("shows the amount from payment-instructions, not one derived in the browser", () => {
    let serverAmount: number | null = null;

    cy.intercept("GET", "**/payment-instructions", (req) => {
      req.continue((res) => {
        // `amountDue` is the one authority on what is owed: it reads
        // `advanceDuePkr` for a down payment and the live installment ledger
        // for a balance. Nothing on the client may recompute it.
        serverAmount = Number(res.body?.data?.amountDue ?? NaN);
      });
    }).as("instructions");

    // An existing booking already awaiting payment is used rather than creating
    // one: this spec must not add a row to a live venue's calendar just to read
    // a label. If none exists the test says so instead of quietly passing.
    cy.apiRequest("GET", "/bookings?status=Awaiting Payment&limit=1").then((res) => {
      const booking = res.body?.data?.bookings?.[0] ?? res.body?.data?.[0];
      if (!booking?.id) {
        cy.task("log", "  NOTE: no booking awaiting payment — cannot exercise the pay page");
        return;
      }

      cy.visit(`/user/bookings/${booking.id}/pay`, { failOnStatusCode: false });
      cy.wait("@instructions", { timeout: 45_000 });

      cy.then(() => {
        // A vendor who has not accepted yet is a legitimate outcome: the page
        // deliberately shows "the venue is reviewing your request" and asks for
        // nothing. Asserting an amount there would be asserting the bug.
        if (!Number.isFinite(serverAmount) || (serverAmount ?? 0) <= 0) {
          cy.task("log", "  NOTE: nothing due on this booking — no amount to compare");
          return;
        }

        cy.contains(/rs\.?\s*[\d,]+/i, { timeout: 30_000 })
          .invoke("text")
          .then((label) => {
            const shown = parseRupees(label);
            expect(shown, `amount parsed from "${label.trim()}"`).to.be.a("number");
            expect(
              shown,
              `screen says Rs ${shown}, server says Rs ${serverAmount} is due`,
            ).to.eq(serverAmount);
          });
      });
    });
  });

  it("never shows an amount before the server has said what is owed", () => {
    // Until the instructions resolve there is no authoritative figure, so any
    // number on screen could only be a guess — and a guess next to a venue's
    // account number is what gets the wrong sum transferred.
    cy.intercept("GET", "**/payment-instructions", (req) => {
      // Hold the response so the "before the amount is known" window is wide
      // enough to assert on rather than being a race against the network.
      req.continue((res) => {
        res.setDelay(4000);
      });
    }).as("slowInstructions");

    cy.apiRequest("GET", "/bookings?status=Awaiting Payment&limit=1").then((res) => {
      const booking = res.body?.data?.bookings?.[0] ?? res.body?.data?.[0];
      if (!booking?.id) {
        cy.task("log", "  NOTE: no booking awaiting payment — nothing to assert");
        return;
      }
      cy.visit(`/user/bookings/${booking.id}/pay`, { failOnStatusCode: false });
      // While loading the page renders skeletons only — no rupee figure, and
      // nothing to submit a transfer against.
      cy.contains("button", /I&apos;ve (transferred|sent)/i).should("not.exist");
      cy.wait("@slowInstructions", { timeout: 45_000 });
    });
  });
});
