import { test } from "@playwright/test";
import { assertAuthedRender } from "./_helpers";

/**
 * Super-admin render smoke — every admin module loads inside the dashboard
 * shell without a crash. Read-only (navigation only); no data mutation.
 */

const SUPERADMIN_ROUTES = [
  "/dashboard",
  "/dashboard/admin/vendor-queue",
  "/dashboard/admin/documents",
  "/dashboard/admin/disputes",
  "/dashboard/admin/force-majeure",
  "/dashboard/admin/platform-pulse",
  "/dashboard/admin/promotions",
  "/dashboard/admin/subscriptions",
  "/dashboard/admin/audit-logs",
  "/dashboard/roles",
  "/dashboard/users",
  "/dashboard/vendors",
  "/dashboard/businesses",
  "/dashboard/customers",
  "/dashboard/bookings",
  "/dashboard/payments",
  "/dashboard/revenue",
];

for (const route of SUPERADMIN_ROUTES) {
  test(`super-admin renders: ${route}`, async ({ page }) => {
    await assertAuthedRender(page, route);
  });
}
