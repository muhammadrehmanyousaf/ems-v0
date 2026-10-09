"use client"

/**
 * ChampagneSidebar — the vendor console's primary rail on the shadcn `Sidebar`
 * primitive (collapse-to-icons), champagne palette. Mirrors the champagne rail's
 * own NAV / KHATA / SETUP structure (artifact-shell) so nothing regresses.
 *
 *   Khata / Set up / Zyada → DRILL-DOWN: clicking the module REPLACES the whole
 *           rail with that section's items, and a "← Back" header returns.
 */

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  ArrowLeft, ChevronRight, ChevronsUpDown, Check, Plus, Wallet, Settings2, MoreHorizontal,
  LayoutGrid, Inbox, CalendarCheck, CalendarDays, MessageSquare, FileText, Users,
  CircleDollarSign, ReceiptText, Undo2, ArrowDownUp, HandCoins, Truck, BookOpen, Landmark,
  ListChecks, Zap, CalendarClock, Package, Building2, Boxes, Fuel, ShieldCheck, Plane,
  Megaphone, Handshake, FileQuestion, Clock, Star, Compass, Workflow, ChefHat, BarChart3, CreditCard,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { isActiveForNav } from "./nav-projects"
import { ChampagneUserMenu } from "./champagne-user-menu"
import { useBusiness } from "@/context/BusinessContext"
import { useUser } from "@/context/UserContext"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { businessStatusInfo, businessSubtitle } from "@/lib/business-status"
import { describeLimit, useBusinessLimit } from "@/lib/business-limits"
import { PlanLockChip } from "@/components/dashboard/plans/plan-locked"
import { SCREEN_FEATURE } from "@/lib/plan-gate"

type Biz = {
  id: number; name?: string; city?: string | null; subArea?: string | null; status?: string
  subBusinessType?: unknown; vendor?: { vendorType?: string | null } | null
}
type NItem = { name: string; url: string; icon: React.ElementType }
type Group = { grp: string; items: NItem[] }

