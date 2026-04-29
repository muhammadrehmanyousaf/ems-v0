"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Search, MapPin, Star, Users, Calendar, ArrowRight, X, Loader2, Heart, Award, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import type { Vendor } from "@/lib/types"
import { VENDOR_TYPES, VENDOR_TYPE_DISPLAY_NAMES, VENDOR_TYPE_DESCRIPTIONS, getAllVendorPaths, VENDOR_TYPE_PATHS } from "@/lib/vendor-types"
import { useVendors } from "@/hooks/use-vendors"
import { usePlatformStats } from "@/hooks/use-platform-stats"
import { motion, AnimatePresence } from "framer-motion"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, EffectFade } from "swiper/modules"
import "swiper/css"
import "swiper/css/effect-fade"
import { TextReveal, CountUp, ScrollReveal } from "@/components/ui/motion-wrapper"

// Vendor categories with icons and descriptions
const vendorCategories = [
  { value: "photographers", label: "Photographers", icon: "📸", description: "Capture your special moments" },
  { value: "makeup-artists", label: "Makeup Artists", icon: "💄", description: "Look stunning on your big day" },
  { value: "decor", label: "Decorators", icon: "🌸", description: "Transform your venue beautifully" },
  { value: "catering", label: "Caterers", icon: "🍽️", description: "Delicious food for your guests" },
  { value: "venues", label: "Wedding Venues", icon: "🏰", description: "Perfect locations for your ceremony" },
  { value: "bridal-wear", label: "Bridal Wear", icon: "👗", description: "Find your dream wedding dress" },
  { value: "car-rental", label: "Car Rental", icon: "🚗", description: "Elegant transportation" },
  { value: "henna-artists", label: "Henna Artists", icon: "🎨", description: "Beautiful mehndi designs" },
  { value: "wedding-stationery", label: "Wedding Stationery", icon: "📝", description: "Invitations and cards" },
]

// Venue types for venue search
const venueTypes = [
  { value: "all", label: "All Venues", icon: "🏰" },
  { value: "banquet", label: "Banquet Halls", icon: "🏛️" },
  { value: "hotel", label: "Hotel Venues", icon: "🏨" },
  { value: "resort", label: "Resorts", icon: "🌴" },
  { value: "garden", label: "Garden Venues", icon: "🌺" },
  { value: "palace", label: "Palaces", icon: "👑" },
  { value: "beach", label: "Beach Venues", icon: "🏖️" },
  { value: "farmhouse", label: "Farmhouses", icon: "🏡" },
  { value: "outdoor", label: "Outdoor Venues", icon: "🌳" },
]

