import { expect, type Page } from "@playwright/test";

/**
 * Assert an authenticated dashboard route renders: no error overlay, stays
 * inside the dashboard shell (flag-gated routes may redirect to /dashboard —
 * that's a pass, not a crash), and the body has real content.
 */
export async function assertAuthedRender(page: Page, route: string) {
  const resp = await page.goto(route, { waitUntil: "domcontentloaded" });
  if (resp) expect(resp.status(), `${route} status`).toBeLessThan(500);

  // Not bounced to login (session/storageState intact).
  await expect(page, `${route} not redirected to login`).not.toHaveURL(/\/login/);

  await expect(page.locator("text=Application error"), `${route} app error`).toHaveCount(0);
  await expect(page.locator("text=/Internal Server Error/i"), `${route} 500`).toHaveCount(0);

  // Let client data load, then assert the shell has substantive content.
  await page.waitForTimeout(800);
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  expect(bodyText.trim().length, `${route} body content`).toBeGreaterThan(60);
}
