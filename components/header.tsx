"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Input } from "@/components/ui/input"
import { Menu, Search, Heart, Camera, Soup, Brush, Building, Paintbrush, Car, PenTool, Signature, MapPin, Star, Users, Calendar, Award, X, User, LogIn } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@/context/UserContext"
import { Spinner } from "./ui/spinner"
import HeaderAvatar from "./header-avatar"


const categories = [
  {
    title: "Planning Tools",
    items: ["Checklist", "Budget", "Guest List", "Timeline", "Vendors", "Venues"],
  },
  {
    title: "Wedding Venues",
    items: ["Banquet Halls", "Hotels", "Resorts", "Gardens", "Farmhouses", "Destination Venues"],
  },
  {
    title: "Wedding Vendors",
    items: ["Photographers", "Makeup Artists", "Decorators", "Caterers", "Wedding Cards", "Mehendi Artists"],
  },
  {
    title: "Wedding Services",
    items: ["Bridal Wear", "Groom Wear", "Jewelry", "Car Rental", "Music", "Choreography"],
  },
]

const vendorIcons = {
  Photographers: Camera,
  Caterer: Soup,
  "Makeup Artists": Brush,
  "Wedding Venues": Building,
  "Henna Artists": Paintbrush,
  Decorators: Paintbrush,
  "Car Rental": Car,
  "Wedding Stationery": PenTool,
  "Bridal Wear": Signature,
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useUser();

  // Debug logging
  useEffect(() => {
    console.log("🔍 Header - Auth state:", { 
      user: !!user, 
      isAuthenticated, 
      isLoading,
      userData: user 
    });
  }, [user, isAuthenticated, isLoading]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const searchTerm = (e.target as HTMLFormElement).search.value
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    setIsSearchOpen(false)
  }

  return (
    <header className="border-b border-neutral-200 sticky top-0 bg-white/95 backdrop-blur-md shadow-lg z-50">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">

        {/* Main Header */}
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Left Section - Logo and Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden h-10 w-10 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 rounded-lg"
                  aria-label="Open mobile menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] bg-white border-r border-neutral-200 p-0">
                <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold text-neutral-900">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-2 p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
                  {categories.map((category) => (
                    <div key={category.title} className="space-y-2">
                      <h3 className="font-semibold text-sm text-neutral-900 border-b border-neutral-100 pb-2">
                        {category.title}
                      </h3>
                      <div className="flex flex-col space-y-1">
                        {category.items.map((item) => (
                          <Link
                            key={item}
                            href={`/${category.title.toLowerCase().replace(" ", "-")}/${item.toLowerCase().replace(" ", "-")}`}
                            className="text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-neutral-100">
                    <Link 
                      href="/events" 
                      className="text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium block" 
                      onClick={() => setIsOpen(false)}
                    >
                      Events
                    </Link>
                  </div>
                  
                  {/* Authentication Section */}
                  <div className="pt-4 border-t border-neutral-100">
                    <h3 className="font-semibold text-sm text-neutral-900 border-b border-neutral-100 pb-2 mb-3">
                      Account
                    </h3>
                    <div className="space-y-2">
                      <Link 
                        href="/login" 
                        className="flex items-center gap-3 text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium" 
                        onClick={() => setIsOpen(false)}
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Link>
                      <Link 
                        href="/register" 
                        className="flex items-center gap-3 text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium" 
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Register
                      </Link>
                      <Link 
                        href="/vendor-guide" 
                        className="flex items-center gap-3 text-sm text-neutral-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all duration-200 font-medium" 
                        onClick={() => setIsOpen(false)}
                      >
                        <Award className="w-4 h-4" />
                        List Your Business
                      </Link>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent group-hover:from-rose-700 group-hover:to-pink-700 transition-all duration-300">
                WeddingPlatform
              </span>
            </Link>
          </div>

          {/* Center Section - Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="space-x-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm text-neutral-700 hover:text-rose-600 hover:bg-rose-50 data-[state=open]:text-rose-600 data-[state=open]:bg-rose-50 transition-all duration-200 font-medium px-3 py-2 h-10">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planning Tools
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white border border-neutral-200 shadow-xl rounded-xl">
                  <ul className="grid w-[400px] gap-3 p-6 md:grid-cols-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/checklist"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Checklist</div>
                              <div className="text-sm text-neutral-500">Stay organized</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/budget"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <div className="w-4 h-4 text-green-600 font-bold">₹</div>
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Budget</div>
                              <div className="text-sm text-neutral-500">Track expenses</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/guest-list"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Guest List</div>
                              <div className="text-sm text-neutral-500">Manage invites</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/timeline"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Timeline</div>
                              <div className="text-sm text-neutral-500">Plan your day</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/venues"
                    className="group inline-flex h-10 w-max items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-rose-50 data-[state=open]:bg-rose-50 border border-transparent hover:border-rose-200"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Venues
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/vendors"
                    className="group inline-flex h-10 w-max items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-rose-50 data-[state=open]:bg-rose-50 border border-transparent hover:border-rose-200"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Vendors
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm text-neutral-700 hover:text-rose-600 hover:bg-rose-50 data-[state=open]:text-rose-600 data-[state=open]:bg-rose-50 transition-all duration-200 font-medium px-3 py-2 h-10">
                  <Camera className="w-4 h-4 mr-2" />
                  Vendor List
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-white border border-neutral-200 shadow-xl rounded-xl">
                  <ul className="grid w-[500px] gap-3 p-6 md:grid-cols-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href={`/vendors/photographers`}
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Photographers</div>
                              <div className="text-sm text-neutral-500">Capture memories</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/catering"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Soup className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Caterer</div>
                              <div className="text-sm text-neutral-500">Delicious food</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/makeup-artists"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                              <Brush className="w-4 h-4 text-pink-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Makeup Artists</div>
                              <div className="text-sm text-neutral-500">Look stunning</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/venues"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <Building className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Wedding Venues</div>
                              <div className="text-sm text-neutral-500">Perfect locations</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/henna-artists"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                              <Paintbrush className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Henna Artists</div>
                              <div className="text-sm text-neutral-500">Beautiful designs</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/decor"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Paintbrush className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Decorators</div>
                              <div className="text-sm text-neutral-500">Transform venues</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/car-rental"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Car className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Car Rental</div>
                              <div className="text-sm text-neutral-500">Elegant transport</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/wedding-stationery"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <PenTool className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Wedding Stationery</div>
                              <div className="text-sm text-neutral-500">Beautiful invites</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/vendors/bridal-wear"
                          className="block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600 border border-transparent hover:border-rose-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                              <Signature className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-neutral-900">Bridal Wear</div>
                              <div className="text-sm text-neutral-500">Dream dresses</div>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Section - Profile Avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Profile Avatar */}
            <div className="relative">
              <HeaderAvatar loading={isLoading} user={user}/>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}