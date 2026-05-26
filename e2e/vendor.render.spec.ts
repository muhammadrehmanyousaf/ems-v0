import { test } from "@playwright/test";
import { assertAuthedRender } from "./_helpers";

/**
 * Vendor render smoke — every vendor module loads inside the dashboard shell
 * without a crash. Flag-gated routes (promote/billing/collaborations/
 * automation) may redirect to /dashboard when their flag is off in the
 * deployed build; assertAuthedRender treats that as a pass. Read-only.
 */

const VENDOR_ROUTES = [
  "/dashboard",
  "/dashboard/today",
  "/dashboard/leads",
  "/dashboard/bookings",
  "/dashboard/function-sheets",
  "/dashboard/customers",
  "/dashboard/calendar",
  "/dashboard/chat",
  "/dashboard/reviews",
  "/dashboard/notifications",
  "/dashboard/payments",
  "/dashboard/receivables",
  "/dashboard/receipts",
  "/dashboard/pdcs",
  "/dashboard/expenses",
  "/dashboard/inventory",
  "/dashboard/staff",
  "/dashboard/suppliers",
  "/dashboard/brokers",
  "/dashboard/generator-fuel",
  "/dashboard/halal-certs",
  "/dashboard/drone-noc",
  "/dashboard/insights",
  "/dashboard/reliability",
  "/dashboard/onboarding",
  "/dashboard/tax",
  "/dashboard/packages",
  "/dashboard/business",
  "/dashboard/businesses",
  "/dashboard/settings",
  "/dashboard/profile",
  // Flag-gated (may redirect to /dashboard when off — still a pass):
  "/dashboard/promote",
  "/dashboard/billing",
  "/dashboard/collaborations",
  "/dashboard/automation",
];

for (const route of VENDOR_ROUTES) {
  test(`vendor renders: ${route}`, async ({ page }) => {
    await assertAuthedRender(page, route);
  });
}
