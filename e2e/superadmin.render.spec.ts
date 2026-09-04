import { test, expect } from "@playwright/test";
import { assertAuthedRender } from "./_helpers";

/**
 * Super-admin render smoke — every admin module loads inside the classic admin
 * chrome (role-chosen sidebar, NOT the champagne shell) without a crash, a
 * clean console, and no 5xx. Read-only (navigation only); no data mutation.
 *
 * Coverage note: all 11 /dashboard/admin/* routes are listed (earlier this
 * spec silently missed activity, complaints, fx-rates), plus the shared
 * directory/finance routes an admin also reaches. If a stale storageState makes
 * these bounce to the marketing home, the body-content assertion in
 * assertAuthedRender catches it — the classic failure mode is a session whose
 * `session_expiry` has passed, which UserContext.validateSession() treats as a
 * logout even while the JWT itself is still valid.
 */

// The full admin console — all 11 /dashboard/admin/* pages.
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

// Shared directory/finance surfaces an admin also uses.
const SHARED_ROUTES = [
  "/dashboard",
  "/dashboard/roles",
  "/dashboard/users",
  "/dashboard/vendors",
  "/dashboard/businesses",
  "/dashboard/customers",
  "/dashboard/bookings",
  "/dashboard/payments",
  "/dashboard/revenue",
];

for (const route of [...ADMIN_ROUTES, ...SHARED_ROUTES]) {
  test(`super-admin renders: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    const server5xx: string[] = [];
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      // Live-deploy console noise that isn't a page defect.
      if (/Failed to load resource|favicon|ResizeObserver|Download the React DevTools|net::ERR_|status of 4|Failed to fetch RSC payload/i.test(t)) return;
      errors.push(t.slice(0, 160));
    });
    page.on("response", (r) => { if (r.status() >= 500) server5xx.push(`${r.status()} ${r.url()}`); });

    await assertAuthedRender(page, route);

    // Admin routes must NOT show the AdminGuard fallback for a super-admin.
    await expect(page.locator("text=/Admin only/i"), `${route}: guard blocked super-admin`).toHaveCount(0);
    expect(server5xx, `${route}: server 5xx`).toHaveLength(0);
    expect(errors, `${route}: console errors`).toHaveLength(0);
  });
}
