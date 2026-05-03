"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Heart, Home, MessageCircle, Search, type LucideIcon } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { useChat } from "@/context/ChatContext"

const SEGMENT_LABELS: Record<string, string> = {
  user: "Account",
  profile: "Profile",
  bookings: "Bookings",
  favorites: "Favourites",
  notifications: "Notifications",
  conversations: "Messages",
  payments: "Payments",
  reviews: "Reviews",
  settings: "Settings",
}

function prettifyId(seg: string) {
  if (/^\d+$/.test(seg)) return `#${seg}`
  return seg
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ")
}

interface IconLinkProps {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | null
}

function IconLink({ href, label, icon: Icon, badge }: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="
        relative inline-flex h-9 w-9 items-center justify-center rounded-full
        text-bridal-text-soft hover:text-bridal-charcoal
        hover:bg-bridal-blush/55
        transition-colors duration-150
      "
    >
      <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-bridal-coral px-1 text-[9.5px] font-medium text-bridal-ivory tabular-nums leading-none ring-2 ring-background">
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

export function UserTopbar() {
  const pathname = usePathname() ?? "/user"
  const { totalUnread } = useChat()

  const segments = pathname.split("/").filter(Boolean)
  const trail = segments.map((seg, i) => ({
    href: "/" + segments.slice(0, i + 1).join("/"),
    label: SEGMENT_LABELS[seg] ?? prettifyId(seg),
    isLast: i === segments.length - 1,
  }))

  const messagesBadge =
    totalUnread > 0 ? (totalUnread > 99 ? "99+" : String(totalUnread)) : null

  return (
    <header
      className="
        sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3
        border-b border-bridal-beige/70
        bg-bridal-ivory/80 backdrop-blur supports-[backdrop-filter]:bg-bridal-ivory/65
        px-3 sm:px-5
      "
    >
      <SidebarTrigger className="-ms-1 text-bridal-text-soft hover:text-bridal-charcoal hover:bg-bridal-blush/55" />
      <Separator orientation="vertical" className="me-1 h-5 bg-bridal-beige/70" />

      {/* Editorial breadcrumb — hidden on small screens */}
      <nav
        aria-label="Breadcrumb"
        className="hidden md:flex items-center gap-1.5 text-[12.5px] min-w-0"
      >
        {trail.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {crumb.isLast ? (
              <span className="font-display italic text-[15px] text-bridal-charcoal truncate max-w-[180px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="font-bridal text-[11.5px] uppercase tracking-[0.18em] text-bridal-text-soft hover:text-bridal-gold-dark transition-colors"
              >
                {crumb.label}
              </Link>
            )}
            {!crumb.isLast && i < trail.length - 1 ? (
              <span aria-hidden className="text-bridal-beige">/</span>
            ) : null}
          </span>
        ))}
      </nav>

      {/* Search — refined, soft surface, gold focus ring */}
      <div className="ms-auto md:ms-4 flex-1 md:max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-bridal-text-soft" />
          <Input
            type="search"
            placeholder="Search bookings, vendors…"
            className="
              h-9 pl-9 pr-3
              rounded-full
              bg-bridal-cream/70 border-bridal-beige/80
              text-[13px] text-bridal-charcoal placeholder:text-bridal-text-soft/85
              focus-visible:bg-bridal-cream
              focus-visible:border-bridal-gold/55
              focus-visible:ring-1 focus-visible:ring-bridal-gold/40
              transition-colors
            "
          />
        </div>
      </div>

      {/* Action cluster */}
      <div className="flex items-center gap-0.5">
        <IconLink href="/vendors" label="Browse vendors" icon={Home} />
        <IconLink href="/user/favorites" label="Favourites" icon={Heart} />
        <IconLink
          href="/user/conversations"
          label="Messages"
          icon={MessageCircle}
          badge={messagesBadge}
        />
        <IconLink href="/user/notifications" label="Notifications" icon={Bell} />
      </div>
    </header>
  )
}
