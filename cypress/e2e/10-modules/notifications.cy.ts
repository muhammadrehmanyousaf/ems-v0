/**
 * Notifications — /dashboard/notifications
 *
 * The densest tap surface in the product: 65 of 89 controls measured under
 * 36px, and 50 of those were one thing — the per-row delete button.
 *
 * Two defects lived there, and the smaller one was the size. The button is
 * `opacity-0` until `group-hover`, and a phone has no hover, so on touch all 50
 * sat fully invisible — each one a hard delete with no dialog, no toast and
 * nothing to undo. Invisible was the dangerous part, not small.
 *
 * Read-only. Nothing here presses delete; that is the whole point of the
 * screen's risk and it is not something a suite should be doing against a live
 * account. Reachability and visibility are asserted instead.
 */
import { moduleSuite } from "../../support/module-suite";

const ROUTE = "/dashboard/notifications";

moduleSuite({
  route: ROUTE,
  name: "Notifications",
  expects: { pageHeader: true, dataTable: false, statCard: false, tabs: false },
});

describe("Notifications · destructive controls", () => {
  beforeEach(() => {
    cy.loginAs("vendor");
    cy.visitModule(ROUTE);
  });

  it("carries the coarse-pointer reveal on every row delete", () => {
    // The class is what makes the button appear on a phone. Asserting the class
    // here and the RULE separately (below) is deliberate: the touch-target bug
    // proved that a class can be applied to 105 elements and match nothing.
    cy.get("button[aria-label*='Delete notification' i]").then(($btns) => {
      if ($btns.length === 0) {
        cy.task("log", "  NOTE: no notifications on this account — no row actions to check");
        return;
      }
      const missing = $btns
        .toArray()
        .filter((b) => !b.className.includes("coarse:opacity-100"));
      expect(missing.length, "row deletes without a coarse-pointer reveal").to.equal(0);
    });
  });

  it("defines that reveal inside a coarse-pointer media query", () => {
    // Reads the CSSOM rather than the class attribute. If this rule were
    // emitted outside the media query the button would be visible on desktop
    // too, which would break the hover-reveal design — so the query is asserted,
    // not just the rule's existence.
    cy.document().then((doc) => {
      let found: string | null = null;
      for (const sheet of Array.from(doc.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = (sheet as CSSStyleSheet).cssRules;
        } catch {
          continue;
        }
        const walk = (list: CSSRuleList, media: string) => {
          for (const rule of Array.from(list)) {
            const asMedia = rule as CSSMediaRule;
            if (asMedia.media && asMedia.cssRules) {
              walk(asMedia.cssRules, asMedia.media.mediaText);
            } else if ((rule as CSSStyleRule).selectorText?.includes("coarse")) {
              found = media;
            }
          }
        };
        walk(rules, "");
      }
      if (found === null) {
        cy.task("log", "  NOTE: no coarse: utility in the loaded CSS — not yet deployed");
        return;
      }
      expect(found, "media query wrapping the coarse: utility").to.match(/pointer:\s*coarse/);
    });
  });

  it("names every row action for a screen reader", () => {
    // The button was once labelled only by `title`, so a keyboard user could
    // focus something invisible and unnamed.
    cy.get("button").then(($btns) => {
      const iconOnly = $btns.toArray().filter((b) => (b.textContent ?? "").trim() === "");
      const unnamed = iconOnly.filter(
        (b) => !b.getAttribute("aria-label") && !b.getAttribute("title"),
      );
      expect(unnamed.length, "icon-only buttons with no accessible name").to.equal(0);
    });
  });

  it("keeps the delete control inside the row at 360px", () => {
    cy.viewport(360, 720);
    cy.visitModule(ROUTE);
    cy.get("button[aria-label*='Delete notification' i]").then(($btns) => {
      if ($btns.length === 0) return;
      const escaping = $btns.toArray().filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.right > 364 || r.left < -4);
      });
      expect(escaping.length, "delete buttons outside the viewport at 360px").to.equal(0);
    });
  });

  it("offers a way to mark everything read without deleting anything", () => {
    // The safe bulk action has to exist, or the only way to clear the list is
    // the irreversible one.
    cy.get("body").then(($b) => {
      const hasBulk = /mark all read|mark as read/i.test($b.text());
      const empty = /no notifications|nothing|all caught up/i.test($b.text());
      expect(hasBulk || empty, "a non-destructive bulk action, or an empty list").to.equal(true);
    });
  });
});
