"use client"

/**
 * ChampagneSidebar — the vendor console's primary rail, rebuilt on the shadcn
 * `Sidebar` primitive (collapse-to-icons) in the champagne palette, with a
 * DRILL-DOWN model instead of the old secondary panel: the daily nav lives at
 * the root; Khata / Set up / Zyada are drill entries that REPLACE the rail's
 * content (with a "← Back" header) rather than opening a second column.
 *
 * Nav content is the real, vendor-type-aware output of buildVendorSections
 * (same source the classic AppSidebar uses), so no route, craft-label or
 * persona wording regresses. Active state + routing go through the same
 * isActiveForNav / router.push the rest of the app uses.
 */

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, ChevronRight, ChevronsUpDown, Wallet, Settings2, MoreHorizontal, Check } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { buildVendorSections } from "./app-sidebar"
import { isActiveForNav } from "./nav-projects"
import { NavUser } from "./nav-user"
import { useUser } from "@/context/UserContext"
import { useBusiness } from "@/context/BusinessContext"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { useNavPersona, navLabel, NAV_LABELS } from "@/lib/nav/nav-persona"
import { useT } from "@/lib/i18n/useT"

type Biz = { id: number; name?: string; city?: string; subArea?: string; vendor?: { vendorType?: string } }

// The secondary-panel sections, now drill destinations. Raw labels from
// buildVendorSections; the "Zyada" drawer folds the remaining secondary groups.
const MORE_LABELS = ["Sell & serve", "Operations", "Grow", "Venue-OS"]

function BusinessSwitcher() {
  const { business, businesses } = useBusiness()
  const setActiveBusinessId = useActiveBusinessStore((s) => s.setActiveBusinessId)
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const list = (businesses || []) as Biz[]
  const active = activeBusinessId != null ? list.find((b) => b.id === activeBusinessId) || null : null
  const allMode = activeBusinessId == null && list.length > 1
  const subOf = (b?: Biz | null) => (b ? [b.city, b.subArea].filter(Boolean).join(" · ") : "")
  const shown = active || (list.length === 1 ? list[0] : (business as Biz | null))
  const name = allMode ? "Sabhi venue" : (shown?.name || "Your venue")
  const sub = allMode ? `${list.length} venues` : (subOf(shown) || " ")
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
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Venue chunein</DropdownMenuLabel>
            {list.length > 1 && (
              <>
                <DropdownMenuItem onClick={() => setActiveBusinessId(null)} className="gap-2">
                  <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">S</span>
                  <span className="flex-1">Sabhi venue</span>
                  {activeBusinessId == null && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {list.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => setActiveBusinessId(b.id)} className="gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold">{((b.name || "?").trim()[0] || "?").toUpperCase()}</span>
                <span className="flex-1 truncate">{b.name || "Venue"}</span>
                {activeBusinessId === b.id && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function ChampagneSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const { business } = useBusiness()
  const { persona } = useNavPersona()
  const t = useT()

  const sections = React.useMemo(
    () => buildVendorSections(user, (business as Biz | null)?.vendor?.vendorType),
    [user, business],
  )
  const byLabel = (l: string) => sections.find((s) => s.label === l)
  const mainSec = byLabel("Main")
  const khataSec = byLabel("Khata")
  const setupSec = byLabel("My Business")
  const moreSecs = sections.filter((s) => MORE_LABELS.includes(s.label))

  const label = (item: { name: string; i18nKey?: string; labelOverride?: string }) =>
    item.labelOverride ? item.labelOverride : item.i18nKey ? t(item.i18nKey) : item.name
  const secLabel = (l: string) => (NAV_LABELS[l] ? navLabel(l, persona) : l)

  // Which drawer holds the current route — so navigating INTO a section opens
  // its drawer, and Back to root stays put until the route leaves the section.
  const has = (sec: typeof khataSec, p: string | null) => !!sec?.items.some((i) => isActiveForNav(p, i.url))
  const activeDrill = React.useMemo<null | "khata" | "setup" | "more">(() => {
    if (has(khataSec, pathname)) return "khata"
    if (has(setupSec, pathname)) return "setup"
    if (moreSecs.some((s) => s.items.some((i) => isActiveForNav(pathname, i.url)))) return "more"
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, sections])
  const [drill, setDrill] = React.useState<null | "khata" | "setup" | "more">(activeDrill)
  React.useEffect(() => { setDrill(activeDrill) }, [activeDrill])

  const go = (url: string) => router.push(url)

  const Item = ({ it }: { it: { name: string; url: string; icon: React.ElementType; i18nKey?: string; labelOverride?: string } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label(it)} isActive={isActiveForNav(pathname, it.url)} onClick={() => go(it.url)}>
        <it.icon /><span>{label(it)}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  const DrillTrigger = ({ id, icon: Icon, text }: { id: "khata" | "setup" | "more"; icon: React.ElementType; text: string }) => (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={text} onClick={() => setDrill(id)}>
        <Icon /><span>{text}</span>
        <ChevronRight className="ml-auto size-4 text-muted-foreground" />
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  const drillTitle = drill === "khata" ? secLabel("Khata") : drill === "setup" ? "Set up" : "Zyada"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader><BusinessSwitcher /></SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        {drill === null ? (
          <div key="root" className="duration-200 animate-in fade-in-0 slide-in-from-left-2">
            {mainSec && (
              <SidebarGroup>
                <SidebarGroupLabel>{secLabel("Main")}</SidebarGroupLabel>
                <SidebarMenu>{mainSec.items.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu>
              </SidebarGroup>
            )}
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarMenu>
                {khataSec && khataSec.items.length > 0 && <DrillTrigger id="khata" icon={Wallet} text={secLabel("Khata")} />}
                {setupSec && setupSec.items.length > 0 && <DrillTrigger id="setup" icon={Settings2} text="Set up" />}
                {moreSecs.length > 0 && <DrillTrigger id="more" icon={MoreHorizontal} text="Zyada" />}
              </SidebarMenu>
            </SidebarGroup>
          </div>
        ) : (
          <div key={drill} className="duration-200 animate-in fade-in-0 slide-in-from-right-3">
            <SidebarGroup className="pb-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setDrill(null)} tooltip="Back" className="font-semibold text-foreground">
                    <ArrowLeft /><span>{drillTitle}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator />
            {drill === "khata" && khataSec && (
              <SidebarGroup><SidebarMenu>{khataSec.items.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu></SidebarGroup>
            )}
            {drill === "setup" && setupSec && (
              <SidebarGroup><SidebarMenu>{setupSec.items.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu></SidebarGroup>
            )}
            {drill === "more" && moreSecs.map((s) => (
              <SidebarGroup key={s.label}>
                <SidebarGroupLabel>{secLabel(s.label)}</SidebarGroupLabel>
                <SidebarMenu>{s.items.map((it) => <Item key={it.name} it={it} />)}</SidebarMenu>
              </SidebarGroup>
            ))}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter><NavUser /></SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default ChampagneSidebar
