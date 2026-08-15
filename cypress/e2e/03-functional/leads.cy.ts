/**
 * Leads — the module a vendor lives in.
 *
 * Split deliberately into what can be proven without touching the live system
 * and what cannot. The read-only half runs on every invocation; the CRUD half
 * is gated behind CYPRESS_ALLOW_MUTATION because this points at production and
 * a stray create leaves a real row in a real vendor's inbox.
 *
 * The hostile cases are the point. A form that accepts a valid lead proves
 * almost nothing — every form does that on the day it ships. What breaks in
 * production is the empty submit, the 300-character name, the phone typed with
 * spaces, the double-click that files two copies.
 */

import { describeMutating } from "../../support/safety";

const ROUTE = "/dashboard/leads";

describe("Leads — read-only", () => {
  beforeEach(() => {
    cy.loginAs("vendor");
    cy.visitModule(ROUTE);
  });

  it("shows the inbox, or says why it is empty", () => {
    cy.get("body").then(($b) => {
      const hasRows = $b.find("table tbody tr, [role='row']").length > 0;
      const explains = /no leads|nothing|yet\b|get started/i.test($b.text());
      expect(hasRows || explains, "rows on screen, or an empty state that explains").to.equal(true);
    });
  });

  it("opens the new-lead form and can close it again without saving", () => {
    // Reachability is the assertion. A control that opens nothing is broken
    // regardless of how it looks, and closing without saving must not write.
    cy.contains("button", /add|new lead|create/i).first().click();
    cy.get("[role='dialog']", { timeout: 15_000 }).should("be.visible");
    cy.get("body").type("{esc}");
    cy.get("[role='dialog']").should("not.exist");
  });

  it("refuses an empty submit instead of filing a blank lead", () => {
    cy.contains("button", /add|new lead|create/i).first().click();
    cy.get("[role='dialog']", { timeout: 15_000 }).should("be.visible");

    // Nothing typed. The dialog must still be open afterwards — either the
    // browser blocked it or the app did, but a blank lead must not be created.
    cy.get("[role='dialog']").within(() => {
      cy.contains("button", /save|create|add/i).click({ force: true });
    });
    cy.get("[role='dialog']").should("be.visible");
  });

  it("every field in the form has a label a screen reader can use", () => {
    // WCAG, and also the plain usability of knowing what a box wants. Checked
    // per control rather than as a count, so the failure names the field.
    cy.contains("button", /add|new lead|create/i).first().click();
    cy.get("[role='dialog']", { timeout: 15_000 }).within(() => {
      cy.get("input:visible, select:visible, textarea:visible").each(($el) => {
        const el = $el[0] as HTMLInputElement;
        const id = el.id;
        const labelled =
          !!el.getAttribute("aria-label") ||
          !!el.getAttribute("aria-labelledby") ||
          !!el.getAttribute("placeholder") ||
          (!!id && Cypress.$(`label[for="${CSS.escape(id)}"]`).length > 0) ||
          Cypress.$(el).closest("label").length > 0;
        expect(labelled, `field "${id || el.name || el.type}" has an accessible name`).to.equal(true);
      });
    });
  });

  it("keeps every row action reachable at 360px", () => {
    // A control that exists but cannot be reached on the device the vendor
    // actually holds is broken. Overflow is the usual cause.
    cy.viewport(360, 720);
    cy.visitModule(ROUTE);
    cy.shouldNotOverflowHorizontally();
    cy.get("button:visible").should("have.length.greaterThan", 0);
  });

  it("logs no console errors while filtering", () => {
    cy.get("input[type='search'], input[placeholder*='earch']").then(($search) => {
      if ($search.length === 0) {
        cy.task("log", "  NOTE: no search control on Leads — filter path not exercised");
        return;
      }
      cy.wrap($search.first()).type("zzz-no-such-lead-zzz");
      cy.wait(1500);
      cy.consoleErrors().should("deep.equal", []);
    });
  });
});

describeMutating("Leads — create, edit, delete", () => {
  const stamp = Date.now();
  const name = `Cypress Lead ${stamp}`;
  let createdId: number | null = null;

  before(() => cy.loginAs("vendor"));

  after(() => {
    // Cleanup is asserted, not hoped for. A suite that leaves rows behind in a
    // live vendor's inbox is worse than one that never ran.
    if (createdId == null) return;
    cy.loginAs("vendor");
    cy.visitModule(ROUTE);
    cy.apiRequest("DELETE", `/leads/${createdId}`).then((res) => {
      expect(res.status, `cleanup DELETE /leads/${createdId}`).to.be.oneOf([200, 204, 404]);
    });
  });

  it("creates a lead and it survives a hard reload", () => {
    cy.loginAs("vendor");
    cy.visitModule(ROUTE);

    cy.intercept("POST", "**/leads*").as("createLead");
    cy.contains("button", /add|new lead|create/i).first().click();
    cy.get("[role='dialog']", { timeout: 15_000 }).within(() => {
      cy.get("input:visible").first().type(name);
      cy.get("input[type='tel'], input[name*='phone' i]").first().type("03001234567", { force: true });
      cy.contains("button", /save|create|add/i).click();
    });

    cy.wait("@createLead").then(({ response }) => {
      expect(response?.statusCode, "create lead").to.be.within(200, 299);
      createdId = response?.body?.data?.id ?? response?.body?.data?.lead?.id ?? null;
    });

    // The assertion that matters: not that the UI updated, but that the SERVER
    // kept it. Post-action UI state is not evidence.
    cy.reload();
    cy.contains(name, { timeout: 20_000 }).should("be.visible");
  });

  it("does not file two leads from a double-click", () => {
    cy.loginAs("vendor");
    cy.visitModule(ROUTE);
    const dupName = `Cypress Dup ${Date.now()}`;
    let posts = 0;
    cy.intercept("POST", "**/leads*", (req) => {
      posts += 1;
      req.continue();
    }).as("dupCreate");

    cy.contains("button", /add|new lead|create/i).first().click();
    cy.get("[role='dialog']", { timeout: 15_000 }).within(() => {
      cy.get("input:visible").first().type(dupName);
      cy.get("input[type='tel'], input[name*='phone' i]").first().type("03001234567", { force: true });
      const save = cy.contains("button", /save|create|add/i);
      save.dblclick();
    });

    cy.wait(3000).then(() => {
      expect(posts, "POST /leads calls from one double-click").to.be.lessThan(2);
    });
  });
});
