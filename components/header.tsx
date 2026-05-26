"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Menu,
  Heart,
  Camera,
  Paintbrush,
  Car,
  PenTool,
  Sparkles,
  Star,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Palette,
  Utensils,
  Crown,
  ArrowRight,
  MapPin,
  Search,
  MessageCircle,
  Flower2,
} from "lucide-react"
import { useUser } from "@/context/UserContext"
import { useChat } from "@/context/ChatContext"
import NotificationDropdown from "./notification-dropdown"
import HeaderAvatar from "./header-avatar"

import { BridalButton } from "@/components/bridal/bridal-button"

// Vendor categories for the mega menu — taglines double as one-line hover copy.
const vendorCategories = [
  { name: "Photographers",  href: "/photographers",       icon: Camera,    desc: "Capture every moment" },
  { name: "Venues",         href: "/venues",              icon: MapPin,    desc: "Where memories begin" },
  { name: "Decorators",     href: "/decor",               icon: Sparkles,  desc: "Transform every space" },
  { name: "Makeup",         href: "/makeup-artists",      icon: Palette,   desc: "The bridal glow" },
  { name: "Catering",       href: "/catering",            icon: Utensils,  desc: "Flavours to remember" },
  { name: "Car Rental",     href: "/car-rental",          icon: Car,       desc: "Arrive in elegance" },
  { name: "Henna Artists",  href: "/henna-artists",       icon: Flower2,   desc: "The mehndi tradition" },
  { name: "Bridal Wear",    href: "/bridal-wear",         icon: Crown,     desc: "Couture for the bride" },
  { name: "Stationery",     href: "/wedding-stationery",  icon: PenTool,   desc: "Invitations that last" },
]

