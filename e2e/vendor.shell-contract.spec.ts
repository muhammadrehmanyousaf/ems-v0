import { test, expect } from "@playwright/test";
import { ROUTES, collect, gotoShell, probeShell, toggleDark, stickyInfo } from "./_shell";

/**
 * Shell Contract (docs/TEST-CASES.md §A) — the champagne-shell invariants,
 * asserted on every vendor route. Read-only; safe against a live deploy.
 *
 * Covers the automatable SC cases:
 *   SC-01/14  champagne shell renders (no login bounce, content present)
 *   SC-04     no horizontal body scroll
 *   SC-18     0 console errors / 0 5xx (noise filtered)
 *   SC-05     dark-mode toggle darkens shell AND content
 *   SC-03     list column-headers are sticky
 */

test.describe("Shell Contract — every route", () => {
  for (const [key, route] of ROUTES) {
    test(`SC ${key} — renders champagne, no h-scroll, clean console`, async ({ page }) => {
      const seen = collect(page);
      await gotoShell(page, route);

      const s = await probeShell(page);
      // SC-01/14: the persistent champagne chrome is present…
      expect(s.cshell, `${key}: .cshell present`).toBeTruthy();
      // …and the screen rendered content (shadow #wwc OR a React hub page).
      expect(s.shadow || s.reactPage, `${key}: content rendered`).toBeTruthy();
      // content-present check — overview is deliberately off useArtifactShell
      // (its main content is not in the first #wwc shadow), so exempt it.
      if (s.shadow && key !== "overview") {
        expect(s.contentLen, `${key}: content not empty`).toBeGreaterThan(40);
      }

      // SC-04: the body never scrolls sideways (wide content scrolls internally).
      expect(s.hScroll, `${key}: no horizontal body scroll`).toBeLessThanOrEqual(2);

      // SC-18: clean console + no server errors.
      expect(seen.net5, `${key}: no 5xx (${seen.net5.join(", ")})`).toHaveLength(0);
      expect(seen.errors, `${key}: no console errors (${seen.errors.join(" | ")})`).toHaveLength(0);
    });
  }
});

test.describe("Shell Contract — interactions", () => {
  test("SC-05 dark mode — toggle darkens the shell AND the content", async ({ page }) => {
    await gotoShell(page, "/dashboard");
    const t = await toggleDark(page);
    expect(t.shellTheme, "shell -> dark").toBe("dark");
    expect(t.hostTheme, "content host -> dark").toBe("dark");
    expect(t.htmlDark, "<html>.dark set (for tailwind hub pages)").toBeTruthy();
  });

  test("SC-03 sticky — bookings list column-headers freeze", async ({ page }) => {
    await gotoShell(page, "/dashboard/bookings");
    const s = await stickyInfo(page);
    expect(s.hasTable, "bookings has a table").toBeTruthy();
    expect(s.theadSticky, "thead position: sticky").toBeTruthy();
  });
});
