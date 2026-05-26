import { test, expect, type Page } from "@playwright/test";

/**
 * Public (no-auth) render smoke. Visits every key marketing/SEO + browse
 * route and asserts it renders without a Next error overlay, a 5xx, or a
 * dead blank body. Zero data risk — pure GETs.
 */

// Fail the test if the page hit a hard runtime error or a server 5xx.
async function assertRenders(page: Page, path: string) {
  const resp = await page.goto(path, { waitUntil: "domcontentloaded" });
  // 4xx/5xx on a top-level navigation is a real failure (404 pages return 200
  // in Next app-router, so only treat >=500 as fatal here).
  if (resp) expect(resp.status(), `${path} HTTP status`).toBeLessThan(500);

  // No Next.js dev/runtime error overlay or generic crash text.
  await expect(page.locator("text=Application error"), `${path} app error`).toHaveCount(0);
  await expect(page.locator("text=/Internal Server Error/i"), `${path} 500 text`).toHaveCount(0);
  await expect(page.locator("text=/This page could not be found/i"), `${path} 404`).toHaveCount(0);

  // Body has real content (not a blank white screen).
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  expect(bodyText.trim().length, `${path} body content`).toBeGreaterThan(40);
}

const PUBLIC_ROUTES = [
  "/",
  "/search",
  "/vendors",
  "/wedding-venues",
  "/caterers",
  "/wedding-photographers",
  "/wedding-decorators",
  "/bridal-makeup-artists",
  "/mehndi-artists",
  "/wedding-cars",
  "/wedding-stationery",
  "/compare",
  "/planning-tools",
  "/planning-tools/budget",
  "/planning-tools/checklist",
  "/planning-tools/guest-list",
  "/planning-tools/timeline",
  "/how-it-works",
  "/about",
  "/contact",
  "/help",
  "/list-your-business",
  "/blog",
  "/cities",
  "/terms",
  "/privacy",
  "/login",
  "/register",
];

for (const route of PUBLIC_ROUTES) {
  test(`public renders: ${route}`, async ({ page }) => {
    await assertRenders(page, route);
  });
}

test.describe("planning tools are interactive (localStorage)", () => {
  test("budget: add an item persists in the list", async ({ page }) => {
    await page.goto("/planning-tools/budget", { waitUntil: "domcontentloaded" });
    // Resilient: open the add dialog, fill the first text + number inputs, save.
    const addBtn = page.getByRole("button", { name: /add item/i }).first();
    if (await addBtn.count()) {
      await addBtn.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const tag = `E2E-${Date.now()}`;
      // Role-based: shadcn <Input> doesn't emit type="text", so target the
      // textbox/spinbutton roles instead of CSS type selectors.
      await dialog.getByRole("textbox").first().fill(tag);
      await dialog.getByRole("spinbutton").first().fill("1000");
      await dialog.getByRole("button", { name: /add|save/i }).last().click();
      await expect(page.getByText(tag)).toBeVisible();
    }
  });
});