const planningTools = [
  { name: "Checklist",  href: "/planning-tools/checklist",  icon: Calendar,    desc: "Stay organised" },
  { name: "Budget",     href: "/planning-tools/budget",     icon: DollarSign,  desc: "Track every rupee" },
  { name: "Guest List", href: "/planning-tools/guest-list", icon: Users,       desc: "Manage invites" },
  { name: "Timeline",   href: "/planning-tools/timeline",   icon: Clock,       desc: "Plan your day" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isAuthenticated, isLoading } = useUser()
  const { totalUnread } = useChat()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ease-out ${
        scrolled
          ? "bg-bridal-ivory/95 backdrop-blur-xl border-b border-bridal-beige/80 shadow-[0_8px_28px_-22px_rgba(176,125,84,0.45)]"
          : "bg-bridal-ivory/85 backdrop-blur-md border-b border-bridal-beige/40"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* ── Left: Mobile menu trigger + bridal logo ── */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Mobile Sheet */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-bridal-charcoal hover:bg-bridal-blush/55 hover:text-bridal-mauve transition-colors duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[320px] sm:w-[380px] p-0 border-bridal-beige bg-bridal-cream"
              >
                {/* Mobile Menu — Header band */}
                <div className="relative px-5 pt-6 pb-5 bg-gradient-to-b from-bridal-blush via-bridal-blush/60 to-bridal-cream border-b border-bridal-beige overflow-hidden">
                  <span
                    aria-hidden
                    className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-bridal-rose/30 blur-3xl"
                  />
                  <span
                    aria-hidden
                    className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-bridal-gold/15 blur-3xl"
                  />

                  <div className="relative flex items-center">
                    <Link
                      href="/"
                      className="flex items-center"
                      onClick={() => setIsOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="Wedding Wala" className="h-9 w-auto" />
                    </Link>
                    {/* Note: SheetContent renders a built-in close (X) at
                        top-right via Radix's SheetPrimitive.Close. We deleted
                        our custom one to avoid the duplicate-close-icon bug
                        the user reported. If we ever need to restyle the
                        close affordance, override it in components/ui/sheet.tsx
                        instead of adding another button here. */}
                  </div>
                  <p className="relative mt-3 font-bridal text-[12.5px] text-bridal-text-soft">
                    Pakistan&apos;s wedding platform — find your dream team.
                  </p>
                </div>

                {/* Mobile Menu — Body */}
                <nav className="flex flex-col h-[calc(100%-150px)] overflow-y-auto">
                  <div className="px-4 py-5 space-y-7">
                    {/* Vendor categories */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="block w-6 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                        <span className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-gold">
                          Vendor Categories
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {vendorCategories.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="
                                group flex flex-col items-center gap-2 p-3
                                rounded-md border border-bridal-beige bg-bridal-cream
                                hover:border-bridal-gold/55 hover:bg-bridal-blush/45
                                transition-all duration-200 text-center
                              "
                            >
                              <span
                                className="
                                  w-9 h-9 rounded-full bg-bridal-blush/70 border border-bridal-beige
                                  flex items-center justify-center
                                  group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/45
                                  transition-colors
                                "
                              >
                                <Icon
                                  className="w-[16px] h-[16px] text-bridal-gold-dark group-hover:text-bridal-gold transition-colors"
                                  strokeWidth={1.6}
                                />
                              </span>
                              <span className="font-display italic text-[12px] text-bridal-charcoal leading-tight">
                                {item.name}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Planning tools */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="block w-6 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                        <span className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-gold">
                          Planning Tools
                        </span>
                      </div>
                      <div className="space-y-1">
                        {planningTools.map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="
                                group flex items-center gap-3 px-3 py-2.5
                                rounded-md hover:bg-bridal-blush/45 transition-colors duration-200
                              "
                            >
                              <span className="w-9 h-9 rounded-md bg-bridal-blush/70 border border-bridal-beige flex items-center justify-center flex-shrink-0 group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/45 transition-colors">
                                <Icon className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                              </span>
                              <div className="min-w-0">
                                <div className="font-display italic text-[15px] text-bridal-charcoal leading-tight">
                                  {item.name}
                                </div>
                                <div className="font-bridal text-[11.5px] text-bridal-text-soft">
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quick links */}
                    <div>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="block w-6 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                        <span className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-gold">
                          Quick Links
                        </span>
                      </div>
                      <div className="space-y-1">
                        {[
                          { name: "All Vendors",  href: "/vendors",            icon: Star },
                          { name: "Search",       href: "/search",             icon: Search },
                          { name: "Messages",     href: "/user/conversations", icon: MessageCircle },
                          { name: "My Bookings",  href: "/user/bookings",      icon: Calendar },
                          { name: "Favourites",   href: "/user/favorites",     icon: Heart },
                        ].map((item) => {
                          const Icon = item.icon
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="
                                group flex items-center gap-3 px-3 py-2.5
                                rounded-md font-bridal text-[14px] text-bridal-text
                                hover:bg-bridal-blush/45 hover:text-bridal-charcoal transition-colors
                              "
                            >
                              <Icon className="w-4 h-4 text-bridal-gold/70 group-hover:text-bridal-gold transition-colors" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Auth */}
                  <div className="mt-auto px-4 py-4 border-t border-bridal-beige bg-bridal-blush/30">
                    {isAuthenticated ? (
                      <p className="font-bridal text-[12px] text-bridal-text-soft text-center">
                        Signed in as{" "}
                        <span className="text-bridal-charcoal font-medium">
                          {user?.fullName || user?.email}
                        </span>
                      </p>
                    ) : (
                      <div className="flex gap-2.5">
                        <Link
                          href="/login"
                          onClick={() => setIsOpen(false)}
                          className="flex-1"
                        >
                          <BridalButton variant="ghost" size="md" block>
                            Sign In
                          </BridalButton>
                        </Link>
                        <Link
                          href="/register"
                          onClick={() => setIsOpen(false)}
                          className="flex-1"
                        >
                          <BridalButton variant="primary" size="md" block>
                            Register
                          </BridalButton>
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo — full brand lockup */}
            <Link href="/" className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Wedding Wala" className="h-12 sm:h-14 w-auto" />
            </Link>
          </div>

          {/* ── Center: Desktop Nav ── */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              {/* Vendors mega menu — editorial three-pane layout */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className="
                    bg-transparent rounded-md px-3.5 py-2 h-9
                    font-bridal text-[12.5px] uppercase tracking-[0.18em] font-medium
                    text-bridal-text hover:text-bridal-charcoal data-[state=open]:text-bridal-charcoal
                    hover:bg-bridal-blush/55 data-[state=open]:bg-bridal-blush/55
                    transition-all duration-200
                  "
                >
                  Vendors
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[1100px] max-w-[calc(100vw-3rem)] bg-bridal-cream border border-bridal-beige rounded-md overflow-hidden shadow-[0_28px_60px_-28px_rgba(176,125,84,0.5)]">
                    <div className="grid grid-cols-12 min-h-[440px]">
                      {/* ── Left: Editorial feature spotlight (4 cols) ── */}
                      <div className="col-span-4 relative overflow-hidden">
                        <Link href="/vendors" className="block group/featured h-full">
                          <Image
                            src="https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800"
                            alt=""
                            fill
                            sizes="(min-width: 1024px) 367px, 100vw"
                            className="object-cover transition-transform duration-700 group-hover/featured:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-bridal-mauve/55 via-bridal-charcoal/60 to-bridal-charcoal/85" />
                          <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/35 to-transparent" />
                          <span aria-hidden className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-bridal-gold/20 blur-3xl" />
                          <span aria-hidden className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-bridal-rose/25 blur-3xl" />

                          <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                            <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 mb-4 rounded-full bg-bridal-gold/20 border border-bridal-gold/55 backdrop-blur-sm font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold">
                              <Star className="w-3 h-3 fill-bridal-gold" />
                              Editor&apos;s Pick
                            </span>
                            <h3 className="font-display italic text-[28px] text-bridal-ivory leading-[1.1]">
                              Find your dream{" "}
                              <span className="text-bridal-gold">team</span>
                            </h3>
                            <p className="mt-2 font-bridal text-[12.5px] text-bridal-ivory/85 leading-relaxed">
                              500+ verified vendors hand-picked for Pakistan&apos;s most thoughtful couples.
                            </p>
                            <span className="mt-4 inline-flex items-center gap-1.5 font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-gold group-hover/featured:text-bridal-rose transition-colors">
                              Browse all vendors
                              <ArrowRight className="w-3 h-3 transition-transform group-hover/featured:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      </div>

                      {/* ── Right: Categories (8 cols) ── */}
                      <div className="col-span-8 p-7 flex flex-col">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="font-bridal text-[10px] uppercase tracking-[0.28em] text-bridal-gold font-medium whitespace-nowrap">
                            All Wedding Categories
                          </span>
                          <span className="flex-1 h-px bg-gradient-to-r from-bridal-beige via-bridal-beige/40 to-transparent" />
                        </div>

                        {/* 3×3 vertical-stacked editorial cards — full names, no truncation */}
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          {vendorCategories.map((item) => {
                            const Icon = item.icon
                            return (
                              <NavigationMenuLink key={item.name} asChild>
                                <Link
                                  href={item.href}
                                  className="
                                    group/item relative flex flex-col items-start gap-2.5 p-4
                                    rounded-md border border-transparent
                                    hover:border-bridal-gold/55 hover:bg-bridal-blush/45 hover:-translate-y-0.5
                                    transition-all duration-300
                                  "
                                >
                                  <span className="
                                    relative w-11 h-11 rounded-full bg-bridal-blush/65 border border-bridal-beige
                                    flex items-center justify-center flex-shrink-0
                                    group-hover/item:bg-bridal-gold/15 group-hover/item:border-bridal-gold/55
                                    transition-colors
                                  ">
                                    <Icon
                                      className="w-[18px] h-[18px] text-bridal-gold-dark group-hover/item:text-bridal-gold transition-colors"
                                      strokeWidth={1.6}
                                    />
                                  </span>
                                  <div className="min-w-0 w-full">
                                    <div className="font-display italic text-[16px] text-bridal-charcoal leading-tight whitespace-nowrap">
                                      {item.name}
                                    </div>
                                    <div className="font-bridal text-[11.5px] text-bridal-text-soft mt-0.5 leading-snug line-clamp-2">
                                      {item.desc}
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            )
                          })}
                        </div>

                        {/* Quick links strip */}
                        <div className="mt-6 pt-4 border-t border-bridal-beige flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-label font-medium">
                              Quick
                            </span>
                            {[
                              { href: "/vendors?featured=true", label: "Featured" },
                              { href: "/vendors?sort=top",      label: "Top Rated" },
                              { href: "/vendors?new=true",      label: "New Arrivals" },
                            ].map((q) => (
                              <Link
                                key={q.label}
                                href={q.href}
                                className="font-bridal text-[12.5px] text-bridal-mauve hover:text-bridal-gold-dark transition-colors"
                              >
                                {q.label}
                              </Link>
                            ))}
                          </div>
                          <Link
                            href="/vendors"
                            className="inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark hover:text-bridal-mauve transition-colors"
                          >
                            See all
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Planning dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className="
                    bg-transparent rounded-md px-3.5 py-2 h-9
                    font-bridal text-[12.5px] uppercase tracking-[0.18em] font-medium
                    text-bridal-text hover:text-bridal-charcoal data-[state=open]:text-bridal-charcoal
                    hover:bg-bridal-blush/55 data-[state=open]:bg-bridal-blush/55
                    transition-all duration-200
                  "
                >
                  Planning
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[440px] p-4 bg-bridal-cream border border-bridal-beige rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      {planningTools.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavigationMenuLink key={item.name} asChild>
                            <Link
                              href={item.href}
                              className="
                                group/item flex items-center gap-3 p-3 rounded-md
                                border border-transparent
                                hover:bg-bridal-blush/45 hover:border-bridal-beige
                                transition-all duration-200
                              "
                            >
                              <span className="w-10 h-10 rounded-md bg-bridal-blush/70 border border-bridal-beige flex items-center justify-center flex-shrink-0 group-hover/item:bg-bridal-gold/15 group-hover/item:border-bridal-gold/55 transition-colors">
                                <Icon className="w-[18px] h-[18px] text-bridal-gold-dark" strokeWidth={1.6} />
                              </span>
                              <div>
                                <div className="font-display italic text-[15px] text-bridal-charcoal leading-tight">
                                  {item.name}
                                </div>
                                <div className="font-bridal text-[11.5px] text-bridal-text-soft">
                                  {item.desc}
                                </div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        )
                      })}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct links */}
              {[
                { href: "/venues", label: "Venues" },
                { href: "/vendors", label: "All Vendors" },
                { href: "/real-weddings", label: "Real Weddings" },
                { href: "/blog", label: "Blog" },
                { href: "/help", label: "Help" },
              ].map((link) => (
                <NavigationMenuItem key={link.href}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={link.href}
                      className="
                        inline-flex h-9 items-center rounded-md px-3.5 py-2
                        font-bridal text-[12.5px] uppercase tracking-[0.18em] font-medium
                        text-bridal-text hover:text-bridal-charcoal hover:bg-bridal-blush/55
                        transition-all duration-200
                      "
                    >
                      {link.label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* ── Right: Actions ── */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {isAuthenticated ? (
              <>
                <Link
                  href={
                    user?.isVendor ||
                    user?.isSuperAdmin ||
                    user?.roles?.some((r: any) => r.id === 1 || r.id === 2)
                      ? "/dashboard/chat"
                      : "/user/conversations"
                  }
                  className="relative h-10 w-10 inline-flex items-center justify-center rounded-full text-bridal-text-soft hover:bg-bridal-blush/55 hover:text-bridal-mauve transition-colors duration-200"
                  aria-label="Messages"
                >
                  <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.6} />
                  {totalUnread > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-bridal-coral text-bridal-ivory text-[10px] font-bridal font-bold leading-none">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </Link>
                <NotificationDropdown
                  notificationsPageUrl={
                    user?.isVendor ||
                    user?.isSuperAdmin ||
                    user?.roles?.some((r: any) => r.id === 1 || r.id === 2)
                      ? "/dashboard/notifications"
                      : "/user/notifications"
                  }
                />
                <Link
                  href="/user/favorites"
                  className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full text-bridal-text-soft hover:bg-bridal-blush/55 hover:text-bridal-mauve transition-colors duration-200"
                  aria-label="Favourites"
                >
                  <Heart className="w-[18px] h-[18px]" strokeWidth={1.6} />
                </Link>
                <div className="relative ml-1">
                  <HeaderAvatar loading={isLoading} user={user} />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-mauve hover:text-bridal-charcoal px-3 h-10 items-center transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/register">
                  <BridalButton variant="primary" size="sm">
                    Get Started
                  </BridalButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
