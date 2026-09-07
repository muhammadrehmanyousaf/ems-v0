"use client"

/**
 * ChampagneUserMenu — the vendor rail's footer profile button. Since the top
 * bar was removed, the things that lived there now live in THIS dropdown:
 * a screen search, notifications (with unread count) and the theme switch —
 * alongside the usual account actions (Profile, Log out).
 */

import * as React from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, Bell, Check, ChevronsUpDown, LogOut, Monitor, Moon, Search, Sun } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, type DashboardRole } from "@/lib/dashboard-role"
import { useThemePrefs } from "@/lib/store/theme-prefs"
import { NotificationAPI } from "@/lib/api/notifications"
import { applyContentSearch } from "@/components/dashboard/mainScreens/artifact/artifact-shell"

const ROLE_LABEL: Record<DashboardRole, string> = { superAdmin: "Super admin", admin: "Admin", vendor: "Vendor", none: "Workspace" }
const THEMES: { key: "light" | "dark" | "system"; label: string; icon: React.ElementType }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
]

export function ChampagneUserMenu() {
  const { isMobile } = useSidebar()
  const { user, logout } = useUser()
  const router = useRouter()
  const mode = useThemePrefs((s) => s.mode)
  const setMode = useThemePrefs((s) => s.setMode)
  const [unread, setUnread] = React.useState(0)
  React.useEffect(() => {
    let a = true
    NotificationAPI.getUnreadCount().then((c: number) => { if (a) setUnread(c) }).catch(() => {})
    return () => { a = false }
  }, [])

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
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-primary/20 text-primary text-xs">{initials}</AvatarFallback></Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[getDashboardRole(user)]}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Search — was the top-bar search box. */}
            <div className="px-1 py-1" onKeyDown={(e) => e.stopPropagation()}>
              <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-2">
                <Search className="size-3.5 text-muted-foreground" />
                <input className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground" placeholder="Is screen mein dhoondein…" onChange={(e) => applyContentSearch(e.currentTarget.value)} />
              </div>
            </div>
            <DropdownMenuSeparator />

            {/* Notifications — was the top-bar bell. */}
            <DropdownMenuItem onClick={() => router.push("/dashboard/notifications")}>
              <Bell />
              Notifications
              {unread > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">{unread > 99 ? "99+" : unread}</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Theme — was the top-bar theme toggle. */}
            <DropdownMenuLabel className="py-1 text-[11px] font-normal uppercase tracking-wide text-muted-foreground">Theme</DropdownMenuLabel>
            {THEMES.map((th) => (
              <DropdownMenuItem key={th.key} onClick={() => setMode(th.key)}>
                <th.icon />
                {th.label}
                {mode === th.key && <Check className="ml-auto size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}><BadgeCheck />Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}><LogOut />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default ChampagneUserMenu
