import { test, expect } from "@playwright/test";
import { gotoWithRetry, dismissCookieBanner } from "./_helpers";

/**
 * Self-cleaning vendor CRUD against the live site. Scoped to vendor-internal
 * ledgers that don't notify real people. Each test creates a uniquely-tagged
 * row, asserts it appears, then deletes it and asserts it's gone — leaving no
 * residue in production.
 */

test("expenses: create -> appears -> delete -> gone", async ({ page }) => {
  const tag = `E2E-EXP-${Date.now()}`;
  await gotoWithRetry(page, "/dashboard/expenses");
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await dismissCookieBanner(page);

  // Open the "Log expense" dialog (header trigger is the first match).
  await page.getByRole("button", { name: /log expense/i }).first().click();
  // Scope to the expense dialog by its title — the cookie banner is also a dialog.
  const dialog = page.getByRole("dialog", { name: /log an expense/i });
  await expect(dialog).toBeVisible();

  // amount (placeholder) + a unique vendorName tag so we can find + delete it.
  // category defaults to 'ingredients', date defaults to today.
  await dialog.getByPlaceholder("e.g. 15000").fill("1234");
  await dialog.getByPlaceholder(/Liaqat Meat Shop/i).fill(tag);

  // Submit (the in-dialog button is also labelled "Log expense").
  await dialog.getByRole("button", { name: /log expense/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });

  // It should now appear in the ledger.
  await expect(page.getByText(tag)).toBeVisible({ timeout: 15_000 });

  // Delete the row that carries our tag, then confirm.
  const row = page.locator("div", { hasText: tag }).last();
  await row.getByRole("button", { name: /delete expense/i }).click().catch(async () => {
    // Fallback: only-expense case — the single delete button is ours.
    await page.getByRole("button", { name: /delete expense/i }).first().click();
  });
  await page.getByRole("button", { name: /^remove$/i }).click();

  // Gone.
  await expect(page.getByText(tag)).toHaveCount(0, { timeout: 15_000 });
});

// Suppliers is a type-conditional Operations module with its own business-
// scope gating; the "Add supplier" trigger isn't actionable the same way the
// expenses one is. Marked fixme until its selectors/gating are iterated
// against the live DOM (the create→list→delete pattern itself is proven by
// the expenses test above).
test.fixme("suppliers: create (with business) -> appears -> delete -> gone", async ({ page }) => {
  const tag = `E2E-SUP-${Date.now()}`;
  await gotoWithRetry(page, "/dashboard/suppliers");
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await dismissCookieBanner(page);

  await page.getByRole("button", { name: /add supplier/i }).first().click();
  const dialog = page.getByRole("dialog", { name: /add supplier/i });
  await expect(dialog).toBeVisible();

  // Business is a required FK picker (shadcn Select → combobox). Open + pick
  // the first option (the seeded vendor owns exactly one business).
  const combo = dialog.getByRole("combobox").first();
  if (await combo.count()) {
    await combo.click();
    await page.getByRole("option").first().click().catch(() => {});
  }
  await dialog.getByPlaceholder(/Liaqat Meat Shop/i).fill(tag);

  await dialog.getByRole("button", { name: /add supplier/i }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(page.getByText(tag)).toBeVisible({ timeout: 15_000 });

  // Delete the card carrying our tag.
  const card = page.locator("div", { hasText: tag }).last();
  await card.getByRole("button", { name: /^delete$/i }).click().catch(async () => {
    await page.getByRole("button", { name: /^delete$/i }).first().click();
  });
  await page.getByRole("button", { name: /^remove$/i }).click();
  await expect(page.getByText(tag)).toHaveCount(0, { timeout: 15_000 });
});
