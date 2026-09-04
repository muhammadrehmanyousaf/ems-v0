import { test, expect } from "@playwright/test";
import { gotoWithRetry } from "./_helpers";

/**
 * Admin gate (security) — a signed-in VENDOR must be refused every
 * /dashboard/admin/* screen. The client `<AdminGuard>` shows the "Admin only"
 * notice, and the backend endpoints are `[auth(), superAdmin()]` regardless, so
 * even if the chrome leaked the tables would come back empty. This asserts the
 * client half: the vendor sees the guard, never the admin console.
 *
 * Regression anchor: the guard used to be applied page-by-page and 7 of the 10
 * redesigned admin pages had quietly lost it; a single layout guard
 * (app/(dashboard)/dashboard/admin/layout.tsx) now covers every page under the
 * directory. This spec fails loudly if a new admin page slips the layout.
 */

const ADMIN_ROUTES = [
  "/dashboard/admin/activity",
  "/dashboard/admin/audit-logs",
  "/dashboard/admin/complaints",
  "/dashboard/admin/disputes",
  "/dashboard/admin/documents",
  "/dashboard/admin/force-majeure",
  "/dashboard/admin/fx-rates",
  "/dashboard/admin/platform-pulse",
  "/dashboard/admin/promotions",
  "/dashboard/admin/subscriptions",
  "/dashboard/admin/vendor-queue",
];

for (const route of ADMIN_ROUTES) {
  test(`vendor is blocked from admin: ${route}`, async ({ page }) => {
    await gotoWithRetry(page, route);
    // Stayed signed-in (not bounced to login) …
    await expect(page, `${route}: not at login`).not.toHaveURL(/\/login/);
    // … but the admin console is refused.
    await expect(page.getByText(/Admin only/i), `${route}: vendor sees the guard`).toBeVisible({ timeout: 15_000 });
  });
}
