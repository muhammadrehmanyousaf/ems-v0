"use client"

/**
 * The contextual panel — the column beside the rail whose entire contents swap
 * with the active module.
 *
 * This is the piece a flat sidebar can never provide: a place for a module to
 * express its own inside. It is the direct answer to the founder's original
 * complaint that a vendor "has to go back to other modules to perform a job for
 * the same user".
 *
 * Spec + measurements: system-docs/04-navigation-ux/10-RAIL-AND-PANEL-SPEC.md
 */

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { moduleForPath, type PanelItem } from "@/lib/nav/module-panels"
import { useT } from "@/lib/i18n/useT"
import { useChat } from "@/context/ChatContext"
import { useNotifications } from "@/context/NotificationContext"

function normalise(href: string) {
  const [path, query = ""] = href.split("?")
  // Every param, not just `tab`. This started as a tab-only check and would
  // have highlighted BOTH "Active bookings" and "Completed" at once the moment
  // a row used a different param name (`bucket`).
  return {
    path: path!.replace(/\/+$/, "") || "/",
    params: Array.from(new URLSearchParams(query).entries()),
  }
}

export function ModulePanel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mod = moduleForPath(pathname)
  const t = useT()

  const currentPath = (pathname || "/dashboard").replace(/\/+$/, "") || "/"

  const isActive = (item: PanelItem) => {
    const { path, params } = normalise(item.href)
    if (path !== currentPath) return false
    // A row that names params is active only when every one of them matches.
    // Without this, all the Khata rows would light up together on
    // /dashboard/money.
    if (params.length > 0) {
      if (params.every(([k, v]) => searchParams?.get(k) === v)) return true
      // A row flagged as the screen's default also matches when its param is
      // absent — /dashboard/money renders Receivables, so Receivables is what
      // should be lit. Without this the rail says Khata, the page shows
      // Receivables, and the panel highlights nothing.
      if (item.isDefaultView) {
        return params.every(([k]) => !searchParams?.get(k))
      }
      return false
    }
    // A bare row (no params) is the module root — active only when no sibling
    // row's param is present, so "Active bookings" dims once you are on
    // ?bucket=completed.
    const siblingParams = new Set(
      mod.groups
        .flatMap((g) => g.items)
        .flatMap((i) => normalise(i.href).params.map(([k]) => k)),
    )
    return !Array.from(siblingParams).some((k) => searchParams?.get(k))
  }

  const label = (item: PanelItem) => (item.i18nKey ? t(item.i18nKey) : item.label)

  // Live counters. Rendered ONLY when non-zero — a panel full of grey zeros
  // teaches people to stop reading it, which is the opposite of what a badge
  // is for. Matches the reference, where a count appears on a row only when
  // there is something waiting.
  const { totalUnread } = useChat()
  const { unreadCount } = useNotifications()
  const badgeFor = (item: PanelItem): number => {
    if (item.badge === "chatUnread") return totalUnread || 0
    if (item.badge === "notifications") return unreadCount || 0
    return 0
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto px-3 py-4">
      <h2 className="px-2 text-[15px] font-semibold tracking-tight text-sidebar-foreground">
        {mod.panelTitle ?? mod.label}
      </h2>

      {mod.groups.map((group, gi) => (
        <div key={group.label ?? `g${gi}`} className="flex flex-col gap-0.5">
          {group.label ? (
            <div className="px-2 pb-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
              {group.label}
            </div>
          ) : null}

          {group.items.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                ].join(" ")}
              >
                <Icon
                  className={
                    active
                      ? "size-4 shrink-0 text-foreground"
                      : "size-4 shrink-0 text-muted-foreground"
                  }
                />
                <span className="truncate">{label(item)}</span>
                {badgeFor(item) > 0 ? (
                  <span className="ml-auto inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
                    {badgeFor(item) > 99 ? "99+" : badgeFor(item)}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}
