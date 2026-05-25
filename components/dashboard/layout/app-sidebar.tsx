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
  MONEY_NAV_KEYS,
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
  // §19.4 type-conditional Operations tools (only for types that define them).
  const extra = vendorConfig?.extraNavItems ?? []
  const allowedKeys = new Set<NavItemKey>([...allowedMain, ...extra])

  const navLabels = vendorConfig?.navLabels
  const applyLabel = (i: (typeof data.vendorMainNav)[number]) => {
    // §19.3 — attach the craft-localized label when this vendor type
    // defines one for the item. Route + nav key are untouched.
    const override = navLabels?.[i.name as NavItemKey]
    return override ? { ...i, labelOverride: override } : i
  }

  const allowed = data.vendorMainNav
    .filter((i) => allowedKeys.has(i.name as NavItemKey))
    .map(applyLabel)

  // Partition: operational "Main", "Khata" (money), and type-specific
  // "Operations" (extra). Order within each preserved from nav-data.
  const extraSet = new Set<NavItemKey>(extra)
  const main = allowed.filter(
    (i) =>
      !MONEY_NAV_KEYS.has(i.name as NavItemKey) &&
      !extraSet.has(i.name as NavItemKey),
  )
  const money = allowed.filter((i) => MONEY_NAV_KEYS.has(i.name as NavItemKey))
  // Render extras in the order the config declares them (not nav-data
  // order) so the most craft-relevant tool leads.
  const operations = extra
    .map((key) => allowed.find((i) => (i.name as NavItemKey) === key))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

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

  const sections: NavSection[] = [{ label: "Main", items: main }]
  if (money.length > 0) {
    sections.push({ label: "Khata", items: money })
  }
  if (operations.length > 0) {
    sections.push({ label: "Operations", items: operations })
  }
  // Growth — Promote (§5) + Plan & billing (§17.1), each flag-gated
  // (default OFF). Grouped together so the monetization surfaces live
  // in one place.
  const growItems = []
  if (process.env.NEXT_PUBLIC_PROMOTIONS === "1") {
    const promote = data.vendorMainNav.find((i) => i.name === "Promote")
    if (promote) growItems.push(promote)
  }
  if (process.env.NEXT_PUBLIC_BILLING === "1") {
    const billing = data.vendorMainNav.find((i) => i.name === "Plan & billing")
    if (billing) growItems.push(billing)
  }
  if (growItems.length > 0) {
    sections.push({ label: "Grow", items: growItems })
  }
  sections.push({
    label: "My Business",
    items: data.vendorMyBusiness,
    collapsibleSettings: {
      triggerId: "Business Settings",
      subItems: settingsSubItems,
    },
  })
  return sections
}

function buildAdminSections(role: DashboardRole): NavSection[] {
  const isSuper = role === "superAdmin"

  // Filter platform group by role — admin only sees Revenue.
  const platform = data.adminPlatform.filter(
    (i) => isSuper || !SUPER_ONLY_PLATFORM.has(i.name),
  )

  // Promotions queue (§5) + Plan-upgrades queue (§17.1) are super-admin
  // only + each gated by their feature flag.
  const promotionsOn = process.env.NEXT_PUBLIC_PROMOTIONS === "1"
  const billingOn = process.env.NEXT_PUBLIC_BILLING === "1"
  const operations = data.adminOperations.filter((i) => {
    if (i.name === "Promotions") return promotionsOn && isSuper
    if (i.name === "Plan upgrades") return billingOn && isSuper
    return true
  })

  const sections: NavSection[] = [
    { label: "Overview",   items: data.adminOverview },
    { label: "Operations", items: operations },
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
                  <span className="text-[13px] font-semibold tracking-tight">W</span>
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
