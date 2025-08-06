"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Search, Filter, X, MapPin, Star, Users } from "lucide-react"
import { getAllVendorTypes, getVendorTypeDisplayName } from "@/lib/vendor-types"

interface Filters {
  search: string
  location: string
  priceRange: [number, number]
  rating: number
  capacity: number
  amenities: string[]
}

interface VendorFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  vendorType?: string
  showVendorTypeFilter?: boolean
}

export default function VendorFilters({ 
  filters, 
  onFiltersChange, 
  vendorType,
  showVendorTypeFilter = false 
}: VendorFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Auto-expand on desktop, collapse on mobile
  const [isDesktop, setIsDesktop] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  
  // Auto-expand on desktop
  useEffect(() => {
    if (isDesktop) {
      setIsExpanded(true)
    }
  }, [isDesktop])

  const vendorTypes = getAllVendorTypes()
  const amenities = [
    "Parking", "Catering", "Decoration", "Music", "Photography", 
    "Videography", "Makeup", "Transportation", "Accommodation", "WiFi",
    "Professional Equipment", "Album", "Video", "Flowers", "Lighting", 
    "Backdrop", "Bridal Makeup", "Hair Styling", "Touch-ups", "Bridal Packages"
  ]

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      location: "",
      priceRange: [0, 1000000],
      rating: 0,
      capacity: 0,
      amenities: []
    })
  }

  const hasActiveFilters = filters.search || filters.location || filters.rating > 0 || filters.capacity > 0 || filters.amenities.length > 0

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search vendors, locations..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 w-full"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {[
                filters.search && 1,
                filters.location && 1,
                filters.rating > 0 && 1,
                filters.capacity > 0 && 1,
                filters.amenities.length
              ].filter(Boolean).reduce((a, b) => a + b, 0)}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vendor Type Filter (if enabled) */}
            {showVendorTypeFilter && (
              <div>
                <label className="text-sm font-medium mb-2 block">Vendor Type</label>
                <Select value={vendorType || "all"} disabled>
                  <SelectTrigger>
                    <SelectValue />
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
            )}

            {/* Location Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Location
              </label>
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

            {/* Rating Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Star className="h-4 w-4" />
                Minimum Rating
              </label>
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

            {/* Capacity Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">
                <Users className="h-4 w-4" />
                Minimum Capacity
              </label>
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

            {/* Amenities */}
            <div>
              <label className="text-sm font-medium mb-2 block">Amenities</label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
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
                    <label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="pt-2 border-t">
                <div className="flex flex-wrap gap-1">
                  {filters.search && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {filters.search}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
} 