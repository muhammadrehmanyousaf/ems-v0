"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
  Building,
  Paintbrush,
  Car,
  PenTool,
  Sparkles,
  Star,
  Users,
  Calendar,
  X,
  DollarSign,
  Clock,
  Palette,
  Utensils,
  Crown,
  ArrowRight,
  MapPin,
  Search,
  MessageCircle,
} from "lucide-react"
import { useUser } from "@/context/UserContext"
import { useChat } from "@/context/ChatContext"
import NotificationDropdown from "./notification-dropdown"
import HeaderAvatar from "./header-avatar"

const vendorCategories = [
  { name: "Photographers", href: "/photographers", icon: Camera, gradient: "from-purple-600 to-violet-700", desc: "Capture every moment" },
  { name: "Venues", href: "/venues", icon: MapPin, gradient: "from-amber-500 to-orange-600", desc: "Perfect locations" },
  { name: "Decorators", href: "/decor", icon: Sparkles, gradient: "from-indigo-500 to-blue-600", desc: "Transform your venue" },
  { name: "Makeup", href: "/makeup-artists", icon: Palette, gradient: "from-pink-500 to-rose-600", desc: "Look stunning" },
  { name: "Catering", href: "/catering", icon: Utensils, gradient: "from-orange-500 to-red-600", desc: "Exquisite cuisine" },
  { name: "Car Rental", href: "/car-rental", icon: Car, gradient: "from-slate-600 to-slate-800", desc: "Arrive in style" },
  { name: "Henna Artists", href: "/henna-artists", icon: Paintbrush, gradient: "from-amber-600 to-amber-700", desc: "Beautiful designs" },
  { name: "Bridal Wear", href: "/bridal-wear", icon: Crown, gradient: "from-gold-500 to-amber-600", desc: "Dream outfits" },
  { name: "Stationery", href: "/wedding-stationery", icon: PenTool, gradient: "from-purple-700 to-slate-800", desc: "Elegant invitations" },
]

