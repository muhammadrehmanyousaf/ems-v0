import { expect, type Page } from "@playwright/test";

/**
 * Assert an authenticated dashboard route renders: no error overlay, stays
 * inside the dashboard shell (flag-gated routes may redirect to /dashboard —
 * that's a pass, not a crash), and the body has real content.
 */
/**
 * Dismiss the persistent cookie-consent banner (role="dialog"
 * aria-label="Cookie preferences") so it doesn't shadow other dialogs or
 * intercept clicks. No-op if absent.
 */
export async function dismissCookieBanner(page: Page) {
  const banner = page.getByRole("dialog", { name: /cookie/i });
  if (await banner.count().catch(() => 0)) {
    const btn = banner.getByRole("button", { name: /accept|got it|agree|ok|allow/i }).first();
    if (await btn.count().catch(() => 0)) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(300);
    }
  }
}

export async function gotoWithRetry(page: Page, route: string, tries = 3) {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
    } catch (e) {
      // Live site over the public internet → tolerate transient resets/timeouts.
      lastErr = e;
      await page.waitForTimeout(2000);
    }
  }
  throw lastErr;
}

export async function assertAuthedRender(page: Page, route: string) {
  const resp = await gotoWithRetry(page, route);
  if (resp) expect(resp.status(), `${route} status`).toBeLessThan(500);

  // Not bounced to login (session/storageState intact).
  await expect(page, `${route} not redirected to login`).not.toHaveURL(/\/login/);

  await expect(page.locator("text=Application error"), `${route} app error`).toHaveCount(0);
  await expect(page.locator("text=/Internal Server Error/i"), `${route} 500`).toHaveCount(0);

  // Let client data settle, then assert the shell has substantive content.
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  expect(bodyText.trim().length, `${route} body content`).toBeGreaterThan(60);
}
