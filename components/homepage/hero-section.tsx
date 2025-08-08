"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Star, Users, Calendar, ArrowRight, X, Loader2, Heart, Award } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { VendorAPI } from "@/lib/api/vendors"
import type { Vendor } from "@/lib/types"
import { VENDOR_TYPES, VENDOR_TYPE_DISPLAY_NAMES, VENDOR_TYPE_DESCRIPTIONS, getAllVendorPaths, VENDOR_TYPE_PATHS } from "@/lib/vendor-types"

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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("vendors")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedVenueType, setSelectedVenueType] = useState("all")
  const [location, setLocation] = useState("")
  const [venueLocation, setVenueLocation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [venues, setVenues] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showVenueLocationDropdown, setShowVenueLocationDropdown] = useState(false)
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Vendor | null>(null)
  const [popularCities, setPopularCities] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load vendors on component mount
  useEffect(() => {
    loadVendors()
  }, [])

  // Get popular cities from vendor data
  const getPopularCities = (vendorList: Vendor[]): string[] => {
    const cityCounts: { [key: string]: number } = {}
    
    vendorList.forEach((vendor) => {
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
  }

  // Load all vendors from API
  const loadVendors = async () => {
    try {
      setIsLoading(true)
      const allVendors = await VendorAPI.getAllBusinesses()
      setVendors(allVendors)
      
      // Filter venues from all vendors
      const venueVendors = allVendors.filter(vendor => 
        vendor.type === VENDOR_TYPES.WEDDING_VENUE || 
        vendor.name?.toLowerCase().includes('venue') ||
        vendor.name?.toLowerCase().includes('hall') ||
        vendor.name?.toLowerCase().includes('palace') ||
        vendor.name?.toLowerCase().includes('banquet') ||
        vendor.name?.toLowerCase().includes('marriage') ||
        vendor.name?.toLowerCase().includes('wedding hall') ||
        vendor.name?.toLowerCase().includes('garden')
      )
      setVenues(venueVendors)
      
      // Get popular cities from vendor data
      const cities = getPopularCities(allVendors)
      setPopularCities(cities)
      
    } catch (error) {
      console.error("Error loading vendors:", error)
      toast({
        title: "Error",
        description: "Failed to load vendors. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  // Filter vendors based on search query and category
  useEffect(() => {
    let filtered = vendors

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => vendorMatchesCategory(vendor, selectedCategory))
    }

    // Filter by location
    if (location) {
      filtered = filtered.filter(vendor => {
        const vendorCity = vendor.city?.toLowerCase() || ''
        const vendorLocation = vendor.location?.toLowerCase() || ''
        const searchLocation = location.toLowerCase()
        
        return vendorCity.includes(searchLocation) || vendorLocation.includes(searchLocation)
      })
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(vendor => {
        const vendorName = vendor.name?.toLowerCase() || ''
        const vendorDescription = vendor.description?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        
        return vendorName.includes(query) || vendorDescription.includes(query)
      })
    }
    
    setFilteredVendors(filtered.slice(0, 10)) // Limit to 10 for dropdown
  }, [vendors, selectedCategory, location, searchQuery])

  // Filter venues based on search query and type
  useEffect(() => {
    let filtered = venues

    // Filter by venue type
    if (selectedVenueType && selectedVenueType !== 'all') {
      filtered = filtered.filter(venue => venueMatchesType(venue, selectedVenueType))
    }

    // Filter by location
    if (venueLocation) {
      filtered = filtered.filter(venue => {
        const venueCity = venue.city?.toLowerCase() || ''
        const venueLocationText = venue.location?.toLowerCase() || ''
        const searchLocation = venueLocation.toLowerCase()
        
        return venueCity.includes(searchLocation) || venueLocationText.includes(searchLocation)
      })
    }

    setFilteredVenues(filtered.slice(0, 10)) // Limit to 10 for dropdown
  }, [venues, selectedVenueType, venueLocation])

  // Create reverse mapping from vendor type to path
  const getVendorTypeToPath = (vendorType: string): string => {
    console.log('🔍 Looking for vendor type:', vendorType)
    
    // First try exact match
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type === vendorType) {
        console.log('✅ Exact match found:', path)
        return path
      }
    }
    
    // Try case-insensitive match
    const lowerVendorType = vendorType.toLowerCase()
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type.toLowerCase() === lowerVendorType) {
        console.log('✅ Case-insensitive match found:', path)
        return path
      }
    }
    
    // Try partial match
    for (const [path, type] of Object.entries(VENDOR_TYPE_PATHS)) {
      if (type.toLowerCase().includes(lowerVendorType) || lowerVendorType.includes(type.toLowerCase())) {
        console.log('✅ Partial match found:', path)
        return path
      }
    }
    
    console.log('❌ No match found, using fallback')
    return 'vendor' // fallback
  }

  // Map vendor types to URL slugs using VENDOR_TYPE_PATHS from vendor-types.ts
  const getVendorSlug = (vendor: Vendor): string => {
    console.log('🎯 Getting slug for vendor:', vendor.name, 'Type:', vendor.type)
    
    const vendorType = vendor.type || ''
    
    // Use the reverse mapping to get the correct path
    const path = getVendorTypeToPath(vendorType)
    if (path !== 'vendor') {
      console.log('✅ Using path from type mapping:', path)
      return path
    }
    
    // Fallback: try to determine from vendor name
    const vendorName = vendor.name?.toLowerCase() || ''
    console.log('🔍 Trying name-based fallback for:', vendorName)
    
    if (vendorName.includes('photography') || vendorName.includes('photographer') || vendorName.includes('camera')) {
      console.log('✅ Name-based match: photographers')
      return 'photographers'
    }
    if (vendorName.includes('makeup') || vendorName.includes('beauty') || vendorName.includes('glamour')) {
      console.log('✅ Name-based match: makeup-artists')
      return 'makeup-artists'
    }
    if (vendorName.includes('decor') || vendorName.includes('sajawat') || vendorName.includes('event')) {
      console.log('✅ Name-based match: decor')
      return 'decor'
    }
    if (vendorName.includes('catering') || vendorName.includes('food') || vendorName.includes('kitchen')) {
      console.log('✅ Name-based match: catering')
      return 'catering'
    }
    if (vendorName.includes('venue') || vendorName.includes('hall') || vendorName.includes('palace') || vendorName.includes('banquet')) {
      console.log('✅ Name-based match: venues')
      return 'venues'
    }
    if (vendorName.includes('car') || vendorName.includes('rental') || vendorName.includes('drive')) {
      console.log('✅ Name-based match: car-rental')
      return 'car-rental'
    }
    if (vendorName.includes('henna') || vendorName.includes('mehndi')) {
      console.log('✅ Name-based match: henna-artists')
      return 'henna-artists'
    }
    if (vendorName.includes('bridal') || vendorName.includes('couture') || vendorName.includes('fashion')) {
      console.log('✅ Name-based match: bridal-wear')
      return 'bridal-wear'
    }
    if (vendorName.includes('card') || vendorName.includes('invitation') || vendorName.includes('print')) {
      console.log('✅ Name-based match: wedding-stationery')
      return 'wedding-stationery'
    }
    
    console.log('❌ No match found, using vendor fallback')
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

  // Handle vendor search submission
  const handleVendorSearch = () => {
    if (!searchQuery.trim() && !selectedCategory && !location) {
      toast({
        title: "Search Required",
        description: "Please enter a search term, select a category, or choose a location.",
        variant: "destructive"
      })
      return
    }

    const searchParams = new URLSearchParams()
    if (searchQuery) searchParams.set('q', searchQuery)
    if (selectedCategory) searchParams.set('category', selectedCategory)
    if (location) searchParams.set('location', location)

    const searchUrl = `/search?${searchParams.toString()}`
    router.push(searchUrl)
  }

  // Handle venue search submission
  const handleVenueSearch = () => {
    if (!selectedVenueType && !venueLocation) {
      toast({
        title: "Search Required",
        description: "Please select a venue type or choose a location.",
        variant: "destructive"
      })
      return
    }

    const searchParams = new URLSearchParams()
    if (selectedVenueType && selectedVenueType !== 'all') searchParams.set('type', selectedVenueType)
    if (venueLocation) searchParams.set('location', venueLocation)

    const searchUrl = `/venues?${searchParams.toString()}`
    router.push(searchUrl)
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

  return (
    <section className="relative min-h-screen flex items-center justify-center">
      {/* Background Image with Enhanced Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1779414/pexels-photo-1779414.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Wedding couple"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/80 via-rose-800/60 to-pink-900/40" />
      </div>

      <div className="relative container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto text-center text-white">
          {/* Enhanced Hero Content */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">
            Find Your Perfect Wedding Vendors
          </h1>
            <p className="text-xl md:text-2xl mb-8 text-rose-100 max-w-3xl mx-auto leading-relaxed">
            Discover and book the best wedding vendors in your city. From photographers to venues, 
            we've got everything you need for your special day.
          </p>
          </div>

          {/* Enhanced Search Card */}
          <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="vendors" 
                    className="text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find Vendors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="venues" 
                    className="text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-md rounded-lg transition-all duration-200"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Find Venues
                  </TabsTrigger>
                </TabsList>

                {/* Vendors Tab */}
                <TabsContent value="vendors" className="space-y-6">
                  {/* Category Selection */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                      <SelectTrigger className="w-full md:w-[220px] h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
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

                    {/* Location Input with Dropdown */}
                    <div className="relative flex-1">
                      <Popover open={showLocationDropdown} onOpenChange={setShowLocationDropdown}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <Input
                              type="text"
                              placeholder="Enter your city"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="pl-12 h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search cities..." />
                                                         <CommandList>
                               <CommandEmpty>No cities found.</CommandEmpty>
                               <CommandGroup>
                                 <div className="p-2">
                                   <h4 className="text-sm font-medium mb-2">Popular Cities ({popularCities.length})</h4>
                                   <div className="grid grid-cols-2 gap-1">
                                     {popularCities.length > 0 ? (
                                       popularCities.map((city) => (
                                         <Button
                                           key={city}
                                           variant="ghost"
                                           size="sm"
                                          className="justify-start text-left hover:bg-rose-50"
                                           onClick={() => handleLocationSelect(city)}
                                         >
                                           {city}
                                         </Button>
                                       ))
                                     ) : (
                                       <div className="text-sm text-gray-500 p-2">
                                         Loading cities...
                                       </div>
                                     )}
                                   </div>
                                 </div>
                               </CommandGroup>
                             </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Search Button */}
                    <Button 
                      onClick={handleVendorSearch} 
                      className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 mr-2" />
                      )}
                      Search Vendors
                    </Button>
                  </div>

                  {/* Vendor Search with Autocomplete */}
                  <div className="relative" ref={searchRef}>
                    <Popover open={showVendorDropdown} onOpenChange={setShowVendorDropdown}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                          <Input
                            type="text"
                            placeholder="Search for specific vendors..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value)
                              setShowVendorDropdown(true)
                            }}
                            className="pl-12 pr-12 h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-rose-50"
                              onClick={clearVendorSearch}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search vendors..." />
                          <CommandList>
                            <CommandEmpty>No vendors found.</CommandEmpty>
                            <CommandGroup>
                              {filteredVendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  onSelect={() => handleVendorSelect(vendor)}
                                  className="cursor-pointer hover:bg-rose-50"
                                >
                                  <div className="flex items-center gap-4 w-full p-2">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                      <img
                                        src={vendor.images?.[0] || "/placeholder.jpg"}
                                        alt={vendor.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold truncate">{vendor.name}</h4>
                                        {vendor.sponsored && (
                                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs">
                                            <Award className="w-3 h-3 mr-1" />
                                            Featured
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-1">
                                        <div className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-rose-500" />
                                         <span>{vendor.city || 'Location not specified'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3 h-3 text-yellow-500" />
                                         <span>{vendor.rating || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-blue-500" />
                                         <span>{vendor.reviews?.length || 0} reviews</span>
                                       </div>
                                      </div>
                                      <div className="text-sm font-semibold text-rose-600">
                                         Starting from ₹{(vendor.minimumPrice || vendor.price || 0).toLocaleString()}
                                       </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-400" />
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center justify-center gap-8 text-sm text-gray-600 pt-4 border-t border-neutral-200">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">{vendors.length}+ Vendors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">50+ Cities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">4.5+ Avg Rating</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Venues Tab */}
                <TabsContent value="venues" className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Venue Type Selection */}
                    <Select value={selectedVenueType} onValueChange={handleVenueTypeSelect}>
                      <SelectTrigger className="w-full md:w-[220px] h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                        <SelectValue placeholder="Venue type" />
                      </SelectTrigger>
                      <SelectContent>
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

                    {/* Venue Location Input */}
                    <div className="relative flex-1">
                      <Popover open={showVenueLocationDropdown} onOpenChange={setShowVenueLocationDropdown}>
                        <PopoverTrigger asChild>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <Input
                              type="text"
                              placeholder="Enter your city"
                              value={venueLocation}
                              onChange={(e) => setVenueLocation(e.target.value)}
                              className="pl-12 h-12 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search cities..." />
                            <CommandList>
                              <CommandEmpty>No cities found.</CommandEmpty>
                              <CommandGroup>
                                <div className="p-2">
                                  <h4 className="text-sm font-medium mb-2">Popular Cities ({popularCities.length})</h4>
                                  <div className="grid grid-cols-2 gap-1">
                                    {popularCities.length > 0 ? (
                                      popularCities.map((city) => (
                                        <Button
                                          key={city}
                                          variant="ghost"
                                          size="sm"
                                          className="justify-start text-left hover:bg-rose-50"
                                          onClick={() => handleVenueLocationSelect(city)}
                                        >
                                          {city}
                                        </Button>
                                      ))
                                    ) : (
                                      <div className="text-sm text-gray-500 p-2">
                                        Loading cities...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Venue Search Button */}
                    <Button 
                      onClick={handleVenueSearch} 
                      className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 mr-2" />
                      )}
                      Search Venues
                    </Button>
                  </div>

                  {/* Venue Results Preview */}
                  {filteredVenues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700">Popular Venues</h4>
                      <div className="space-y-2">
                        {filteredVenues.slice(0, 3).map((venue) => (
                          <div
                            key={venue.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors duration-200"
                            onClick={() => handleVenueSelect(venue)}
                          >
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={venue.images?.[0] || "/placeholder.jpg"}
                                alt={venue.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold truncate">{venue.name}</h5>
                                {venue.sponsored && (
                                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-xs">
                                    <Award className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-500" />
                                  <span>{venue.city || 'Location not specified'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span>{venue.rating || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-blue-500" />
                                  <span>{venue.capacity || 0} guests</span>
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Venue Stats */}
                  <div className="flex items-center justify-center gap-8 text-sm text-gray-600 pt-4 border-t border-neutral-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">{venues.length}+ Venues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">4.8+ Avg Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      <span className="font-semibold">Premium Locations</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Enhanced Popular Categories */}
          {/* <div className="mt-12 flex flex-wrap justify-center gap-4">
            {vendorCategories.slice(0, 6).map((category) => (
              <Button
                key={category.value}
                variant="outline"
                size="lg"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-200 font-semibold rounded-xl px-6 py-3"
                onClick={() => {
                  // Navigate directly to the category page
                  router.push(`/${category.value}`)
                }}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div> */}
        </div>
      </div>
    </section>
  )
}

