"use client"

/**
 * ChampagneUserMenu — the vendor rail's footer profile button. Since the top
 * bar was removed, notifications (with unread count) and a Light/Dark theme
 * toggle now live in THIS dropdown, alongside the account actions (Profile,
 * Log out). The menu carries the `champagne-menu` class so its gold/cream
 * shadcn tokens survive the Radix portal (see CHROME_CSS in champagne-shell).
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Bell, ChevronsUpDown, CreditCard, LogOut, Moon, Sun } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, type DashboardRole } from "@/lib/dashboard-role"
import { useThemePrefs, useResolvedThemeMode } from "@/lib/store/theme-prefs"
import { NotificationAPI } from "@/lib/api/notifications"
import { useUnreadCount } from "@/hooks/use-unread-count"
import { usePlan } from "@/context/plan-context"

const ROLE_LABEL: Record<DashboardRole, string> = { superAdmin: "Super admin", admin: "Admin", vendor: "Vendor", none: "Workspace" }

export function ChampagneUserMenu() {
  const { isMobile } = useSidebar()
  const { user, logout } = useUser()
  const router = useRouter()
  const setMode = useThemePrefs((s) => s.setMode)
  const resolved = useResolvedThemeMode()
  // WW-PERF — shared query; see hooks/use-unread-count.ts
  const { unread } = useUnreadCount()
  // The vendor's plan, by its public name (the server's, via the one provider): the same name on every screen.
  const plan = usePlan()
  // Shown when it is true and useful: the vendor has a plan in force, or plan limits apply to them. A vendor with no plan
  // while limits are NOT being enforced sees nothing (they use everything today; "No plan" would only alarm them).
  const showPlan = getDashboardRole(user) === "vendor" && plan.known && (plan.enforced || plan.tier !== "free")

  const displayName = user?.fullName || "User"
  const displayEmail = user?.email || ""
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-primary/20 text-primary text-xs">{initials}</AvatarFallback></Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="champagne-menu w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-primary/20 text-primary text-xs">{initials}</AvatarFallback></Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[getDashboardRole(user)]}{showPlan ? ` · ${plan.planName}` : ""}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Notifications — was the top-bar bell. */}
            <DropdownMenuItem onClick={() => router.push("/dashboard/notifications")}>
              <Bell />
              Notifications
              {unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">{unread > 99 ? "99+" : unread}</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Theme — a plain Light/Dark toggle (not DropdownMenuItems, so a tap
                switches the theme without closing the menu). */}
            <div className="thseg" role="group" aria-label="Theme">
              <button type="button" aria-pressed={resolved === "light"} onClick={() => setMode("light")}><Sun />Light</button>
              <button type="button" aria-pressed={resolved === "dark"} onClick={() => setMode("dark")}><Moon />Dark</button>
            </div>
            <DropdownMenuSeparator />

            {showPlan && (
              <DropdownMenuItem onClick={() => router.push("/dashboard/billing")} data-testid="menu-plan">
                <CreditCard />Plan &amp; billing
                <span className="ml-auto text-xs text-muted-foreground">{plan.planName}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}><BadgeCheck />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}><LogOut />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default ChampagneUserMenu
