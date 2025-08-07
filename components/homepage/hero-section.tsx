"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Star, Users, Calendar, ArrowRight, X, Loader2 } from "lucide-react"
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
import { VENDOR_TYPES, VENDOR_TYPE_DISPLAY_NAMES, VENDOR_TYPE_DESCRIPTIONS, getAllVendorPaths } from "@/lib/vendor-types"

// Vendor categories with icons and descriptions
const vendorCategories = [
  { value: "photographers", label: "Photographers", icon: "📸", description: "Capture your special moments" },
  { value: "makeup-artists", label: "Makeup Artists", icon: "💄", description: "Look stunning on your big day" },
  { value: "decorators", label: "Decorators", icon: "🌸", description: "Transform your venue beautifully" },
  { value: "caterers", label: "Caterers", icon: "🍽️", description: "Delicious food for your guests" },
  { value: "venues", label: "Wedding Venues", icon: "🏰", description: "Perfect locations for your ceremony" },
  { value: "bridal-wear", label: "Bridal Wear", icon: "👗", description: "Find your dream wedding dress" },
  { value: "car-rental", label: "Car Rental", icon: "🚗", description: "Elegant transportation" },
  { value: "henna-artists", label: "Henna Artists", icon: "🎨", description: "Beautiful mehndi designs" },
  { value: "wedding-stationery", label: "Wedding Stationery", icon: "📝", description: "Invitations and cards" },
]

// Popular cities will be dynamically generated from vendor data

