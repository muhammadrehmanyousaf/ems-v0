"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Search, MapPin, Star, Users, Filter, SortAsc, SortDesc, Award, Heart, DollarSign, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import type { Vendor } from "@/lib/types"
import { VENDOR_TYPES, VENDOR_TYPE_DISPLAY_NAMES, VENDOR_TYPE_DESCRIPTIONS, getAllVendorPaths } from "@/lib/vendor-types"
import { useRouter } from "next/navigation"
import VendorCard from "@/components/VendorCard"
import { useVendors } from "@/hooks/use-vendors"

interface Filters {
  search: string
  category: string
  location: string
  priceRange: [number, number]
  rating: number
  capacity: number
  amenities: string[]
  sortBy: string
}

function SearchContent() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    category: "all",
    location: "",
    priceRange: [0, 1000000],
    rating: 0,
    capacity: 0,
    amenities: [],
    sortBy: "rating"
  })

  // Get search parameters from URL
  const query = searchParams?.get('q') || ""
  const category = searchParams?.get('category') || ""
  const location = searchParams?.get('location') || ""

  // Use React Query hook for vendors
  const { data: allVendors = [], isLoading, error } = useVendors()

  const vendorCategories = [
    { display: "All Categories", value: "all" },
    { display: "Photographers", value: "photographers" },
    { display: "Makeup Artists", value: "makeup-artists" },
    { display: "Decorators", value: "decor" },
    { display: "Caterers", value: "catering" },
    { display: "Wedding Venues", value: "venues" },
    { display: "Bridal Wear", value: "bridal-wear" },
    { display: "Car Rental", value: "car-rental" },
    { display: "Henna Artists", value: "henna-artists" }
  ]

  const amenities = [
    "Parking", "Catering", "Decoration", "Music", "Photography", 
    "Videography", "Makeup", "Transportation", "Accommodation", "WiFi",
    "Professional Equipment", "Album", "Video", "Flowers", "Lighting", 
    "Backdrop", "Bridal Makeup", "Hair Styling", "Touch-ups", "Bridal Packages"
  ]

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: query,
      category: category || "all",
      location: location
    }))
  }, [query, category, location])

  // Helper function to check if vendor matches category
  const vendorMatchesCategory = (vendor: Vendor, category: string): boolean => {
    if (category === "all") return true
    
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
      
      case 'decor':
        return vendorType === VENDOR_TYPES.DECORATOR || 
               vendorName.includes('decor') || 
               vendorName.includes('sajawat') || 
               vendorName.includes('event') || 
               vendorName.includes('styling') || 
               vendorName.includes('settings') || 
               vendorName.includes('decoration') || 
               vendorName.includes('floral') || 
               vendorName.includes('arrangement') || 
               vendorName.includes('design') || 
               vendorName.includes('theme')
      
      case 'catering':
        return vendorType === VENDOR_TYPES.CATERING || 
               vendorName.includes('catering') || 
               vendorName.includes('food') || 
               vendorName.includes('restaurant') || 
               vendorName.includes('kitchen') || 
               vendorName.includes('dining') || 
               vendorName.includes('cuisine') || 
               vendorName.includes('meal') || 
               vendorName.includes('banquet') || 
               vendorName.includes('caterer') || 
               vendorName.includes('chef')
      
      case 'venues':
        return vendorType === VENDOR_TYPES.WEDDING_VENUE || 
               vendorName.includes('venue') || 
               vendorName.includes('hall') || 
               vendorName.includes('resort') || 
               vendorName.includes('hotel') || 
               vendorName.includes('palace') || 
               vendorName.includes('garden') || 
               vendorName.includes('lawn') || 
               vendorName.includes('banquet') || 
               vendorName.includes('marriage') || 
               vendorName.includes('wedding')
      
      case 'bridal-wear':
        return vendorType === VENDOR_TYPES.BRIDAL_WEAR || 
               vendorName.includes('bridal') || 
               vendorName.includes('dress') || 
               vendorName.includes('suit') || 
               vendorName.includes('lehenga') || 
               vendorName.includes('saree') || 
               vendorName.includes('outfit') || 
               vendorName.includes('fashion') || 
               vendorName.includes('designer') || 
               vendorName.includes('boutique') || 
               vendorName.includes('clothing')
      
      case 'car-rental':
        return vendorType === VENDOR_TYPES.CAR_RENTAL || 
               vendorName.includes('car') || 
               vendorName.includes('vehicle') || 
               vendorName.includes('transport') || 
               vendorName.includes('rental') || 
               vendorName.includes('limousine') || 
               vendorName.includes('luxury') || 
               vendorName.includes('fleet') || 
               vendorName.includes('cab') || 
               vendorName.includes('taxi') || 
               vendorName.includes('auto')
      
      case 'henna-artists':
        return vendorType === VENDOR_TYPES.HENNA_ARTIST || 
               vendorName.includes('henna') || 
               vendorName.includes('mehendi') || 
               vendorName.includes('artist') || 
               vendorName.includes('design') || 
               vendorName.includes('tattoo') || 
               vendorName.includes('body art') || 
               vendorName.includes('traditional') || 
               vendorName.includes('bridal') || 
               vendorName.includes('decoration') || 
               vendorName.includes('artwork')
      
      default:
        return true
    }
  }

  // Apply filters using useMemo for better performance
  const filteredVendors = useMemo(() => {
    let filtered = [...allVendors]

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
      filtered = filtered.filter(vendor => {
        const nameMatch = vendor.name?.toLowerCase().includes(searchTerm)
        const locationMatch = vendor.location?.toLowerCase().includes(searchTerm)
        const cityMatch = vendor.city?.toLowerCase().includes(searchTerm)
        const typeMatch = vendor.type?.toLowerCase().includes(searchTerm)
        const subTypeMatch = vendor.subBusinessType?.toLowerCase().includes(searchTerm)
        
        return nameMatch || locationMatch || cityMatch || typeMatch || subTypeMatch
      })
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(vendor => vendorMatchesCategory(vendor, filters.category))
    }

    // Location filter
    if (filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase().trim()
      filtered = filtered.filter(vendor => {
        const locationMatch = vendor.location?.toLowerCase().includes(locationTerm)
        const cityMatch = vendor.city?.toLowerCase().includes(locationTerm)
        return locationMatch || cityMatch
      })
    }

    // Price range filter
    filtered = filtered.filter(vendor => {
      const price = Number(vendor.minimumPrice || vendor.price || 0)
      const minPrice = filters.priceRange[0]
      const maxPrice = filters.priceRange[1]
      return price >= minPrice && price <= maxPrice
    })

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(vendor => {
        const rating = Number(vendor.rating || 0)
        return rating >= filters.rating
      })
    }

    // Capacity filter
    if (filters.capacity > 0) {
      filtered = filtered.filter(vendor => {
        const capacity = Number(vendor.capacity || 0)
        return capacity >= filters.capacity
      })
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(vendor => {
        if (!vendor.amenities || vendor.amenities.length === 0) return false
        
        return filters.amenities.some(filterAmenity => {
          return vendor.amenities.some(vendorAmenity => 
            vendorAmenity.toLowerCase().includes(filterAmenity.toLowerCase())
          )
        })
      })
    }

    // Sort
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => {
          const priceA = Number(a.minimumPrice || a.price || 0)
          const priceB = Number(b.minimumPrice || b.price || 0)
          return priceA - priceB
        })
        break
      case "price-high":
        filtered.sort((a, b) => {
          const priceA = Number(a.minimumPrice || a.price || 0)
          const priceB = Number(b.minimumPrice || b.price || 0)
          return priceB - priceA
        })
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "recent":
        filtered.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        break
      default: // rating
        filtered.sort((a, b) => {
          const ratingA = Number(a.rating || 0)
          const ratingB = Number(b.rating || 0)
          return ratingB - ratingA
        })
        break
    }

    return filtered
  }, [allVendors, filters])

  // Calculate pagination
  const totalPages = Math.ceil(filteredVendors.length / 12)
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      location: "",
      priceRange: [0, 1000000],
      rating: 0,
      capacity: 0,
      amenities: [],
      sortBy: "rating"
    })
  }

  const getVendorSlug = (vendor: Vendor): string => {
    // Use the same logic as in hero-section.tsx
    const getVendorTypeToPath = (vendorType: string): string => {
      const typeToPathMap: { [key: string]: string } = {
        'Photographer': 'photographers',
        'Makeup Artist': 'makeup-artists',
        'Decorator': 'decor',
        'Caterer': 'catering',
        'Venue': 'venues',
        'Bridal Wear': 'bridal-wear',
        'Car Rental': 'car-rental',
        'Henna Artist': 'henna-artists'
      }

      // Exact match
      if (typeToPathMap[vendorType]) {
        return typeToPathMap[vendorType]
      }

      // Case-insensitive match
      const lowerType = vendorType.toLowerCase()
      for (const [type, path] of Object.entries(typeToPathMap)) {
        if (type.toLowerCase() === lowerType) {
          return path
        }
      }

      // Partial match
      for (const [type, path] of Object.entries(typeToPathMap)) {
        if (lowerType.includes(type.toLowerCase()) || type.toLowerCase().includes(lowerType)) {
          return path
        }
      }

      // Name-based fallback
      const vendorName = vendor.name?.toLowerCase() || ''
      if (vendorName.includes('photography') || vendorName.includes('camera') || vendorName.includes('studio')) {
        return 'photographers'
      }
      if (vendorName.includes('makeup') || vendorName.includes('beauty')) {
        return 'makeup-artists'
      }
      if (vendorName.includes('decor') || vendorName.includes('decoration')) {
        return 'decor'
      }
      if (vendorName.includes('catering') || vendorName.includes('food')) {
        return 'catering'
      }
      if (vendorName.includes('venue') || vendorName.includes('hall')) {
        return 'venues'
      }
      if (vendorName.includes('bridal') || vendorName.includes('dress')) {
        return 'bridal-wear'
      }
      if (vendorName.includes('car') || vendorName.includes('rental')) {
        return 'car-rental'
      }
      if (vendorName.includes('henna') || vendorName.includes('mehendi')) {
        return 'henna-artists'
      }

      return 'vendors' // fallback
    }

    const categoryPath = getVendorTypeToPath(vendor.type || '')
    return `/${categoryPath}/${vendor.id}`
  }

  const handleVendorClick = (vendor: Vendor) => {
    const slug = getVendorSlug(vendor)
    router.push(slug)
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">Error loading vendors</h3>
          <p className="text-neutral-600 mb-4">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30">
      {/* Header Section */}
      <div className="bg-white border-b border-neutral-100 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Search Results</h1>
            <p className="text-lg text-neutral-600">
              {filteredVendors.length} vendors found
              {filters.search && ` for "${filters.search}"`}
              {filters.category !== "all" && ` in ${vendorCategories.find(c => c.value === filters.category)?.display}`}
              {filters.location && ` in ${filters.location}`}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sticky Filters Sidebar */}
          <div className="lg:w-80">
            <div className="sticky top-20 max-h-[calc(100vh-4rem)] overflow-hidden">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-4 border-b border-neutral-100 bg-gradient-to-r from-purple-50 to-purple-50/80">
                  <CardTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-purple-500" />
                    Filters
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Clear all filters
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-4 space-y-6 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-purple-400 scrollbar-thumb-rounded-full">
                    {/* Search */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Search className="w-4 h-4 text-purple-500" />
                        Search
                      </label>
                      <Input
                        placeholder="Search vendors..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        Category
                      </label>
                      <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value} className="hover:bg-purple-50">
                              {category.display}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        Location
                      </label>
                      <Input
                        placeholder="Enter city..."
                        value={filters.location}
                        onChange={(e) => handleFilterChange("location", e.target.value)}
                        className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200"
                      />
                    </div>

                    {/* Price Range */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-500" />
                        Price Range
                      </label>
                      <div className="px-2">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => handleFilterChange("priceRange", value)}
                          max={1000000}
                          step={10000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-3">
                          <span className="font-medium">Rs. {filters.priceRange[0].toLocaleString()}</span>
                          <span className="font-medium">Rs. {filters.priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Star className="w-4 h-4 text-purple-500" />
                        Minimum Rating
                      </label>
                      <Select value={filters.rating.toString()} onValueChange={(value) => handleFilterChange("rating", parseInt(value))}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200">
                          <SelectValue placeholder="Any rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="hover:bg-purple-50">Any rating</SelectItem>
                          <SelectItem value="3" className="hover:bg-purple-50">3+ stars</SelectItem>
                          <SelectItem value="4" className="hover:bg-purple-50">4+ stars</SelectItem>
                          <SelectItem value="4.5" className="hover:bg-purple-50">4.5+ stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Capacity */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        Minimum Capacity
                      </label>
                      <Select value={filters.capacity.toString()} onValueChange={(value) => handleFilterChange("capacity", parseInt(value))}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200">
                          <SelectValue placeholder="Any capacity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="hover:bg-purple-50">Any capacity</SelectItem>
                          <SelectItem value="50" className="hover:bg-purple-50">50+ guests</SelectItem>
                          <SelectItem value="100" className="hover:bg-purple-50">100+ guests</SelectItem>
                          <SelectItem value="200" className="hover:bg-purple-50">200+ guests</SelectItem>
                          <SelectItem value="500" className="hover:bg-purple-50">500+ guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Sort By */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <SortAsc className="w-4 h-4 text-purple-500" />
                        Sort By
                      </label>
                      <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 rounded-lg transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating" className="hover:bg-purple-50">Highest Rated</SelectItem>
                          <SelectItem value="price-low" className="hover:bg-purple-50">Price: Low to High</SelectItem>
                          <SelectItem value="price-high" className="hover:bg-purple-50">Price: High to Low</SelectItem>
                          <SelectItem value="name" className="hover:bg-purple-50">Name: A to Z</SelectItem>
                          <SelectItem value="recent" className="hover:bg-purple-50">Most Recent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Amenities */}
                    <div>
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-4">
                        <Heart className="w-4 h-4 text-purple-500" />
                        Amenities
                      </label>
                      <div className="grid grid-cols-1 gap-3">
                        {amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-3">
                            <Checkbox
                              id={amenity}
                              checked={filters.amenities.includes(amenity)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleFilterChange("amenities", [...filters.amenities, amenity])
                                } else {
                                  handleFilterChange("amenities", filters.amenities.filter(a => a !== amenity))
                                }
                              }}
                              className="text-purple-600 border-neutral-300 hover:border-purple-500 transition-colors duration-200"
                            />
                            <label htmlFor={amenity} className="text-sm text-neutral-600 cursor-pointer hover:text-neutral-800 transition-colors duration-200">{amenity}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-neutral-100 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-semibold text-neutral-700">
                    {isLoading ? "Loading..." : `${filteredVendors.length} of ${allVendors.length} results`}
                  </span>
                </div>
                {(filters.search || filters.category !== "all" || filters.location || filters.rating > 0 || filters.capacity > 0 || filters.amenities.length > 0) && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                    Filtered
                  </Badge>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(filters.search || filters.category !== "all" || filters.location || filters.rating > 0 || filters.capacity > 0 || filters.amenities.length > 0) && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-semibold text-neutral-700">Active filters:</span>
                  {filters.search && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Search: {filters.search}
                    </Badge>
                  )}
                  {filters.category && filters.category !== "all" && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Category: {vendorCategories.find(c => c.value === filters.category)?.display}
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Location: {filters.location}
                    </Badge>
                  )}
                  {filters.rating > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Rating: {filters.rating}+ stars
                    </Badge>
                  )}
                  {filters.capacity > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      Capacity: {filters.capacity}+ guests
                    </Badge>
                  )}
                  {filters.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                    <div className="bg-white p-4 rounded-b-lg">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">No vendors found</h3>
                  <p className="text-neutral-600 mb-6">Try adjusting your search criteria or filters</p>
                  <Button onClick={clearFilters} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
                    Clear all filters
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Vendors Grid with VendorCards */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedVendors.map((vendor) => (
                    <VendorCard
                      key={vendor.id}
                      id={vendor.id}
                      name={vendor.name}
                      image={vendor.images?.[0] || "/placeholder.svg"}
                      location={vendor.location || vendor.city}
                      rating={vendor.rating}
                      reviews={Array.isArray(vendor.reviews) ? vendor.reviews.length : 0}
                      price={vendor.minimumPrice || vendor.price}
                      type={vendor.type || vendor.subBusinessType}
                      capacity={vendor.capacity}
                      amenities={vendor.amenities}
                      sponsored={vendor.sponsored}
                    />
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-neutral-200 hover:border-purple-500 hover:text-purple-600 transition-all duration-200"
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className={`${currentPage === page ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800' : 'border-neutral-200 hover:border-purple-500 hover:text-purple-600'} transition-all duration-200`}
                          >
                            {page}
                          </Button>
                        )
                      })}
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="border-neutral-200 hover:border-purple-500 hover:text-purple-600 transition-all duration-200"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-purple-50/30 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          <span className="text-neutral-600">Loading search page...</span>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
