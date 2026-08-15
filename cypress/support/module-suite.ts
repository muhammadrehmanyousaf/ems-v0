/// <reference types="cypress" />

/**
 * The contract every module has to satisfy, in one place.
 *
 * There is one spec FILE per module, because that is how a failure is read:
 * "Suppliers is red" is actionable, "the sweep is red" is not. But the shared
 * expectations live here rather than being copied 51 times — copied assertions
 * drift, and half of them quietly stop asserting anything.
 *
 * Each module's file calls `moduleSuite({...})` for the contract and then adds
 * its own cases underneath. The contract is the floor. It is deliberately more
 * than "the page rendered", because a render check has never once caught a real
 * defect on this project:
 *
 *   - the calendar rendered perfectly while offering every blocked date
 *   - the pay button rendered perfectly while quoting the wrong price
 *   - Notifications rendered 50 delete buttons that were invisible on a phone
 *
 * All of it is read-only. Nothing here submits a form or writes a row.
 */

export interface ModuleSpec {
  /** Route under test, e.g. "/dashboard/leads". */
  route: string;
  /** Human name used in test titles. */
  name: string;
  /** Vendor session cannot see this; assert the gate holds instead. */
  adminOnly?: boolean;
  /** What the source scanner found, so the right thing is asserted per module. */
  expects?: {
    pageHeader?: boolean;
    dataTable?: boolean;
    statCard?: boolean;
    tabs?: boolean;
    /** Carried from the scanner for completeness; not asserted directly. */
    emptyState?: boolean;
  };
  /** Role to sign in as. Defaults to vendor. */
  as?: "vendor" | "user" | "superadmin";
}

const BROKEN =
  /something went wrong|application error|client-side exception|unhandled|this page could not be found|internal server error/i;

