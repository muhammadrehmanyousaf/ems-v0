"use client"

/**
 * The icon rail — the leftmost ~64px column.
 *
 * One entry per module, icon above a one-word label, and it never changes.
 * Everything that varies lives in the contextual panel beside it.
 *
 * Spec + measurements: system-docs/04-navigation-ux/10-RAIL-AND-PANEL-SPEC.md
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { NAV_MODULES, moduleForPath } from "@/lib/nav/module-panels"
import { useT } from "@/lib/i18n/useT"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"

export function ModuleRail() {
  const pathname = usePathname()
  const active = moduleForPath(pathname)
  const t = useT()
  const { user } = useUser()

  // Admins do not get the rail.
  //
  // Caught on production while signed in as a super-admin: the rail rendered
  // the VENDOR modules — Enquiries, Bookings, Khata — beside the admin console
  // nav, offering an admin a set of doors that are not theirs. The panel was
  // already role-aware; the rail was not, because it lives in the layout rather
  // than inside AppSidebar where the role check already existed.
  if (isAdminLike(getDashboardRole(user))) return null

  return (
    <nav
      aria-label="Modules"
      className="hidden md:flex w-[68px] shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3"
    >
      {NAV_MODULES.map((m) => {
        const isActive = m.id === active.id
        const Icon = m.icon
        return (
          <Link
            key={m.id}
            href={m.href}
            aria-current={isActive ? "page" : undefined}
            title={m.label}
            className={[
              "group flex w-[56px] flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            ].join(" ")}
          >
            <Icon className="size-[18px]" />
            {/* One word. Truncation here would defeat the point of the label. */}
            <span className="text-[10px] font-medium leading-none text-center">
              {m.label}
            </span>
          </Link>
        )
      })}

      {/* Primary create action, mirroring the compose FAB in the reference. */}
      <Link
        href="/dashboard/bookings"
        title={t("verb.create")}
        className="mt-3 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
        aria-label="New booking"
      >
        <Plus className="size-5" />
      </Link>
    </nav>
  )
}
