import { test, expect, type Page } from "@playwright/test";

/**
 * The "?" help beside registration fields (components/ui/field-help.tsx).
 *
 * Drives the real /business-registration page. Zero data risk: every request
 * that leaves the app and is not a read is answered locally, so the draft
 * autosave that starts once an email is typed never reaches a real backend.
 *
 *   - aria-label "About <field>" and the text linked by aria-describedby
 *   - opens on keyboard focus, Escape closes and focus stays put
 *   - opens on hover without taking focus from the field being typed in
 *   - a tap opens it on a phone, a tap elsewhere closes it
 *   - the bubble stays on screen and never covers the field it explains
 *   - validation errors are separate from help (an error shows with help closed)
 *
 * Running it against `next dev`: pass `--output=<a folder outside the repo>`.
 * Playwright's video/trace files are written under ./test-results by default,
 * and a dev server watching the repo rebuilds on every write, which serves a
 * half-written chunk and leaves the page un-hydrated (every test then times out).
 *
 *   E2E_BASE_URL=http://localhost:3001 npx playwright test --project=public \
 *     e2e/public.field-help.spec.ts --headed --output=%TEMP%/pw-out
 */

// Each test loads the multi-step registration form, which is heavy under `next dev`.
test.describe.configure({ timeout: 150_000 });

