/**
 * Send a vendor to a FIELD, not just to a screen.
 *
 * The onboarding checklist has promised "a checklist deep-linked to the right
 * edit page" since it was written, and delivered links at TAB granularity —
 * `/dashboard/settings?tab=listing`. Listing content is a form with roughly
 * thirty inputs across four groups, so "add your WhatsApp number" dropped the
 * vendor at the top of it with nothing indicating which box was meant. Six
 * checklist items were worse than that: they pointed at the Profile tab, which
 * edits five fields, none of which was the one named (see
 * vendorCompletenessScore.js — the tabs are fixed there).
 *
 * The links now carry `&field=<dom-id>`, and this resolves it.
 *
 * Two details that matter:
 *
 *  - The target may not exist yet. Settings mounts its tab body only after the
 *    businesses query resolves, and the managers inside mount later still, so a
 *    single `getElementById` on click reliably finds nothing.
 *
 *    The first version of this polled 40 animation frames — about 0.7s — which
 *    was measured, on the live settings screen, to be too short: the deep link
 *    landed on the right tab with `lc-whatsapp` present in the DOM and the page
 *    still scrolled to the top, cursor nowhere. The budget is a WALL-CLOCK
 *    ceiling now, not a frame count: rAF is throttled hard in a background tab,
 *    so 40 frames can be 40 seconds there and half a second here. Still bounded,
 *    so a wrong id gives up instead of spinning.
 *
 *  - `scrollIntoView` alone puts the field under the fixed top bar. The bar
 *    publishes nothing, but the scroll container is known (`[data-dashboard-scroll]`,
 *    set by the dashboard shell), so the offset is measured from the container's
 *    own top rather than assumed.
 */

const FLASH_CLASS = "ww-field-flash";
/** Wall-clock budget for the field to appear. Covers a cold tab-body mount. */
const MAX_WAIT_MS = 8000;
const FLASH_MS = 2400;

/** The element a vendor should actually be typing in, given a wrapper or an input. */
function focusableWithin(el: HTMLElement): HTMLElement {
  const SEL = "input:not([type=hidden]), textarea, select, button, [tabindex]:not([tabindex='-1'])";
  if (el.matches(SEL)) return el;
  return el.querySelector<HTMLElement>(SEL) ?? el;
}

/**
 * @param onFound Called once the field has been reached. The caller uses this
 *   to strip `?field=` from the URL — and ONLY then, so a slow mount does not
 *   lose the instruction and a reload can still retry it.
 */
export function focusField(id: string, onFound?: () => void): void {
  if (!id || typeof document === "undefined") return;

  const deadline = Date.now() + MAX_WAIT_MS;
  const tick = () => {
    const el = document.getElementById(id);
    if (!el) {
      if (Date.now() < deadline) requestAnimationFrame(tick);
      return;
    }

    const scroller = el.closest<HTMLElement>("[data-dashboard-scroll]");
    if (scroller) {
      // Centre it in the visible region rather than pinning it to the top edge,
      // so the vendor sees the field WITH its label and its helper text.
      const top =
        el.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        Math.max(80, scroller.clientHeight / 3);
      scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // preventScroll: the smooth scroll above owns the movement; letting focus
    // scroll too produces a visible double-jump.
    focusableWithin(el).focus?.({ preventScroll: true });

    el.classList.add(FLASH_CLASS);
    window.setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_MS);

    onFound?.();
  };

  requestAnimationFrame(tick);
}

export default focusField;
