"use client"

/**
 * Phase-1 navigation — mobile bottom tab bar (the PRIMARY layman surface).
 *
 * Research across the apps Pakistani vendors actually use (Khatabook, Easypaisa,
 * Foodpanda Partner) is unanimous: for a non-technical, phone-first owner the
 * winning shape is a 4–5 item thumb-reach BOTTOM TAB BAR + a "More" drawer — not
 * a hamburger sidebar. "If you can use WhatsApp, you can use this."
 *
 * Shown on mobile only (`md:hidden`), and only for vendors. Labels follow the
 * Aasaan/Professional persona.
 */

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarDays, Wallet, Inbox, LayoutGrid, Star, Users, Boxes, HandCoins, Settings, MessageSquareText, Building2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useUser } from "@/context/UserContext"
import { getDashboardRole } from "@/lib/dashboard-role"
import { useNavPersona, type NavPersona } from "@/lib/nav/nav-persona"


type Tab = {
  key: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  simple: string
  pro: string
}

// The 5 primary tabs. Kept deliberately short (a bottom bar has no room for
// "Naye Rabtay") — the full labels live in the sidebar / More drawer.
const TABS: Tab[] = [
  { key: "home", href: "/dashboard", icon: Home, simple: "Ghar", pro: "Home" },
  { key: "booking", href: "/dashboard/bookings", icon: CalendarDays, simple: "Booking", pro: "Bookings" },
  { key: "paisa", href: "/dashboard/payments", icon: Wallet, simple: "Paisa", pro: "Money" },
  { key: "rabtay", href: "/dashboard/leads", icon: Inbox, simple: "Rabtay", pro: "Leads" },
]

// "More" drawer contents — the everyday overflow, in the vendor's own words.
const MORE: { href: string; icon: React.ComponentType<{ className?: string }>; simple: string; pro: string }[] = [
  { href: "/dashboard/calendar", icon: CalendarDays, simple: "Khali Tareekhein", pro: "Calendar" },
  { href: "/dashboard/customers", icon: Users, simple: "Grahak", pro: "Customers" },
  { href: "/dashboard/chat", icon: MessageSquareText, simple: "Baat Cheet", pro: "Messages" },
  { href: "/dashboard/expenses", icon: Wallet, simple: "Kharcha", pro: "Expenses" },
  { href: "/dashboard/staff", icon: HandCoins, simple: "Staff", pro: "Staff & Payroll" },
  { href: "/dashboard/inventory", icon: Boxes, simple: "Saman", pro: "Inventory" },
  { href: "/dashboard/reviews", icon: Star, simple: "Raaye", pro: "Reviews" },
  { href: "/dashboard/venue-os", icon: Building2, simple: "Meri Venues", pro: "Venues" },
  { href: "/dashboard/settings", icon: Settings, simple: "Settings", pro: "Settings" },
]

const pick = (t: { simple: string; pro: string }, p: NavPersona) => (p === "professional" ? t.pro : t.simple)

export function MobileBottomNav() {
  const { user } = useUser()
  const pathname = usePathname()
  const { persona } = useNavPersona()
  const [open, setOpen] = React.useState(false)

  if (getDashboardRole(user) !== "vendor") return null

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href)

  return (
    <>
      {/* Spacer so the fixed bar never covers page content. */}
      <div className="h-16 md:hidden" aria-hidden />

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-sidebar-border bg-background md:hidden">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = isActive(t.href)
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 pt-1 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{pick(t, persona)}</span>
            </Link>
          )
        })}

        {/* More — opens the grouped overflow drawer. */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-1 pt-1 text-[11px] font-medium text-muted-foreground"
            >
              <LayoutGrid className="h-5 w-5" />
              <span>{persona === "professional" ? "More" : "Aur"}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{persona === "professional" ? "More" : "Aur — sab kuch"}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {MORE.map((m) => {
                const Icon = m.icon
                return (
                  <Link
                    key={m.href}
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-sidebar-border bg-card p-3 text-center text-[12px] text-foreground transition-colors hover:bg-accent"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="leading-tight">{pick(m, persona)}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  )
}
