/**
 * The button must say what Stripe will charge.
 *
 * Measured on production, booking #193:
 *
 *   button label          "Pay Rs 32,500"
 *   PaymentIntent.amount  3500000   (PKR is 2-decimal -> Rs 35,000)
 *   receipt               "DOWN PAYMENT PAID Rs. 35,000"
 *
 * The browser computed its own total and deposit; the server recomputed the
 * booking on create and took the deposit from the persisted
 * `booking.downPayment`. Stripe follows the server. So the customer was quoted
 * one number and charged Rs 2,500 more, then shown a receipt that silently
 * disagreed with the button they had pressed.
 *
 * The two figures only diverge when the server's pricing disagrees with the
 * client's — which is exactly when a customer is least likely to accept it, and
 * exactly what a happy-path test with matching numbers would never catch. So
 * this spec asserts the RELATIONSHIP (label == server amount), not a constant.
 *
 * Read-only. It never confirms a PaymentIntent, so no charge is created and
 * nothing needs cleaning up.
 */

import { refuseMoneyWrites } from "../../support/safety";

/** "Pay Rs 32,500" / "Pay Rs. 32,500" -> 32500 */
function parseRupees(text: string): number | null {
  const m = text.match(/Rs\.?\s*([\d,]+)/i);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}

describe("Checkout — the price on the button is the price charged", () => {
  beforeEach(() => {
    cy.loginAs("vendor");
    refuseMoneyWrites();
  });

  it("shows the server's deposit figure, not the browser's", () => {
    let serverAmount: number | null = null;

    cy.intercept("POST", "**/payments/create-payment-intent", (req) => {
      req.continue((res) => {
        // `paymentDetails.amount` is what the server built the PaymentIntent
        // from — the number Stripe will actually take.
        serverAmount = Number(res.body?.data?.paymentDetails?.amount ?? NaN);
      });
    }).as("intent");

    // An existing booking already awaiting payment is used rather than creating
    // one: this spec must not add a row to a live venue's calendar just to read
    // a label. If none exists the test says so instead of quietly passing.
    cy.apiRequest("GET", "/bookings?status=Awaiting Payment&limit=1").then((res) => {
      const booking = res.body?.data?.bookings?.[0] ?? res.body?.data?.[0];
      if (!booking?.id) {
        cy.task("log", "  NOTE: no booking awaiting payment — cannot exercise the checkout label");
        return;
      }

      cy.visit(`/user/bookings/${booking.id}/pay`, { failOnStatusCode: false });
      cy.wait("@intent", { timeout: 45_000 });

      cy.contains("button", /pay\s*rs/i, { timeout: 30_000 })
        .invoke("text")
        .then((label) => {
          const shown = parseRupees(label);
          expect(shown, `amount parsed from "${label.trim()}"`).to.be.a("number");
          expect(serverAmount, "server paymentDetails.amount").to.be.a("number").and.not.be.NaN;
          expect(
            shown,
            `button says Rs ${shown}, server will charge Rs ${serverAmount}`,
          ).to.eq(serverAmount);
        });
    });
  });

  it("never leaves the pay button enabled before the amount is known", () => {
    // The fallback path. Until the intent resolves there is no authoritative
    // figure, so pressing Pay could only ever confirm a guess — the button has
    // to stay unpressable until the server has spoken.
    cy.intercept("POST", "**/payments/create-payment-intent", (req) => {
      // Hold the response so the "before the amount is known" window is wide
      // enough to assert on rather than being a race against the network.
      req.continue((res) => {
        res.setDelay(4000);
      });
    }).as("slowIntent");

    cy.apiRequest("GET", "/bookings?status=Awaiting Payment&limit=1").then((res) => {
      const booking = res.body?.data?.bookings?.[0] ?? res.body?.data?.[0];
      if (!booking?.id) {
        cy.task("log", "  NOTE: no booking awaiting payment — nothing to assert");
        return;
      }
      cy.visit(`/user/bookings/${booking.id}/pay`, { failOnStatusCode: false });
      cy.get("button")
        .filter((_, el) => /pay\s*rs|loading/i.test(el.textContent ?? ""))
        .first()
        .should("be.disabled");
      cy.wait("@slowIntent", { timeout: 45_000 });
    });
  });
});
