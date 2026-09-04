import { test, expect } from "@playwright/test";
import { gotoShell } from "./_shell";

/**
 * Visual regression (docs/TEST-CASES.md — pixel oracle, automated slice).
 *
 * What this CAN and CANNOT do, stated honestly:
 *   • It guards the champagne shell's LAYOUT and DESIGN TOKENS — rail, top bar,
 *     panel frame, headers, toolbars, spacing, palette — against regression.
 *     A broken grid, a lost sticky header, a mis-set token, a font fallback all
 *     move pixels the mask doesn't cover and fail the diff.
 *   • It is NOT a pixel-exact check of live content against the design sample.
 *     The console is multi-tenant and live: list rows, counts, dates and money
 *     change hour to hour, so a full-page exact diff would be red every day for
 *     no defect. That comparison stays the MANUAL pixel oracle in TEST-CASES.md.
 *
 * How it stays stable on a live site:
 *   • viewport-only (the above-the-fold chrome is the design-critical, most
 *     stable band), animations disabled, and the data-variable regions masked
 *     (the list bodies / data-grid), with a small maxDiffPixelRatio for the
 *     antialiasing + any unmasked jitter.
 *
 * Baselines were captured against production and verified stable across an
 * immediate re-run. Regenerate intentionally with `--update-snapshots` when a
 * design change is deliberate; review the diff image first.
 */

// The design-critical screens (mirror docs/design-samples/*.html) plus a couple
// of high-traffic operational screens. Kept small on purpose — a visual baseline
// is a liability if it is large and no one looks at the diffs.
const SCREENS: [key: string, route: string][] = [
  ["overview", "/dashboard"],
  ["leads", "/dashboard/leads"],
  ["bookings", "/dashboard/bookings"],
  ["calendar", "/dashboard/calendar"],
  ["chat", "/dashboard/chat"],
  ["function-sheets", "/dashboard/function-sheets"],
  ["customers", "/dashboard/customers"],
  ["money", "/dashboard/money"],
  ["settings", "/dashboard/settings"],
];

test.describe("Visual — champagne shell layout & tokens", () => {
  for (const [key, route] of SCREENS) {
    test(`visual ${key}`, async ({ page }) => {
      await gotoShell(page, route);
      // Settle late fonts/icons and any first-paint shimmer.
      await page.waitForTimeout(1200);

      // Mask the data-variable regions (locators pierce the shadow root). The
      // shell chrome around them is what this baseline actually asserts.
      const masks = [
        page.locator("[data-ww-list]"),
        page.locator("table tbody"),
        page.locator("[data-grid] .tbl-wrap, .tbl-wrap"),
        page.locator("[data-chat-thread], [data-messages]"),
        page.locator("time, [data-money], .ww-amount"),
      ];

      await expect(page).toHaveScreenshot(`${key}.png`, {
        animations: "disabled",
        caret: "hide",
        mask: masks,
        maxDiffPixelRatio: 0.02,
        // viewport only — the above-the-fold band is the design-critical, stable part
        fullPage: false,
        timeout: 15_000,
      });
    });
  }
});
