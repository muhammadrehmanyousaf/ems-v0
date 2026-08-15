/**
 * "Is this control actually unreachable?" — one definition, shared.
 *
 * This existed as three drifting copies and produced three separate false-
 * positive reports before it was consolidated:
 *
 *   1. `/dashboard/business` — 100 row-action buttons flagged. All inside a
 *      Radix ScrollArea viewport. Reachable by scrolling.
 *   2. `/dashboard/reviews`, `/trade-ops` — same cause.
 *   3. `/` at 360px — 42 category cards flagged. All inside `.swiper-wrapper`,
 *      which sets `overflow: visible` and slides by transform, so a predicate
 *      keyed on `overflow-x: auto|scroll` missed it entirely.
 *
 * The lesson each time: a control outside the viewport is only broken if there
 * is no mechanism to bring it in. Test for the MECHANISM, not for one CSS
 * property that happens to implement it.
 *
 * Returns the source of a browser-side function, because it has to be injected
 * into `page.evaluate` / `cy.window` rather than imported there.
 */
export const REACHABILITY_FN = `
// Assigned onto window explicitly. A bare function declaration inside an init
// script is not reliably visible to a later page.evaluate.
window.__reachMechanism = function (el) {
  let n = el.parentElement;
  while (n && n !== document.body) {
    const s = getComputedStyle(n);
    // Any ancestor that scrolls, however its overflow is declared. Swiper sets
    // overflow:visible on the wrapper, so checking overflowX alone misses it.
    if (n.scrollWidth > n.clientWidth + 4) return "scroll";
    // Carousels that slide by transform never report scrollWidth at all.
    if (s.transform && s.transform !== "none") return "transform";
    // A fixed/sticky ancestor is positioned deliberately, not overflowing.
    if (s.position === "fixed" || s.position === "sticky") return "positioned";
    n = n.parentElement;
  }
  return null;
};
window.__isUnreachable = function (el, viewportWidth) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  if (r.left >= -4 && r.right <= viewportWidth + 4) return false;
  if (window.__reachMechanism(el) !== null) return false;
  /**
   * Partly off-screen is CLIPPED, not unreachable. A control with a usable
   * amount of itself still on screen can be tapped, and calling that "broken"
   * overstates it — which happened twice:
   *
   *   vendor-queue  "Approve"                   left -19, 91px visible  → tappable
   *   force-majeure "Preview affected booking"  left -78, 153px visible → tappable
   *
   * Both are real cosmetic defects worth fixing, and neither blocks the user.
   * A control is unreachable only when almost none of it can be hit: fewer than
   * 24 CSS px on screen, which is below the minimum comfortable touch target.
   */
  const visible = Math.min(viewportWidth, r.right) - Math.max(0, r.left);
  return visible < 24;
};
/** True when a control is on screen but partly cut off — cosmetic, not blocking. */
window.__isClipped = function (el, viewportWidth) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  if (r.left >= -4 && r.right <= viewportWidth + 4) return false;
  if (window.__reachMechanism(el) !== null) return false;
  const visible = Math.min(viewportWidth, r.right) - Math.max(0, r.left);
  return visible >= 24;
};
`;
