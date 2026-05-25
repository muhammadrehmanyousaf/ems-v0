"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { type LucideIcon, ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
// Phase 3 #9.4 follow-up — translate sidebar labels via useT when an
// i18nKey is provided on the nav item; falls back to `name` otherwise.
import { useT } from "@/lib/i18n/useT"

export type NavItem = {
  name: string;
  url: string;
  icon: LucideIcon;
  i18nKey?: string;
  // §19.3 craft-localized label. When set, it WINS over the i18n
  // translation (craft-naming is separate from the EN/اردو toggle).
  labelOverride?: string;
}

export type SettingsSubItem = { id: string; label: string }

export type NavSection = {
  label: string
  items: NavItem[]
  collapsibleSettings?: {
    triggerId: string
    subItems: SettingsSubItem[]
  }
}

function normalizePath(p?: string | null) {
  if (!p) return "/"
  const [pathOnly] = p.split(/[?#]/)
  return pathOnly!.replace(/\/+$/, "") || "/"
}

function getDashboardModule(path: string) {
  const segs = path.split("/").filter(Boolean)
  if (segs[0] !== "dashboard") return null
  return segs[1] ?? ""
}

function getDashboardSubModule(path: string) {
  const segs = path.split("/").filter(Boolean)
  if (segs[0] !== "dashboard") return null
  if (segs[1] !== "admin") return null
  return segs[2] ?? ""
}

function isActiveForNav(currentPathname: string | null, itemUrl: string) {
  const current = normalizePath(currentPathname)
  const target = normalizePath(itemUrl)
  const currentMod = getDashboardModule(current)
  const targetMod = getDashboardModule(target)

  if (targetMod === null) return current === target
  if (targetMod === "") return currentMod === ""
  if (currentMod !== targetMod) return false
  if (targetMod === "admin") {
    return getDashboardSubModule(current) === getDashboardSubModule(target)
  }
  return true
}

const ITEM_BASE =
  "h-8 text-[13px] font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold rounded-md transition-colors"

const ICON_BASE =
  "[&>svg]:size-4 [&>svg]:text-muted-foreground data-[active=true]:[&>svg]:text-foreground"

export function NavSections({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isOnSettingsPage = getDashboardModule(normalizePath(pathname)) === "settings"
  const currentTab = searchParams?.get("tab") || "overview"
  const t = useT()
  // Craft-localized override (§19.3) wins over everything. Otherwise,
  // when an item declares i18nKey, prefer the translated label. Falls
  // back cleanly to the hardcoded `name` when no key (or no translation).
  const label = (item: NavItem) =>
    item.labelOverride ? item.labelOverride : item.i18nKey ? t(item.i18nKey) : item.name

  return (
    <>
      {sections.map((section, i) => (
        <SidebarGroup
          key={`${section.label}-${i}`}
          className="px-2 py-2"
        >
          <SidebarGroupLabel className="px-2 h-7 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground/70">
            {section.label}
          </SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {section.items.map((item) => {
              const active = isActiveForNav(pathname, item.url)
              const isCollapsibleTrigger =
                section.collapsibleSettings?.triggerId === item.name

              if (isCollapsibleTrigger && section.collapsibleSettings) {
                const { subItems } = section.collapsibleSettings
                return (
                  <Collapsible
                    key={item.name}
                    asChild
                    defaultOpen={isOnSettingsPage}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <div className="flex items-center w-full">
                        <SidebarMenuButton
                          isActive={isOnSettingsPage}
                          asChild
                          className={`${ITEM_BASE} ${ICON_BASE} flex-1 pr-1`}
                        >
                          <Link href={`${item.url}?tab=overview`}>
                            <item.icon />
                            <span>{label(item)}</span>
                          </Link>
                        </SidebarMenuButton>
                        {subItems.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <button
                              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                              aria-label="Toggle business settings menu"
                            >
                              <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      {subItems.length > 0 && (
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-l border-sidebar-border ml-3 pl-2">
                            {subItems.map((sub) => (
                              <SidebarMenuSubItem key={sub.id}>
                                <SidebarMenuSubButton
                                  isActive={isOnSettingsPage && currentTab === sub.id}
                                  asChild
                                  className="h-7 text-[12.5px] text-sidebar-foreground/70 hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-medium rounded-md"
                                >
                                  <Link href={`${item.url}?tab=${sub.id}`}>
                                    <span>{sub.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    isActive={active}
                    asChild
                    className={`${ITEM_BASE} ${ICON_BASE}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{label(item)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