export function HeroSection() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("vendors")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [location, setLocation] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showVendorDropdown, setShowVendorDropdown] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [popularCities, setPopularCities] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Load vendors on component mount
  useEffect(() => {
    loadVendors()
  }, [])

  // Get popular cities from vendor data
  const getPopularCities = (vendorList: Vendor[]): string[] => {
    const cityCounts: { [key: string]: number } = {}
    
    console.log('🔍 Extracting cities from vendors...')
    vendorList.forEach((vendor, index) => {
      console.log(`Vendor ${index + 1}: "${vendor.name}" - City: "${vendor.city}"`)
      if (vendor.city) {
        cityCounts[vendor.city] = (cityCounts[vendor.city] || 0) + 1
      }
    })
    
    console.log('📊 City counts:', cityCounts)
    
    // Sort by count and get top 10 cities
    const sortedCities = Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([city]) => city)
    
    console.log('🏙️ Final popular cities:', sortedCities)
    return sortedCities
  }

  // Load all vendors from API
  const loadVendors = async () => {
    try {
      setIsLoading(true)
      const allVendors = await VendorAPI.getAllBusinesses()
      setVendors(allVendors)
      console.log(`Loaded ${allVendors.length} vendors`)
      
      // Get popular cities from vendor data
      const cities = getPopularCities(allVendors)
      setPopularCities(cities)
      console.log('🏙️ Popular cities from vendors:', cities)
      
      // Log all unique vendor types to see what we're working with
      const vendorTypes = [...new Set(allVendors.map(v => v.type).filter(Boolean))]
      console.log('📋 All vendor types from API:', vendorTypes)
      
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
    const subBusinessType = vendor.subBusinessType || ''
    
    switch (category) {
      case 'photographers':
        return vendorType === VENDOR_TYPES.PHOTOGRAPHER || 
               vendorName.includes('photography') || 
               vendorName.includes('studio') || 
               vendorName.includes('camera') || 
               vendorName.includes('lens') || 
               vendorName.includes('shutter') || 
               vendorName.includes('pixel') || 
               vendorName.includes('frame') || 
               vendorName.includes('capture') || 
               vendorName.includes('moments') || 
               vendorName.includes('shots')
      
      case 'makeup-artists':
        return vendorType === VENDOR_TYPES.MAKEUP_ARTIST || 
               vendorName.includes('makeup') || 
               vendorName.includes('beauty') || 
               vendorName.includes('glamour') || 
               vendorName.includes('bridal beauty') || 
               vendorName.includes('makeover') || 
               vendorName.includes('beauty expert') || 
               vendorName.includes('stylish') || 
               vendorName.includes('professional beauty') || 
               vendorName.includes('gorgeous')
      
      case 'decorators':
        return vendorType === VENDOR_TYPES.DECORATOR || 
               vendorName.includes('decor') || 
               vendorName.includes('sajawat') || 
               vendorName.includes('event') || 
               vendorName.includes('styling') || 
               vendorName.includes('settings') || 
               vendorName.includes('affairs')
      
      case 'caterers':
        return vendorType === VENDOR_TYPES.CATERING || 
               vendorName.includes('catering') || 
               vendorName.includes('food') || 
               vendorName.includes('kitchen') || 
               vendorName.includes('cuisine') || 
               vendorName.includes('taste')
      
      case 'venues':
        return vendorType === VENDOR_TYPES.WEDDING_VENUE || 
               vendorName.includes('venue') || 
               vendorName.includes('hall') || 
               vendorName.includes('palace') || 
               vendorName.includes('banquet') || 
               vendorName.includes('marriage') || 
               vendorName.includes('wedding hall') || 
               vendorName.includes('garden')
      
      case 'car-rental':
        return vendorType === VENDOR_TYPES.CAR_RENTAL || 
               vendorName.includes('car') || 
               vendorName.includes('rental') || 
               vendorName.includes('drive') || 
               vendorName.includes('ride') || 
               vendorName.includes('motor')
      
      case 'henna-artists':
        return vendorType === VENDOR_TYPES.HENNA_ARTIST || 
               vendorName.includes('henna') || 
               vendorName.includes('mehndi') || 
               vendorName.includes('bridal henna')
      
      case 'bridal-wear':
        return vendorType === VENDOR_TYPES.BRIDAL_WEAR || 
               vendorName.includes('bridal') || 
               vendorName.includes('couture') || 
               vendorName.includes('fashion') || 
               vendorName.includes('attire') || 
               vendorName.includes('wear')
      
      case 'wedding-stationery':
        return vendorType === VENDOR_TYPES.WEDDING_STATIONERY || 
               vendorName.includes('card') || 
               vendorName.includes('invitation') || 
               vendorName.includes('print') || 
               vendorName.includes('stationery') || 
               vendorName.includes('invite')
      
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

    console.log(`🔍 Filtering results: Category=${selectedCategory}, Location=${location}, Query=${searchQuery}`)
    console.log(`📊 Found ${filtered.length} vendors after filtering`)
    
    setFilteredVendors(filtered.slice(0, 10)) // Limit to 10 for dropdown
  }, [vendors, selectedCategory, location, searchQuery])

  // Map vendor types to URL slugs based on centralized vendor types
  const getVendorSlug = (vendor: Vendor): string => {
    const vendorName = vendor.name?.toLowerCase() || ''
    const vendorType = vendor.type || ''
    const subBusinessType = vendor.subBusinessType || ''
    
    console.log(`🔍 Vendor: "${vendor.name}"`)
    console.log(`📝 Type: "${vendorType}", SubType: "${subBusinessType}"`)
    
    // Check against centralized vendor types first
    if (vendorType === VENDOR_TYPES.PHOTOGRAPHER || vendorName.includes('photography') || vendorName.includes('studio') || vendorName.includes('camera') || vendorName.includes('lens') || vendorName.includes('shutter') || vendorName.includes('pixel') || vendorName.includes('frame') || vendorName.includes('capture') || vendorName.includes('moments') || vendorName.includes('shots')) {
      console.log(`📸 Detected as Photographer`)
      return 'photographers'
    }
    
    if (vendorType === VENDOR_TYPES.MAKEUP_ARTIST || vendorName.includes('makeup') || vendorName.includes('beauty') || vendorName.includes('glamour') || vendorName.includes('bridal beauty') || vendorName.includes('makeover') || vendorName.includes('beauty expert') || vendorName.includes('stylish') || vendorName.includes('professional beauty') || vendorName.includes('gorgeous')) {
      console.log(`💄 Detected as Makeup Artist`)
      return 'makeup-artists'
    }
    
    if (vendorType === VENDOR_TYPES.DECORATOR || vendorName.includes('decor') || vendorName.includes('sajawat') || vendorName.includes('event') || vendorName.includes('styling') || vendorName.includes('settings') || vendorName.includes('affairs')) {
      console.log(`🌸 Detected as Decorator`)
      return 'decorators'
    }
    
    if (vendorType === VENDOR_TYPES.CATERING || vendorName.includes('catering') || vendorName.includes('food') || vendorName.includes('kitchen') || vendorName.includes('cuisine') || vendorName.includes('taste')) {
      console.log(`🍽️ Detected as Caterer`)
      return 'caterers'
    }
    
    if (vendorType === VENDOR_TYPES.WEDDING_VENUE || vendorName.includes('venue') || vendorName.includes('hall') || vendorName.includes('palace') || vendorName.includes('banquet') || vendorName.includes('marriage') || vendorName.includes('wedding hall') || vendorName.includes('garden')) {
      console.log(`🏰 Detected as Venue`)
      return 'venues'
    }
    
    if (vendorType === VENDOR_TYPES.CAR_RENTAL || vendorName.includes('car') || vendorName.includes('rental') || vendorName.includes('drive') || vendorName.includes('ride') || vendorName.includes('motor')) {
      console.log(`🚗 Detected as Car Rental`)
      return 'car-rental'
    }
    
    if (vendorType === VENDOR_TYPES.HENNA_ARTIST || vendorName.includes('henna') || vendorName.includes('mehndi') || vendorName.includes('bridal henna')) {
      console.log(`🎨 Detected as Henna Artist`)
      return 'henna-artists'
    }
    
    if (vendorType === VENDOR_TYPES.BRIDAL_WEAR || vendorName.includes('bridal') || vendorName.includes('couture') || vendorName.includes('fashion') || vendorName.includes('attire') || vendorName.includes('wear')) {
      console.log(`👗 Detected as Bridal Wear`)
      return 'bridal-wear'
    }
    
    if (vendorType === VENDOR_TYPES.WEDDING_STATIONERY || vendorName.includes('card') || vendorName.includes('invitation') || vendorName.includes('print') || vendorName.includes('stationery') || vendorName.includes('invite')) {
      console.log(`📝 Detected as Wedding Stationery`)
      return 'wedding-stationery'
    }
    
    console.log(`❓ Could not determine type, using 'vendor'`)
    return 'vendor'
  }

  // Handle vendor selection
  const handleVendorSelect = (vendor: Vendor) => {
    console.log(`🚀 Vendor selected:`, vendor)
    console.log(`📝 Vendor type: "${vendor.type}"`)
    console.log(`🆔 Vendor ID: ${vendor.id}`)
    
    setSelectedVendor(vendor)
    setSearchQuery(vendor.name)
    setShowVendorDropdown(false)
    
    // Navigate to vendor detail page with proper vendor type slug
    const vendorSlug = getVendorSlug(vendor)
    const finalUrl = `/${vendorSlug}/${vendor.id}`
    console.log(`🌐 Navigating to: ${finalUrl}`)
    router.push(finalUrl)
  }

  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim() && !selectedCategory && !location) {
      toast({
        title: "Search Required",
        description: "Please enter a search term, select a category, or choose a location.",
        variant: "destructive"
      })
      return
    }

    // Build search URL
    const searchParams = new URLSearchParams()
    if (searchQuery) searchParams.set('q', searchQuery)
    if (selectedCategory) searchParams.set('category', selectedCategory)
    if (location) searchParams.set('location', location)

    const searchUrl = `/search?${searchParams.toString()}`
    router.push(searchUrl)
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setSearchQuery("")
    setSelectedVendor(null)
  }

  // Handle location selection
  const handleLocationSelect = (city: string) => {
    setLocation(city)
    setShowLocationDropdown(false)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSelectedVendor(null)
    setSelectedCategory("all")
    setLocation("")
  }

  return (
    <section className="relative min-h-[600px] flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/1779414/pexels-photo-1779414.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Wedding couple"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
      </div>

      <div className="relative container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find Your Perfect Wedding Vendors
          </h1>
          <p className="text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
            Discover and book the best wedding vendors in your city. From photographers to venues, 
            we've got everything you need for your special day.
          </p>

          {/* Search Card */}
          <Card className="bg-white/95 backdrop-blur shadow-2xl">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="vendors" className="text-sm font-medium">
                    Find Vendors
                  </TabsTrigger>
                  <TabsTrigger value="venues" className="text-sm font-medium">
                    Find Venues
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vendors" className="space-y-4">
                  {/* Category Selection */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                      <SelectTrigger className="w-full md:w-[200px]">
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
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              type="text"
                              placeholder="Enter your city"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="pl-10"
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
                                           className="justify-start text-left"
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
                      onClick={handleSearch} 
                      className="w-full md:w-auto" 
                      size="lg"
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

                  {/* Vendor Search with Autocomplete */}
                  <div className="relative" ref={searchRef}>
                    <Popover open={showVendorDropdown} onOpenChange={setShowVendorDropdown}>
                      <PopoverTrigger asChild>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type="text"
                            placeholder="Search for specific vendors..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value)
                              setShowVendorDropdown(true)
                            }}
                            className="pl-10 pr-10"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                              onClick={clearSearch}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search vendors..." />
                          <CommandList>
                            <CommandEmpty>No vendors found.</CommandEmpty>
                            <CommandGroup>
                              {filteredVendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  onSelect={() => handleVendorSelect(vendor)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={vendor.images[0] || "/placeholder.jpg"}
                                        alt={vendor.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium truncate">{vendor.name}</h4>
                                        {vendor.sponsored && (
                                          <Badge variant="secondary" className="text-xs">Sponsored</Badge>
                                        )}
                                      </div>
                                                                             <div className="flex items-center gap-2 text-sm text-gray-500">
                                         <MapPin className="w-3 h-3" />
                                         <span>{vendor.city || 'Location not specified'}</span>
                                         <Star className="w-3 h-3" />
                                         <span>{vendor.rating || 0}</span>
                                         <Users className="w-3 h-3" />
                                         <span>{vendor.reviews?.length || 0} reviews</span>
                                       </div>
                                       <div className="text-sm text-gray-600">
                                         Starting from ₹{(vendor.minimumPrice || vendor.price || 0).toLocaleString()}
                                       </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-400" />
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
                  <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{vendors.length}+ Vendors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>50+ Cities</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>4.5+ Avg Rating</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="venues" className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select>
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Venue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banquet">Banquet Halls</SelectItem>
                        <SelectItem value="hotels">Hotels</SelectItem>
                        <SelectItem value="resorts">Resorts</SelectItem>
                        <SelectItem value="gardens">Gardens</SelectItem>
                        <SelectItem value="palaces">Palaces</SelectItem>
                        <SelectItem value="beach">Beach Venues</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input type="text" placeholder="Enter your city" className="pl-10" />
                    </div>

                    <Button className="w-full md:w-auto" size="lg">
                      <Search className="w-4 h-4 mr-2" />
                      Search Venues
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {vendorCategories.slice(0, 6).map((category) => (
              <Button
                key={category.value}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => {
                  setActiveTab("vendors")
                  handleCategorySelect(category.value)
                }}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

