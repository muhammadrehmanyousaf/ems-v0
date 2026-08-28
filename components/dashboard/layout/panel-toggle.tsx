"use client"

/**
 * The header's panel-collapse button — rendered only when there is a panel.
 *
 * `SidebarTrigger` used to sit unconditionally in the header. On Home, and now
 * on Bookings, `AppSidebar` returns null (see `railOnly` in module-panels.ts),
 * so the button was still there and clicking it did nothing at all. Measured on
 * /dashboard/bookings: trigger present at x≈90, no sidebar element in the DOM
 * for it to toggle.
 *
 * The separator lives here too. It exists to divide the trigger from the
 * breadcrumb, so on its own it is a stray vertical line in front of the first
 * crumb.
 */

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { hasPanel } from "@/lib/nav/module-panels"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"

export function PanelToggle() {
  const pathname = usePathname()
  const { user } = useUser()

  // Same call AppSidebar makes, so the button and the panel cannot disagree.
  if (!hasPanel(pathname, isAdminLike(getDashboardRole(user)))) return null

  return (
    <>
      <SidebarTrigger className="-ml-1 size-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent" />
      <Separator orientation="vertical" className="mx-1 h-4 shrink-0" />
    </>
  )
}
