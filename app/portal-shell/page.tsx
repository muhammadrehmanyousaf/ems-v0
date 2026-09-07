"use client"

import "../globals.css"

/**
 * PREVIEW — shadcn sidebar-07 shell in the WeddingWala champagne palette, with a
 * DRILL-DOWN primary rail (no secondary panel): the daily nav plus a few section
 * entries (Khata / Set up / Zyada). Click a section and the rail's content is
 * REPLACED by that section's items with a "← Back" header; Back returns to root.
 * Standalone route (/portal-shell); does not touch the live portal.
 */

import * as React from "react"
import {
  LayoutGrid, Inbox, CalendarCheck, CalendarDays, MessageSquare, FileText, Users,
  Wallet, Settings2, MoreHorizontal, ChevronRight, ArrowLeft, ChevronsUpDown,
  Search, Bell, Sun, Download, Plus, Building2, Package, Boxes, ReceiptText, Undo2,
  CircleDollarSign, UsersRound, Truck, BookOpen, Landmark, ArrowDownUp, CalendarClock,
  Fuel, BadgeCheck, Plane, Compass, FileQuestion, Clock, BarChart3, Star, Megaphone, CreditCard, Handshake,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger,
} from "@/components/ui/sidebar"

// The champagne palette, mapped onto the shadcn tokens the shell reads.
const champagne = {
  "--sidebar-background": "0 0% 100%", "--sidebar-foreground": "33 9% 35%",
  "--sidebar-primary": "36 51% 48%", "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-accent": "43 21% 94%", "--sidebar-accent-foreground": "40 11% 9%",
  "--sidebar-border": "43 15% 90%", "--sidebar-ring": "36 51% 48%",
  "--background": "45 18% 96%", "--foreground": "40 11% 9%",
  "--card": "0 0% 100%", "--card-foreground": "40 11% 9%",
  "--primary": "36 51% 48%", "--primary-foreground": "0 0% 100%",
  "--muted": "43 21% 94%", "--muted-foreground": "40 6% 41%",
  "--accent": "43 21% 94%", "--accent-foreground": "40 11% 9%",
  "--border": "43 15% 90%", "--input": "43 15% 86%", "--ring": "36 51% 48%",
} as React.CSSProperties

type Item = { title: string; icon: React.ElementType; active?: boolean }

const DAILY: Item[] = [
  { title: "Overview", icon: LayoutGrid }, { title: "Leads", icon: Inbox },
  { title: "Bookings", icon: CalendarCheck, active: true }, { title: "Calendar", icon: CalendarDays },
  { title: "Chat", icon: MessageSquare }, { title: "Function sheets", icon: FileText },
  { title: "Customers", icon: Users },
]

// The sections that USED to be secondary panels — now drill-down destinations.
const SECTIONS: Record<string, { title: string; icon: React.ElementType; items: Item[] }> = {
  khata: {
    title: "Khata", icon: Wallet, items: [
      { title: "Payments", icon: CircleDollarSign }, { title: "Receipts", icon: ReceiptText },
      { title: "Wapsi (due)", icon: Undo2 }, { title: "Kharche", icon: ArrowDownUp },
      { title: "Staff & payroll", icon: UsersRound }, { title: "Suppliers", icon: Truck },
      { title: "Cheque ledger", icon: BookOpen }, { title: "Tax report", icon: Landmark },
    ],
  },
  setup: {
    title: "Set up", icon: Settings2, items: [
      { title: "Business settings", icon: Building2 }, { title: "Halls & spaces", icon: Boxes },
      { title: "Bookable slots", icon: CalendarClock }, { title: "Packages & menus", icon: Package },
      { title: "Venue-OS hub", icon: Building2 }, { title: "Inventory", icon: Boxes },
      { title: "Generator fuel", icon: Fuel }, { title: "Halal certs", icon: BadgeCheck },
      { title: "Drone NOC", icon: Plane },
    ],
  },
  more: {
    title: "Zyada", icon: MoreHorizontal, items: [
      { title: "Field capture", icon: Compass }, { title: "Quote requests", icon: FileQuestion },
      { title: "Date holds", icon: Clock }, { title: "Reports", icon: BarChart3 },
      { title: "Reviews", icon: Star }, { title: "Notifications", icon: Bell },
      { title: "Promote", icon: Megaphone }, { title: "Plan & billing", icon: CreditCard },
      { title: "Collaborations", icon: Handshake },
    ],
  },
}
const DRILLS = ["khata", "setup", "more"] as const

