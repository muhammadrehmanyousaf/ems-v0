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
import { Plus, Heart } from "lucide-react"
import { TeamSwitcher } from "./team-switcher"
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
      // Full height of the shell, and its own scroll region.
      //
      // This used to be `sticky top-0 h-svh` because the page itself scrolled
      // and the rail grew with the content (1,647px on the bookings screen),
      // scrolling away with it. Now that the shell is exactly one viewport tall
      // and does not scroll, the rail is simply `h-full` — there is nothing to
      // stick to and nothing to escape from.
      //
      // `overflow-y-auto` still matters: on a short window (a laptop at 100%
      // with browser chrome) the module list is taller than the rail, and this
      // keeps the bottom entries reachable rather than clipped.
      className="z-20 hidden h-full shrink-0 overflow-y-auto overflow-x-clip md:flex w-[68px] flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Brand and the business switcher live HERE, not in the panel.
          Both are constant: the panel's whole contents change per module, and
          identity plus "which business am I acting as" must not slide around
          underneath the user. The switcher also scopes every module, so it
          belongs beside all of them.

          The mark, not a lucide `<Heart/>`. The rail is the one element on the
          screen that never changes and is always visible, so it is the only
          place identity belongs — and a generic stock icon standing in for it
          was the weakest thing in the shell. `/icon-mark.png` is the same asset
          the panel header used before that block was removed. */}
      <Link
        href="/dashboard"
        aria-label="Wedding Wala — dashboard home"
        title="Wedding Wala"
        className="mb-1 flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-sidebar-accent"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icon-mark.png"
          alt=""
          width={36}
          height={36}
          className="size-9 object-contain"
        />
      </Link>

      <div className="mb-2 w-full px-2">
        <TeamSwitcher variant="rail" />
      </div>

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
