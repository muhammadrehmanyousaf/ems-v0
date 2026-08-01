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

function normalise(href: string) {
  const [path, query = ""] = href.split("?")
  const tab = new URLSearchParams(query).get("tab")
  return { path: path!.replace(/\/+$/, "") || "/", tab }
}

export function ModulePanel() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mod = moduleForPath(pathname)
  const t = useT()

  const currentPath = (pathname || "/dashboard").replace(/\/+$/, "") || "/"
  const currentTab = searchParams?.get("tab") ?? null

  const isActive = (item: PanelItem) => {
    const { path, tab } = normalise(item.href)
    if (path !== currentPath) return false
    // A row that names a tab is only active for THAT tab. Without this every
    // Khata row would highlight at once on /dashboard/money.
    if (tab) return currentTab === tab
    return true
  }

  const label = (item: PanelItem) => (item.i18nKey ? t(item.i18nKey) : item.label)

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
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}
