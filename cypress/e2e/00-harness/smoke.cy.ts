/**
 * Does the harness itself work?
 *
 * Run this first and alone. Every other spec assumes a real authenticated
 * session against a real deployment; if that assumption is wrong, the rest of
 * the suite fails in a hundred confusing ways instead of one clear one.
 */

describe("Harness", () => {
  it("is pointed at a deployed origin, not localhost", () => {
    const base = Cypress.config("baseUrl") ?? "";
    expect(base, "baseUrl").to.match(/^https:\/\//);
    expect(base, "baseUrl").not.to.match(/localhost|127\.0\.0\.1/);
  });

  it("blocks mutations unless they were deliberately enabled", () => {
    // Not asserting a fixed value — asserting the flag is a real boolean and
    // is reported, so a run can never be ambiguous about whether it could write.
    const allow = Cypress.env("ALLOW_MUTATION");
    expect(allow, "ALLOW_MUTATION").to.be.a("boolean");
    cy.task("log", `  ALLOW_MUTATION=${allow}`);
  });

  it("signs a vendor in and keeps a usable token", () => {
    cy.loginAs("vendor");
    cy.visitModule("/dashboard");
    cy.location("pathname").should("match", /\/dashboard/);
    cy.window().its("localStorage.auth_token").should("be.a", "string").and("have.length.gt", 20);
  });

  it("reaches the API with that token", () => {
    // Proves the session is genuinely authenticated rather than just rendering
    // a shell — a stale token paints the same screen and 401s every call.
    cy.loginAs("vendor");
    cy.visitModule("/dashboard");
    cy.apiRequest("GET", "/users/profile/me").then((res) => {
      expect(res.status, `GET /users/profile/me -> ${res.status}`).to.be.oneOf([200, 304]);
    });
  });

  it("collects console errors so other specs can assert on them", () => {
    cy.loginAs("vendor");
    cy.visitModule("/dashboard");
    cy.consoleErrors().should("be.an", "array");
  });
});

// Keeps this spec a module so its top-level consts do not collide with
// another spec in the same TS program.
export {};
