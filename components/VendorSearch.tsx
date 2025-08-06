"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
}

export default function VendorSearch({ vendorType }: VendorSearchProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVendors, setTotalVendors] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sortOption, setSortOption] = useState("default")

  const [filters, setFilters] = useState<Filters>({
    search: "",
    location: "",
    priceRange: [0, 1000000],
    rating: 0,
    capacity: 0,
    amenities: []
  })

  // Get vendor type from path
  const vendorTypeFromPath = getVendorTypeFromPath(vendorType);
  const displayName = getVendorTypeDisplayName(vendorTypeFromPath);
  const description = getVendorTypeDescription(vendorTypeFromPath);


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

    setFilteredVendors(filtered)
    setTotalPages(Math.ceil(filtered.length / 12))
    setCurrentPage(1)
  }

  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{displayName}</h1>
      <p className="text-gray-600 mb-8">{description}</p>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-1/4">
          <VendorFilters
            filters={filters}
            onFiltersChange={setFilters}
            vendorType={vendorTypeFromPath}
            showVendorTypeFilter={false}
          />
        </aside>

        {/* Right Side - Results */}
        <div className="flex-1">
          <section className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 w-full">
              <p className="text-gray-600 mb-2 sm:mb-0">
                {isLoading ? "Loading..." : `${filteredVendors.length} OF ${totalVendors} RESULTS`}
              </p>
              <div className="w-full sm:w-auto">
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">SORT BY: RELEVANCE</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className="col-span-full text-center py-8">
                  <p className="text-xl font-semibold">No results found</p>
                  <p className="text-gray-600 mt-2">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="m-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      className="m-1"
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
                  className="m-1"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