const planningTools = [
  { name: "Checklist", href: "/planning-tools/checklist", icon: Calendar, desc: "Stay organized", gradient: "from-purple-600 to-purple-700" },
  { name: "Budget", href: "/planning-tools/budget", icon: DollarSign, desc: "Track expenses", gradient: "from-gold-500 to-amber-600" },
  { name: "Guest List", href: "/planning-tools/guest-list", icon: Users, desc: "Manage invites", gradient: "from-indigo-500 to-purple-600" },
  { name: "Timeline", href: "/planning-tools/timeline", icon: Clock, desc: "Plan your day", gradient: "from-amber-500 to-orange-600" },
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
          ? "bg-white/80 backdrop-blur-2xl shadow-lg shadow-purple-500/8 border-b border-purple-100/50"
          : "bg-white/95 backdrop-blur-sm border-b border-purple-100/20"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 sm:h-[68px]">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden h-10 w-10 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] sm:w-[370px] p-0 border-0 shadow-2xl">
                {/* Mobile Menu Header - Gradient */}
                <div className="relative p-5 pb-6 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.15),transparent_60%)]" />
                  <div className="relative flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5" onClick={() => setIsOpen(false)}>
                      <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <Heart className="w-[18px] h-[18px] text-gold-300" />
                      </div>
                      <span className="text-xl font-heading font-bold text-white">WeddingPlatform</span>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="relative mt-3 text-sm text-purple-200/80">Find your perfect wedding vendors</p>
                </div>

                {/* Mobile Menu Body */}
                <nav className="flex flex-col h-[calc(100%-130px)] overflow-y-auto">
                  <div className="p-4 space-y-6">
                    {/* Vendor Categories - Compact Grid */}
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-3 px-1">
                        Vendor Categories
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {vendorCategories.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group text-center"
                          >
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-200`}
                            >
                              <item.icon className="w-[18px] h-[18px] text-white" />
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-600 group-hover:text-purple-700 leading-tight">
                              {item.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Planning Tools */}
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-3 px-1">
                        Planning Tools
                      </h3>
                      <div className="space-y-1">
                        {planningTools.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                          >
                            <div
                              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}
                            >
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-700 group-hover:text-purple-700">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-neutral-400">{item.desc}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-purple-400 mb-3 px-1">
                        Quick Links
                      </h3>
                      <div className="space-y-1">
                        {[
                          { name: "All Vendors", href: "/vendors", icon: Star },
                          { name: "Search", href: "/search", icon: Search },
                          { name: "Messages", href: "/user/conversations", icon: MessageCircle },
                          { name: "My Bookings", href: "/user/bookings", icon: Calendar },
                          { name: "Favorites", href: "/favorites", icon: Heart },
                        ].map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-all duration-200 group text-sm font-medium text-neutral-600 hover:text-purple-600"
                          >
                            <item.icon className="w-4 h-4 text-neutral-400 group-hover:text-purple-500" />
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Auth */}
                  <div className="mt-auto p-4 border-t border-neutral-100 bg-neutral-50/50">
                    <div className="flex gap-2.5">
                      <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full h-11 text-sm font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-xl transition-all duration-200"
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)} className="flex-1">
                        <Button className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg shadow-purple-500/20 transition-all duration-200">
                          Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center mr-2.5 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-[1.03]">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gold-300" />
              </div>
              <span className="text-xl sm:text-2xl font-heading font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                WeddingPlatform
              </span>
            </Link>
          </div>

          {/* Center: Desktop Nav */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-0.5">
              {/* Vendors Mega Menu */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-[13px] font-semibold text-neutral-600 hover:text-purple-700 data-[state=open]:text-purple-700 bg-transparent hover:bg-purple-50/80 data-[state=open]:bg-purple-50/80 rounded-lg px-3.5 py-2 h-9 transition-all duration-200">
                  Vendors
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="flex w-[660px]">
                    {/* Left: Featured Panel */}
                    <div className="w-[210px] bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 p-6 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.12),transparent_60%)]" />
                      <div className="relative">
                        <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                          <Star className="w-5 h-5 text-gold-300" />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-white leading-tight mb-2">
                          Find Your Dream Team
                        </h3>
                        <p className="text-[13px] text-purple-200/80 leading-relaxed">
                          500+ verified wedding vendors across Pakistan
                        </p>
                      </div>
                      <Link
                        href="/vendors"
                        className="relative inline-flex items-center gap-1.5 text-sm font-semibold text-gold-300 hover:text-gold-200 transition-colors mt-6 group/link"
                      >
                        Browse all
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Right: Category Grid */}
                    <div className="flex-1 p-4">
                      <div className="grid grid-cols-3 gap-1">
                        {vendorCategories.map((item) => (
                          <NavigationMenuLink key={item.name} asChild>
                            <Link
                              href={item.href}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-purple-50/80 transition-all duration-200 group/item"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 group-hover/item:shadow-md transition-all duration-200`}
                              >
                                <item.icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-neutral-800 group-hover/item:text-purple-700 truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-neutral-400 truncate">{item.desc}</div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Planning Tools Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-[13px] font-semibold text-neutral-600 hover:text-purple-700 data-[state=open]:text-purple-700 bg-transparent hover:bg-purple-50/80 data-[state=open]:bg-purple-50/80 rounded-lg px-3.5 py-2 h-9 transition-all duration-200">
                  Planning
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[420px] p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {planningTools.map((item) => (
                        <NavigationMenuLink key={item.name} asChild>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50/80 transition-all duration-200 group/item border border-transparent hover:border-purple-100/80"
                          >
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover/item:shadow-md group-hover/item:scale-110 transition-all duration-200`}
                            >
                              <item.icon className="w-[18px] h-[18px] text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-neutral-800 group-hover/item:text-purple-700">
                                {item.name}
                              </div>
                              <div className="text-xs text-neutral-400">{item.desc}</div>
                            </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct Links */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/venues"
                    className="inline-flex h-9 items-center rounded-lg px-3.5 py-2 text-[13px] font-semibold text-neutral-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all duration-200"
                  >
                    Venues
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/vendors"
                    className="inline-flex h-9 items-center rounded-lg px-3.5 py-2 text-[13px] font-semibold text-neutral-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all duration-200"
                  >
                    All Vendors
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/events"
                    className="inline-flex h-9 items-center rounded-lg px-3.5 py-2 text-[13px] font-semibold text-neutral-600 hover:text-purple-700 hover:bg-purple-50/80 transition-all duration-200"
                  >
                    Events
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {isAuthenticated && (
              <>
                <Link
                  href={
                    user?.isVendor ||
                    user?.isSuperAdmin ||
                    user?.roles?.some((r: any) => r.id === 1 || r.id === 2)
                      ? "/dashboard/chat"
                      : "/user/conversations"
                  }
                  className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-purple-50 text-neutral-400 hover:text-purple-600 transition-all duration-200"
                  aria-label="Messages"
                >
                  <MessageCircle className="w-[18px] h-[18px]" />
                  {totalUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold leading-none">
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
              </>
            )}
            <Link
              href="/favorites"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl hover:bg-purple-50 text-neutral-400 hover:text-purple-600 transition-all duration-200"
              aria-label="Favorites"
            >
              <Heart className="w-[18px] h-[18px]" />
            </Link>
            <div className="relative">
              <HeaderAvatar loading={isLoading} user={user} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
