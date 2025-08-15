"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Search, MapPin, Star, Users, Calendar, Filter, X, Award, Heart, Clock, DollarSign } from "lucide-react"
import VendorCard from "./VendorCard"
import VendorFilters from "./VendorFilters"
import type { Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { getVendorTypeFromPath, getVendorTypeDisplayName, getVendorTypeDescription } from "@/lib/vendor-types"

interface VendorSearchProps {
  vendorType: string
  title?: string
  description?: string
}

interface Filters {
  search: string
  location: string
  priceRange: [number, number]
  rating: number
  capacity: number
  amenities: string[]
  availability: string[]
  experience: string[]
  services: string[]
  budget: string
  sortBy: string
}

export default function VendorSearch({ vendorType }: VendorSearchProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVendors, setTotalVendors] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sortOption, setSortOption] = useState("default")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const [filters, setFilters] = useState<Filters>({
    search: "",
    location: "",
    priceRange: [0, 1000000],
    rating: 0,
    capacity: 0,
    amenities: [],
    availability: [],
    experience: [],
    services: [],
    budget: "",
    sortBy: "default"
  })

  // Get vendor type from path
  const vendorTypeFromPath = getVendorTypeFromPath(vendorType);
  const displayName = getVendorTypeDisplayName(vendorTypeFromPath);
  const description = getVendorTypeDescription(vendorTypeFromPath);

  // Enhanced filter options
  const availabilityOptions = [
    { value: "immediate", label: "Immediate Availability" },
    { value: "within-week", label: "Within a Week" },
    { value: "within-month", label: "Within a Month" },
    { value: "flexible", label: "Flexible Dates" }
  ]

  const experienceOptions = [
    { value: "1-3", label: "1-3 Years" },
    { value: "3-5", label: "3-5 Years" },
    { value: "5-10", label: "5-10 Years" },
    { value: "10+", label: "10+ Years" }
  ]

  const servicesOptions = [
    { value: "full-service", label: "Full Service" },
    { value: "partial", label: "Partial Service" },
    { value: "consultation", label: "Consultation" },
    { value: "custom", label: "Custom Packages" }
  ]

  const budgetOptions = [
    { value: "budget", label: "Budget Friendly" },
    { value: "mid-range", label: "Mid Range" },
    { value: "premium", label: "Premium" },
    { value: "luxury", label: "Luxury" }
  ]

  const fetchVendorsbyType = async () => {
    setIsLoading(true)
    try {
      const vendorsData = await VendorAPI.getBusinessesByVendorType(vendorTypeFromPath);
      setVendors(vendorsData);
      setTotalVendors(vendorsData.length);
      setIsLoading(false)
    } catch (error) {
      console.log('error', error);
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchVendorsbyType();
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vendors, filters, sortOption])

  const applyFilters = () => {
    let filtered = [...vendors]

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

    // Budget filter
    if (filters.budget) {
      filtered = filtered.filter(vendor => {
        const price = Number(vendor.minimumPrice || vendor.price || 0)
        switch (filters.budget) {
          case "budget":
            return price <= 50000
          case "mid-range":
            return price > 50000 && price <= 200000
          case "premium":
            return price > 200000 && price <= 500000
          case "luxury":
            return price > 500000
          default:
            return true
        }
      })
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
      case "recent":
        filtered.sort((a, b) => {
          // Sort by ID as a fallback since createdAt doesn't exist
          return Number(b.id || 0) - Number(a.id || 0)
        })
        break
      default:
        // Keep default order
        break
    }

    setFilteredVendors(filtered)
    setTotalPages(Math.ceil(filtered.length / 12))
    setCurrentPage(1)
  }

  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  const clearAllFilters = () => {
    setFilters({
      search: "",
      location: "",
      priceRange: [0, 1000000],
      rating: 0,
      capacity: 0,
      amenities: [],
      availability: [],
      experience: [],
      services: [],
      budget: "",
      sortBy: "default"
    })
    setSortOption("default")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-rose-50">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-2 sm:mb-3">{displayName}</h1>
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-3xl mx-auto px-2">{description}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sticky Left Sidebar - Filters */}
          <aside className="w-full lg:w-1/4">
            <div className="sticky top-20">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm max-h-[calc(100vh-4rem)] overflow-hidden">
                <CardHeader className="pb-3 sm:pb-4 border-b border-neutral-100 bg-gradient-to-r from-rose-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg sm:text-xl font-bold text-neutral-900 flex items-center gap-2">
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
                      Filters
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all duration-200"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-rose-300 scrollbar-track-neutral-100 hover:scrollbar-thumb-rose-400 scrollbar-thumb-rounded-full">
                    {/* Search */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-xs sm:text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Search className="w-3 h-3 sm:w-4 sm:h-4 text-rose-500" />
                        Search Vendors
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-3 h-3 sm:w-4 sm:h-4" />
                        <Input
                          placeholder="Search by name, location..."
                          value={filters.search}
                          onChange={(e) => setFilters({...filters, search: e.target.value})}
                          className="pl-8 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg transition-all duration-200"
                        />
                      </div>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Location */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <Input
                          placeholder="Enter city or area..."
                          value={filters.location}
                          onChange={(e) => setFilters({...filters, location: e.target.value})}
                          className="pl-10 h-11 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg transition-all duration-200"
                        />
                      </div>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Price Range */}
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-rose-500" />
                        Price Range
                      </label>
                      <div className="px-2">
                        <Slider
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters({...filters, priceRange: value as [number, number]})}
                          max={1000000}
                          step={10000}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-neutral-500 mt-3">
                          <span className="font-medium">₹{filters.priceRange[0].toLocaleString()}</span>
                          <span className="font-medium">₹{filters.priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Rating */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Star className="w-4 h-4 text-rose-500" />
                        Minimum Rating
                      </label>
                      <Select value={filters.rating.toString()} onValueChange={(value) => setFilters({...filters, rating: Number(value)})}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg transition-all duration-200">
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0" className="hover:bg-rose-50">Any Rating</SelectItem>
                          <SelectItem value="3" className="hover:bg-rose-50">3+ Stars</SelectItem>
                          <SelectItem value="4" className="hover:bg-rose-50">4+ Stars</SelectItem>
                          <SelectItem value="4.5" className="hover:bg-rose-50">4.5+ Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Budget */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-rose-500" />
                        Budget Category
                      </label>
                      <Select value={filters.budget} onValueChange={(value) => setFilters({...filters, budget: value})}>
                        <SelectTrigger className="h-11 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 rounded-lg transition-all duration-200">
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="hover:bg-rose-50">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Availability */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-rose-500" />
                        Availability
                      </label>
                      <div className="space-y-3">
                        {availabilityOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3">
                            <Checkbox
                              id={option.value}
                              checked={filters.availability.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({...filters, availability: [...filters.availability, option.value]})
                                } else {
                                  setFilters({...filters, availability: filters.availability.filter(item => item !== option.value)})
                                }
                              }}
                              className="text-rose-600 border-neutral-300 hover:border-rose-500 transition-colors duration-200"
                            />
                            <label htmlFor={option.value} className="text-sm text-neutral-600 cursor-pointer hover:text-neutral-800 transition-colors duration-200">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Experience */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Award className="w-4 h-4 text-rose-500" />
                        Experience Level
                      </label>
                      <div className="space-y-3">
                        {experienceOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3">
                            <Checkbox
                              id={option.value}
                              checked={filters.experience.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({...filters, experience: [...filters.experience, option.value]})
                                } else {
                                  setFilters({...filters, experience: filters.experience.filter(item => item !== option.value)})
                                }
                              }}
                              className="text-rose-600 border-neutral-300 hover:border-rose-500 transition-colors duration-200"
                            />
                            <label htmlFor={option.value} className="text-sm text-neutral-600 cursor-pointer hover:text-neutral-800 transition-colors duration-200">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-neutral-200" />

                    {/* Services */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        Service Type
                      </label>
                      <div className="space-y-3">
                        {servicesOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3">
                            <Checkbox
                              id={option.value}
                              checked={filters.services.includes(option.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters({...filters, services: [...filters.services, option.value]})
                                } else {
                                  setFilters({...filters, services: filters.services.filter(item => item !== option.value)})
                                }
                              }}
                              className="text-rose-600 border-neutral-300 hover:border-rose-500 transition-colors duration-200"
                            />
                            <label htmlFor={option.value} className="text-sm text-neutral-600 cursor-pointer hover:text-neutral-800 transition-colors duration-200">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Right Side - Results */}
          <div className="flex-1">
            <section className="w-full">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 p-4 bg-white rounded-xl shadow-sm border border-neutral-100">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-semibold text-neutral-700">
                      {isLoading ? "Loading..." : `${filteredVendors.length} of ${totalVendors} results`}
                    </span>
                  </div>
                  {filters.search || filters.location || filters.rating > 0 ? (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-0">
                      Filtered
                    </Badge>
                  ) : null}
                </div>
                
                <div className="flex items-center gap-3">
                  <Select value={sortOption} onValueChange={setSortOption}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10 border-neutral-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Sort by: Relevance</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                             {/* Results Grid */}
               <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : filteredVendors.length > 0 ? (
                  paginatedVendors.map((vendor) => (
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
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="max-w-md mx-auto">
                      <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">No results found</h3>
                      <p className="text-neutral-600 mb-6">Try adjusting your filters or search terms</p>
                      <Button onClick={clearAllFilters} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="m-1 border-neutral-200 hover:border-rose-500 hover:text-rose-600"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        className={`m-1 ${currentPage === page ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700' : 'border-neutral-200 hover:border-rose-500 hover:text-rose-600'}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="m-1 border-neutral-200 hover:border-rose-500 hover:text-rose-600"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

