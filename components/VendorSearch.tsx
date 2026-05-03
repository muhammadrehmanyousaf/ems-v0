"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft, ChevronRight, Search, MapPin, Star, Users, Filter,
  DollarSign, Tag, Shield, Car, Utensils, Sparkles,
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
  const searchParams = useSearchParams()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [sortOption, setSortOption] = useState("default")

  // Seed initial filters from URL — lets the hero search hand off
  // ?q=&location=&type= and have the grid render pre-filtered on first paint.
  const initialFilters: Filters = useMemo(() => {
    const q = searchParams?.get("q") || searchParams?.get("search") || ""
    const loc = searchParams?.get("location") || ""
    const type = searchParams?.get("type") || ""
    return {
      ...DEFAULT_FILTERS,
      search: q,
      location: loc,
      subTypes: type ? [type] : [],
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [filters, setFilters] = useState<Filters>(initialFilters)

  const vendorTypeFromPath = getVendorTypeFromPath(vendorType)
  const displayName = getVendorTypeDisplayName(vendorTypeFromPath)
  const description = getVendorTypeDescription(vendorTypeFromPath)
  const typeConfig = getVendorTypeConfig(vendorTypeFromPath)

  const subTypeField = typeConfig?.typeSpecificFields.find(f => f.key === "subBusinessType")
  const subTypeOptions: string[] = subTypeField?.options ?? []
  const subTypeLabel = subTypeField?.label ?? "Sub-type"

  const amenitiesField = typeConfig?.typeSpecificFields.find(f => f.key === "amenities")
  const amenityOptions: string[] = amenitiesField?.options ?? []
  const amenitiesLabel = amenitiesField?.label ?? "Services"

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
    <div className="min-h-screen bg-bridal-ivory">
      {/* ── Editorial Listing Hero ── */}
      <section className="relative overflow-hidden border-b border-bridal-beige/60 bg-bridal-hero">
        <div className="bg-mughal-jaal absolute inset-0 opacity-[0.06] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20 text-center">
          <p className="font-bridal text-[11px] sm:text-[12px] uppercase tracking-[0.4em] text-bridal-gold-dark mb-4">
            Find your perfect match
          </p>
          <h1 className="font-display italic text-[36px] sm:text-[48px] lg:text-[60px] leading-[1.05] text-bridal-charcoal mb-4">
            {displayName}
          </h1>
          <div className="mx-auto mb-5 h-[1px] w-24 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <p className="font-bridal text-[14px] sm:text-[15px] text-bridal-text-soft max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 lg:gap-8">
          {/* ── Filter Sidebar ── */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-24">
              <Card className="border border-bridal-beige bg-bridal-cream rounded-md max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]">
                <CardHeader className="pb-3 border-b border-bridal-beige bg-bridal-ivory flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display italic text-[18px] text-bridal-charcoal flex items-center gap-2">
                      <Filter className="w-4 h-4 text-bridal-gold" />
                      Filters
                      {activeCount > 0 && (
                        <span className="ml-1 bg-bridal-gold text-bridal-charcoal font-bridal text-[10px] font-medium tracking-[0.15em] px-1.5 py-0.5 rounded-full">
                          {activeCount}
                        </span>
                      )}
                    </CardTitle>
                    {activeCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark hover:text-bridal-mauve transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-h-0">
                  <div className="h-full overflow-y-auto px-4 py-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-bridal-beige [&::-webkit-scrollbar-thumb]:rounded-full">

                    {/* Search */}
                    <FilterGroup icon={<Search className="w-3.5 h-3.5 text-bridal-gold" />} label="Search">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bridal-gold/70 w-3.5 h-3.5" />
                        <Input
                          placeholder="Name, city, type..."
                          value={filters.search}
                          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                          className="pl-9 h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:ring-bridal-gold focus-visible:ring-1 focus-visible:border-bridal-gold/55"
                        />
                      </div>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Location */}
                    <FilterGroup icon={<MapPin className="w-3.5 h-3.5 text-bridal-gold" />} label="Location">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-bridal-gold/70 w-3.5 h-3.5" />
                        <Input
                          placeholder="City or area..."
                          value={filters.location}
                          onChange={e => setFilters(p => ({ ...p, location: e.target.value }))}
                          className="pl-9 h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:ring-bridal-gold focus-visible:ring-1 focus-visible:border-bridal-gold/55"
                        />
                      </div>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Price Range */}
                    <FilterGroup icon={<DollarSign className="w-3.5 h-3.5 text-bridal-gold" />} label="Price Range">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={v => setFilters(p => ({ ...p, priceRange: v as [number, number] }))}
                        max={1000000}
                        step={10000}
                        className="w-full [&_[role=slider]]:bg-bridal-gold [&_[role=slider]]:border-bridal-gold-dark [&_.bg-primary]:bg-bridal-gold [&_[data-orientation=horizontal]]:bg-bridal-beige"
                      />
                      <div className="flex justify-between font-bridal text-[11px] text-bridal-text-soft font-medium pt-2">
                        <span>Rs. {filters.priceRange[0].toLocaleString()}</span>
                        <span>Rs. {filters.priceRange[1].toLocaleString()}</span>
                      </div>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Rating */}
                    <FilterGroup icon={<Star className="w-3.5 h-3.5 text-bridal-gold" />} label="Minimum Rating">
                      <Select
                        value={filters.rating.toString()}
                        onValueChange={v => setFilters(p => ({ ...p, rating: Number(v) }))}
                      >
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          <SelectItem value="0">Any Rating</SelectItem>
                          <SelectItem value="3">3+ Stars ★★★</SelectItem>
                          <SelectItem value="4">4+ Stars ★★★★</SelectItem>
                          <SelectItem value="4.5">4.5+ Stars ★★★★½</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    {/* Sub-type */}
                    {subTypeOptions.length > 0 && (
                      <>
                        <BridalSeparator />
                        <FilterGroup icon={<Tag className="w-3.5 h-3.5 text-bridal-gold" />} label={subTypeLabel}>
                          <div className="flex flex-wrap gap-1.5">
                            {subTypeOptions.map(opt => {
                              const active = filters.subTypes.includes(opt)
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleArr("subTypes", opt)}
                                  className={`font-bridal text-[11px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border transition-all ${
                                    active
                                      ? "bg-bridal-gold text-bridal-charcoal border-bridal-gold-dark"
                                      : "bg-bridal-ivory text-bridal-text-soft border-bridal-beige hover:border-bridal-gold/55 hover:text-bridal-charcoal"
                                  }`}
                                >
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </FilterGroup>
                      </>
                    )}

                    {/* Staff preference */}
                    <BridalSeparator />
                    <FilterGroup icon={<Users className="w-3.5 h-3.5 text-bridal-gold" />} label="Staff Preference">
                      <div className="space-y-2">
                        {["Male", "Female", "Transgender"].map(s => (
                          <BridalCheckRow
                            key={s}
                            id={`staff-${s}`}
                            label={s}
                            checked={filters.staff.includes(s)}
                            onChange={() => toggleArr("staff", s)}
                          />
                        ))}
                      </div>
                    </FilterGroup>

                    {/* Capacity */}
                    {showCapacity && (
                      <>
                        <BridalSeparator />
                        <FilterGroup icon={<Users className="w-3.5 h-3.5 text-bridal-gold" />} label="Min. Guest Capacity">
                          <Select
                            value={filters.capacity.toString()}
                            onValueChange={v => setFilters(p => ({ ...p, capacity: Number(v) }))}
                          >
                            <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                              <SelectItem value="0">Any Capacity</SelectItem>
                              <SelectItem value="50">50+ guests</SelectItem>
                              <SelectItem value="100">100+ guests</SelectItem>
                              <SelectItem value="200">200+ guests</SelectItem>
                              <SelectItem value="500">500+ guests</SelectItem>
                              <SelectItem value="1000">1000+ guests</SelectItem>
                            </SelectContent>
                          </Select>
                        </FilterGroup>
                      </>
                    )}

                    {/* Venue features */}
                    {isVenue && (
                      <>
                        <BridalSeparator />
                        <FilterGroup icon={<Sparkles className="w-3.5 h-3.5 text-bridal-gold" />} label="Venue Features">
                          <div className="space-y-2">
                            <BridalCheckRow
                              id="hasCatering"
                              label="In-house Catering"
                              icon={<Utensils className="w-3.5 h-3.5 text-bridal-coral" />}
                              checked={filters.hasCatering}
                              onChange={v => setFilters(p => ({ ...p, hasCatering: !!v }))}
                            />
                            <BridalCheckRow
                              id="hasParking"
                              label="Parking Available"
                              icon={<Car className="w-3.5 h-3.5 text-bridal-mauve" />}
                              checked={filters.hasParking}
                              onChange={v => setFilters(p => ({ ...p, hasParking: !!v }))}
                            />
                          </div>
                        </FilterGroup>
                      </>
                    )}

                    {/* Catering features */}
                    {isCatering && (
                      <>
                        <BridalSeparator />
                        <FilterGroup icon={<Utensils className="w-3.5 h-3.5 text-bridal-gold" />} label="Catering Features">
                          <div className="space-y-2">
                            <BridalCheckRow
                              id="hasFoodTasting"
                              label="Food Tasting Available"
                              checked={filters.hasFoodTasting}
                              onChange={v => setFilters(p => ({ ...p, hasFoodTasting: !!v }))}
                            />
                            <BridalCheckRow
                              id="hasWaiter"
                              label="Waiter Service Included"
                              checked={filters.hasWaiter}
                              onChange={v => setFilters(p => ({ ...p, hasWaiter: !!v }))}
                            />
                          </div>
                        </FilterGroup>
                      </>
                    )}

                    {/* Travel to client */}
                    {showTravelFilter && (
                      <>
                        <BridalSeparator />
                        <BridalCheckRow
                          id="travelToClient"
                          label="Travels to Client Location"
                          strong
                          checked={filters.travelToClient}
                          onChange={v => setFilters(p => ({ ...p, travelToClient: !!v }))}
                        />
                      </>
                    )}

                    {/* Amenities */}
                    {amenityOptions.length > 0 && (
                      <>
                        <BridalSeparator />
                        <FilterGroup label={amenitiesLabel}>
                          <div className="space-y-2">
                            {amenityOptions.map(a => (
                              <BridalCheckRow
                                key={a}
                                id={`am-${a}`}
                                label={a}
                                checked={filters.amenities.includes(a)}
                                onChange={() => toggleArr("amenities", a)}
                              />
                            ))}
                          </div>
                        </FilterGroup>
                      </>
                    )}

                    {/* Cancellation Policy */}
                    <BridalSeparator />
                    <FilterGroup icon={<Shield className="w-3.5 h-3.5 text-bridal-gold" />} label="Cancellation Policy">
                      <Select
                        value={filters.cancellationPolicy || "all"}
                        onValueChange={v => setFilters(p => ({ ...p, cancellationPolicy: v === "all" ? "" : v }))}
                      >
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          <SelectItem value="all">Any Policy</SelectItem>
                          <SelectItem value="Free">Free Cancellation</SelectItem>
                          <SelectItem value="Partial">Partially Refundable</SelectItem>
                          <SelectItem value="Non-Refundable">Non-Refundable</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    {/* Featured only */}
                    <BridalSeparator />
                    <BridalCheckRow
                      id="sponsored"
                      label="Featured Vendors Only"
                      icon={<Sparkles className="w-3.5 h-3.5 text-bridal-gold-dark" />}
                      strong
                      checked={filters.sponsored}
                      onChange={v => setFilters(p => ({ ...p, sponsored: !!v }))}
                    />

                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* ── Results column ── */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 px-4 py-3.5 bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_8px_24px_-20px_rgba(176,125,84,0.35)]">
              <div className="flex items-center gap-3 mb-3 sm:mb-0">
                {isLoading ? (
                  <span className="font-bridal text-[12px] uppercase tracking-[0.22em] text-bridal-text-soft">
                    Loading…
                  </span>
                ) : (
                  <span className="flex items-baseline gap-2">
                    <span className="font-display italic text-[20px] text-bridal-charcoal leading-none">
                      {filteredVendors.length}
                    </span>
                    <span className="font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-text-soft">
                      of {vendors.length} {vendors.length === 1 ? "result" : "results"}
                    </span>
                  </span>
                )}
                {activeCount > 0 && (
                  <span className="inline-flex items-center font-bridal text-[10.5px] uppercase tracking-[0.2em] font-medium px-2.5 py-1 rounded-full bg-bridal-blush text-bridal-mauve border border-bridal-rose/45">
                    {activeCount} filter{activeCount > 1 ? "s" : ""} active
                  </span>
                )}
              </div>
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-full sm:w-52 h-10 border-bridal-beige bg-bridal-ivory text-sm rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
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
              <div className="flex flex-wrap gap-2 mb-5">
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
                    <div className="bg-bridal-beige/60 aspect-[4/3] rounded-t-md" />
                    <div className="bg-bridal-cream p-4 rounded-b-md border border-bridal-beige border-t-0 space-y-2">
                      <div className="h-4 bg-bridal-beige/50 rounded w-3/4" />
                      <div className="h-3 bg-bridal-beige/50 rounded w-1/2" />
                      <div className="h-3 bg-bridal-beige/50 rounded w-2/3" />
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
                        reviews={
                          (vendor as any).reviewCount ?? vendor.reviews?.length ?? 0
                        }
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
                        business={vendor}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="col-span-full text-center py-20 px-6 bg-bridal-cream rounded-md border border-bridal-beige">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bridal-blush mb-4">
                    <Search className="w-6 h-6 text-bridal-mauve" />
                  </div>
                  <h3 className="font-display italic text-[24px] text-bridal-charcoal mb-2">
                    No vendors found
                  </h3>
                  <p className="font-bridal text-[13px] text-bridal-text-soft mb-6">
                    Try adjusting your filters to expand the search
                  </p>
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="inline-flex items-center justify-center h-11 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)]"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-10">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[4px] border border-bridal-beige bg-bridal-cream font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => {
                  const active = currentPage === page
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-[4px] font-display italic text-[15px] transition-all ${
                        active
                          ? "bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark shadow-[0_6px_18px_-10px_rgba(176,125,84,0.55)]"
                          : "bg-bridal-cream border border-bridal-beige text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark"
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-[4px] border border-bridal-beige bg-bridal-cream font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bridal sidebar primitives (module scope to avoid focus loss) ──

function FilterGroup({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <label className="font-bridal text-[10.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

function BridalSeparator() {
  return <Separator className="bg-bridal-beige/70" />
}

function BridalCheckRow({
  id,
  label,
  icon,
  checked,
  onChange,
  strong = false,
}: {
  id: string
  label: string
  icon?: React.ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  strong?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 group">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={v => onChange(!!v)}
        className="border-bridal-beige data-[state=checked]:bg-bridal-gold data-[state=checked]:text-bridal-charcoal data-[state=checked]:border-bridal-gold-dark transition-colors"
      />
      <label
        htmlFor={id}
        className={`font-bridal text-[13px] cursor-pointer flex items-center gap-1.5 ${
          strong ? "font-medium text-bridal-charcoal" : "text-bridal-charcoal/85 group-hover:text-bridal-charcoal"
        }`}
      >
        {icon}
        {label}
      </label>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-bridal-cream border border-bridal-gold/45 text-bridal-gold-dark font-bridal text-[11px] uppercase tracking-[0.18em] font-medium px-3 py-1 rounded-full shadow-[0_4px_12px_-8px_rgba(176,125,84,0.4)]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-full bg-bridal-beige/50 hover:bg-bridal-gold hover:text-bridal-charcoal transition-colors text-[14px] leading-none"
        aria-label="Remove filter"
      >
        ×
      </button>
    </span>
  )
}
