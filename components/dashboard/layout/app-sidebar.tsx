"use client"

import * as React from "react"
import { Suspense } from "react"
import Link from "next/link"
import { Wallet } from "lucide-react"

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
import { useVenueOsFlags } from "@/lib/venue-os-runtime-flags"
import { useBusiness } from "@/context/BusinessContext"
import {
  getVendorTypeConfig,
  DEFAULT_VENDOR_CONFIG,
  MONEY_NAV_KEYS,
  UNIVERSAL_EXTRA_NAV,
  type NavItemKey,
  type SettingsTabKey,
} from "@/lib/vendor-type-config"
import { getDashboardRole, isAdminLike, type DashboardRole } from "@/lib/dashboard-role"
import { useNavPersona, navLabel, NAV_LABELS } from "@/lib/nav/nav-persona"

// Persona-aware labels — Aasaan (Roman-Urdu, layman) vs Professional (industry
// English). Live for every vendor; the register is a per-user preference set in
// Business Settings, defaulting to Professional. Routes never change, only words.

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

function buildVendorSections(
  user: ReturnType<typeof useUser>["user"],
  // Issue #32 — the active business's vendor type drives the nav
  // craft-labels and settings tabs, not the user's vendorType. Both
  // CAN drift (admin viewing another vendor's business, multi-
  // business owners) and the silent fallback to DEFAULT_VENDOR_CONFIG
  // / photographer-flavoured copy was the visible "I'm a makeup
  // artist but my sidebar says Shoots" bug. Falls back to the user's
  // vendorType when the business object hasn't loaded yet.
  businessVendorType: string | null | undefined,
): NavSection[] {
  const vendorType = businessVendorType ?? user?.vendorType
  const vendorConfig = getVendorTypeConfig(vendorType)
  const allowedMain = vendorConfig?.mainNavItems ?? DEFAULT_VENDOR_CONFIG.mainNavItems
  // §19.4 type-conditional Operations tools.
  // Issue #33 — fall back to DEFAULT_VENDOR_CONFIG.extraNavItems for
  // vendor types that don't have an explicit entry in
  // VENDOR_TYPE_CONFIGS (the 14 BK-100.55 categories). Before the
  // fallback, new vendor types had `extra = []`, so the "Staff &
  // payroll" surface — the team-user management screen — never
  // showed in their sidebar. Old vendors with explicit configs are
  // unaffected; their own extraNavItems still wins.
  const extra = Array.from(
    new Set([
      ...(vendorConfig?.extraNavItems ?? DEFAULT_VENDOR_CONFIG.extraNavItems ?? []),
      ...UNIVERSAL_EXTRA_NAV,
    ]),
  )
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
  // PWA-02 — Field Capture hub leads the Main nav. Offline-first lead, payment,
  // expense and hold capture is the single most useful thing on a phone at a
  // venue with no signal, and it was pilot-dark.
  main.unshift(...data.vendorFieldCapture)
  // Customer quote/haggle requests, in the Main nav.
  main.push(...data.vendorQuotes)
  const money = allowed.filter((i) => MONEY_NAV_KEYS.has(i.name as NavItemKey))
  // Render extras in the order the config declares them (not nav-data
  // order) so the most craft-relevant tool leads.
  const operations = extra
    .map((key) => allowed.find((i) => (i.name as NavItemKey) === key))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

  const settingsTabs = vendorConfig?.settingsTabs ?? DEFAULT_VENDOR_CONFIG.settingsTabs
  const isStationery = vendorType === "Wedding Invitations and Stationery"
  const settingsSubItems: SettingsSubItem[] = settingsTabs.map((tabKey) => ({
    id: tabKey,
    label:
      tabKey === "type-specific" && vendorConfig
        ? `${vendorConfig.displayName} Details`
        : tabKey === "packages" && isStationery
        ? "Products"
        : TAB_LABELS[tabKey],
  }))

  // ── The daily loop ────────────────────────────────────────────────────
  //
  // Everything that had been hidden behind flags is now visible, and the rail
  // reached 36 entries — which is its own way of losing a vendor. Tripleseat
  // runs ~8 top-level items across 20,000 venues; Shopify puts the scannable
  // limit at 10-12.
  //
  // These eight are the whole job of running a wedding business on a normal
  // day. A vendor should never need "More" to get through one. Everything else
  // is occasional — set up once, read monthly — and moves behind the
  // disclosure, still one click away, nothing removed.
  const PRIMARY: NavItemKey[] = [
    "Dashboard",
    "Today",
    "Lead inbox",
    "Bookings",
    "Calendar",
    "Conversations",
    "Function sheets",
    "Customers",
  ]
  const primaryOrder = new Map(PRIMARY.map((k, i) => [k, i]))
  const isPrimary = (n: string) => primaryOrder.has(n as NavItemKey)

  const dailyItems = main
    .filter((i) => isPrimary(i.name))
    .sort((a, b) => primaryOrder.get(a.name as NavItemKey)! - primaryOrder.get(b.name as NavItemKey)!)

  // Whatever Main held that is not part of the daily loop — Field capture,
  // Quote requests, Date holds, Reports, Reviews, Notifications and the niche
  // craft tools — becomes the "Sell & serve" drawer rather than disappearing.
  const restOfMain = main.filter((i) => !isPrimary(i.name))

  const sections: NavSection[] = [{ label: "Main", items: dailyItems }]
  // Money — ONE entry, not five. Payments / Receivables / Receipts / Cheque
  // ledger / Expenses are not five jobs; they are five views of "where is my
  // money". They are now tabs inside /dashboard/money. Every original route
  // still exists and still works, so no bookmark or deep link breaks — this
  // collapses the rail, not the app.
  if (money.length > 0) {
    // Tax report is money, so it belongs in Khata — but NOT inside
    // MONEY_NAV_KEYS. Everything in that set is swallowed by the single
    // "Money" entry above, which points at /dashboard/money. Putting Tax there
    // is what made /dashboard/tax unreachable even after it was given a nav
    // entry: the entry existed and was immediately collapsed away.
    const khata = [{ name: "Money", url: "/dashboard/money", icon: Wallet, i18nKey: "nav.money" }]
    const tax = data.vendorMainNav.find((i) => i.name === "Tax report")
    if (tax) khata.push(tax)
    sections.push({ label: "Khata", items: khata })
  }

  // ── Everything below here lives behind "More" ─────────────────────────
  if (restOfMain.length > 0) {
    sections.push({ label: "Sell & serve", items: restOfMain, secondary: true })
  }
  if (operations.length > 0) {
    sections.push({ label: "Operations", items: operations, secondary: true })
  }
  // Growth — Promote (§5) + Plan & billing (§17.1), each flag-gated
  // (default OFF). Grouped together so the monetization surfaces live
  // in one place.
  // The whole Grow section was dark: /promotions/mine, /subscriptions/me and
  // /collaborations/incoming are all live on production. A vendor could not
  // promote a listing, see or upgrade their plan, or sub-contract work.
  const growItems = ["Promote", "Plan & billing", "Collaborations"]
    .map((name) => data.vendorMainNav.find((i) => i.name === name))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))
  if (growItems.length > 0) {
    sections.push({ label: "Grow", items: growItems, secondary: true })
  }
  // Venue-OS (multi-venue vendor-OS spine). Always in the sidebar: the backend
  // ORG_MEMBERSHIP_ON gate is globally enabled in production (FeatureFlagOverride,
  // owner-authorized 2026-07-11), and hiding the section was the reason none of
  // the venue finance surfaces were reachable from the navigation.
  //
  // Venue-OS also speaks a SECOND vocabulary for jobs the main rail already
  // names — Tonight vs Today, Venue money vs Money, Kitchen vs Kitchen prep,
  // Event profit vs Reports. Two names for one job is its own way of getting
  // someone lost. Moving the section behind "More" stops it competing with the
  // daily rail; actually merging the duplicate concepts is a content change to
  // those screens, tracked separately rather than half-done here.
  sections.push({ label: "Venue-OS", items: data.vendorVenueOs, secondary: true })
  sections.push({
    label: "My Business",
    items: data.vendorMyBusiness,
    secondary: true,
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

  // Promotions queue (§5) + Plan-upgrades queue (§17.1) are super-admin only.
  // Both were additionally flag-dark, so vendors could request an upgrade
  // (/subscriptions/request-upgrade is live) into a queue no admin could open.
  const operations = data.adminOperations.filter((i) => {
    if (i.name === "Promotions" || i.name === "Plan upgrades") return isSuper
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
  // Resolve per-venue venue-OS flags (populates the runtime store so the
  // "Venue-OS" nav section appears for pilot venues even with the global flag off).
  useVenueOsFlags()
  const role = getDashboardRole(user)
  // Issue #32 — pass the active business's vendorType through so the
  // nav reflects the actual business being managed, not the logged-in
  // user's stale type.
  const { business } = useBusiness()
  const businessVendorType = business?.vendor?.vendorType

  const sections: NavSection[] = isAdminLike(role)
    ? buildAdminSections(role)
    : buildVendorSections(user, businessVendorType)

  // Relabel group headings + items through the bilingual persona dictionary
  // (Aasaan Roman-Urdu vs Professional English). Routes are never touched —
  // only the words. An item with no dictionary entry keeps its existing label,
  // so adding a nav item can never produce a blank or missing-key heading.
  const { persona } = useNavPersona()
  const displaySections: NavSection[] = sections.map((s) => ({
    ...s,
    label: NAV_LABELS[s.label] ? navLabel(s.label, persona) : s.label,
    items: s.items.map((it) => ({
      ...it,
      labelOverride: NAV_LABELS[it.name]
        ? navLabel(it.name, persona)
        : it.labelOverride,
    })),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Brand block — flat dark monogram + clean wordmark + role label. */}
      <SidebarHeader className="border-b border-sidebar-border h-14 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-sidebar-accent">
              <Link href="/dashboard" className="flex items-center gap-2">
                {/* Brand mark (lotus + W). SVG → crisp at the collapsed icon size. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icon-mark.png" alt="Wedding Wala" className="size-8 shrink-0" />
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
          <NavSections sections={displaySections} />
        </Suspense>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
