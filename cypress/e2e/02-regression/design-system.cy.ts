/**
 * The design decisions that were measured, and must stay measured.
 *
 * Each of these was a real defect found by reading computed style off the live
 * DOM, not by looking at screenshots. They are asserted the same way, because
 * the class name in the source proves nothing — a rule can ship, be applied to
 * 105 elements, and match nothing at all, which is exactly what happened to the
 * touch target when it was written into a stylesheet the portal never imports.
 */

const KPI_WEIGHT = 600; // Money screen and Venue-OS agree on this for a hero figure
const COLUMN_WEIGHT = 500; // MoneyCell — the table-column atom

/** Every visible leaf node whose whole text is a rupee amount. */
function moneyNodes(): Cypress.Chainable<HTMLElement[]> {
  return cy
    .get("main")
    .last()
    .find("*")
    .then(($els: JQuery<HTMLElement>) => {
      const nodes = $els.toArray().filter((el: HTMLElement) => {
        if (el.children.length > 0) return false;
        const t = (el.textContent ?? "").trim();
        if (!/^Rs\.?\s?[\d,]+$/.test(t)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      return cy.wrap(nodes, { log: false }) as unknown as Cypress.Chainable<HTMLElement[]>;
    });
}

describe("Design system — measured, not eyeballed", () => {
  beforeEach(() => cy.loginAs("vendor"));

  describe("brand typography", () => {
    // The portal rendered in Inter and nothing else while the public site was
    // set in Playfair. A vendor moved from a site with a voice to a dashboard
    // that looked like every SaaS tool made since 2018.
    ["/dashboard/staff", "/dashboard/money", "/dashboard/reviews", "/dashboard/bookings"].forEach((route) => {
      it(`sets the page title in Playfair on ${route}`, () => {
        cy.visitModule(route);
        cy.get("h1").first().then(($h1) => {
          const family = getComputedStyle($h1[0]).fontFamily;
          expect(family, `h1 font-family on ${route}`).to.match(/playfair/i);
        });
      });
    });

    it("keeps Inter for body text — the gap was display, not body", () => {
      // Restraint is the point. If Playfair leaks into table cells the fix has
      // overshot: it is the wrong face for dense figures.
      cy.visitModule("/dashboard/bookings");
      cy.get("main").last().find("td, p").first().then(($el) => {
        expect(getComputedStyle($el[0]).fontFamily, "body font-family").not.to.match(/playfair/i);
      });
    });
  });

  describe("money reads as money", () => {
    it("draws column figures at the MoneyCell weight on Venue-OS", () => {
      // Every one of these was 400 — the same weight as the venue name beside
      // it — while the KPI figures at the top of the SAME screen sat at 600.
      cy.visitModule("/dashboard/venue-os");
      moneyNodes().then((nodes) => {
        if (nodes.length === 0) {
          cy.task("log", "  NOTE: no money figures on screen — nothing to weigh");
          return;
        }
        const weights = [...new Set(nodes.map((el) => getComputedStyle(el).fontWeight))];
        cy.task("log", `  venue-os money weights: ${weights.join(", ")}`);
        const tooLight = nodes.filter((el) => Number(getComputedStyle(el).fontWeight) < COLUMN_WEIGHT);
        expect(
          tooLight.map((el) => el.textContent?.trim()),
          `money drawn lighter than ${COLUMN_WEIGHT}`,
        ).to.deep.equal([]);
      });
    });

    it("draws the report card figure at the KPI weight, not bolder", () => {
      // 700 here and 600 everywhere else meant one number changed weight
      // depending on which screen it was read from.
      cy.visitModule("/dashboard/reports");
      moneyNodes().then((nodes) => {
        if (nodes.length === 0) {
          cy.task("log", "  NOTE: no money figures on Reports — nothing to weigh");
          return;
        }
        const weights = nodes.map((el) => Number(getComputedStyle(el).fontWeight));
        cy.task("log", `  reports money weights: ${[...new Set(weights)].join(", ")}`);
        expect(Math.max(...weights), "heaviest money figure on Reports").to.be.at.most(KPI_WEIGHT);
      });
    });

    it("uses tabular numerals so columns align to the digit", () => {
      cy.visitModule("/dashboard/money");
      moneyNodes().then((nodes) => {
        if (nodes.length === 0) return;
        const proportional = nodes.filter(
          (el) => !getComputedStyle(el).fontVariantNumeric.includes("tabular"),
        );
        expect(proportional.map((el) => el.textContent?.trim()), "money without tabular-nums").to.deep.equal([]);
      });
    });
  });

  describe("touch targets", () => {
    it("ships the coarse-pointer hit area into the PORTAL's stylesheet", () => {
      // The whole bug in one assertion. The rule lived in app/globals.css,
      // which the dashboard tree never imports, so `.touch-40` was applied to
      // 105 controls on Leads and matched nothing. Reading the class name off
      // the element would still have "passed" — so read the CSSOM instead and
      // prove a rule actually exists for it, inside a coarse-pointer query.
      cy.visitModule("/dashboard/leads");
      cy.document().then((doc) => {
        let found: { media: string; text: string } | null = null;
        for (const sheet of Array.from(doc.styleSheets)) {
          let rules: CSSRuleList;
          try {
            rules = (sheet as CSSStyleSheet).cssRules;
          } catch {
            continue; // cross-origin sheet
          }
          const walk = (list: CSSRuleList, media: string) => {
            for (const rule of Array.from(list)) {
              if ((rule as CSSMediaRule).media && (rule as CSSMediaRule).cssRules) {
                walk((rule as CSSMediaRule).cssRules, (rule as CSSMediaRule).media.mediaText);
              } else if ((rule as CSSStyleRule).selectorText?.includes("touch-40")) {
                found = { media, text: (rule as CSSStyleRule).cssText.slice(0, 120) };
              }
            }
          };
          walk(rules, "");
        }
        expect(found, "a .touch-40 rule in the portal's loaded stylesheets").to.not.equal(null);
        expect(found!.media, ".touch-40 media query").to.match(/pointer:\s*coarse/);
      });
    });

    it("applies the hit-area class to the controls that need it", () => {
      cy.visitModule("/dashboard/leads");
      cy.get(".touch-40").should("have.length.greaterThan", 0);
    });
  });

  describe("responsive", () => {
    // The strongest part of the system before any of this work, and the one a
    // careless fix would break: a horizontally scrolling body detaches the
    // sticky header.
    ["/dashboard", "/dashboard/leads", "/dashboard/money", "/dashboard/calendar"].forEach((route) => {
      it(`does not scroll sideways at 360px on ${route}`, () => {
        cy.viewport(360, 720);
        cy.visitModule(route);
        cy.shouldNotOverflowHorizontally();
      });
    });
  });
});

// Keeps this spec a module so its top-level consts do not collide with
// another spec in the same TS program.
export {};
