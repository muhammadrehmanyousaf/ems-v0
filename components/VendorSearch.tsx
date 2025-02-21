"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import VendorCard from "./VendorCard"
import FilterContent from "./FilterContent"
import { vendors as allVendors } from "@/lib/data"
import type { Vendor, Filters, SortOption, StaffOption } from "@/lib/types"

interface VendorSearchProps {
  vendorType: string
  title: string
  description: string
  vendors: any[];
}

export default function VendorSearch({ vendorType, title, description }: VendorSearchProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVendors, setTotalVendors] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    city: "All Cities",
    subArea: "",
    minPrice: "",
    maxPrice: "",
    type: "All Types",
    capacity: "",
    amenities: [],
    cancellationPolicy: "All Policies",
    staff: [],
  })
  const [sortOption, setSortOption] = useState<SortOption>("default")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVendors()
  }, [filters, sortOption, currentPage])

  function fetchVendors() {
    setIsLoading(true)
    const filteredVendors = allVendors[vendorType as keyof typeof allVendors] || []

    // Apply filters
    const filteredAndSortedVendors = filteredVendors
      .filter((vendor) => {
        return (
          (filters.city === "All Cities" || vendor.location === filters.city) &&
          (filters.type === "All Types" || vendor.type === filters.type) &&
          (filters.cancellationPolicy === "All Policies" || vendor.cancellationPolicy === filters.cancellationPolicy) &&
          (filters.amenities.length === 0 || filters.amenities.every((amenity) => vendor.amenities.includes(amenity))) &&
          (filters.staff.length === 0 || filters.staff.every((staff) => vendor.staff.includes(staff))) &&
          (filters.minPrice === "" || vendor.price >= Number(filters.minPrice)) &&
          (filters.maxPrice === "" || vendor.price <= Number(filters.maxPrice)) &&
          (filters.capacity === "" || (vendor.capacity ?? 0) >= Number(filters.capacity))
        )
      })
      .sort((a, b) => {
        switch (sortOption) {
          case "price-low":
            return a.price - b.price
          case "price-high":
            return b.price - a.price
          case "rating":
            return b.rating - a.rating
          case "alphabetical":
            return a.name.localeCompare(b.name)
          default:
            return 0
        }
      })

    const startIndex = (currentPage - 1) * 10
    const endIndex = startIndex + 10
    const paginatedVendors = filteredAndSortedVendors.slice(startIndex, endIndex)

    setVendors(paginatedVendors)
    setTotalPages(Math.ceil(filteredAndSortedVendors.length / 10))
    setTotalVendors(filteredAndSortedVendors.length)
    setIsLoading(false)
  }

  function handleFilterChange(key: string, value: string | number | string[]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function handleAmenityToggle(amenity: string) {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
    setCurrentPage(1)
  }

  function handleStaffToggle(staff: StaffOption) {
    setFilters((prev) => {
      if (staff === "all") {
        return { ...prev, staff: prev.staff.length === 3 ? [] : ["male", "female", "transgender"] }
      } else {
        const newStaff = prev.staff.includes(staff) ? prev.staff.filter((s) => s !== staff) : [...prev.staff, staff]
        return { ...prev, staff: newStaff }
      }
    })
    setCurrentPage(1)
  }

  function handleSortChange(value: SortOption) {
    setSortOption(value)
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setFilters({
      city: "All Cities",
      subArea: "",
      minPrice: "",
      maxPrice: "",
      type: "All Types",
      capacity: "",
      amenities: [],
      cancellationPolicy: "All Policies",
      staff: [],
    })
    setSortOption("default")
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-gray-600 mb-8">{description}</p>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Filters for mobile screens */}
        <div className="sm:hidden w-full">
          <Button onClick={() => setIsFilterOpen(!isFilterOpen)} className="w-full mb-4">
            Filters {isFilterOpen ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
          </Button>
          {isFilterOpen && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <FilterContent
                  filters={filters}
                  handleFilterChange={handleFilterChange}
                  handleAmenityToggle={handleAmenityToggle}
                  handleStaffToggle={handleStaffToggle}
                  handleResetFilters={handleResetFilters}
                  vendorType={vendorType}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters for small, medium, and large screens */}
        <aside className="hidden sm:block w-full sm:w-1/3 lg:w-1/4 sticky top-4 self-start overflow-auto max-h-[calc(100vh-2rem)]">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">FILTER</h2>
              <FilterContent
                filters={filters}
                handleFilterChange={handleFilterChange}
                handleAmenityToggle={handleAmenityToggle}
                handleStaffToggle={handleStaffToggle}
                handleResetFilters={handleResetFilters}
                vendorType={vendorType}
              />
            </CardContent>
          </Card>
        </aside>

        <section className="w-full sm:w-2/3 lg:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <p className="text-gray-600 mb-2 sm:mb-0">
              {isLoading ? "Loading..." : `${vendors.length} OF ${totalVendors} RESULTS`}
            </p>
            <div className="w-full sm:w-auto">
              <Select value={sortOption} onValueChange={handleSortChange}>
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
            ) : vendors.length > 0 ? (
              vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  id={vendor.id}
                  name={vendor.name}
                  image={vendor.images[0]}
                  location={vendor.location}
                  rating={vendor.rating}
                  reviews={vendor.reviews.length}
                  price={vendor.price}
                  type={vendor.type}
                  vendorType={vendorType}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-xl font-semibold">No results found</p>
                <p className="text-gray-600 mt-2">Try adjusting your filters</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="m-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                className="m-1"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="m-1"
            >
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

