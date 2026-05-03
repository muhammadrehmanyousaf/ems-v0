"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Heart,
  MessageCircle,
  Bell,
  Wallet,
  Star,
  User,
  Settings,
  Heart as HeartLogo,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUser } from "@/context/UserContext"
import { useChat } from "@/context/ChatContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badgeKey?: "unread"
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/user/profile", label: "Profile", icon: User },
      { href: "/user/bookings", label: "Bookings", icon: Calendar },
      { href: "/user/favorites", label: "Favourites", icon: Heart },
    ],
  },
  {
    label: "Activity",
    items: [
      {
        href: "/user/conversations",
        label: "Messages",
        icon: MessageCircle,
        badgeKey: "unread",
      },
      { href: "/user/notifications", label: "Notifications", icon: Bell },
      { href: "/user/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/user/payments", label: "Payments", icon: Wallet },
      { href: "/user/settings", label: "Settings", icon: Settings },
    ],
  },
]

function getInitials(name?: string | null) {
  if (!name) return "U"
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "U"
}

export function UserSidebar() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const { totalUnread } = useChat()

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-bridal-beige/70">
      {/* Brand */}
      <SidebarHeader className="border-b border-bridal-beige/60 pb-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 py-1 rounded-md hover:bg-bridal-blush/40 transition-colors group/brand"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bridal-cream border border-bridal-gold/55 shadow-[0_2px_8px_-4px_rgba(176,125,84,0.4)]">
            <HeartLogo className="h-4 w-4 text-bridal-gold-dark" />
          </span>
          <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display italic text-[20px] text-bridal-charcoal leading-none">
              AJOINT
            </span>
            <span className="text-[9px] font-bridal uppercase tracking-[0.32em] text-bridal-gold-dark mt-1">
              My account
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1.5 pt-3">
        {NAV_GROUPS.map((group, gi) => (
          <SidebarGroup
            key={group.label}
            className={gi === 0 ? "" : "border-t border-bridal-beige/45 mt-2 pt-3"}
          >
            <SidebarGroupLabel className="text-[10px] font-bridal uppercase tracking-[0.28em] font-medium text-bridal-text-label/85 px-2.5 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  const badge =
                    item.badgeKey === "unread" && totalUnread > 0
                      ? totalUnread > 99
                        ? "99+"
                        : String(totalUnread)
                      : null
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className="
                          relative h-9 rounded-md
                          text-bridal-charcoal/80
                          hover:bg-bridal-blush/55 hover:text-bridal-charcoal
                          data-[active=true]:bg-bridal-cream
                          data-[active=true]:text-bridal-charcoal
                          data-[active=true]:font-medium
                          data-[active=true]:shadow-[0_1px_3px_-1px_rgba(176,125,84,0.18)]
                          data-[active=true]:border data-[active=true]:border-bridal-gold/35
                          transition-colors duration-150
                        "
                      >
                        <Link href={item.href}>
                          {/* Active gold indicator */}
                          {active ? (
                            <span
                              aria-hidden
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-bridal-gold group-data-[collapsible=icon]:hidden"
                            />
                          ) : null}
                          <Icon
                            className={
                              active
                                ? "h-4 w-4 text-bridal-gold-dark"
                                : "h-4 w-4 text-bridal-text-soft"
                            }
                          />
                          <span className="text-[13.5px]">{item.label}</span>
                          {badge ? (
                            <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bridal-coral px-1.5 text-[10px] font-medium text-bridal-ivory tabular-nums leading-none group-data-[collapsible=icon]:hidden">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer — profile chip + sign out */}
      <SidebarFooter className="border-t border-bridal-beige/60 p-2">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={user?.fullName ?? user?.email ?? "Account"}
              className="
                h-auto py-2 px-2 rounded-md
                hover:bg-bridal-blush/55
                data-[state=open]:bg-bridal-blush/55
              "
            >
              <Avatar className="h-8 w-8 rounded-full ring-1 ring-bridal-gold/35">
                <AvatarImage
                  src={user?.profileImage ?? undefined}
                  alt={user?.fullName ?? "User"}
                />
                <AvatarFallback className="rounded-full bg-bridal-cream text-bridal-gold-dark text-[11px] font-medium">
                  {getInitials(user?.fullName ?? user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight min-w-0">
                <span className="truncate text-[13px] font-medium text-bridal-charcoal">
                  {user?.fullName ?? "Guest"}
                </span>
                <span className="truncate text-[11px] text-bridal-text-soft">
                  {user?.email ?? "—"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout?.()}
              tooltip="Sign out"
              className="
                h-9 rounded-md
                text-bridal-text-soft hover:text-bridal-coral
                hover:bg-bridal-coral/10
                transition-colors duration-150
              "
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[13px]">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
