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
// The bottom bar IS the rail on mobile — a 68px vertical column of icons has
// nowhere to go on a phone, and a thumb reaches the bottom of the screen, not
// the left edge. So these four mirror the first four rail modules, in the same
// order, and "More" carries the rest. Same mental model, different ergonomics.
//
// `paisa` now points at /dashboard/money (the Khata hub) rather than
// /dashboard/payments — the rail says Khata and lands on the hub, and the two
// disagreeing was a vendor learning two different homes for the same job.
const TABS: Tab[] = [
  { key: "home", href: "/dashboard", icon: Home, simple: "Ghar", pro: "Home" },
  { key: "rabtay", href: "/dashboard/leads", icon: Inbox, simple: "Rabtay", pro: "Enquiries" },
  { key: "booking", href: "/dashboard/bookings", icon: CalendarDays, simple: "Booking", pro: "Bookings" },
  { key: "paisa", href: "/dashboard/money", icon: Wallet, simple: "Paisa", pro: "Khata" },
]

// "More" drawer contents — the everyday overflow, in the vendor's own words.
// "More" completes the rail: the four modules the bottom bar has no room for,
// then the destinations a phone-first vendor actually reaches for. Ordered so
// the remaining MODULES come first — that keeps the mobile mental model
// identical to desktop instead of presenting an unrelated list.
const MORE: { href: string; icon: React.ComponentType<{ className?: string }>; simple: string; pro: string }[] = [
  { href: "/dashboard/calendar", icon: CalendarDays, simple: "Khali Tareekhein", pro: "Calendar" },
  { href: "/dashboard/chat", icon: MessageSquareText, simple: "Baat Cheet", pro: "Messages" },
  { href: "/dashboard/customers", icon: Users, simple: "Grahak", pro: "Customers" },
  { href: "/dashboard/settings", icon: Settings, simple: "Settings", pro: "Set up" },
  // Everyday destinations inside those modules.
  { href: "/dashboard/holds", icon: CalendarDays, simple: "Tareekh Rokein", pro: "Date holds" },
  { href: "/dashboard/expenses", icon: Wallet, simple: "Kharcha", pro: "Expenses" },
  { href: "/dashboard/staff", icon: HandCoins, simple: "Staff", pro: "Staff & Payroll" },
  { href: "/dashboard/inventory", icon: Boxes, simple: "Saman", pro: "Inventory" },
  { href: "/dashboard/reviews", icon: Star, simple: "Raaye", pro: "Reviews" },
  { href: "/dashboard/venue-os", icon: Building2, simple: "Meri Venues", pro: "Venues" },
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
