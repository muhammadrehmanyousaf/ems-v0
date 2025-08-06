"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, MapPin, Star, Users, Calendar } from "lucide-react"
import VendorCard from "@/components/VendorCard"
import { VendorAPI } from "@/lib/api/vendors"
import { getAllVendorTypes, getVendorTypeDisplayName } from "@/lib/vendor-types"
import type { Vendor } from "@/lib/types"

interface Filters {
  search: string
  vendorType: string
  location: string
  priceRange: [number, number]
  rating: number
  capacity: number
  amenities: string[]
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVendors, setTotalVendors] = useState(0)
  const [sortOption, setSortOption] = useState("default")

  const [filters, setFilters] = useState<Filters>({
    search: "",
    vendorType: "all",
    location: "",
    priceRange: [0, 1000000],
    rating: 0,
    capacity: 0,
    amenities: []
  })

  const vendorTypes = getAllVendorTypes()
  const amenities = [
    "Parking", "Catering", "Decoration", "Music", "Photography", 
    "Videography", "Makeup", "Transportation", "Accommodation", "WiFi",
    "Professional Equipment", "Album", "Video", "Flowers", "Lighting", 
    "Backdrop", "Bridal Makeup", "Hair Styling", "Touch-ups", "Bridal Packages"
  ]

  useEffect(() => {
    fetchAllVendors()
  }, [currentPage])

  const fetchAllVendors = async () => {
    try {
      setIsLoading(true)
      const allVendors = await VendorAPI.getAllBusinesses()
      setVendors(allVendors)
      setTotalVendors(allVendors.length)
      setTotalPages(Math.ceil(allVendors.length / 12))
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    applyFilters()
  }, [vendors, filters, sortOption])

  const applyFilters = () => {
    let filtered = [...vendors]
    console.log('🔍 Applying filters:', filters)
    console.log('📊 Total vendors before filtering:', filtered.length)

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
      console.log('🔍 After search filter:', filtered.length, 'vendors')
    }

    // Vendor type filter
    if (filters.vendorType && filters.vendorType !== "all") {
      filtered = filtered.filter(vendor => {
        const typeMatch = vendor.type === filters.vendorType
        const subTypeMatch = vendor.subBusinessType === filters.vendorType
        return typeMatch || subTypeMatch
      })
      console.log('🏷️ After vendor type filter:', filtered.length, 'vendors')
    }

    // Location filter
    if (filters.location.trim()) {
      const locationTerm = filters.location.toLowerCase().trim()
      filtered = filtered.filter(vendor => {
        const locationMatch = vendor.location?.toLowerCase().includes(locationTerm)
        const cityMatch = vendor.city?.toLowerCase().includes(locationTerm)
        return locationMatch || cityMatch
      })
      console.log('📍 After location filter:', filtered.length, 'vendors')
    }

    // Price range filter
    filtered = filtered.filter(vendor => {
      const price = Number(vendor.minimumPrice || vendor.price || 0)
      const minPrice = filters.priceRange[0]
      const maxPrice = filters.priceRange[1]
      return price >= minPrice && price <= maxPrice
    })
    console.log('💰 After price filter:', filtered.length, 'vendors')

    // Rating filter
    if (filters.rating > 0) {
      filtered = filtered.filter(vendor => {
        const rating = Number(vendor.rating || 0)
        return rating >= filters.rating
      })
      console.log('⭐ After rating filter:', filtered.length, 'vendors')
    }

    // Capacity filter
    if (filters.capacity > 0) {
      filtered = filtered.filter(vendor => {
        const capacity = Number(vendor.capacity || 0)
        return capacity >= filters.capacity
      })
      console.log('👥 After capacity filter:', filtered.length, 'vendors')
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
      console.log('🏠 After amenities filter:', filtered.length, 'vendors')
    }

    // Sort
    switch (sortOption) {
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
      case "rating":
        filtered.sort((a, b) => {
          const ratingA = Number(a.rating || 0)
          const ratingB = Number(b.rating || 0)
          return ratingB - ratingA
        })
        break
      case "alphabetical":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        // Keep default order
        break
    }

    console.log('📊 Final filtered results:', filtered.length, 'vendors')
    setFilteredVendors(filtered)
    setTotalPages(Math.ceil(filtered.length / 12))
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      vendorType: "all",
      location: "",
      priceRange: [0, 1000000],
      rating: 0,
      capacity: 0,
      amenities: []
    })
    setSortOption("default")
  }

  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">All Wedding Vendors</h1>
          <p className="text-gray-600">Discover the best wedding vendors for your special day</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search vendors, locations..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-4">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Vendor Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Vendor Type</label>
                                         <Select value={filters.vendorType} onValueChange={(value) => handleFilterChange("vendorType", value)}>
                       <SelectTrigger>
                         <SelectValue placeholder="All types" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All types</SelectItem>
                         {vendorTypes.map((type) => (
                           <SelectItem key={type} value={type}>
                             {getVendorTypeDisplayName(type)}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <Input
                      placeholder="Enter location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange("location", e.target.value)}
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price Range</label>
                    <div className="space-y-2">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={(value) => handleFilterChange("priceRange", value)}
                        max={1000000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>PKR {filters.priceRange[0].toLocaleString()}</span>
                        <span>PKR {filters.priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                                     {/* Rating */}
                   <div>
                     <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                     <Select value={filters.rating.toString()} onValueChange={(value) => handleFilterChange("rating", parseInt(value))}>
                       <SelectTrigger>
                         <SelectValue placeholder="Any rating" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="0">Any rating</SelectItem>
                         <SelectItem value="3">3+ stars</SelectItem>
                         <SelectItem value="4">4+ stars</SelectItem>
                         <SelectItem value="4.5">4.5+ stars</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Capacity */}
                   <div>
                     <label className="text-sm font-medium mb-2 block">Minimum Capacity</label>
                     <Select value={filters.capacity.toString()} onValueChange={(value) => handleFilterChange("capacity", parseInt(value))}>
                       <SelectTrigger>
                         <SelectValue placeholder="Any capacity" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="0">Any capacity</SelectItem>
                         <SelectItem value="50">50+ guests</SelectItem>
                         <SelectItem value="100">100+ guests</SelectItem>
                         <SelectItem value="200">200+ guests</SelectItem>
                         <SelectItem value="500">500+ guests</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                {/* Amenities */}
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
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
                        />
                        <label htmlFor={amenity} className="text-sm">{amenity}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

                     {/* Active Filters Display */}
           {(filters.search || filters.vendorType || filters.location || filters.rating > 0 || filters.capacity > 0 || filters.amenities.length > 0) && (
             <div className="mb-4">
               <div className="flex flex-wrap gap-2 items-center">
                 <span className="text-sm font-medium text-gray-600">Active filters:</span>
                 {filters.search && (
                   <Badge variant="secondary" className="text-xs">
                     Search: {filters.search}
                   </Badge>
                 )}
                                   {filters.vendorType && filters.vendorType !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Type: {getVendorTypeDisplayName(filters.vendorType)}
                    </Badge>
                  )}
                 {filters.location && (
                   <Badge variant="secondary" className="text-xs">
                     Location: {filters.location}
                   </Badge>
                 )}
                 {filters.rating > 0 && (
                   <Badge variant="secondary" className="text-xs">
                     Rating: {filters.rating}+ stars
                   </Badge>
                 )}
                 {filters.capacity > 0 && (
                   <Badge variant="secondary" className="text-xs">
                     Capacity: {filters.capacity}+ guests
                   </Badge>
                 )}
                 {filters.amenities.map((amenity) => (
                   <Badge key={amenity} variant="secondary" className="text-xs">
                     {amenity}
                   </Badge>
                 ))}
               </div>
             </div>
           )}

           {/* Results and Sort */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <p className="text-gray-600">
               {isLoading ? "Loading..." : `${filteredVendors.length} OF ${totalVendors} RESULTS`}
             </p>
             <div className="flex items-center gap-2">
               <span className="text-sm text-gray-600">Sort by:</span>
               <Select value={sortOption} onValueChange={setSortOption}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="default">Relevance</SelectItem>
                   <SelectItem value="price-low">Price: Low to High</SelectItem>
                   <SelectItem value="price-high">Price: High to Low</SelectItem>
                   <SelectItem value="rating">Rating</SelectItem>
                   <SelectItem value="alphabetical">Alphabetical</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
        </div>

        {/* Vendors Grid */}
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
        ) : filteredVendors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedVendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.name}
                  image={vendor.images?.[0] || "/placeholder.svg"}
                  location={vendor.location || vendor.city}
                  rating={vendor.rating}
                  reviews={vendor.reviews?.length || 0}
                  price={vendor.minimumPrice || vendor.price}
                  type={vendor.subBusinessType || vendor.type}
                  capacity={vendor.capacity}
                  amenities={vendor.amenities}
                  sponsored={vendor.sponsored}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </div>
        )}
      </div>
    </div>
  )
} 