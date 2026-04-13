"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { type LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"
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

type ProjectItem = { name: string; url: string; icon: LucideIcon }

export type SettingsSubItem = {
  id: string
  label: string
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

function isActiveForNav(currentPathname: string | null, itemUrl: string) {
  const current = normalizePath(currentPathname)
  const target = normalizePath(itemUrl)

  const currentMod = getDashboardModule(current)
  const targetMod = getDashboardModule(target)

  if (targetMod === null) return current === target

  if (targetMod === "") return currentMod === ""

  return currentMod === targetMod
}

export function NavProjects({
  mainNavs,
  vendorControls,
  adminItems = [],
  settingsSubItems = [],
}: {
  mainNavs: ProjectItem[]
  vendorControls: ProjectItem[]
  adminItems?: ProjectItem[]
  settingsSubItems?: SettingsSubItem[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isOnSettingsPage = getDashboardModule(normalizePath(pathname)) === "settings"
  const currentTab = searchParams?.get("tab") || "overview"

  // Separate Business Settings from other controls
  const regularControls = vendorControls.filter((item) => item.name !== "Business Settings")
  const settingsItem = vendorControls.find((item) => item.name === "Business Settings")

  return (
    <>
      <SidebarGroup className="py-1">
        <SidebarGroupLabel className="h-6 text-[11px] uppercase tracking-wider opacity-60">Main</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          {mainNavs.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                size="sm"
                isActive={isActiveForNav(pathname, item.url)}
                asChild
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      {/* Business Settings with collapsible sub-items */}
      {settingsItem && settingsSubItems.length > 0 && (
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="h-6 text-[11px] uppercase tracking-wider opacity-60">My Business</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            <Collapsible asChild defaultOpen={isOnSettingsPage} className="group/collapsible">
              <SidebarMenuItem>
                {/* Split: label navigates, chevron toggles */}
                <div className="flex items-center w-full">
                  <SidebarMenuButton
                    size="sm"
                    isActive={isOnSettingsPage}
                    asChild
                    className="flex-1 pr-1"
                  >
                    <Link href="/dashboard/settings?tab=overview">
                      <settingsItem.icon />
                      <span>Business Settings</span>
                    </Link>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex items-center justify-center h-7 w-7 rounded-sm hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors shrink-0"
                      aria-label="Toggle business settings menu"
                    >
                      <ChevronRight className="size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {settingsSubItems.map((sub) => (
                      <SidebarMenuSubItem key={sub.id}>
                        <SidebarMenuSubButton
                          size="sm"
                          isActive={isOnSettingsPage && currentTab === sub.id}
                          asChild
                        >
                          <Link href={`/dashboard/settings?tab=${sub.id}`}>
                            <span>{sub.label}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      )}

      {regularControls.length > 0 && (
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="h-6 text-[11px] uppercase tracking-wider opacity-60">Controls</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {regularControls.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  size="sm"
                  isActive={isActiveForNav(pathname, item.url)}
                  asChild
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
      {adminItems.length > 0 && (
        <SidebarGroup className="py-1">
          <SidebarGroupLabel className="h-6 text-[11px] uppercase tracking-wider opacity-60">Admin</SidebarGroupLabel>
          <SidebarMenu className="gap-0.5">
            {adminItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  size="sm"
                  isActive={isActiveForNav(pathname, item.url)}
                  asChild
                >
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}
