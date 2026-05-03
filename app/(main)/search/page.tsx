"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, MapPin, Star, Users, Filter, SortAsc, Award, Heart,
  DollarSign, ChevronLeft, ChevronRight,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import type { Vendor } from "@/lib/types"
import { VENDOR_TYPES } from "@/lib/vendor-types"
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

const VENDOR_CATEGORIES = [
  { display: "All Categories", value: "all" },
  { display: "Photographers", value: "photographers" },
  { display: "Makeup Artists", value: "makeup-artists" },
  { display: "Decorators", value: "decor" },
  { display: "Caterers", value: "catering" },
  { display: "Wedding Venues", value: "venues" },
  { display: "Bridal Wear", value: "bridal-wear" },
  { display: "Car Rental", value: "car-rental" },
  { display: "Henna Artists", value: "henna-artists" },
]

const AMENITIES_LIST = [
  "Parking", "Catering", "Decoration", "Music", "Photography",
  "Videography", "Makeup", "Transportation", "Accommodation", "WiFi",
  "Professional Equipment", "Album", "Video", "Flowers", "Lighting",
  "Backdrop", "Bridal Makeup", "Hair Styling", "Touch-ups", "Bridal Packages",
]

function SearchContent() {
  const router = useRouter()
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
    sortBy: "rating",
  })

  const query = searchParams?.get("q") || ""
  const category = searchParams?.get("category") || ""
  const location = searchParams?.get("location") || ""

  const { data: allVendors = [], isLoading, error } = useVendors()

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: query,
      category: category || "all",
      location,
    }))
  }, [query, category, location])

  const vendorMatchesCategory = (vendor: Vendor, category: string): boolean => {
    if (category === "all") return true
    const vendorName = vendor.name?.toLowerCase() || ""
    const vendorType = vendor.type || ""

    const map: Record<string, { type: string; keywords: string[] }> = {
      "photographers": { type: VENDOR_TYPES.PHOTOGRAPHER, keywords: ["photography", "studio", "camera", "lens", "shutter", "pixel", "frame", "capture", "moments", "shots"] },
      "makeup-artists": { type: VENDOR_TYPES.MAKEUP_ARTIST, keywords: ["makeup", "beauty", "glamour", "bridal beauty", "makeover", "stylish", "gorgeous"] },
      "decor": { type: VENDOR_TYPES.DECORATOR, keywords: ["decor", "sajawat", "event", "styling", "settings", "decoration", "floral", "arrangement", "design", "theme"] },
      "catering": { type: VENDOR_TYPES.CATERING, keywords: ["catering", "food", "restaurant", "kitchen", "dining", "cuisine", "meal", "banquet", "caterer", "chef"] },
      "venues": { type: VENDOR_TYPES.WEDDING_VENUE, keywords: ["venue", "hall", "resort", "hotel", "palace", "garden", "lawn", "banquet", "marriage", "wedding"] },
      "bridal-wear": { type: VENDOR_TYPES.BRIDAL_WEAR, keywords: ["bridal", "dress", "suit", "lehenga", "saree", "outfit", "fashion", "designer", "boutique", "clothing"] },
      "car-rental": { type: VENDOR_TYPES.CAR_RENTAL, keywords: ["car", "vehicle", "transport", "rental", "limousine", "luxury", "fleet", "cab", "taxi", "auto"] },
      "henna-artists": { type: VENDOR_TYPES.HENNA_ARTIST, keywords: ["henna", "mehendi", "artist", "design", "tattoo", "body art", "traditional", "decoration", "artwork"] },
    }

    const cfg = map[category]
    if (!cfg) return true
    if (vendorType === cfg.type) return true
    return cfg.keywords.some(k => vendorName.includes(k))
  }

  const filteredVendors = useMemo(() => {
    let filtered = [...allVendors]

    if (filters.search.trim()) {
      const s = filters.search.toLowerCase().trim()
      filtered = filtered.filter(v =>
        v.name?.toLowerCase().includes(s) ||
        v.location?.toLowerCase().includes(s) ||
        v.city?.toLowerCase().includes(s) ||
        v.type?.toLowerCase().includes(s) ||
        v.subBusinessType?.toLowerCase().includes(s)
      )
    }

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(v => vendorMatchesCategory(v, filters.category))
    }

    if (filters.location.trim()) {
      const l = filters.location.toLowerCase().trim()
      filtered = filtered.filter(v =>
        v.location?.toLowerCase().includes(l) || v.city?.toLowerCase().includes(l)
      )
    }

    filtered = filtered.filter(v => {
      const price = Number(v.minimumPrice || v.price || 0)
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    if (filters.rating > 0) {
      filtered = filtered.filter(v => Number(v.rating || 0) >= filters.rating)
    }

    if (filters.capacity > 0) {
      filtered = filtered.filter(v => Number(v.capacity || 0) >= filters.capacity)
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter(v => {
        if (!v.amenities?.length) return false
        return filters.amenities.some(a =>
          v.amenities.some(va => va.toLowerCase().includes(a.toLowerCase()))
        )
      })
    }

    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => Number(a.minimumPrice || a.price || 0) - Number(b.minimumPrice || b.price || 0))
        break
      case "price-high":
        filtered.sort((a, b) => Number(b.minimumPrice || b.price || 0) - Number(a.minimumPrice || a.price || 0))
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "recent":
        filtered.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
        break
      default:
        filtered.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        break
    }

    return filtered
  }, [allVendors, filters])

  const totalPages = Math.ceil(filteredVendors.length / 12)
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * 12, currentPage * 12)

  useEffect(() => { setCurrentPage(1) }, [filters])

  const setF = (key: keyof Filters, value: any) => setFilters(prev => ({ ...prev, [key]: value }))
  const clearFilters = () => setFilters({
    search: "", category: "all", location: "",
    priceRange: [0, 1000000], rating: 0, capacity: 0,
    amenities: [], sortBy: "rating",
  })

  const activeFilterCount = [
    !!filters.search,
    filters.category !== "all",
    !!filters.location,
    filters.rating > 0,
    filters.capacity > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000,
    filters.amenities.length > 0,
  ].filter(Boolean).length

  if (error) {
    return (
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bridal-blush mb-4">
            <Search className="w-6 h-6 text-bridal-mauve" />
          </div>
          <h3 className="font-display italic text-[28px] text-bridal-charcoal mb-2">
            Couldn’t load vendors
          </h3>
          <p className="font-bridal text-[13px] text-bridal-text-soft mb-6">
            Please try refreshing the page
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center h-11 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)]"
          >
            Refresh page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bridal-ivory">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden border-b border-bridal-beige/60 bg-bridal-hero">
        <div className="bg-mughal-jaal absolute inset-0 opacity-[0.06] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-14 lg:py-16 text-center">
          <p className="font-bridal text-[11px] sm:text-[12px] uppercase tracking-[0.4em] text-bridal-gold-dark mb-4">
            Search results
          </p>
          <h1 className="font-display italic text-[34px] sm:text-[44px] lg:text-[54px] leading-[1.05] text-bridal-charcoal mb-4">
            Curated for you
          </h1>
          <div className="mx-auto mb-5 h-[1px] w-24 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <p className="font-bridal text-[14px] sm:text-[15px] text-bridal-text-soft max-w-2xl mx-auto leading-relaxed">
            <span className="font-display italic text-bridal-charcoal text-[20px] mr-1.5">{filteredVendors.length}</span>
            vendors found
            {filters.search && <> for <span className="text-bridal-gold-dark">“{filters.search}”</span></>}
            {filters.category !== "all" && <> in <span className="text-bridal-gold-dark">{VENDOR_CATEGORIES.find(c => c.value === filters.category)?.display}</span></>}
            {filters.location && <> in <span className="text-bridal-gold-dark">{filters.location}</span></>}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-12 py-6 sm:py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-5 sm:gap-6 lg:gap-8">
          {/* Sticky Filters Sidebar */}
          <aside className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:self-start">
            <div className="lg:sticky lg:top-24">
              <Card className="border border-bridal-beige bg-bridal-cream rounded-md max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]">
                <CardHeader className="pb-3 border-b border-bridal-beige bg-bridal-ivory flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display italic text-[18px] text-bridal-charcoal flex items-center gap-2">
                      <Filter className="w-4 h-4 text-bridal-gold" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-1 bg-bridal-gold text-bridal-charcoal font-bridal text-[10px] font-medium tracking-[0.15em] px-1.5 py-0.5 rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </CardTitle>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
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
                      <Input
                        placeholder="Search vendors…"
                        value={filters.search}
                        onChange={e => setF("search", e.target.value)}
                        className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:ring-bridal-gold focus-visible:ring-1 focus-visible:border-bridal-gold/55"
                      />
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Category */}
                    <FilterGroup icon={<Award className="w-3.5 h-3.5 text-bridal-gold" />} label="Category">
                      <Select value={filters.category} onValueChange={v => setF("category", v)}>
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          {VENDOR_CATEGORIES.map(c => (
                            <SelectItem key={c.value} value={c.value}>{c.display}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Location */}
                    <FilterGroup icon={<MapPin className="w-3.5 h-3.5 text-bridal-gold" />} label="Location">
                      <Input
                        placeholder="Enter city…"
                        value={filters.location}
                        onChange={e => setF("location", e.target.value)}
                        className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:ring-bridal-gold focus-visible:ring-1 focus-visible:border-bridal-gold/55"
                      />
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Price Range */}
                    <FilterGroup icon={<DollarSign className="w-3.5 h-3.5 text-bridal-gold" />} label="Price Range">
                      <Slider
                        value={filters.priceRange}
                        onValueChange={v => setF("priceRange", v)}
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
                      <Select value={filters.rating.toString()} onValueChange={v => setF("rating", parseFloat(v))}>
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue placeholder="Any rating" />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          <SelectItem value="0">Any rating</SelectItem>
                          <SelectItem value="3">3+ stars ★★★</SelectItem>
                          <SelectItem value="4">4+ stars ★★★★</SelectItem>
                          <SelectItem value="4.5">4.5+ stars ★★★★½</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Capacity */}
                    <FilterGroup icon={<Users className="w-3.5 h-3.5 text-bridal-gold" />} label="Minimum Capacity">
                      <Select value={filters.capacity.toString()} onValueChange={v => setF("capacity", parseInt(v))}>
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue placeholder="Any capacity" />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          <SelectItem value="0">Any capacity</SelectItem>
                          <SelectItem value="50">50+ guests</SelectItem>
                          <SelectItem value="100">100+ guests</SelectItem>
                          <SelectItem value="200">200+ guests</SelectItem>
                          <SelectItem value="500">500+ guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Sort */}
                    <FilterGroup icon={<SortAsc className="w-3.5 h-3.5 text-bridal-gold" />} label="Sort By">
                      <Select value={filters.sortBy} onValueChange={v => setF("sortBy", v)}>
                        <SelectTrigger className="h-10 text-sm border-bridal-beige bg-bridal-ivory rounded-[4px] font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-bridal-cream border-bridal-beige rounded-md">
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="price-low">Price: Low to High</SelectItem>
                          <SelectItem value="price-high">Price: High to Low</SelectItem>
                          <SelectItem value="name">Name: A to Z</SelectItem>
                          <SelectItem value="recent">Most Recent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterGroup>

                    <BridalSeparator />

                    {/* Amenities */}
                    <FilterGroup icon={<Heart className="w-3.5 h-3.5 text-bridal-gold" />} label="Amenities">
                      <div className="space-y-2">
                        {AMENITIES_LIST.map(a => (
                          <BridalCheckRow
                            key={a}
                            id={`am-${a}`}
                            label={a}
                            checked={filters.amenities.includes(a)}
                            onChange={(v) => {
                              if (v) setF("amenities", [...filters.amenities, a])
                              else setF("amenities", filters.amenities.filter(x => x !== a))
                            }}
                          />
                        ))}
                      </div>
                    </FilterGroup>

                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Results Section */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 px-4 py-3.5 bg-bridal-cream rounded-md border border-bridal-beige shadow-[0_8px_24px_-20px_rgba(176,125,84,0.35)]">
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
                    of {allVendors.length} {allVendors.length === 1 ? "result" : "results"}
                  </span>
                </span>
              )}

              {activeFilterCount > 0 && (
                <span className="inline-flex items-center font-bridal text-[10.5px] uppercase tracking-[0.2em] font-medium px-2.5 py-1 rounded-full bg-bridal-blush text-bridal-mauve border border-bridal-rose/45">
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                </span>
              )}
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {filters.search && <FilterChip label={`"${filters.search}"`} onRemove={() => setF("search", "")} />}
                {filters.category && filters.category !== "all" && (
                  <FilterChip label={VENDOR_CATEGORIES.find(c => c.value === filters.category)?.display ?? filters.category} onRemove={() => setF("category", "all")} />
                )}
                {filters.location && <FilterChip label={filters.location} onRemove={() => setF("location", "")} />}
                {filters.rating > 0 && <FilterChip label={`${filters.rating}+ stars`} onRemove={() => setF("rating", 0)} />}
                {filters.capacity > 0 && <FilterChip label={`${filters.capacity}+ guests`} onRemove={() => setF("capacity", 0)} />}
                {filters.amenities.map(a => (
                  <FilterChip key={a} label={a} onRemove={() => setF("amenities", filters.amenities.filter(x => x !== a))} />
                ))}
              </div>
            )}

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-bridal-beige/60 aspect-[4/3] rounded-t-md" />
                    <div className="bg-bridal-cream p-4 rounded-b-md border border-bridal-beige border-t-0 space-y-2">
                      <div className="h-4 bg-bridal-beige/50 rounded w-3/4" />
                      <div className="h-3 bg-bridal-beige/50 rounded w-1/2" />
                      <div className="h-3 bg-bridal-beige/50 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-20 px-6 bg-bridal-cream rounded-md border border-bridal-beige">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-bridal-blush mb-4">
                  <Search className="w-6 h-6 text-bridal-mauve" />
                </div>
                <h3 className="font-display italic text-[24px] text-bridal-charcoal mb-2">
                  No vendors found
                </h3>
                <p className="font-bridal text-[13px] text-bridal-text-soft mb-6">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center h-11 px-7 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-all duration-300 shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)]"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                          reviews={Array.isArray(vendor.reviews) ? vendor.reviews.length : 0}
                          price={vendor.minimumPrice || vendor.price}
                          type={vendor.type || vendor.subBusinessType}
                          capacity={vendor.capacity}
                          amenities={vendor.amenities}
                          sponsored={vendor.sponsored}
                          business={vendor}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bridal sidebar primitives ──

function FilterGroup({
  icon, label, children,
}: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
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
  id, label, checked, onChange,
}: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
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
        className="font-bridal text-[13px] cursor-pointer text-bridal-charcoal/85 group-hover:text-bridal-charcoal"
      >
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bridal-ivory flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-bridal-gold border-t-transparent" />
          <span className="font-bridal text-[12px] uppercase tracking-[0.25em] text-bridal-text-soft">
            Loading search…
          </span>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