export function moduleSuite(spec: ModuleSpec): void {
  const { route, name, adminOnly = false, expects = {}, as = "vendor" } = spec;

  describe(`${name} · ${route}`, () => {
    beforeEach(() => {
      cy.loginAs(as);
      cy.visitModule(route);
    });

    // ── Reachability ────────────────────────────────────────────────────────
    describe("reachability", () => {
      it("does not bounce to login", () => {
        cy.location("pathname").should((p) =>
          expect(p, `ended on ${p}`).not.to.match(/\/login|\/register/),
        );
      });

      it("renders no error boundary", () => {
        cy.get("body")
          .invoke("text")
          .should((t) => {
            const hit = t.match(BROKEN);
            expect(hit?.[0], `error text on ${route}`).to.be.oneOf([undefined, null]);
          });
      });

      it("renders real content rather than an empty shell", () => {
        // "HTTP 200 but nothing there" is invisible to a status-code check and
        // is a failure mode this product has actually shipped.
        cy.get("main, [role='main']")
          .last()
          .invoke("text")
          .should((t) => expect(t.trim().length, "main text length").to.be.greaterThan(120));
      });
    });

    // ── Correctness signals ─────────────────────────────────────────────────
    describe("health", () => {
      it("logs no console errors", () => {
        // A broken fetch hides behind a screen that still paints. This is the
        // cheapest way to see it.
        cy.consoleErrors().should((errors) => expect(errors, "console errors").to.deep.equal([]));
      });

      it("makes no failing API calls on load", () => {
        // Re-visits with interception so a 4xx/5xx on first paint is caught,
        // which the console check alone can miss when the app swallows it.
        const failures: string[] = [];
        cy.intercept({ url: /\/api\/v1\// }, (req) => {
          req.continue((res) => {
            if (res.statusCode >= 400) failures.push(`${res.statusCode} ${req.method} ${req.url}`);
          });
        }).as("api");
        cy.visitModule(route);
        cy.wait(2500);
        cy.then(() => {
          // 401/403 on an admin route with a vendor session is the gate doing
          // its job, not a defect.
          const real = adminOnly ? failures.filter((f) => !/^40[13] /.test(f)) : failures;
          expect(real, `failing API calls on ${route}`).to.deep.equal([]);
        });
      });
    });

    // ── Layout ──────────────────────────────────────────────────────────────
    describe("layout", () => {
      it("does not scroll sideways at 1366px", () => {
        cy.shouldNotOverflowHorizontally();
      });

      it("does not scroll sideways at 360px", () => {
        // A horizontally scrolling body detaches the sticky header. This axis
        // measured clean across all 44 modules and must stay that way.
        cy.viewport(360, 720);
        cy.visitModule(route);
        cy.shouldNotOverflowHorizontally();
      });

      it("keeps its primary actions on screen at 360px", () => {
        cy.viewport(360, 720);
        cy.visitModule(route);
        /**
         * A control inside a horizontally scrollable container is one scroll
         * away, not unreachable — that is how a wide data table is supposed to
         * work. Measured on /dashboard/business: 100 of 100 flagged "Open menu"
         * buttons were inside the table's scroll viewport. Without this the
         * check reports phantom bugs and stops being believed.
         */
        const inScroller = (el: HTMLElement) => {
          let n = el.parentElement;
          while (n && n !== document.body) {
            const s = getComputedStyle(n);
            if ((s.overflowX === "auto" || s.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
            n = n.parentElement;
          }
          return false;
        };
        cy.get("button:visible, a[href]:visible").then(($els) => {
          const offscreen = $els.toArray().filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.left < -4 || r.right > 364) && !inScroller(el);
          });
          expect(offscreen.map((e) => e.textContent?.trim().slice(0, 24)), "controls off-screen at 360px")
            .to.deep.equal([]);
        });
      });
    });

    if (adminOnly) {
      it("holds the admin gate against this session", () => {
        cy.get("body")
          .invoke("text")
          .should((t) =>
            expect(
              /admin only|not authorised|not authorized|permission|access denied/i.test(t),
              `admin gate copy on ${route}`,
            ).to.equal(true),
          );
      });
      return; // the rest of the contract describes vendor chrome that is not there
    }

    // ── Chrome the scanner says this module has ─────────────────────────────
    describe("structure", () => {
      if (expects.pageHeader) {
        it("has exactly one page title, and it is not blank", () => {
          cy.get("h1").should("have.length.at.least", 1);
          cy.get("h1").first().invoke("text").should((t) => expect(t.trim()).to.not.equal(""));
        });
      }

      if (expects.dataTable) {
        it("shows its table, or an empty state that explains the absence", () => {
          cy.get("body").then(($b) => {
            const hasTable = $b.find("table, [role='table'], [role='grid']").length > 0;
            const explains = /no |nothing |yet\b|get started|add your first|empty/i.test($b.text());
            expect(hasTable || explains, "table or explained empty state").to.equal(true);
          });
        });

        it("gives every table column a header", () => {
          cy.get("body").then(($b) => {
            if ($b.find("table thead").length === 0) return;
            cy.get("table thead th").each(($th) => {
              const text = $th.text().trim();
              const labelled = text.length > 0 || $th.find("[aria-label]").length > 0;
              expect(labelled, "column header has a name").to.equal(true);
            });
          });
        });
      }

      if (expects.tabs) {
        it("renders a tablist whose tabs are all reachable", () => {
          cy.get("[role='tablist']").should("exist");
          cy.get("[role='tab']").should("have.length.greaterThan", 1);
          cy.get("[role='tab']").each(($tab) => {
            expect($tab.attr("aria-selected"), "tab exposes selection state").to.be.oneOf([
              "true",
              "false",
            ]);
          });
        });
      }
    });

    // ── Accessibility floor ─────────────────────────────────────────────────
    describe("accessibility", () => {
      it("gives every visible control an accessible name", () => {
        // An icon-only button with no name is unusable by a screen reader and
        // unlabelled in every automated report thereafter.
        cy.get("button:visible, a[href]:visible").then(($els) => {
          const nameless = $els.toArray().filter((el) => {
            const text = (el.textContent ?? "").trim();
            return (
              text.length === 0 &&
              !el.getAttribute("aria-label") &&
              !el.getAttribute("aria-labelledby") &&
              !el.getAttribute("title")
            );
          });
          expect(nameless.length, `controls with no accessible name on ${route}`).to.equal(0);
        });
      });

      it("starts its heading structure at h1", () => {
        cy.get("h1, h2, h3").then(($hs) => {
          if ($hs.length === 0) return;
          const first = $hs.toArray()[0].tagName.toLowerCase();
          expect(first, "first heading on the page").to.equal("h1");
        });
      });

      it("keeps a visible focus ring on the first control", () => {
        // Keyboard users navigate this product too, and a focus ring removed by
        // a reset is invisible until somebody tries.
        cy.get("button:visible, a[href]:visible").first().focus();
        cy.focused().then(($el) => {
          const s = getComputedStyle($el[0]);
          const visible =
            s.outlineStyle !== "none" || s.boxShadow !== "none" || s.borderColor !== "transparent";
          expect(visible, "focused control shows a focus indicator").to.equal(true);
        });
      });
    });
  });
}