export default function PortalShellPreview() {
  const [section, setSection] = React.useState<null | keyof typeof SECTIONS>(null)

  return (
    <div style={champagne} className="min-h-screen bg-background text-foreground [font-family:Geist,Inter,system-ui,sans-serif]">
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="Zzz QA Coverage Marquee">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">Z</div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[13px] font-semibold">Zzz QA Coverage…</span>
                    <span className="truncate text-[11px] text-muted-foreground">Lahore · Johar Town</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="overflow-x-hidden">
            {section === null ? (
              // ── ROOT view ──────────────────────────────────────────────
              <div key="root" className="duration-200 animate-in fade-in-0 slide-in-from-left-2">
                <SidebarGroup>
                  <SidebarGroupLabel>Rozana</SidebarGroupLabel>
                  <SidebarMenu>
                    {DAILY.map((it) => (
                      <SidebarMenuItem key={it.title}>
                        <SidebarMenuButton tooltip={it.title} isActive={it.active}>
                          <it.icon /><span>{it.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                  <SidebarMenu>
                    {DRILLS.map((key) => {
                      const s = SECTIONS[key]
                      return (
                        <SidebarMenuItem key={key}>
                          <SidebarMenuButton tooltip={s.title} onClick={() => setSection(key)}>
                            <s.icon /><span>{s.title}</span>
                            <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              </div>
            ) : (
              // ── DRILLED-IN view (replaces the rail) ────────────────────
              <div key={section} className="duration-200 animate-in fade-in-0 slide-in-from-right-3">
                <SidebarGroup className="pb-0">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton onClick={() => setSection(null)} className="font-semibold text-foreground" tooltip="Back">
                        <ArrowLeft /><span>{SECTIONS[section].title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
                <SidebarSeparator />
                <SidebarGroup>
                  <SidebarMenu>
                    {SECTIONS[section].items.map((it) => (
                      <SidebarMenuItem key={it.title}>
                        <SidebarMenuButton tooltip={it.title}>
                          <it.icon /><span>{it.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroup>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="Muhammad Rehman Yousaf">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-foreground text-xs font-semibold">MR</div>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-[12.5px] font-semibold">Muhammad Rehman Yousaf</span>
                    <span className="truncate text-[11px] text-muted-foreground">Owner</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="bg-background">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="mx-1 h-5 w-px bg-border" />
            <nav className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <span>Paisa</span><ChevronRight className="size-3.5" /><span className="font-semibold text-foreground">Bookings</span>
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 h-9 text-muted-foreground sm:flex">
                <Search className="size-4" /><span className="text-[13px]">Search…</span><span className="rounded border border-border px-1.5 text-[10.5px]">⌘K</span>
              </div>
              <button className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground"><Sun className="size-4" /></button>
              <button className="grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground"><Bell className="size-4" /></button>
            </div>
          </header>

          <main className="flex-1 p-5 lg:p-6">
            <div className="mx-auto w-full max-w-[1320px]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-[22px] font-semibold tracking-tight">Bookings</h1>
                  <p className="mt-1 text-[13px] text-muted-foreground">Saari shaadiyan aur events — <b className="text-foreground/80">206 total</b>.</p>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-[13px] font-semibold"><Download className="size-4" />Export</button>
                  <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground"><Plus className="size-4" />Nayi booking</button>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { cap: "Kul billed", val: "42,50,000", sub: "14 bookings", hl: true },
                  { cap: "Received", val: "7,50,000", sub: "18% mil chuka", tone: "ok" },
                  { cap: "Baqaya", val: "35,00,000", sub: "abhi tak pending", tone: "warn" },
                  { cap: "Ho gaya", val: "100", sub: "confirmed", plain: true },
                ].map((t) => (
                  <div key={t.cap} className={"rounded-xl border p-3.5 shadow-sm " + (t.hl ? "border-primary/30 bg-primary/[0.06]" : "border-border bg-card")}>
                    <div className="text-[11.5px] font-medium text-muted-foreground">{t.cap}</div>
                    <div className={"mt-1 text-[17px] font-bold tracking-tight " + (t.tone === "ok" ? "text-emerald-700" : t.tone === "warn" ? "text-primary" : "")}>
                      {!t.plain && <span className="text-[12px] font-semibold text-muted-foreground">Rs </span>}{t.val}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{t.sub}</div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2.5 font-semibold">Couple</th><th className="px-4 py-2.5 font-semibold">Event</th>
                      <th className="px-4 py-2.5 font-semibold">Taareekh</th><th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["ZQ", "Fatima & Bilal", "Barat · 12 May 2029", "12 May 2029", "6,62,500", "Confirmed"],
                      ["AR", "Ayesha & Raza", "Walima · 5 May 2029", "5 May 2029", "6,62,500", "Confirmed"],
                      ["NS", "Nadia Sheikh", "Mehndi · 11 Apr 2029", "11 Apr 2029", "2,50,000", "Pending"],
                      ["UT", "Usman Tariq", "Barat · 4 Apr 2029", "4 Apr 2029", "2,50,000", "Confirmed"],
                      ["HK", "Hina & Waqar", "Nikah · 26 Mar 2029", "26 Mar 2029", "2,50,000", "Confirmed"],
                    ].map((r, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="grid size-8 place-items-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">{r[0]}</div>
                            <span className="font-semibold">{r[1]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r[2]}</td>
                        <td className="px-4 py-3">{r[3]}</td>
                        <td className="px-4 py-3 text-right font-semibold"><span className="text-[11px] text-muted-foreground">Rs </span>{r[4]}</td>
                        <td className="px-4 py-3">
                          <span className={"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold " + (r[5] === "Confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-primary/10 text-primary")}>
                            <i className={"size-1.5 rounded-full " + (r[5] === "Confirmed" ? "bg-emerald-600" : "bg-primary")} />{r[5]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