export function HeroSection() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("vendors")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedVenueType, setSelectedVenueType] = useState("all")
  const [location, setLocation] = useState("")
  const [venueLocation, setVenueLocation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showVenueLocationDropdown, setShowVenueLocationDropdown] = useState(false)
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Vendor | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)

  // Use React Query hook for vendors
  const { data: allVendors = [], isLoading } = useVendors()
  const { data: stats } = usePlatformStats()

  // ── Recent searches (per-user, falls back to "guest") ──
  // Persist the last 5 unique searches in localStorage so users can rerun
  // common queries with a single click.
  type RecentSearch = {
    tab: "vendors" | "venues"
    category?: string
    venueType?: string
    location?: string
    query?: string
    ts: number
  }
  const RECENT_LIMIT = 5
  const recentKey = useCallback(() => {
    if (typeof window === "undefined") return "recent_searches:guest"
    const uid = localStorage.getItem("user_id") || "guest"
    return `recent_searches:${uid}`
  }, [])

  const [recent, setRecent] = useState<RecentSearch[]>([])

  // Load on mount + whenever the auth identity changes.
  const loadRecent = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(recentKey())
      const parsed: RecentSearch[] = raw ? JSON.parse(raw) : []
      setRecent(Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [])
    } catch {
      setRecent([])
    }
  }, [recentKey])

  useEffect(() => {
    loadRecent()
    const onLogin = () => loadRecent()
    const onLogout = () => loadRecent()
    window.addEventListener("userLogin", onLogin as EventListener)
    window.addEventListener("user-login", onLogin as EventListener)
    window.addEventListener("userLogout", onLogout)
    window.addEventListener("user-logout", onLogout)
    return () => {
      window.removeEventListener("userLogin", onLogin as EventListener)
      window.removeEventListener("user-login", onLogin as EventListener)
      window.removeEventListener("userLogout", onLogout)
      window.removeEventListener("user-logout", onLogout)
    }
  }, [loadRecent])

  // Build a stable signature so we can dedupe identical searches.
  const recentSig = (s: RecentSearch) =>
    [
      s.tab,
      s.category || "",
      s.venueType || "",
      (s.location || "").trim().toLowerCase(),
      (s.query || "").trim().toLowerCase(),
    ].join("|")

  const pushRecent = useCallback(
    (entry: Omit<RecentSearch, "ts">) => {
      // Skip empty searches — pure "browse" intents aren't worth saving.
      const isEmpty =
        !entry.location?.trim() &&
        !entry.query?.trim() &&
        (!entry.category || entry.category === "all") &&
        (!entry.venueType || entry.venueType === "all")
      if (isEmpty) return
      const next: RecentSearch = { ...entry, ts: Date.now() }
      const sig = recentSig(next)
      const merged = [next, ...recent.filter((r) => recentSig(r) !== sig)].slice(
        0,
        RECENT_LIMIT
      )
      setRecent(merged)
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(recentKey(), JSON.stringify(merged))
        }
      } catch {
        // Ignore quota errors etc — recent searches are best-effort.
      }
    },
    [recent, recentKey]
  )

  const clearRecent = () => {
    setRecent([])
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(recentKey())
      }
    } catch {}
  }

  const recentLabel = (s: RecentSearch) => {
    if (s.tab === "venues") {
      const t = s.venueType && s.venueType !== "all"
        ? venueTypes.find((v) => v.value === s.venueType)?.label
        : "Venues"
      return [t, s.location].filter(Boolean).join(" · ")
    }
    const cat =
      s.category && s.category !== "all"
        ? vendorCategories.find((c) => c.value === s.category)?.label
        : null
    return [s.query, cat, s.location].filter(Boolean).join(" · ")
  }

  const applyRecent = (s: RecentSearch) => {
    if (s.tab === "venues") {
      setActiveTab("venues")
      setSelectedVenueType(s.venueType || "all")
      setVenueLocation(s.location || "")
      // Defer routing one tick so the state has updated before submit picks
      // up the new values from closure.
      setTimeout(() => {
        const params = new URLSearchParams()
        if (s.venueType && s.venueType !== "all") params.set("type", s.venueType)
        if (s.location?.trim()) params.set("location", s.location.trim())
        const qs = params.toString()
        router.push(`/venues${qs ? `?${qs}` : ""}`)
      }, 0)
      return
    }
    setActiveTab("vendors")
    setSelectedCategory(s.category || "all")
    setLocation(s.location || "")
    setSearchQuery(s.query || "")
    setTimeout(() => {
      const params = new URLSearchParams()
      if (s.query?.trim()) params.set("q", s.query.trim())
      if (s.location?.trim()) params.set("location", s.location.trim())
      const qs = params.toString()
      const querySuffix = qs ? `?${qs}` : ""
      if (s.category && s.category !== "all") {
        router.push(`/${s.category}${querySuffix}`)
      } else {
        router.push(`/search${querySuffix}`)
      }
    }, 0)
  }

  // Get popular cities from vendor data - memoized
  const popularCities = useMemo(() => {
    const cityCounts: { [key: string]: number } = {}
    
    allVendors?.forEach((vendor) => {
      if (vendor.city) {
        cityCounts[vendor.city] = (cityCounts[vendor.city] || 0) + 1
      }
    })
    
    // Sort by count and get top 10 cities
    const sortedCities = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city]) => city)
    
    return sortedCities
  }, [allVendors])

  // Filter venues from all vendors - memoized to prevent infinite loops
  const venues = useMemo(() => allVendors.filter(vendor => 
    vendor.type === VENDOR_TYPES.WEDDING_VENUE || 
    vendor.name?.toLowerCase().includes('venue') ||
    vendor.name?.toLowerCase().includes('hall') ||
    vendor.name?.toLowerCase().includes('palace') ||
    vendor.name?.toLowerCase().includes('banquet') ||
    vendor.name?.toLowerCase().includes('marriage') ||
    vendor.name?.toLowerCase().includes('wedding hall') ||
    vendor.name?.toLowerCase().includes('garden')
  ), [allVendors])



  // Helper function to check if vendor matches category
  const vendorMatchesCategory = (vendor: Vendor, category: string): boolean => {
    const vendorName = vendor.name?.toLowerCase() || ''
    const vendorType = vendor.type || ''
    
    switch (category) {
      case 'photographers':
        return vendorType === VENDOR_TYPES.PHOTOGRAPHER || 
               vendorName.includes('photography') || 
               vendorName.includes('studio') || 
               vendorName.includes('camera')
      
      case 'makeup-artists':
        return vendorType === VENDOR_TYPES.MAKEUP_ARTIST || 
               vendorName.includes('makeup') || 
               vendorName.includes('beauty') || 
               vendorName.includes('glamour')
      
      case 'decor':
        return vendorType === VENDOR_TYPES.DECORATOR || 
               vendorName.includes('decor') || 
               vendorName.includes('sajawat') || 
               vendorName.includes('event')
      
      case 'catering':
        return vendorType === VENDOR_TYPES.CATERING || 
               vendorName.includes('catering') || 
               vendorName.includes('food') || 
               vendorName.includes('kitchen')
      
      case 'venues':
        return vendorType === VENDOR_TYPES.WEDDING_VENUE || 
               vendorName.includes('venue') || 
               vendorName.includes('hall') || 
               vendorName.includes('palace')
      
      case 'car-rental':
        return vendorType === VENDOR_TYPES.CAR_RENTAL || 
               vendorName.includes('car') || 
               vendorName.includes('rental') || 
               vendorName.includes('drive')
      
      case 'henna-artists':
        return vendorType === VENDOR_TYPES.HENNA_ARTIST || 
               vendorName.includes('henna') || 
               vendorName.includes('mehndi')
      
      case 'bridal-wear':
        return vendorType === VENDOR_TYPES.BRIDAL_WEAR || 
               vendorName.includes('bridal') || 
               vendorName.includes('couture') || 
               vendorName.includes('fashion')
      
      case 'wedding-stationery':
        return vendorType === VENDOR_TYPES.WEDDING_STATIONERY || 
               vendorName.includes('card') || 
               vendorName.includes('invitation') || 
               vendorName.includes('print')
      
      default:
        return true
    }
  }

  // Helper function to check if venue matches type
  const venueMatchesType = (venue: Vendor, venueType: string): boolean => {
    const venueName = venue.name?.toLowerCase() || ''
    const venueDescription = venue.description?.toLowerCase() || ''
    
    switch (venueType) {
      case 'banquet':
        return venueName.includes('banquet') || venueName.includes('hall') || venueDescription.includes('banquet')
      case 'hotel':
        return venueName.includes('hotel') || venueName.includes('resort') || venueDescription.includes('hotel')
      case 'resort':
        return venueName.includes('resort') || venueName.includes('spa') || venueDescription.includes('resort')
      case 'garden':
        return venueName.includes('garden') || venueName.includes('lawn') || venueDescription.includes('garden')
      case 'palace':
        return venueName.includes('palace') || venueName.includes('royal') || venueDescription.includes('palace')
      case 'beach':
        return venueName.includes('beach') || venueName.includes('seaside') || venueDescription.includes('beach')
      case 'farmhouse':
        return venueName.includes('farm') || venueName.includes('villa') || venueDescription.includes('farm')
      case 'outdoor':
        return venueName.includes('outdoor') || venueName.includes('open') || venueDescription.includes('outdoor')
      default:
        return true
    }
  }

  // Filter vendors against the current form state. We compute the FULL list
  // once (used for the live "X matches" counter) and then slice 10 for the
  // suggestions popover.
  const filteredVendorsAll = useMemo(() => {
    let filtered = allVendors

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => vendorMatchesCategory(vendor, selectedCategory))
    }

    if (location) {
      filtered = filtered.filter(vendor => {
        const vendorCity = vendor.city?.toLowerCase() || ''
        const vendorLocation = vendor.location?.toLowerCase() || ''
        const searchLocation = location.toLowerCase()
        return vendorCity.includes(searchLocation) || vendorLocation.includes(searchLocation)
      })
    }

    if (searchQuery) {
      filtered = filtered.filter(vendor => {
        const vendorName = vendor.name?.toLowerCase() || ''
        const vendorDescription = vendor.description?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        return vendorName.includes(query) || vendorDescription.includes(query)
      })
    }

    return filtered
  }, [allVendors, selectedCategory, location, searchQuery])

  const filteredVendors = useMemo(
    () => filteredVendorsAll.slice(0, 10),
    [filteredVendorsAll]
  )

  // Filter venues for the live count + dropdown.
  const filteredVenuesAll = useMemo(() => {
    let filtered = venues

    if (selectedVenueType && selectedVenueType !== 'all') {
      filtered = filtered.filter(venue => venueMatchesType(venue, selectedVenueType))
    }

    if (venueLocation) {
      filtered = filtered.filter(venue => {
        const venueCity = venue.city?.toLowerCase() || ''
        const venueLocationText = venue.location?.toLowerCase() || ''
        const searchLocation = venueLocation.toLowerCase()
        return venueCity.includes(searchLocation) || venueLocationText.includes(searchLocation)
      })
    }

    return filtered
  }, [venues, selectedVenueType, venueLocation])

  const filteredVenues = useMemo(
    () => filteredVenuesAll.slice(0, 10),
    [filteredVenuesAll]
  )

  // Has the user actually filtered anything in the active tab? (Used to
  // decide when to surface the live "X matches" counter — we don't want it
  // shouting "500 vendors match" when nothing's been entered yet.)
  const hasActiveVendorFilter =
    (selectedCategory && selectedCategory !== 'all') ||
    !!location.trim() ||
    !!searchQuery.trim()
  const hasActiveVenueFilter =
    (selectedVenueType && selectedVenueType !== 'all') ||
    !!venueLocation.trim()

  // Create reverse mapping from vendor type to path
  const getVendorTypeToPath = (vendorType: string): string => {
    // First try exact match
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type === vendorType) {
        return path
      }
    }

    // Try case-insensitive match
    const lowerVendorType = vendorType.toLowerCase()
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type.toLowerCase() === lowerVendorType) {
        return path
      }
    }

    // Try partial match
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type.toLowerCase().includes(lowerVendorType) || lowerVendorType.includes(type.toLowerCase())) {
        return path
      }
    }

    return 'vendor' // fallback
  }

  // Map vendor types to URL slugs using VENDOR_TYPE_PATHS from vendor-types.ts
  const getVendorSlug = (vendor: Vendor): string => {
    const vendorType = vendor.type || ''

    // Use the reverse mapping to get the correct path
    const path = getVendorTypeToPath(vendorType)
    if (path !== 'vendor') {
      return path
    }

    // Fallback: try to determine from vendor name
    const vendorName = vendor.name?.toLowerCase() || ''

    if (vendorName.includes('photography') || vendorName.includes('photographer') || vendorName.includes('camera')) {
      return 'photographers'
    }
    if (vendorName.includes('makeup') || vendorName.includes('beauty') || vendorName.includes('glamour')) {
      return 'makeup-artists'
    }
    if (vendorName.includes('decor') || vendorName.includes('sajawat') || vendorName.includes('event')) {
      return 'decor'
    }
    if (vendorName.includes('catering') || vendorName.includes('food') || vendorName.includes('kitchen')) {
      return 'catering'
    }
    if (vendorName.includes('venue') || vendorName.includes('hall') || vendorName.includes('palace') || vendorName.includes('banquet')) {
      return 'venues'
    }
    if (vendorName.includes('car') || vendorName.includes('rental') || vendorName.includes('drive')) {
      return 'car-rental'
    }
    if (vendorName.includes('henna') || vendorName.includes('mehndi')) {
      return 'henna-artists'
    }
    if (vendorName.includes('bridal') || vendorName.includes('couture') || vendorName.includes('fashion')) {
      return 'bridal-wear'
    }
    if (vendorName.includes('card') || vendorName.includes('invitation') || vendorName.includes('print')) {
      return 'wedding-stationery'
    }

    return 'vendor' // final fallback
  }

  // Handle vendor selection
  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setSearchQuery(vendor.name)
    setShowVendorDropdown(false)
    
    const vendorSlug = getVendorSlug(vendor)
    const finalUrl = `/${vendorSlug}/${vendor.id}`
    router.push(finalUrl)
  }

  // Handle venue selection
  const handleVenueSelect = (venue: Vendor) => {
    setSelectedVenue(venue)
    setShowVendorDropdown(false)
    
    const finalUrl = `/venues/${venue.id}`
    router.push(finalUrl)
  }

  // Handle vendor search submission. We don't gate on "all + empty" — sending
  // the user to the unfiltered /search page is a perfectly valid intent
  // (browse mode). When they DID pick a category, route directly to that
  // category's listing page instead of the generic /search so the URL is
  // shareable and the filter chips on that page reflect the choice.
  const handleVendorSearch = () => {
    setShowVendorDropdown(false)
    setShowLocationDropdown(false)

    pushRecent({
      tab: "vendors",
      category: selectedCategory,
      location: location.trim(),
      query: searchQuery.trim(),
    })

    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (location.trim()) params.set("location", location.trim())

    const qs = params.toString()
    const querySuffix = qs ? `?${qs}` : ""

    if (selectedCategory && selectedCategory !== "all") {
      // Category-scoped listing (e.g. /photographers, /venues).
      router.push(`/${selectedCategory}${querySuffix}`)
      return
    }

    if (params.has("q")) params.set("category", "all")
    router.push(`/search${qs ? `?${params.toString()}` : ""}`)
  }

  // Handle venue search submission. Always lands on /venues — /venues is
  // already a category-scoped listing, so type/location are passed as
  // params for the listing page to consume.
  const handleVenueSearch = () => {
    setShowVenueLocationDropdown(false)

    pushRecent({
      tab: "venues",
      venueType: selectedVenueType,
      location: venueLocation.trim(),
    })

    const params = new URLSearchParams()
    if (selectedVenueType && selectedVenueType !== "all") {
      params.set("type", selectedVenueType)
    }
    if (venueLocation.trim()) params.set("location", venueLocation.trim())

    const qs = params.toString()
    router.push(`/venues${qs ? `?${qs}` : ""}`)
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setSearchQuery("")
    setSelectedVendor(null)
  }

  // Handle venue type selection
  const handleVenueTypeSelect = (venueType: string) => {
    setSelectedVenueType(venueType)
    setSelectedVenue(null)
  }

  // Handle location selection
  const handleLocationSelect = (city: string) => {
    setLocation(city)
    setShowLocationDropdown(false)
  }

  // Handle venue location selection
  const handleVenueLocationSelect = (city: string) => {
    setVenueLocation(city)
    setShowVenueLocationDropdown(false)
  }

  // Clear vendor search
  const clearVendorSearch = () => {
    setSearchQuery("")
    setSelectedVendor(null)
    setSelectedCategory("all")
    setLocation("")
  }

  // Clear venue search
  const clearVenueSearch = () => {
    setSelectedVenue(null)
    setSelectedVenueType("all")
    setVenueLocation("")
  }

  // Hero background images – real wedding Pexels photos
  const heroImages = [
    "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1920",
    "https://images.pexels.com/photos/1456613/pexels-photo-1456613.jpeg?auto=compress&cs=tinysrgb&w=1920",
  ]

  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
      {/* ── Background: Swiper Ken Burns Carousel ── */}
      <div className="absolute inset-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          speed={2000}
          className="w-full h-full"
        >
          {heroImages.map((src, i) => (
            <SwiperSlide key={i}>
              <div className="w-full h-full overflow-hidden">
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover animate-ken-burns"
                  style={{ animationDelay: `${i * 5}s` }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-purple-950/60 to-black/80" />
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* ── Floating decorative elements ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[8%] w-64 h-64 rounded-full bg-purple-500/5 blur-3xl animate-float" />
        <div className="absolute bottom-[20%] right-[5%] w-80 h-80 rounded-full bg-gold-400/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/4 right-[12%] w-1 h-1 rounded-full bg-gold-400/50 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[5%] w-1.5 h-1.5 rounded-full bg-gold-400/40 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[35%] right-[18%] w-1 h-1 rounded-full bg-purple-300/40 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-20 w-full pt-28 sm:pt-32 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Text Area ── */}
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold-300">Pakistan&apos;s Wedding Platform</span>
            </motion.div>

            <TextReveal
              text="Plan Your Perfect Wedding"
              as="h1"
              mode="word"
              staggerDelay={0.08}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-5 leading-[1.05] text-white"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed"
            >
              Discover top-rated photographers, venues, decorators and more — all in one place.
            </motion.p>
          </div>

          {/* ── Search Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/20 p-3 sm:p-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Pill Tabs */}
                <TabsList className="grid w-full grid-cols-2 mb-3 bg-purple-50/80 p-1 rounded-xl h-auto">
                  <TabsTrigger
                    value="vendors"
                    className="text-sm font-semibold py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm transition-all duration-300"
                  >
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    Vendors
                  </TabsTrigger>
                  <TabsTrigger
                    value="venues"
                    className="text-sm font-semibold py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm transition-all duration-300"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Venues
                  </TabsTrigger>
                </TabsList>

                {/* ── Vendors Tab ── */}
                <TabsContent value="vendors" className="space-y-2.5 mt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                      <SelectTrigger className="w-full sm:w-[180px] h-11 border-purple-100/80 bg-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300 transition-all">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <span>🎯</span>
                            <span>All Categories</span>
                          </div>
                        </SelectItem>
                        {vendorCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Location Input */}
                    <div className="relative flex-1">
                      <Popover open={showLocationDropdown} onOpenChange={setShowLocationDropdown}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="City"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleVendorSearch()
                                }
                              }}
                              className="pl-9 h-11 border-purple-100/80 bg-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300 transition-all"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-xl" align="start">
                          <Command>
                            <CommandInput placeholder="Search cities..." />
                            <CommandList>
                              <CommandEmpty>No cities found.</CommandEmpty>
                              {popularCities.length > 0 ? (
                                <CommandGroup heading="Popular Cities">
                                  {popularCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={() => handleLocationSelect(city)}
                                      className="cursor-pointer"
                                    >
                                      <MapPin className="w-3.5 h-3.5 mr-2 text-purple-400" />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : (
                                <div className="text-sm text-gray-500 p-3">
                                  No cities yet — type one in.
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Search Button */}
                    <Button
                      onClick={handleVendorSearch}
                      className="h-11 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-600/30"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  {/* Vendor Autocomplete */}
                  <div className="relative" ref={searchRef}>
                    <Popover open={showVendorDropdown} onOpenChange={setShowVendorDropdown}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Or search by vendor name..."
                            value={searchQuery}
                            onChange={(e) => {
                              const v = e.target.value
                              setSearchQuery(v)
                              // Only auto-open the suggestions when there's
                              // something to suggest. Avoids the empty popover
                              // hovering over the page on focus.
                              setShowVendorDropdown(v.trim().length > 0)
                            }}
                            onFocus={() => {
                              if (searchQuery.trim().length > 0) {
                                setShowVendorDropdown(true)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                setShowVendorDropdown(false)
                                handleVendorSearch()
                              } else if (e.key === "Escape") {
                                setShowVendorDropdown(false)
                              }
                            }}
                            className="pl-9 pr-10 h-10 border-purple-100/60 bg-purple-50/40 rounded-xl text-sm focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300 focus:bg-white transition-all"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-purple-100 rounded-lg"
                              onClick={clearVendorSearch}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[500px] p-0 rounded-xl"
                        align="start"
                        // Don't steal focus from the input — user must keep
                        // typing while the suggestions list updates live.
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command shouldFilter={false}>
                          <CommandList>
                            <CommandEmpty>No vendors found.</CommandEmpty>
                            <CommandGroup>
                              {filteredVendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  onSelect={() => handleVendorSelect(vendor)}
                                  className="cursor-pointer hover:bg-purple-50"
                                >
                                  <div className="flex items-center gap-3 w-full p-1.5">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-purple-100">
                                      <img
                                        src={vendor.images?.[0] || "/placeholder.jpg"}
                                        alt={vendor.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-semibold text-sm truncate">{vendor.name}</h4>
                                        {vendor.sponsored && (
                                          <Badge className="bg-gradient-to-r from-gold-500 to-gold-600 text-white border-0 text-[10px] px-1.5 py-0">
                                            Featured
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2.5 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3" />
                                          {vendor.city || "N/A"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Star className="w-3 h-3 text-gold-500" />
                                          {vendor.rating || 0}
                                        </span>
                                        <span className="font-medium text-purple-600">
                                          Rs. {(vendor.minimumPrice || vendor.price)?.toLocaleString() ?? 'Contact us'}
                                        </span>
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300" />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Live results count + recent searches (vendors tab) */}
                  <div className="flex flex-col gap-2 px-1">
                    {/* Live count — only when there's something filtered */}
                    {hasActiveVendorFilter && !isLoading && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span
                          className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            filteredVendorsAll.length > 0
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>
                          <span className="font-semibold text-gray-700">
                            {filteredVendorsAll.length}
                          </span>{" "}
                          {filteredVendorsAll.length === 1 ? "vendor" : "vendors"}{" "}
                          match{" "}
                          <button
                            type="button"
                            onClick={handleVendorSearch}
                            className="text-purple-600 hover:text-purple-700 font-medium underline-offset-2 hover:underline"
                          >
                            view all →
                          </button>
                        </span>
                      </div>
                    )}

                    {/* Recent searches (vendors tab) */}
                    {recent.filter((r) => r.tab === "vendors").length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mr-1">
                          Recent
                        </span>
                        {recent
                          .filter((r) => r.tab === "vendors")
                          .map((r) => (
                            <button
                              key={recentSig(r)}
                              type="button"
                              onClick={() => applyRecent(r)}
                              className="px-2.5 py-1 text-xs rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100/80"
                            >
                              {recentLabel(r)}
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={clearRecent}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 ml-auto"
                          aria-label="Clear recent searches"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── Venues Tab ── */}
                <TabsContent value="venues" className="space-y-2.5 mt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedVenueType} onValueChange={handleVenueTypeSelect}>
                      <SelectTrigger className="w-full sm:w-[180px] h-11 border-purple-100/80 bg-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300 transition-all">
                        <SelectValue placeholder="Venue type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {venueTypes.map((venueType) => (
                          <SelectItem key={venueType.value} value={venueType.value}>
                            <div className="flex items-center gap-2">
                              <span>{venueType.icon}</span>
                              <span>{venueType.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                      <Popover open={showVenueLocationDropdown} onOpenChange={setShowVenueLocationDropdown}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="City"
                              value={venueLocation}
                              onChange={(e) => setVenueLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleVenueSearch()
                                }
                              }}
                              className="pl-9 h-11 border-purple-100/80 bg-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400/30 focus:border-purple-300 transition-all"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-xl" align="start">
                          <Command>
                            <CommandInput placeholder="Search cities..." />
                            <CommandList>
                              <CommandEmpty>No cities found.</CommandEmpty>
                              {popularCities.length > 0 ? (
                                <CommandGroup heading="Popular Cities">
                                  {popularCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={() => handleVenueLocationSelect(city)}
                                      className="cursor-pointer"
                                    >
                                      <MapPin className="w-3.5 h-3.5 mr-2 text-purple-400" />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : (
                                <div className="text-sm text-gray-500 p-3">
                                  No cities yet — type one in.
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button
                      onClick={handleVenueSearch}
                      className="h-11 px-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-600/25 hover:shadow-xl hover:shadow-purple-600/30"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Search
                    </Button>
                  </div>

                  {/* Live results count + recent searches (venues tab) */}
                  <div className="flex flex-col gap-2 px-1">
                    {hasActiveVenueFilter && !isLoading && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span
                          className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            filteredVenuesAll.length > 0
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span>
                          <span className="font-semibold text-gray-700">
                            {filteredVenuesAll.length}
                          </span>{" "}
                          {filteredVenuesAll.length === 1 ? "venue" : "venues"}{" "}
                          match{" "}
                          <button
                            type="button"
                            onClick={handleVenueSearch}
                            className="text-purple-600 hover:text-purple-700 font-medium underline-offset-2 hover:underline"
                          >
                            view all →
                          </button>
                        </span>
                      </div>
                    )}

                    {recent.filter((r) => r.tab === "venues").length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mr-1">
                          Recent
                        </span>
                        {recent
                          .filter((r) => r.tab === "venues")
                          .map((r) => (
                            <button
                              key={recentSig(r)}
                              type="button"
                              onClick={() => applyRecent(r)}
                              className="px-2.5 py-1 text-xs rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100/80"
                            >
                              {recentLabel(r)}
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={clearRecent}
                          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 ml-auto"
                          aria-label="Clear recent searches"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Venue Results Preview */}
                  {filteredVenues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Popular Venues</h4>
                      <div className="space-y-1.5">
                        {filteredVenues.slice(0, 3).map((venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 cursor-pointer transition-all duration-200 group"
                            onClick={() => handleVenueSelect(venue)}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-purple-100">
                              <img
                                src={venue.images?.[0] || "/placeholder.jpg"}
                                alt={venue.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-sm truncate">{venue.name}</h5>
                              <div className="flex items-center gap-2.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {venue.city || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-gold-500" />
                                  {venue.rating || 0}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* ── Stats Row ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-8 sm:mt-10"
          >
            {[
              { end: stats?.vendors || allVendors.length || 500, suffix: "+", label: "Vendors" },
              { end: stats?.couplesServed || 10000, suffix: "+", label: "Couples Served" },
              { end: stats?.cities || 50, suffix: "+", label: "Cities" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-heading font-bold text-white leading-none">
                  <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} />
                </div>
                <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Scroll Indicator ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1"
        >
          <div className="w-1 h-1 rounded-full bg-white/60 animate-bounce-dot" />
        </motion.div>
      </div>
    </section>
  )
}