// ── Nav data — mirrors artifact-shell's NAV / KHATA / SETUP (static, like the
//    champagne rail it replaces) with lucide icons. ─────────────────────────
const ROZANA: NItem[] = [
  { name: "Overview", url: "/dashboard", icon: LayoutGrid },
  { name: "Leads", url: "/dashboard/leads", icon: Inbox },
  { name: "Bookings", url: "/dashboard/bookings", icon: CalendarCheck },
  { name: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
  { name: "Chat", url: "/dashboard/chat", icon: MessageSquare },
  { name: "Function sheets", url: "/dashboard/function-sheets", icon: FileText },
  { name: "Customers", url: "/dashboard/customers", icon: Users },
]

// Khata (money) — shown as a flat list inside the Khata drill-down.
const KHATA: NItem[] = [
  { name: "Payments", url: "/dashboard/payments", icon: CircleDollarSign },
  { name: "Receipts", url: "/dashboard/receipts", icon: ReceiptText },
  { name: "Wapsi (due)", url: "/dashboard/receivables", icon: Undo2 },
  { name: "Kharche", url: "/dashboard/expenses", icon: ArrowDownUp },
  { name: "Staff & payroll", url: "/dashboard/staff", icon: HandCoins },
  { name: "Suppliers", url: "/dashboard/suppliers", icon: Truck },
  { name: "Cheque ledger", url: "/dashboard/pdcs", icon: BookOpen },
  { name: "Tax report", url: "/dashboard/tax", icon: Landmark },
]
const KHATA_ROOT = "/dashboard/money"

const SETUP: Group[] = [
  { grp: "Mera business", items: [
    { name: "Business settings", url: "/dashboard/settings", icon: Settings2 },
    { name: "Setup checklist", url: "/dashboard/onboarding", icon: ListChecks },
    { name: "Automation", url: "/dashboard/automation", icon: Zap },
    { name: "Cancellation policy", url: "/dashboard/cancellation-policy", icon: FileText } ] },
  { grp: "Venue", items: [
    { name: "Halls & spaces", url: "/dashboard/spaces", icon: Building2 },
    { name: "Bookable slots", url: "/dashboard/slots", icon: CalendarClock },
    { name: "Packages & menus", url: "/dashboard/packages", icon: Package },
    { name: "Venue-OS hub", url: "/dashboard/venue-os", icon: Building2 } ] },
  { grp: "Stock & compliance", items: [
    { name: "Inventory", url: "/dashboard/inventory", icon: Boxes },
    { name: "Generator fuel", url: "/dashboard/generator-fuel", icon: Fuel },
    { name: "Halal certs", url: "/dashboard/halal-certs", icon: ShieldCheck },
    { name: "Drone NOC", url: "/dashboard/drone-noc", icon: Plane } ] },
  { grp: "Grow", items: [
    { name: "Promote", url: "/dashboard/promote", icon: Megaphone },
    { name: "Collaborations", url: "/dashboard/collaborations", icon: Handshake } ] },
]
const SETUP_ROOT = "/dashboard/setup"

const ZYADA: Group[] = [
  { grp: "Bechna & serve", items: [
    { name: "Quote requests", url: "/dashboard/quotes", icon: FileQuestion },
    { name: "Date holds", url: "/dashboard/holds", icon: Clock },
    { name: "Reviews", url: "/dashboard/reviews", icon: Star },
    { name: "Field capture", url: "/dashboard/field", icon: Compass } ] },
  { grp: "Operations", items: [
    { name: "Trade ops", url: "/dashboard/trade-ops", icon: Workflow },
    { name: "Kitchen prep", url: "/dashboard/kitchen-prep", icon: ChefHat },
    { name: "Brokers", url: "/dashboard/brokers", icon: Handshake } ] },
  { grp: "Grow", items: [
    { name: "Reports", url: "/dashboard/insights", icon: BarChart3 },
    { name: "Plan & billing", url: "/dashboard/billing", icon: CreditCard } ] },
]

const anyActive = (pathname: string | null, items: NItem[]) => items.some((i) => isActiveForNav(pathname, i.url))
const KHATA_ACTIVE = (p: string | null) => isActiveForNav(p, KHATA_ROOT) || anyActive(p, KHATA)
const SETUP_ACTIVE = (p: string | null) => isActiveForNav(p, SETUP_ROOT) || SETUP.some((g) => anyActive(p, g.items))
const ZYADA_ACTIVE = (p: string | null) => ZYADA.some((g) => anyActive(p, g.items))

/** Where "Add a business" goes. Same account, same login: it is a short form, not a sign-up. */
const ADD_BUSINESS_HREF = "/dashboard/business/new"

/** Small status chip for a business that is not live yet (live ones stay quiet). */
function StatusChip({ status }: { status?: string }) {
  const info = businessStatusInfo(status)
  if (!info || info.tone === "ok") return null
  const tone = info.tone === "bad"
    ? "bg-destructive/10 text-destructive"
    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
  return (
    <span className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium leading-4 ${tone}`} title={info.summary}>
      {info.label}
    </span>
  )
}

function BusinessSwitcher() {
  const { business, businesses } = useBusiness()
  const { user } = useUser()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const { limit, atLimit } = useBusinessLimit()
  const list = (businesses || []) as Biz[]
  const active = activeBusinessId != null ? list.find((b) => b.id === activeBusinessId) || null : null
  const allMode = activeBusinessId == null && list.length > 1
  const shown = active || (list.length === 1 ? list[0] : (business as Biz | null))
  const name = allMode ? "Sabhi venue" : (shown?.name || "Your venue")
  // Under the name: type · city · area. While the business is not live yet the stage
  // comes first instead ("Under review · Karachi"), short enough not to be cut off.
  const stage = (() => { const s = businessStatusInfo(shown?.status); return s && s.tone !== "ok" ? s.label : "" })()
  const sub = allMode
    ? `${list.length} venues`
    : (stage ? [stage, shown?.city].filter(Boolean).join(" · ") : shown ? businessSubtitle(shown) : "") || " "
  const canAdd = !!(user as { isVendor?: boolean } | null)?.isVendor
  // "3 of 4 businesses" once the API publishes the plan's limit; the plain count until then.
  const countText = limit ? describeLimit(limit) : list.length ? `${list.length} ${list.length === 1 ? "business" : "businesses"}` : ""
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={name} className="data-[state=open]:bg-sidebar-accent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">{(name.trim()[0] || "V").toUpperCase()}</div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[13px] font-semibold">{name}</span>
                <span className="truncate text-[11px] text-muted-foreground">{sub}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {/* Wider than the rail on purpose: two businesses named "Zzz QA Coverage Marquee..."
              were indistinguishable once the name was cut at one line. Names now wrap to two
              lines, the line under them carries type, city and area, and the full name is in
              the tooltip. The list scrolls on its own so "Add a business" stays the last row
              in view however many businesses there are. */}
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-72 max-w-[22rem]">
            <DropdownMenuLabel className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Venue chunein</span>
              {countText && <span className="font-normal normal-case tabular-nums">{countText}</span>}
            </DropdownMenuLabel>
            <div className="max-h-[min(50vh,22rem)] overflow-y-auto overflow-x-hidden">
              {list.length > 1 && (
                <>
                  <DropdownMenuItem onClick={() => setActiveBusinessId(null)} className="items-start gap-2" aria-current={activeBusinessId == null ? "true" : undefined}>
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">S</span>
                    <span className="grid min-w-0 flex-1 leading-snug">
                      <span className="text-[13px] font-medium">Sabhi venue</span>
                      <span className="text-[11px] text-muted-foreground">All {list.length} businesses combined</span>
                    </span>
                    {activeBusinessId == null && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {list.map((b) => {
                const subtitle = businessSubtitle(b)
                return (
                  <DropdownMenuItem
                    key={b.id}
                    onClick={() => setActiveBusinessId(b.id)}
                    className="items-start gap-2"
                    title={[b.name, subtitle].filter(Boolean).join(", ")}
                    aria-current={activeBusinessId === b.id ? "true" : undefined}
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">{((b.name || "?").trim()[0] || "?").toUpperCase()}</span>
                    <span className="grid min-w-0 flex-1 leading-snug">
                      <span className="line-clamp-2 break-words text-[13px] font-medium">{b.name || "Venue"}</span>
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <StatusChip status={b.status} />
                        {subtitle && <span className="truncate">{subtitle}</span>}
                      </span>
                    </span>
                    {activeBusinessId === b.id && <Check className="mt-0.5 size-4 shrink-0 text-primary" />}
                  </DropdownMenuItem>
                )
              })}
              {list.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">You have no business on this account yet.</div>
              )}
            </div>
            {canAdd && (
              <>
                <DropdownMenuSeparator />
                {/* Last row, always in view. Opens a short form that reuses this login. */}
                <DropdownMenuItem asChild className="items-start gap-2">
                  <Link href={ADD_BUSINESS_HREF} data-testid="add-business-action">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/50">
                      <Plus className="size-3.5" />
                    </span>
                    <span className="grid min-w-0 flex-1 leading-snug">
                      <span className="text-[13px] font-medium">{list.length === 0 ? "Add your business" : "Add a business"}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {atLimit && limit
                          ? `Your plan allows ${limit.max} - see how to add more`
                          : "Another venue or service, same login"}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function ChampagneSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const go = (url: string) => router.push(url)

  const activeDrill = React.useMemo<null | "khata" | "setup" | "more">(() => {
    if (KHATA_ACTIVE(pathname)) return "khata"
    if (SETUP_ACTIVE(pathname)) return "setup"
    if (ZYADA_ACTIVE(pathname)) return "more"
    return null
  }, [pathname])
  const [drill, setDrill] = React.useState<null | "khata" | "setup" | "more">(activeDrill)
  React.useEffect(() => { setDrill(activeDrill) }, [activeDrill])

  const Item = ({ it }: { it: NItem }) => (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={it.name} isActive={isActiveForNav(pathname, it.url)} onClick={() => go(it.url)}>
        <it.icon /><span>{it.name}</span>
        {/* A screen whose feature the plan lacks is shown LOCKED (lock + the plan that includes it), not hidden.
            The chip renders nothing unless the server says this vendor is locked out of it. */}
        {SCREEN_FEATURE[it.url] ? <PlanLockChip feature={SCREEN_FEATURE[it.url]} className="ml-auto" /> : null}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
  const Grouped = ({ groups }: { groups: Group[] }) => (
    <>{groups.map((g) => (
      <SidebarGroup key={g.grp}>
        <SidebarGroupLabel>{g.grp}</SidebarGroupLabel>
        <SidebarMenu>{g.items.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu>
      </SidebarGroup>
    ))}</>
  )
  const BackHeader = ({ title }: { title: string }) => (
    <>
      <SidebarGroup className="pb-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setDrill(null)} tooltip="Back" className="font-semibold text-foreground">
              <ArrowLeft /><span>{title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader><BusinessSwitcher /></SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {drill === null ? (
          <div key="root" className="duration-200 animate-in fade-in-0 slide-in-from-left-2">
            <SidebarGroup>
              <SidebarGroupLabel>Rozana</SidebarGroupLabel>
              <SidebarMenu>{ROZANA.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Modules</SidebarGroupLabel>
              <SidebarMenu>
                {/* Khata / Set up / Zyada — drill-downs that replace the whole rail. */}
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Khata" isActive={KHATA_ACTIVE(pathname)} onClick={() => setDrill("khata")}>
                    <Wallet /><span>Khata</span>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Set up" isActive={SETUP_ACTIVE(pathname)} onClick={() => setDrill("setup")}>
                    <Settings2 /><span>Set up</span>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Zyada" isActive={ZYADA_ACTIVE(pathname)} onClick={() => setDrill("more")}>
                    <MoreHorizontal /><span>Zyada</span>
                    <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ) : (
          <div key={drill} className="duration-200 animate-in fade-in-0 slide-in-from-right-3">
            <BackHeader title={drill === "khata" ? "Khata" : drill === "setup" ? "Set up" : "Zyada"} />
            {drill === "khata" ? (
              <SidebarGroup>
                <SidebarMenu>{KHATA.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu>
              </SidebarGroup>
            ) : (
              <Grouped groups={drill === "setup" ? SETUP : ZYADA} />
            )}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter><ChampagneUserMenu /></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default ChampagneSidebar