async function openPersonalDetails(page: Page) {
  await page.route(
    (url) => !["localhost", "127.0.0.1"].includes(url.hostname),
    (route) => {
      const method = route.request().method();
      if (["GET", "HEAD", "OPTIONS"].includes(method)) return route.continue();
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    },
  );
  await page.goto("/business-registration", { waitUntil: "domcontentloaded" });
  // React must have attached before anything is clicked; a sleep reports a page
  // that never hydrated as clean.
  await page.waitForFunction(
    () => {
      const el = document.querySelector("main") || document.body;
      return Object.keys(el).some((k) => k.startsWith("__reactFiber$") || k.startsWith("__reactProps$"));
    },
    undefined,
    // A cold `next dev` compiles the route on first hit, which can take a while.
    { timeout: 90_000 },
  );
  await page.getByRole("button", { name: "Essential only" }).click({ timeout: 5000 }).catch(() => {});
  await page.getByRole("heading", { name: "Photographer" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator('button[data-field-help="email"]')).toBeVisible();
}

const help = (page: Page, key: string) => page.locator(`button[data-field-help="${key}"]`);
const bubble = (page: Page, key: string) => page.locator(`[data-field-help-bubble="${key}"]`);

test.describe("registration field help (desktop)", () => {
  test("the business-type heading has help before any step is chosen", async ({ page }) => {
    await page.goto("/business-registration", { waitUntil: "domcontentloaded" });
    await expect(help(page, "businessType")).toBeVisible();
    await expect(help(page, "businessType")).toHaveAttribute("aria-label", "About business type");
  });

  test("each help button is named About <field> and described by its text", async ({ page }) => {
    await openPersonalDetails(page);
    for (const [key, name] of [
      ["fullName", "About full name"],
      ["email", "About email"],
      ["phoneNumber", "About phone number"],
      ["password", "About password"],
    ] as const) {
      const button = help(page, key);
      await expect(button).toHaveAttribute("aria-label", name);
      const describedBy = await button.getAttribute("aria-describedby");
      expect(describedBy, `${key} aria-describedby`).toBeTruthy();
      const text = await page.evaluate((id) => document.getElementById(id!)?.textContent ?? "", describedBy);
      expect(text.length, `${key} described text`).toBeGreaterThan(20);
    }
  });

  test("keyboard focus opens it, Escape closes it and focus stays on the button", async ({ page }) => {
    await openPersonalDetails(page);
    await page.getByPlaceholder("Enter your full name here").focus();
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("data-field-help", "email");
    await expect(bubble(page, "email")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(bubble(page, "email")).toHaveCount(0);
    await expect(page.locator(":focus")).toHaveAttribute("data-field-help", "email");

    // Enter opens it again; tabbing on closes it.
    await page.keyboard.press("Enter");
    await expect(bubble(page, "email")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(bubble(page, "email")).toHaveCount(0);
  });

  test("hover opens it, leaving closes it, and it never steals focus from the field", async ({ page }) => {
    await openPersonalDetails(page);
    const name = page.getByPlaceholder("Enter your full name here");
    await name.focus();
    await help(page, "email").hover();
    await expect(bubble(page, "email")).toBeVisible();
    await expect(name).toBeFocused();

    await page.mouse.move(2, 400);
    await expect(bubble(page, "email")).toHaveCount(0);
  });

  test("a click pins it open until something else is pressed", async ({ page }) => {
    await openPersonalDetails(page);
    await help(page, "phoneNumber").click();
    await page.mouse.move(2, 400);
    await page.waitForTimeout(400);
    await expect(bubble(page, "phoneNumber")).toBeVisible();
    await page.mouse.click(2, 400);
    await expect(bubble(page, "phoneNumber")).toHaveCount(0);
  });

  test("the bubble stays on screen and does not cover the field it explains", async ({ page }) => {
    await openPersonalDetails(page);
    for (const key of ["fullName", "email", "phoneNumber", "password", "confirmPassword", "profilePhoto"]) {
      const button = help(page, key);
      await button.scrollIntoViewIfNeeded();
      await button.hover();
      await expect(bubble(page, key), key).toBeVisible();
      const geo = await page.evaluate((k) => {
        const b = document.querySelector(`[data-field-help-bubble="${k}"]`)!.getBoundingClientRect();
        const btn = document.querySelector(`button[data-field-help="${k}"]`)!;
        const input = btn
          .closest("[data-fieldhelp-row]")
          ?.parentElement?.querySelector("input:not([type=file]),textarea,select,[role=combobox]");
        const i = input?.getBoundingClientRect();
        return {
          onScreen: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight,
          coversInput: !!i && !(b.right <= i.left || i.right <= b.left || b.bottom <= i.top || i.bottom <= b.top),
        };
      }, key);
      expect(geo.onScreen, `${key} on screen`).toBe(true);
      expect(geo.coversInput, `${key} covers its input`).toBe(false);
      await page.mouse.move(2, 400);
      await expect(bubble(page, key)).toHaveCount(0);
    }
  });

  test("help and validation errors are separate", async ({ page }) => {
    await openPersonalDetails(page);
    await page.getByRole("button", { name: "Continue" }).click();
    // The red error text sits under the field (the same message is also repeated
    // elsewhere on the step, hence the field-scoped locator) with every bubble closed...
    const fieldError = page.locator("p.text-red-500", { hasText: "Full name is required" });
    await expect(fieldError).toBeVisible();
    await expect(page.locator("[data-field-help-bubble]")).toHaveCount(0);
    // ...and opening the help does not replace or hide it.
    await help(page, "fullName").hover();
    await expect(bubble(page, "fullName")).toBeVisible();
    await expect(fieldError).toBeVisible();
  });
});

test.describe("registration field help (phone)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("a tap opens it, a second tap or a tap elsewhere closes it, and it fits the screen", async ({ page }) => {
    await openPersonalDetails(page);
    const button = help(page, "phoneNumber");
    await button.scrollIntoViewIfNeeded();

    await button.tap();
    await expect(bubble(page, "phoneNumber")).toBeVisible();
    const onScreen = await page.evaluate(() => {
      const b = document.querySelector("[data-field-help-bubble]")!.getBoundingClientRect();
      return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight;
    });
    expect(onScreen, "bubble fits a 390px screen").toBe(true);

    await button.tap();
    await expect(bubble(page, "phoneNumber")).toHaveCount(0);

    await button.tap();
    await expect(bubble(page, "phoneNumber")).toBeVisible();
    await page.touchscreen.tap(2, 2);
    await expect(bubble(page, "phoneNumber")).toHaveCount(0);
  });
});
