"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import VenueCard from "./VenueCard"
import FilterContent from "./FilterContent"
import type { Venue, Filters, SortOption, StaffOption } from "@/lib/types"

export default function VenueSearch() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVenues, setTotalVenues] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    city: "All Cities",
    subArea: "",
    minPrice: "",
    maxPrice: "",
    type: "All Venues",
    capacity: "",
    amenities: [],
    cancellationPolicy: "All Policies",
    staff: [],
  })
  const [sortOption, setSortOption] = useState<SortOption>("default")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchVenues()
  }, [filters, sortOption, currentPage]) //This line was already correct, no changes needed.

  async function fetchVenues() {
    setIsLoading(true)
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
      sort: sortOption,
      ...Object.fromEntries(
        Object.entries(filters).filter(
          ([key, value]) =>
            value !== "" &&
            value !== "All Cities" &&
            value !== "All Venues" &&
            value !== "All Policies" &&
            (Array.isArray(value) ? value.length > 0 : true),
        ),
      ),
    })
    if (filters.amenities.length > 0) {
      queryParams.set("amenities", filters.amenities.join(","))
    }
    if (filters.staff.length > 0) {
      queryParams.set("staff", filters.staff.join(","))
    }
    const response = await fetch(`/api/venues?${queryParams}`)
    const data = await response.json()
    setVenues(data.results)
    setTotalPages(data.totalPages)
    setTotalVenues(data.totalVenues)
    setIsLoading(false)
  }

  function handleFilterChange(key: string, value: string | string[]) {
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
      type: "All Venues",
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
      <h1 className="text-3xl font-bold mb-4">Wedding Halls And Marquees In Pakistan</h1>
      <p className="text-gray-600 mb-8">
        Find the best wedding venues across Pakistan for a perfect celebration, only on Shadiyana.
      </p>

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
              />
            </CardContent>
          </Card>
        </aside>

        <section className="w-full sm:w-2/3 lg:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <p className="text-gray-600 mb-2 sm:mb-0">
              {isLoading ? "Loading..." : `${venues.length} OF ${totalVenues} RESULTS`}
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
            ) : venues.length > 0 ? (
              venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
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

