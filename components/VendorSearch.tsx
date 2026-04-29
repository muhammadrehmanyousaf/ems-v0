"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft, ChevronRight, Search, MapPin, Star, Users, Filter,
  DollarSign, Tag, Shield, Car, Utensils, ParkingSquare, Sparkles,
} from "lucide-react"
import VendorCard from "./VendorCard"
import type { Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { getVendorTypeFromPath, getVendorTypeDisplayName, getVendorTypeDescription } from "@/lib/vendor-types"
import { VENDOR_TYPES } from "@/lib/vendor-types"
import { getVendorTypeConfig } from "@/lib/vendor-type-config"

interface VendorSearchProps {
  vendorType: string
}

interface Filters {
  search: string
  location: string
  priceRange: [number, number]
  rating: number
  staff: string[]
  subTypes: string[]
  amenities: string[]
  sponsored: boolean
  travelToClient: boolean
  capacity: number
  hasParking: boolean
  hasCatering: boolean
  hasFoodTasting: boolean
  hasWaiter: boolean
  cancellationPolicy: string
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  location: "",
  priceRange: [0, 1000000],
  rating: 0,
  staff: [],
  subTypes: [],
  amenities: [],
  sponsored: false,
  travelToClient: false,
  capacity: 0,
  hasParking: false,
  hasCatering: false,
  hasFoodTasting: false,
  hasWaiter: false,
  cancellationPolicy: "",
}

export default function VendorSearch({ vendorType }: VendorSearchProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [sortOption, setSortOption] = useState("default")
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const vendorTypeFromPath = getVendorTypeFromPath(vendorType)
  const displayName = getVendorTypeDisplayName(vendorTypeFromPath)
  const description = getVendorTypeDescription(vendorTypeFromPath)
  const typeConfig = getVendorTypeConfig(vendorTypeFromPath)

  // Derive filter options from the same config used in vendor settings
  const subTypeField = typeConfig?.typeSpecificFields.find(f => f.key === "subBusinessType")
  const subTypeOptions: string[] = subTypeField?.options ?? []
  const subTypeLabel = subTypeField?.label ?? "Sub-type"

  const amenitiesField = typeConfig?.typeSpecificFields.find(f => f.key === "amenities")
  const amenityOptions: string[] = amenitiesField?.options ?? []
  const amenitiesLabel = amenitiesField?.label ?? "Services"

  // Type flags
  const isVenue = vendorTypeFromPath === VENDOR_TYPES.WEDDING_VENUE
  const isCatering = vendorTypeFromPath === VENDOR_TYPES.CATERING
  const showCapacity = isVenue || isCatering || vendorTypeFromPath === VENDOR_TYPES.DECORATOR
  const showTravelFilter = [
    VENDOR_TYPES.PHOTOGRAPHER, VENDOR_TYPES.DECORATOR,
    VENDOR_TYPES.HENNA_ARTIST, VENDOR_TYPES.MAKEUP_ARTIST,
  ].includes(vendorTypeFromPath as any)

  const fetchVendors = async () => {
    setIsLoading(true)
    try {
      const data = vendorTypeFromPath === "all"
        ? await VendorAPI.getAllBusinesses()
        : await VendorAPI.getBusinessesByVendorType(vendorTypeFromPath)
      setVendors(data)
    } catch {}
    finally { setIsLoading(false) }
  }

  useEffect(() => { fetchVendors() }, [])
  useEffect(() => { setCurrentPage(1) }, [filters, sortOption])

  const filteredVendors = useMemo(() => {
    let result = [...vendors]

    if (filters.search.trim()) {
      const s = filters.search.toLowerCase()
      result = result.filter(v =>
        v.name?.toLowerCase().includes(s) ||
        v.location?.toLowerCase().includes(s) ||
        v.city?.toLowerCase().includes(s) ||
        v.type?.toLowerCase().includes(s)
      )
    }

    if (filters.location.trim()) {
      const l = filters.location.toLowerCase()
      result = result.filter(v =>
        v.location?.toLowerCase().includes(l) ||
        v.city?.toLowerCase().includes(l) ||
        v.subArea?.toLowerCase().includes(l)
      )
    }

    result = result.filter(v => {
      const price = Number(v.minimumPrice || v.price || 0)
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    if (filters.rating > 0)
      result = result.filter(v => Number(v.rating || 0) >= filters.rating)

    if (filters.staff.length > 0)
      result = result.filter(v => v.staff?.some(s => filters.staff.includes(s)))

    if (filters.subTypes.length > 0) {
      result = result.filter(v => {
        if (!v.subBusinessType) return false
        const vals = Array.isArray(v.subBusinessType) ? v.subBusinessType : [v.subBusinessType]
        return filters.subTypes.some(st => vals.includes(st))
      })
    }

    if (filters.amenities.length > 0) {
      result = result.filter(v => {
        if (!v.amenities?.length) return false
        return filters.amenities.some(a =>
          v.amenities.some(va => va.toLowerCase().includes(a.toLowerCase()))
        )
      })
    }

    if (filters.sponsored)
      result = result.filter(v => v.sponsored === true)

    if (filters.travelToClient)
      result = result.filter(v => v.travelToClientHome === true)

    if (filters.capacity > 0)
      result = result.filter(v => Number(v.maxCapacity || v.capacity || 0) >= filters.capacity)

    if (filters.hasParking)
      result = result.filter(v => v.parking === true)

    if (filters.hasCatering)
      result = result.filter(v => v.catering === true)

    if (filters.hasFoodTasting)
      result = result.filter(v => v.provideFoodTasting === true)

    if (filters.hasWaiter)
      result = result.filter(v => v.provideWaiter === true)

    if (filters.cancellationPolicy) {
      result = result.filter(v => {
        const p = v.cancelationPolicy || v.cancellationPolicy || ""
        return p.toLowerCase().includes(filters.cancellationPolicy.toLowerCase())
      })
    }

    switch (sortOption) {
      case "price-low":
        result.sort((a, b) => Number(a.minimumPrice || a.price || 0) - Number(b.minimumPrice || b.price || 0))
        break
      case "price-high":
        result.sort((a, b) => Number(b.minimumPrice || b.price || 0) - Number(a.minimumPrice || a.price || 0))
        break
      case "rating":
        result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        break
      case "alphabetical":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "recent":
        result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        break
    }

    return result
  }, [vendors, filters, sortOption])

  const totalPages = Math.ceil(filteredVendors.length / 12)
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  const toggleArr = (key: "staff" | "subTypes" | "amenities", value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value],
    }))
  }

  const activeCount = [
    filters.search,
    filters.location,
    filters.rating > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000,
    filters.staff.length > 0,
    filters.subTypes.length > 0,
    filters.amenities.length > 0,
    filters.sponsored,
    filters.travelToClient,
    filters.capacity > 0,
    filters.hasParking,
    filters.hasCatering,
    filters.hasFoodTasting,
    filters.hasWaiter,
    filters.cancellationPolicy,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 p-8 sm:p-10 text-center"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          </div>
          <div className="relative z-10">
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-yellow-300 mb-2">Find Your Perfect Match</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">{displayName}</h1>
            <p className="text-sm sm:text-base text-purple-100 max-w-2xl mx-auto">{description}</p>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* ── Filter Sidebar ── */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <Card className="shadow-lg border-0 bg-white max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-purple-500" />
                      Filters
                      {activeCount > 0 && (
                        <span className="ml-1 bg-purple-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                          {activeCount}
                        </span>
                      )}
                    </CardTitle>
                    {activeCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1"
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-h-0">
                  <div className="h-full overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">

                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-purple-500" /> Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <Input
                          placeholder="Name, city, type..."
                          value={filters.search}
                          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                          className="pl-9 h-10 text-sm border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" /> Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <Input
                          placeholder="City or area..."
                          value={filters.location}
                          onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
                          className="pl-9 h-10 text-sm border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Price Range */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-purple-500" /> Price Range
                      </label>
                      <Slider
                        value={filters.priceRange}
                        onValueChange={v => setFilters(p => ({ ...p, priceRange: v as [number, number] }))}
                        max={1000000}
                        step={10000}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Rs. {filters.priceRange[0].toLocaleString()}</span>
                        <span>Rs. {filters.priceRange[1].toLocaleString()}</span>
                      </div>
                    </div>

                    <Separator />

                    {/* Rating */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-purple-500" /> Minimum Rating
                      </label>
                      <Select
                        value={filters.rating.toString()}
                        onValueChange={v => setFilters(p => ({ ...p, rating: Number(v) }))}
                      >
                        <SelectTrigger className="h-10 text-sm border-gray-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Rating</SelectItem>
                          <SelectItem value="3">3+ Stars ★★★</SelectItem>
                          <SelectItem value="4">4+ Stars ★★★★</SelectItem>
                          <SelectItem value="4.5">4.5+ Stars ★★★★½</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sub-type — derived from vendor config */}
                    {subTypeOptions.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-purple-500" /> {subTypeLabel}
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {subTypeOptions.map(opt => (
                              <button
                                key={opt}
                                onClick={() => toggleArr("subTypes", opt)}
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                  filters.subTypes.includes(opt)
                                    ? "bg-purple-600 text-white border-purple-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-400 hover:text-purple-600"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Staff preference */}
                    <Separator />
                    <div className="space-y-2.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-500" /> Staff Preference
                      </label>
                      {["Male", "Female", "Transgender"].map(s => (
                        <div key={s} className="flex items-center gap-2.5">
                          <Checkbox
                            id={`staff-${s}`}
                            checked={filters.staff.includes(s)}
                            onCheckedChange={() => toggleArr("staff", s)}
                            className="border-gray-300"
                          />
                          <label htmlFor={`staff-${s}`} className="text-sm text-gray-700 cursor-pointer">{s}</label>
                        </div>
                      ))}
                    </div>

                    {/* Capacity — venue / catering / decorator */}
                    {showCapacity && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-purple-500" /> Min. Guest Capacity
                          </label>
                          <Select
                            value={filters.capacity.toString()}
                            onValueChange={v => setFilters(p => ({ ...p, capacity: Number(v) }))}
                          >
                            <SelectTrigger className="h-10 text-sm border-gray-200 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Any Capacity</SelectItem>
                              <SelectItem value="50">50+ guests</SelectItem>
                              <SelectItem value="100">100+ guests</SelectItem>
                              <SelectItem value="200">200+ guests</SelectItem>
                              <SelectItem value="500">500+ guests</SelectItem>
                              <SelectItem value="1000">1000+ guests</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* Venue-specific */}
                    {isVenue && (
                      <>
                        <Separator />
                        <div className="space-y-2.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Venue Features
                          </label>
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              id="hasCatering"
                              checked={filters.hasCatering}
                              onCheckedChange={v => setFilters(p => ({ ...p, hasCatering: !!v }))}
                              className="border-gray-300"
                            />
                            <label htmlFor="hasCatering" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-orange-400" /> In-house Catering
                            </label>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              id="hasParking"
                              checked={filters.hasParking}
                              onCheckedChange={v => setFilters(p => ({ ...p, hasParking: !!v }))}
                              className="border-gray-300"
                            />
                            <label htmlFor="hasParking" className="text-sm text-gray-700 cursor-pointer flex items-center gap-1.5">
                              <Car className="w-3.5 h-3.5 text-blue-400" /> Parking Available
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Catering-specific */}
                    {isCatering && (
                      <>
                        <Separator />
                        <div className="space-y-2.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5 text-purple-500" /> Catering Features
                          </label>
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              id="hasFoodTasting"
                              checked={filters.hasFoodTasting}
                              onCheckedChange={v => setFilters(p => ({ ...p, hasFoodTasting: !!v }))}
                              className="border-gray-300"
                            />
                            <label htmlFor="hasFoodTasting" className="text-sm text-gray-700 cursor-pointer">Food Tasting Available</label>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              id="hasWaiter"
                              checked={filters.hasWaiter}
                              onCheckedChange={v => setFilters(p => ({ ...p, hasWaiter: !!v }))}
                              className="border-gray-300"
                            />
                            <label htmlFor="hasWaiter" className="text-sm text-gray-700 cursor-pointer">Waiter Service Included</label>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Travel to client */}
                    {showTravelFilter && (
                      <>
                        <Separator />
                        <div className="flex items-center gap-2.5">
                          <Checkbox
                            id="travelToClient"
                            checked={filters.travelToClient}
                            onCheckedChange={v => setFilters(p => ({ ...p, travelToClient: !!v }))}
                            className="border-gray-300"
                          />
                          <label htmlFor="travelToClient" className="text-sm text-gray-700 cursor-pointer font-medium">
                            Travels to Client Location
                          </label>
                        </div>
                      </>
                    )}

                    {/* Amenities — from vendor config for this type */}
                    {amenityOptions.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {amenitiesLabel}
                          </label>
                          <div className="space-y-2">
                            {amenityOptions.map(a => (
                              <div key={a} className="flex items-center gap-2.5">
                                <Checkbox
                                  id={`am-${a}`}
                                  checked={filters.amenities.includes(a)}
                                  onCheckedChange={() => toggleArr("amenities", a)}
                                  className="border-gray-300"
                                />
                                <label htmlFor={`am-${a}`} className="text-sm text-gray-700 cursor-pointer">{a}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Cancellation Policy */}
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-500" /> Cancellation Policy
                      </label>
                      <Select
                        value={filters.cancellationPolicy || "all"}
                        onValueChange={v => setFilters(p => ({ ...p, cancellationPolicy: v === "all" ? "" : v }))}
                      >
                        <SelectTrigger className="h-10 text-sm border-gray-200 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Policy</SelectItem>
                          <SelectItem value="Free">Free Cancellation</SelectItem>
                          <SelectItem value="Partial">Partially Refundable</SelectItem>
                          <SelectItem value="Non-Refundable">Non-Refundable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Featured only toggle */}
                    <Separator />
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id="sponsored"
                        checked={filters.sponsored}
                        onCheckedChange={v => setFilters(p => ({ ...p, sponsored: !!v }))}
                        className="border-gray-300"
                      />
                      <label htmlFor="sponsored" className="text-sm text-gray-700 cursor-pointer font-medium flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Featured Vendors Only
                      </label>
                    </div>

                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                <span className="text-sm font-semibold text-gray-700">
                  {isLoading ? "Loading..." : `${filteredVendors.length} of ${vendors.length} results`}
                </span>
                {activeCount > 0 && (
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">
                    {activeCount} filter{activeCount > 1 ? "s" : ""} active
                  </Badge>
                )}
              </div>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-48 h-10 border-gray-200 text-sm rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Relevance</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="alphabetical">A to Z</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filter chips */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.search && <FilterChip label={`"${filters.search}"`} onRemove={() => setFilters(p => ({ ...p, search: "" }))} />}
                {filters.location && <FilterChip label={filters.location} onRemove={() => setFilters(p => ({ ...p, location: "" }))} />}
                {filters.rating > 0 && <FilterChip label={`${filters.rating}+ stars`} onRemove={() => setFilters(p => ({ ...p, rating: 0 }))} />}
                {filters.staff.map(s => <FilterChip key={s} label={s} onRemove={() => toggleArr("staff", s)} />)}
                {filters.subTypes.map(st => <FilterChip key={st} label={st} onRemove={() => toggleArr("subTypes", st)} />)}
                {filters.amenities.map(a => <FilterChip key={a} label={a} onRemove={() => toggleArr("amenities", a)} />)}
                {filters.sponsored && <FilterChip label="Featured only" onRemove={() => setFilters(p => ({ ...p, sponsored: false }))} />}
                {filters.travelToClient && <FilterChip label="Travels to client" onRemove={() => setFilters(p => ({ ...p, travelToClient: false }))} />}
                {filters.capacity > 0 && <FilterChip label={`${filters.capacity}+ guests`} onRemove={() => setFilters(p => ({ ...p, capacity: 0 }))} />}
                {filters.hasCatering && <FilterChip label="In-house catering" onRemove={() => setFilters(p => ({ ...p, hasCatering: false }))} />}
                {filters.hasParking && <FilterChip label="Parking" onRemove={() => setFilters(p => ({ ...p, hasParking: false }))} />}
                {filters.hasFoodTasting && <FilterChip label="Food tasting" onRemove={() => setFilters(p => ({ ...p, hasFoodTasting: false }))} />}
                {filters.hasWaiter && <FilterChip label="Waiter service" onRemove={() => setFilters(p => ({ ...p, hasWaiter: false }))} />}
                {filters.cancellationPolicy && <FilterChip label={filters.cancellationPolicy} onRemove={() => setFilters(p => ({ ...p, cancellationPolicy: "" }))} />}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-t-xl" />
                    <div className="bg-white p-4 rounded-b-xl border border-gray-100 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : filteredVendors.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {paginatedVendors.map((vendor, idx) => (
                    <motion.div
                      key={vendor.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <VendorCard
                        id={vendor.id}
                        name={vendor.name}
                        image={vendor.images?.[0] || "/placeholder.svg"}
                        location={vendor.location || vendor.city}
                        rating={vendor.rating}
                        reviews={vendor.reviews?.length || 0}
                        price={
                          vendor.minimumPrice ||
                          (vendor.packages?.length > 0
                            ? Math.min(...vendor.packages.map(p => p.price).filter(p => p > 0))
                            : null) ||
                          vendor.price ||
                          null
                        }
                        type={vendor.type || vendor.subBusinessType}
                        capacity={vendor.capacity}
                        amenities={vendor.amenities}
                        sponsored={vendor.sponsored}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="col-span-full text-center py-16">
                  <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
                  <p className="text-gray-500 mb-5 text-sm">Try adjusting your filters</p>
                  <Button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-gray-200 hover:border-purple-400 hover:text-purple-600"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "border-gray-200 hover:border-purple-400 hover:text-purple-600"
                    }
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-gray-200 hover:border-purple-400 hover:text-purple-600"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-purple-900 transition-colors">
        ×
      </button>
    </span>
  )
}
