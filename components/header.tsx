"use client"

import { useState } from "react"
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
import { Menu, Search, Heart } from "lucide-react"

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

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const isAuthenticated = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated')

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const searchTerm = (e.target as HTMLFormElement).search.value
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    setIsSearchOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('currentVendor')
    window.location.replace('/vendor/login')
  }

  return (
    <header className="border-b sticky top-0 bg-white z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        {/* <div className="flex items-center justify-center md:justify-between py-2 border-b">
          <div className="hidden md:flex items-center space-x-4 text-sm">
            <Link href="/blog">Wedding Blog</Link>
            <Link href="/deals">Wedding Deals</Link>
            <Link href="/reviews">Real Wedding Reviews</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/vendor/register">
              <Button variant="outline" size="sm">
                Register Business
              </Button>
            </Link>
            <Link href="/vendor/login">
              <Button size="sm">Vendor Login</Button>
            </Link>
          </div>
        </div> */}

        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  {categories.map((category) => (
                    <div key={category.title} className="space-y-3">
                      <h2 className="font-semibold">{category.title}</h2>
                      <div className="flex flex-col space-y-2">
                        {category.items.map((item) => (
                          <Link
                            key={item}
                            href={`/${category.title.toLowerCase().replace(" ", "-")}/${item.toLowerCase().replace(" ", "-")}`}
                            className="text-sm hover:text-primary"
                            onClick={() => setIsOpen(false)}
                          >
                            {item}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link href="/events" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>
                    Events
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center">
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-primary ml-1 md:ml-0">WeddingPlatform</span>
            </Link>
          </div>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Planning Tools</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/checklist"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Checklist
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/budget"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Budget
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/guest-list"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Guest List
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          href="/planning-tools/timeline"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          Timeline
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
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  >
                    Venues
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/vendors"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                  >
                    Vendors
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">

            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Heart className="h-5 w-5" />
            </Button>
            <div className="relative">
              {/* <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSearchOpen(!isSearchOpen)}>
                <Search className="h-5 w-5" />
              </Button> */}
              <Link href="/login">
              <Button className="px-1 py-0 sm:px-4 sm:py-2 md:px-5 md:py-3 text-xs sm:text-sm md:text-base">
  List Your Business
</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

