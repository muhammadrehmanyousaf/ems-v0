"use client"

import * as React from "react"
import { Suspense } from "react"

import { NavProjects, type SettingsSubItem } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { data } from "./nav-data"
import { Command } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/context/UserContext"
import { getVendorTypeConfig, DEFAULT_VENDOR_CONFIG, type NavItemKey, type SettingsTabKey } from "@/lib/vendor-type-config"

const TAB_LABELS: Record<SettingsTabKey, string> = {
  overview: "Overview",
  basic: "Basic Information",
  images: "Images",
  packages: "Packages",
  menus: "Menus",
  "type-specific": "Details",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar()
  const { user } = useUser()

  const vendorConfig = getVendorTypeConfig(user?.vendorType)
  const isSuperAdmin = user?.isSuperAdmin === true

  const allowedMainNav = vendorConfig?.mainNavItems ?? DEFAULT_VENDOR_CONFIG.mainNavItems
  const allowedControls = vendorConfig?.controlNavItems ?? DEFAULT_VENDOR_CONFIG.controlNavItems

  const filteredMainNav = isSuperAdmin
    ? data.mainNav
    : data.mainNav.filter((item) => allowedMainNav.includes(item.name as NavItemKey))

  const filteredControls = isSuperAdmin
    ? data.vendorControls
    : data.vendorControls.filter((item) => allowedControls.includes(item.name as NavItemKey))

  const adminItems = isSuperAdmin ? data.adminSection : []

  // Build settings sub-items from vendor config
  const settingsTabs = vendorConfig?.settingsTabs ?? DEFAULT_VENDOR_CONFIG.settingsTabs
  const settingsSubItems: SettingsSubItem[] = settingsTabs.map((tabKey) => ({
    id: tabKey,
    label: tabKey === "type-specific" && vendorConfig
      ? `${vendorConfig.displayName} Details`
      : TAB_LABELS[tabKey],
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="mb-1">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus:ring-0 focus:outline-none focus:border-none hover:bg-transparent"
        >
          <div className={cn("bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square items-center justify-center rounded-md", open ? 'size-8' : 'size-8')}>
            <Command className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="text-lg font-bold truncate"><span className="text-primary">AJOINT</span></p>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarSeparator className={cn("transition-opacity", open ? 'opacity-0' : 'opacity-100')} />
      <SidebarContent>
        <div className={cn("transition-opacity px-2 py-0.5", open ? 'opacity-100 border-y' : 'opacity-0 -mt-10')}>
          <TeamSwitcher />
        </div>
        <Suspense fallback={null}>
          <NavProjects mainNavs={filteredMainNav} vendorControls={filteredControls} adminItems={adminItems} settingsSubItems={settingsSubItems} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
