"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Search, MapPin, Star, Users, Filter, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { VendorAPI } from "@/lib/api/vendors"
import type { Vendor } from "@/lib/types"
import { VENDOR_TYPES, VENDOR_TYPE_DISPLAY_NAMES, VENDOR_TYPE_DESCRIPTIONS, getAllVendorPaths } from "@/lib/vendor-types"
import { useRouter } from "next/navigation"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [priceRange, setPriceRange] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Get search parameters from URL
  const query = searchParams.get('q') || ""
  const category = searchParams.get('category') || ""
  const location = searchParams.get('location') || ""

  useEffect(() => {
    setSearchQuery(query)
    setSelectedCategory(category || "all")
    setSelectedLocation(location)
    loadVendors()
  }, [query, category, location])

  const loadVendors = async () => {
    try {
      setIsLoading(true)
      const allVendors = await VendorAPI.getAllBusinesses()
      setVendors(allVendors)
      filterAndSortVendors(allVendors)
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

  const filterAndSortVendors = (vendorList: Vendor[]) => {
    let filtered = [...vendorList]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(vendor => {
        const vendorName = vendor.name?.toLowerCase() || ''
        const vendorDescription = vendor.description?.toLowerCase() || ''
        const query = searchQuery.toLowerCase()
        
        return vendorName.includes(query) || vendorDescription.includes(query)
      })
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(vendor => vendorMatchesCategory(vendor, selectedCategory))
    }

    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter(vendor => {
        const vendorCity = vendor.city?.toLowerCase() || ''
        const vendorLocation = vendor.location?.toLowerCase() || ''
        const searchLocation = selectedLocation.toLowerCase()
        
        return vendorCity.includes(searchLocation) || vendorLocation.includes(searchLocation)
      })
    }

    // Filter by price range
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number)
      filtered = filtered.filter(vendor => {
        const price = vendor.minimumPrice || vendor.price
        if (max) {
          return price >= min && price <= max
        } else {
          return price >= min
        }
      })
    }

    // Sort vendors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating
        case "price-low":
          return (a.minimumPrice || a.price) - (b.minimumPrice || b.price)
        case "price-high":
          return (b.minimumPrice || b.price) - (a.minimumPrice || a.price)
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    console.log(`🔍 Search filtering: Category=${selectedCategory}, Location=${selectedLocation}, Query=${searchQuery}`)
    console.log(`📊 Found ${filtered.length} vendors after filtering`)
    setFilteredVendors(filtered)
  }

  useEffect(() => {
    filterAndSortVendors(vendors)
  }, [vendors, searchQuery, selectedCategory, selectedLocation, sortBy, priceRange])

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

  const handleVendorClick = (vendor: Vendor) => {
    console.log(`🚀 Vendor clicked:`, vendor)
    console.log(`📝 Vendor type: "${vendor.type}"`)
    console.log(`🆔 Vendor ID: ${vendor.id}`)
    
    // Navigate to vendor detail page with proper vendor type slug
    const vendorSlug = getVendorSlug(vendor)
    const finalUrl = `/${vendorSlug}/${vendor.id}`
    console.log(`🌐 Navigating to: ${finalUrl}`)
    router.push(finalUrl)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedLocation("")
    setPriceRange("all")
    setSortBy("rating")
  }

  const vendorCategories = [
    "Photographers", "Makeup Artists", "Decorators", "Caterers", 
    "Wedding Venues", "Bridal Wear", "Car Rental", "Henna Artists"
  ]

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-10000", label: "Under ₹10,000" },
    { value: "10000-50000", label: "₹10,000 - ₹50,000" },
    { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
    { value: "100000-", label: "Above ₹1,00,000" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Search Results</h1>
              <p className="text-gray-600">
                {filteredVendors.length} vendors found
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCategory && ` in ${selectedCategory}`}
                {selectedLocation && ` in ${selectedLocation}`}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {vendorCategories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Input
                    placeholder="Enter city..."
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                  />
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span>Loading vendors...</span>
                </div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={clearFilters}>Clear all filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map((vendor) => (
                  <Card 
                    key={vendor.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleVendorClick(vendor)}
                  >
                    <CardHeader className="p-0">
                      <div className="relative aspect-[4/3]">
                        <img
                          src={vendor.images[0] || "/placeholder.jpg"}
                          alt={vendor.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        {vendor.sponsored && (
                          <Badge className="absolute top-2 right-2 bg-primary">
                            Sponsored
                          </Badge>
                        )}
                                                 <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                           ₹{(vendor.minimumPrice || vendor.price || 0).toLocaleString()}
                         </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg line-clamp-1">{vendor.name}</h3>
                      </div>
                      
                                             <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                         <MapPin className="w-4 h-4" />
                         <span>{vendor.city || 'Location not specified'}</span>
                       </div>

                       <div className="flex items-center gap-4 text-sm mb-3">
                         <div className="flex items-center gap-1">
                           <Star className="w-4 h-4 text-yellow-500 fill-current" />
                           <span>{vendor.rating || 0}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Users className="w-4 h-4" />
                           <span>{vendor.reviews?.length || 0} reviews</span>
                         </div>
                       </div>

                                             <div className="flex items-center justify-between">
                         <Badge variant="secondary" className="text-xs">
                           {vendor.type || 'Vendor'}
                         </Badge>
                        <Button size="sm" className="text-xs">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

