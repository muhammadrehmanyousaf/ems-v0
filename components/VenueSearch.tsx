"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import VenueCard from "./VenueCard"

const venueTypes = ["Hall", "Outdoor", "Marquee", "Banquet Hall"]
const amenities = ["Parking Space", "Wheelchair Accessible", "Air Conditioning", "Catering Services", "DJ Services"]
const cancellationPolicies = ["Refundable", "Partially Refundable", "Non-refundable"]

export default function VenueSearch() {
  const [venues, setVenues] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVenues, setTotalVenues] = useState(0)
  const [filters, setFilters] = useState({
    city: "",
    subArea: "",
    minPrice: "",
    maxPrice: "",
    type: "",
    capacity: "",
    amenities: [],
    cancellationPolicy: "",
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    fetchVenues()
  }, [filters]) // Removed currentPage from dependencies

  async function fetchVenues() {
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: "10",
      city: filters.city,
      subArea: filters.subArea,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      type: filters.type,
      capacity: filters.capacity,
      amenities: filters.amenities.join(","),
      cancellationPolicy: filters.cancellationPolicy,
    })
    const response = await fetch(`/api/venues?${queryParams}`)
    const data = await response.json()
    setVenues(data.results)
    setTotalPages(data.totalPages)
    setTotalVenues(data.totalVenues)
  }

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  function handleAmenityToggle(amenity) {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
    setCurrentPage(1)
  }

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <label className="block mb-2 font-medium">City</label>
        <Select value={filters.city} onValueChange={(value) => handleFilterChange("city", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lahore">Lahore</SelectItem>
            <SelectItem value="islamabad">Islamabad</SelectItem>
            <SelectItem value="rawalpindi">Rawalpindi</SelectItem>
            <SelectItem value="karachi">Karachi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-2 font-medium">Sub Area</label>
        <Input
          value={filters.subArea}
          placeholder="e.g. G-10 Markaz"
          onChange={(e) => handleFilterChange("subArea", e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Price Range (PKR)</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="block mb-2 font-medium">Venue Type</label>
        <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select venue type" />
          </SelectTrigger>
          <SelectContent>
            {venueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block mb-2 font-medium">Capacity</label>
        <Input
          type="number"
          placeholder="Enter capacity"
          value={filters.capacity}
          onChange={(e) => handleFilterChange("capacity", e.target.value)}
        />
      </div>
      <div>
        <label className="block mb-2 font-medium">Amenities</label>
        <div className="space-y-2">
          {amenities.map((amenity) => (
            <div key={amenity} className="flex items-center">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={filters.amenities.includes(amenity)}
                onCheckedChange={() => handleAmenityToggle(amenity)}
              />
              <label htmlFor={`amenity-${amenity}`} className="ml-2">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <label className="block mb-2 font-medium">Cancellation Policy</label>
        <Select
          value={filters.cancellationPolicy}
          onValueChange={(value) => handleFilterChange("cancellationPolicy", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select policy" />
          </SelectTrigger>
          <SelectContent>
            {cancellationPolicies.map((policy) => (
              <SelectItem key={policy} value={policy}>
                {policy}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

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
                <FilterContent />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters for small, medium, and large screens */}
        <aside className="hidden sm:block w-full sm:w-1/3 lg:w-1/4 sticky top-4 self-start overflow-auto max-h-[calc(100vh-2rem)]">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">FILTER</h2>
              <FilterContent />
            </CardContent>
          </Card>
        </aside>

        <section className="w-full sm:w-2/3 lg:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <p className="text-gray-600 mb-2 sm:mb-0">
              {venues.length} OF {totalVenues} RESULTS
            </p>
            <div className="w-full sm:w-auto">
              <Select defaultValue="relevance">
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">SORT BY: RELEVANCE</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
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

