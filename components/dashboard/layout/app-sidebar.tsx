"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"

import { NavSections, type SettingsSubItem, type NavSection } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { data } from "./nav-data"
import { useUser } from "@/context/UserContext"
import {
  getVendorTypeConfig,
  DEFAULT_VENDOR_CONFIG,
  type NavItemKey,
  type SettingsTabKey,
} from "@/lib/vendor-type-config"
import { getDashboardRole, isAdminLike, type DashboardRole } from "@/lib/dashboard-role"

const TAB_LABELS: Record<SettingsTabKey, string> = {
  overview: "Overview",
  basic: "Basic Information",
  images: "Images",
  fleet: "Fleet / Cars",
  packages: "Packages",
  menus: "Menus",
  "type-specific": "Details",
}

const ROLE_LABEL: Record<DashboardRole, string> = {
  superAdmin: "Super admin",
  admin: "Admin",
  vendor: "Vendor",
  none: "Workspace",
}

// Items inside `adminPlatform` that are super-admin only.
const SUPER_ONLY_PLATFORM = new Set(["Audit logs", "Roles", "Users"])

function buildVendorSections(user: ReturnType<typeof useUser>["user"]): NavSection[] {
  const vendorConfig = getVendorTypeConfig(user?.vendorType)
  const allowedMain = vendorConfig?.mainNavItems ?? DEFAULT_VENDOR_CONFIG.mainNavItems

  const main = data.vendorMainNav.filter((i) =>
    allowedMain.includes(i.name as NavItemKey),
  )

  const settingsTabs = vendorConfig?.settingsTabs ?? DEFAULT_VENDOR_CONFIG.settingsTabs
  const isStationery = user?.vendorType === "Wedding Invitations and Stationery"
  const settingsSubItems: SettingsSubItem[] = settingsTabs.map((tabKey) => ({
    id: tabKey,
    label:
      tabKey === "type-specific" && vendorConfig
        ? `${vendorConfig.displayName} Details`
        : tabKey === "packages" && isStationery
        ? "Products"
        : TAB_LABELS[tabKey],
  }))

  return [
    { label: "Main", items: main },
    {
      label: "My Business",
      items: data.vendorMyBusiness,
      collapsibleSettings: {
        triggerId: "Business Settings",
        subItems: settingsSubItems,
      },
    },
  ]
}

function buildAdminSections(role: DashboardRole): NavSection[] {
  const isSuper = role === "superAdmin"

  // Filter platform group by role — admin only sees Revenue.
  const platform = data.adminPlatform.filter(
    (i) => isSuper || !SUPER_ONLY_PLATFORM.has(i.name),
  )

  const sections: NavSection[] = [
    { label: "Overview",   items: data.adminOverview },
    { label: "Operations", items: data.adminOperations },
    { label: "Directory",  items: data.adminDirectory },
    { label: "Platform",   items: platform },
  ]

  if (isSuper) {
    sections.push({ label: "Emergency", items: data.adminEmergency })
  }

  return sections
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const role = getDashboardRole(user)

  const sections: NavSection[] = isAdminLike(role)
    ? buildAdminSections(role)
    : buildVendorSections(user)

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand block — flat dark monogram + clean wordmark + role label. */}
      <SidebarHeader className="border-b border-sidebar-border h-14 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-foreground text-background">
                  <span className="text-[13px] font-semibold tracking-tight">A</span>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground">
                    Wedding Wala
                  </span>
                  <span className="text-[11px] text-muted-foreground -mt-0.5">
                    {ROLE_LABEL[role]}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        {role === "vendor" && (
          <div className="px-2 py-2 border-b border-sidebar-border">
            <TeamSwitcher />
          </div>
        )}
        <Suspense fallback={null}>
          <NavSections sections={sections} />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
