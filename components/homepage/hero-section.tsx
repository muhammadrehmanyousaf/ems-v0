"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import { Search, MapPin, Star, ArrowRight, X, Heart, Award } from "lucide-react"
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

// ── Bridal primitives (Phase 2.1 — homepage hero revamp) ─────────────────
import { BridalButton } from "@/components/bridal/bridal-button"
import { BridalBadge } from "@/components/bridal/bridal-badge"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { FloatingPetals } from "@/components/bridal/floating-petals"

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

  // Hero background — cinematic Pakistani bridal & mehndi photography.
  // Curated pool biased toward South-Asian wedding visuals (bridal couture,
  // mehndi hands, henna patterns, gold jewellery, marigold florals, dupatta).
  // All URLs Pexels CDN, free for commercial use.
  const heroImages = [
    "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1920", // bridal portrait, traditional jewellery
    "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920", // bride couple
    "https://images.pexels.com/photos/1456613/pexels-photo-1456613.jpeg?auto=compress&cs=tinysrgb&w=1920", // mehndi hands close-up
    "https://images.pexels.com/photos/2253839/pexels-photo-2253839.jpeg?auto=compress&cs=tinysrgb&w=1920", // bridal close-up, golden hour
    "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1920", // wedding ceremony
    "https://images.pexels.com/photos/1485469/pexels-photo-1485469.jpeg?auto=compress&cs=tinysrgb&w=1920", // bride solo portrait
    "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1920", // henna pattern art
  ]

  return (
    <section className="relative min-h-[760px] h-[100vh] max-h-[980px] flex flex-col justify-center overflow-hidden bridal-surface">
      {/* ── Background: cinematic Pakistani wedding photography ── */}
      <div className="absolute inset-0">
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          loop
          speed={2200}
          className="w-full h-full"
        >
          {heroImages.map((src, i) => (
            <SwiperSlide key={i}>
              <div className="w-full h-full overflow-hidden relative">
                {/* LCP image — first slide is the page's largest paint;
                    priority + high fetch priority is the single biggest CWV
                    lever. Reference: docs/seo/05-T5-image-migration-runbook.md. */}
                <Image
                  src={src}
                  alt=""
                  fill
                  priority={i === 0}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  sizes="100vw"
                  className="object-cover animate-ken-burns"
                  style={{ animationDelay: `${i * 5}s` }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── Bridal layered veils ── */}
        {/* 1. Mughal jaal motif at very low opacity — cultural watermark. */}
        <div
          className="absolute inset-0 z-10 mix-blend-soft-light opacity-40 pointer-events-none bg-mughal-jaal"
          aria-hidden
        />
        {/* 2. Warm parchment veil from the bottom — keeps copy readable
              while preserving the photography mood at the top. */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-b from-bridal-charcoal/30 via-bridal-charcoal/55 to-bridal-charcoal/85 pointer-events-none"
          aria-hidden
        />
        {/* 3. Side wash — soft mauve-blush from left, champagne tint from
              right. Anchors the editorial feel without going dark/cold. */}
        <div
          className="absolute inset-0 z-10 bg-gradient-to-br from-bridal-mauve/20 via-transparent to-bridal-blush/15 pointer-events-none"
          aria-hidden
        />
        {/* 4. Subtle vignette so the corners feel printed, not flat. */}
        <div
          className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(44,24,16,0.45)_100%)] pointer-events-none"
          aria-hidden
        />
      </div>

      {/* ── Floating petals — 5 SVG rose petals drifting gently ── */}
      <FloatingPetals className="z-10" />

      {/* ── Soft warm bokeh — replaces the old purple/blur dots ── */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[12%] left-[6%] w-72 h-72 rounded-full bg-bridal-rose/15 blur-3xl animate-float" />
        <div
          className="absolute bottom-[18%] right-[4%] w-96 h-96 rounded-full bg-bridal-gold/15 blur-3xl animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute top-[32%] right-[18%] w-1.5 h-1.5 rounded-full bg-bridal-gold/70 animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-[55%] left-[12%] w-2 h-2 rounded-full bg-bridal-rose/70 animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-20 w-full pt-20 sm:pt-24 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Editorial copy block — Playfair italic H1, bridal palette ── */}
          <div className="text-center mb-8 sm:mb-10">
            {/* Bridal badge — rose pill, gold heart, caps tracking */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <BridalBadge
                variant="rose"
                className="backdrop-blur-md bg-bridal-blush/95 shadow-[0_8px_22px_-12px_rgba(176,125,84,0.35)]"
              >
                <Heart className="w-3 h-3 fill-bridal-rose text-bridal-rose" />
                Pakistan&apos;s #1 Shaadi Platform
              </BridalBadge>
            </motion.div>

            {/* Crown rule — short gold gradient lines flanking a caps label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex items-center gap-3 justify-center mb-5"
            >
              <span className="block w-12 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold">
                Light · Luxurious · Unforgettable
              </span>
              <span className="block w-12 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
            </motion.div>

            {/* Playfair italic H1 — the brief specifies italic 52px display */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
              className="font-display italic font-normal text-bridal-ivory leading-[1.05] mb-4 text-[36px] sm:text-[44px] md:text-[52px] lg:text-[58px]"
            >
              Where every{" "}
              <span className="text-bridal-gold">love story</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              finds its{" "}
              <span className="text-bridal-rose">perfect setting</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95 }}
              className="font-bridal font-light text-[15px] sm:text-[17px] lg:text-[18px] text-bridal-ivory/85 max-w-xl mx-auto leading-relaxed"
            >
              From the first mehndi to the final rukhsati — discover Pakistan&apos;s
              most trusted photographers, venues, decorators and more, all in
              one place.
            </motion.p>

            {/* Floral SVG divider — replaces a plain horizontal rule */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 1.1 }}
              className="mt-6 flex justify-center"
            >
              <FloralDivider width={220} className="[&>svg]:opacity-90" />
            </motion.div>
          </div>

          {/* ── Search Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative bg-bridal-cream/97 backdrop-blur-2xl rounded-md border border-bridal-gold/30 shadow-[0_28px_64px_-32px_rgba(44,24,16,0.55)] p-3 sm:p-4">
              {/* Decorative gold corner brackets — adds editorial framing */}
              <span aria-hidden className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-bridal-gold/70 rounded-tl-md" />
              <span aria-hidden className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-bridal-gold/70 rounded-tr-md" />
              <span aria-hidden className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-bridal-gold/70 rounded-bl-md" />
              <span aria-hidden className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-bridal-gold/70 rounded-br-md" />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Bridal pill tabs — beige rail, blush+gold active state */}
                <TabsList className="grid w-full grid-cols-2 mb-3 bg-bridal-blush/50 p-1 rounded-md h-auto border border-bridal-beige/70">
                  <TabsTrigger
                    value="vendors"
                    className="font-bridal text-[13px] uppercase tracking-[0.18em] py-2 rounded-[4px] text-bridal-text-soft data-[state=active]:bg-bridal-cream data-[state=active]:text-bridal-charcoal data-[state=active]:shadow-[0_4px_14px_-8px_rgba(176,125,84,0.45)] transition-all duration-300"
                  >
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                    Vendors
                  </TabsTrigger>
                  <TabsTrigger
                    value="venues"
                    className="font-bridal text-[13px] uppercase tracking-[0.18em] py-2 rounded-[4px] text-bridal-text-soft data-[state=active]:bg-bridal-cream data-[state=active]:text-bridal-charcoal data-[state=active]:shadow-[0_4px_14px_-8px_rgba(176,125,84,0.45)] transition-all duration-300"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Venues
                  </TabsTrigger>
                </TabsList>

                {/* ── Vendors Tab ── */}
                <TabsContent value="vendors" className="space-y-2.5 mt-0">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                      <SelectTrigger className="w-full sm:w-[180px] h-11 border-bridal-beige bg-bridal-cream rounded-[4px] text-sm font-bridal text-bridal-charcoal hover:border-bridal-gold/55 focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold transition-all">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] bg-bridal-cream border-bridal-beige">
                        <SelectItem value="all">
                          <div className="flex items-center gap-2 font-bridal">
                            <span>🎯</span>
                            <span>All Categories</span>
                          </div>
                        </SelectItem>
                        {vendorCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center gap-2 font-bridal">
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
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bridal-gold w-4 h-4 pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="Which city?"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleVendorSearch()
                                }
                              }}
                              className="pl-9 h-11 border-bridal-beige bg-bridal-cream rounded-[4px] text-sm font-bridal text-bridal-charcoal placeholder:text-bridal-text-label/70 hover:border-bridal-gold/55 focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold transition-all"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-[4px] bg-bridal-cream border-bridal-beige" align="start">
                          <Command className="bg-transparent">
                            <CommandInput placeholder="Search cities..." className="font-bridal" />
                            <CommandList>
                              <CommandEmpty className="font-bridal text-bridal-text-soft text-sm py-3">
                                No cities found.
                              </CommandEmpty>
                              {popularCities.length > 0 ? (
                                <CommandGroup
                                  heading="Popular Cities"
                                  className="[&_[cmdk-group-heading]]:font-bridal [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-bridal-text-label"
                                >
                                  {popularCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={() => handleLocationSelect(city)}
                                      className="cursor-pointer font-bridal text-bridal-charcoal data-[selected=true]:bg-bridal-blush/50"
                                    >
                                      <MapPin className="w-3.5 h-3.5 mr-2 text-bridal-gold" />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : (
                                <div className="text-sm font-bridal text-bridal-text-soft p-3">
                                  No cities yet — type one in.
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Search Button — bridal primary */}
                    <BridalButton
                      onClick={handleVendorSearch}
                      variant="primary"
                      size="md"
                      loading={isLoading}
                      className="h-11"
                    >
                      {!isLoading && <Search className="w-4 h-4" />}
                      {isLoading ? "Searching…" : "Search"}
                    </BridalButton>
                  </div>

                  {/* Vendor Autocomplete — bridal styled */}
                  <div className="relative" ref={searchRef}>
                    <Popover open={showVendorDropdown} onOpenChange={setShowVendorDropdown}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bridal-gold w-4 h-4 pointer-events-none" />
                          <Input
                            type="text"
                            placeholder="Or search by vendor name…"
                            value={searchQuery}
                            onChange={(e) => {
                              const v = e.target.value
                              setSearchQuery(v)
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
                            className="pl-9 pr-10 h-10 border-bridal-beige bg-bridal-blush/35 rounded-[4px] text-sm font-bridal text-bridal-charcoal placeholder:text-bridal-text-label/70 hover:border-bridal-gold/55 focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold focus:bg-bridal-cream transition-all"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 inline-flex w-7 h-7 items-center justify-center rounded-full text-bridal-text-label hover:text-bridal-mauve hover:bg-bridal-blush/60 transition-colors"
                              onClick={clearVendorSearch}
                              aria-label="Clear search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[500px] p-0 rounded-[4px] bg-bridal-cream border-bridal-beige"
                        align="start"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command shouldFilter={false} className="bg-transparent">
                          <CommandList>
                            <CommandEmpty className="font-bridal text-bridal-text-soft text-sm py-4">
                              No vendors found.
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredVendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  onSelect={() => handleVendorSelect(vendor)}
                                  className="cursor-pointer data-[selected=true]:bg-bridal-blush/45"
                                >
                                  <div className="flex items-center gap-3 w-full p-1.5">
                                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-bridal-beige relative">
                                      <Image
                                        src={vendor.images?.[0] || "/placeholder.jpg"}
                                        alt={vendor.name}
                                        fill
                                        sizes="48px"
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-display italic text-[15px] text-bridal-charcoal truncate">
                                          {vendor.name}
                                        </h4>
                                        {vendor.sponsored && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFF8EE] border border-bridal-gold/55 text-[#8B5E2E] text-[9.5px] font-bridal font-medium uppercase tracking-[0.15em]">
                                            <Award className="w-2.5 h-2.5" />
                                            Featured
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2.5 text-[12px] font-bridal text-bridal-text-soft">
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-bridal-gold/80" />
                                          {vendor.city || "N/A"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                                          {vendor.rating || 0}
                                        </span>
                                        <span className="font-medium text-bridal-gold-dark">
                                          Rs.{" "}
                                          {(vendor.minimumPrice || vendor.price)?.toLocaleString() ?? "Contact us"}
                                        </span>
                                      </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-bridal-beige" />
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
                    {hasActiveVendorFilter && !isLoading && (
                      <div className="text-[12px] font-bridal text-bridal-text-soft flex items-center gap-1.5">
                        <span
                          className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            filteredVendorsAll.length > 0
                              ? "bg-bridal-sage"
                              : "bg-bridal-coral"
                          }`}
                        />
                        <span>
                          <span className="font-semibold text-bridal-charcoal">
                            {filteredVendorsAll.length}
                          </span>{" "}
                          {filteredVendorsAll.length === 1 ? "vendor" : "vendors"} match{" "}
                          <button
                            type="button"
                            onClick={handleVendorSearch}
                            className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-2 hover:underline"
                          >
                            view all →
                          </button>
                        </span>
                      </div>
                    )}

                    {recent.filter((r) => r.tab === "vendors").length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bridal font-medium uppercase tracking-[0.2em] text-bridal-text-label mr-1">
                          Recent
                        </span>
                        {recent
                          .filter((r) => r.tab === "vendors")
                          .map((r) => (
                            <button
                              key={recentSig(r)}
                              type="button"
                              onClick={() => applyRecent(r)}
                              className="px-3 py-1 text-[12px] font-bridal rounded-full bg-bridal-blush border border-bridal-rose/55 text-bridal-mauve hover:border-bridal-gold hover:bg-bridal-blush/80 hover:text-bridal-charcoal transition-colors"
                            >
                              {recentLabel(r)}
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={clearRecent}
                          className="px-2 py-1 text-[11px] font-bridal text-bridal-text-label hover:text-bridal-mauve ml-auto transition-colors"
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
                      <SelectTrigger className="w-full sm:w-[180px] h-11 border-bridal-beige bg-bridal-cream rounded-[4px] text-sm font-bridal text-bridal-charcoal hover:border-bridal-gold/55 focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold transition-all">
                        <SelectValue placeholder="Venue type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[4px] bg-bridal-cream border-bridal-beige">
                        {venueTypes.map((venueType) => (
                          <SelectItem key={venueType.value} value={venueType.value}>
                            <div className="flex items-center gap-2 font-bridal">
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
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-bridal-gold w-4 h-4 pointer-events-none" />
                            <Input
                              type="text"
                              placeholder="Which city?"
                              value={venueLocation}
                              onChange={(e) => setVenueLocation(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleVenueSearch()
                                }
                              }}
                              className="pl-9 h-11 border-bridal-beige bg-bridal-cream rounded-[4px] text-sm font-bridal text-bridal-charcoal placeholder:text-bridal-text-label/70 hover:border-bridal-gold/55 focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold transition-all"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0 rounded-[4px] bg-bridal-cream border-bridal-beige" align="start">
                          <Command className="bg-transparent">
                            <CommandInput placeholder="Search cities..." className="font-bridal" />
                            <CommandList>
                              <CommandEmpty className="font-bridal text-bridal-text-soft text-sm py-3">
                                No cities found.
                              </CommandEmpty>
                              {popularCities.length > 0 ? (
                                <CommandGroup
                                  heading="Popular Cities"
                                  className="[&_[cmdk-group-heading]]:font-bridal [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-bridal-text-label"
                                >
                                  {popularCities.map((city) => (
                                    <CommandItem
                                      key={city}
                                      value={city}
                                      onSelect={() => handleVenueLocationSelect(city)}
                                      className="cursor-pointer font-bridal text-bridal-charcoal data-[selected=true]:bg-bridal-blush/50"
                                    >
                                      <MapPin className="w-3.5 h-3.5 mr-2 text-bridal-gold" />
                                      {city}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ) : (
                                <div className="text-sm font-bridal text-bridal-text-soft p-3">
                                  No cities yet — type one in.
                                </div>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <BridalButton
                      onClick={handleVenueSearch}
                      variant="primary"
                      size="md"
                      loading={isLoading}
                      className="h-11"
                    >
                      {!isLoading && <Search className="w-4 h-4" />}
                      {isLoading ? "Searching…" : "Search"}
                    </BridalButton>
                  </div>

                  {/* Live results count + recent searches (venues tab) */}
                  <div className="flex flex-col gap-2 px-1">
                    {hasActiveVenueFilter && !isLoading && (
                      <div className="text-[12px] font-bridal text-bridal-text-soft flex items-center gap-1.5">
                        <span
                          className={`inline-flex w-1.5 h-1.5 rounded-full ${
                            filteredVenuesAll.length > 0
                              ? "bg-bridal-sage"
                              : "bg-bridal-coral"
                          }`}
                        />
                        <span>
                          <span className="font-semibold text-bridal-charcoal">
                            {filteredVenuesAll.length}
                          </span>{" "}
                          {filteredVenuesAll.length === 1 ? "venue" : "venues"} match{" "}
                          <button
                            type="button"
                            onClick={handleVenueSearch}
                            className="text-bridal-gold hover:text-bridal-gold-dark font-medium underline-offset-2 hover:underline"
                          >
                            view all →
                          </button>
                        </span>
                      </div>
                    )}

                    {recent.filter((r) => r.tab === "venues").length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bridal font-medium uppercase tracking-[0.2em] text-bridal-text-label mr-1">
                          Recent
                        </span>
                        {recent
                          .filter((r) => r.tab === "venues")
                          .map((r) => (
                            <button
                              key={recentSig(r)}
                              type="button"
                              onClick={() => applyRecent(r)}
                              className="px-3 py-1 text-[12px] font-bridal rounded-full bg-bridal-blush border border-bridal-rose/55 text-bridal-mauve hover:border-bridal-gold hover:bg-bridal-blush/80 hover:text-bridal-charcoal transition-colors"
                            >
                              {recentLabel(r)}
                            </button>
                          ))}
                        <button
                          type="button"
                          onClick={clearRecent}
                          className="px-2 py-1 text-[11px] font-bridal text-bridal-text-label hover:text-bridal-mauve ml-auto transition-colors"
                          aria-label="Clear recent searches"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Venue Results Preview — bridal styled */}
                  {filteredVenues.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-[10px] font-bridal font-medium uppercase tracking-[0.2em] text-bridal-text-label">
                        Popular Venues
                      </h4>
                      <div className="space-y-1.5">
                        {filteredVenues.slice(0, 3).map((venue) => (
                          <button
                            key={venue.id}
                            type="button"
                            className="w-full flex items-center gap-3 p-2.5 rounded-[4px] hover:bg-bridal-blush/50 cursor-pointer transition-all duration-200 group text-left"
                            onClick={() => handleVenueSelect(venue)}
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-bridal-beige relative">
                              <Image
                                src={venue.images?.[0] || "/placeholder.jpg"}
                                alt={venue.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-display italic text-[14px] text-bridal-charcoal truncate">
                                {venue.name}
                              </h5>
                              <div className="flex items-center gap-2.5 text-[12px] font-bridal text-bridal-text-soft">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-bridal-gold/80" />
                                  {venue.city || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                                  {venue.rating || 0}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-bridal-beige group-hover:text-bridal-gold transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>

          {/* ── Stats Row — bridal palette with gold dividers between ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-4 mt-10 sm:mt-12"
          >
            {[
              {
                end: stats?.vendors || allVendors.length || 500,
                suffix: "+",
                label: "Verified Vendors",
              },
              {
                end: stats?.couplesServed || 10000,
                suffix: "+",
                label: "Happy Couples",
              },
              {
                end: stats?.cities || 50,
                suffix: "+",
                label: "Cities",
              },
              {
                end: 4.8,
                suffix: "/5",
                label: "Avg Rating",
              },
            ].map((stat, i, arr) => (
              <div key={i} className="flex items-center gap-3 sm:gap-6">
                <div className="text-center">
                  <div className="font-display italic font-normal text-bridal-ivory leading-none text-[26px] sm:text-[34px]">
                    <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} />
                  </div>
                  <div className="font-bridal text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-bridal-rose/85 mt-1.5">
                    {stat.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden sm:flex items-center justify-center text-bridal-gold/70"
                  >
                    {/* Tiny gold floret divider — keeps the rhythm bridal */}
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
                      <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.55" />
                      <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 2" opacity="0.5" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

    </section>
  )
}
