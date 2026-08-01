"use client"

/**
 * Every /dashboard/admin/* screen is gated here, once.
 *
 * Before this layout existed the guard was applied page-by-page, and 7 of the
 * 10 admin pages had quietly lost it: the redesigned views never carried the
 * `<AdminGuard>` wrapper the original screens had, and because the redesign
 * flag was ON in production, the guarded branch had been dead code since the
 * cutover. A signed-in vendor who typed /dashboard/admin/vendor-queue got the
 * admin approval console's chrome. No data leaked — every one of these
 * endpoints is `[auth(), superAdmin()]` on the backend, so the tables came back
 * empty — but the vendor saw a console that was never theirs.
 *
 * A per-page guard is something you have to remember. A layout guard is
 * something you cannot forget: any page added under this directory from now on
 * inherits it. Pages needing the stricter tier (audit logs) still wrap
 * themselves in `<AdminGuard requireSuperAdmin>` — nesting is additive.
 */

import { AdminGuard } from "@/components/admin/AdminGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>
}
