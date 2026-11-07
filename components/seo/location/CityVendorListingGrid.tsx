"use client"

import React, { useState, useMemo, useId } from "react"
import Link from "next/link"
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  MapPin,
  Star,
  ShieldCheck,
  ArrowUpDown,
} from "lucide-react"
import VendorCard from "@/components/VendorCard"
import type { VendorListItem } from "@/lib/seo/fetch-vendors"

export interface CityVendorListingGridProps {
  initialVendors: VendorListItem[]
  categoryLabel: string
  categoryPlural: string
  cityName: string
  citySlug: string
  typeSlug: string
  waLink: string
}

type PriceFilterKey = "all" | "under-100k" | "100k-300k" | "300k-600k" | "600k-plus"
type SortKey = "recommended" | "rating-desc" | "reviews-desc" | "price-asc" | "price-desc"

export function CityVendorListingGrid({
  initialVendors,
  categoryLabel,
  categoryPlural,
  cityName,
  citySlug,
  typeSlug,
  waLink,
}: CityVendorListingGridProps) {
  const [search, setSearch] = useState("")
  const [priceFilter, setPriceFilter] = useState<PriceFilterKey>("all")
  const [minRating, setMinRating] = useState<number>(0)
  const [selectedArea, setSelectedArea] = useState<string>("all")
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<SortKey>("recommended")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Unique sub-areas / localities extracted from vendor listings
  const availableAreas = useMemo(() => {
    const areas = new Set<string>()
    for (const v of initialVendors) {
      const area = v.subArea || v.areaServed
      if (area && area.trim().length > 1 && area.trim().toLowerCase() !== cityName.toLowerCase()) {
        areas.add(area.trim())
      }
    }
    return Array.from(areas).sort((a, b) => a.localeCompare(b))
  }, [initialVendors, cityName])

  // Filtered & sorted vendor list
  const filteredVendors = useMemo(() => {
    let result = [...initialVendors]

    // 1. Text Search (name, area, description, specialties)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((v) => {
        const nameMatch = v.name?.toLowerCase().includes(q)
        const areaMatch =
          v.subArea?.toLowerCase().includes(q) ||
          v.areaServed?.toLowerCase().includes(q) ||
          v.city?.toLowerCase().includes(q)
        const descMatch = v.description?.toLowerCase().includes(q)
        const specMatch = v.specialties?.some((s) => s.toLowerCase().includes(q))
        return nameMatch || areaMatch || descMatch || specMatch
      })
    }

    // 2. Budget / Price Range
    if (priceFilter !== "all") {
      result = result.filter((v) => {
        const p = v.priceMin
        if (p == null || !Number.isFinite(p) || p <= 0) return false
        switch (priceFilter) {
          case "under-100k":
            return p <= 100000
          case "100k-300k":
            return p >= 100000 && p <= 300000
          case "300k-600k":
            return p >= 300000 && p <= 600000
          case "600k-plus":
            return p >= 600000
          default:
            return true
        }
      })
    }

    // 3. Rating
    if (minRating > 0) {
      result = result.filter((v) => (v.rating || 0) >= minRating)
    }

    // 4. Area / Locality
    if (selectedArea !== "all") {
      result = result.filter((v) => {
        const area = v.subArea || v.areaServed || ""
        return area.toLowerCase() === selectedArea.toLowerCase()
      })
    }

    // 5. Verified Only
    if (verifiedOnly) {
      result = result.filter((v) => {
        const tier = v.verificationTier ?? 0
        const isApproved = v.status === "approved"
        return tier >= 1 || isApproved
      })
    }

    // 6. Sorting
    switch (sortBy) {
      case "rating-desc":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      case "reviews-desc":
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || (b.rating || 0) - (a.rating || 0))
        break
      case "price-asc":
        result.sort((a, b) => {
          const pa = a.priceMin ?? Infinity
          const pb = b.priceMin ?? Infinity
          return pa - pb
        })
        break
      case "price-desc":
        result.sort((a, b) => {
          const pa = a.priceMin ?? -Infinity
          const pb = b.priceMin ?? -Infinity
          return pb - pa
        })
        break
      case "recommended":
      default:
        // Keep initial server-curated rank
        break
    }

    return result
  }, [initialVendors, search, priceFilter, minRating, selectedArea, verifiedOnly, sortBy])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search.trim()) count++
    if (priceFilter !== "all") count++
    if (minRating > 0) count++
    if (selectedArea !== "all") count++
    if (verifiedOnly) count++
    return count
  }, [search, priceFilter, minRating, selectedArea, verifiedOnly])

  const handleResetFilters = () => {
    setSearch("")
    setPriceFilter("all")
    setMinRating(0)
    setSelectedArea("all")
    setVerifiedOnly(false)
    setSortBy("recommended")
  }

  return (
    <div className="space-y-6">
      {/* ── LUXURY FILTER CONTROL BAR ── */}
      <div className="rounded-2xl border border-bridal-beige bg-bridal-cream/80 p-4 shadow-sm backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search + Mobile Toggle + Sort Dropdown */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bridal-gold-dark" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${categoryPlural.toLowerCase()} by name, area, specialty...`}
                className="w-full rounded-xl border border-bridal-beige/90 bg-bridal-ivory/95 py-2.5 pl-10 pr-9 font-bridal text-[13.5px] text-bridal-charcoal placeholder:text-bridal-text-label/70 focus:border-bridal-gold focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-bridal-text-soft hover:bg-bridal-sand/40 hover:text-bridal-charcoal transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 font-bridal text-[12px] uppercase tracking-[0.16em] font-medium transition-all ${
                  mobileFiltersOpen || activeFilterCount > 0
                    ? "border-bridal-gold bg-bridal-gold/15 text-bridal-gold-dark"
                    : "border-bridal-beige bg-bridal-ivory/90 text-bridal-charcoal hover:border-bridal-gold/50"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bridal-gold text-[10px] font-semibold text-bridal-charcoal">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Mobile Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="appearance-none rounded-xl border border-bridal-beige bg-bridal-ivory/90 py-2.5 pl-3 pr-8 font-bridal text-[12px] uppercase tracking-[0.14em] font-medium text-bridal-charcoal focus:border-bridal-gold focus:outline-none"
                >
                  <option value="recommended">Featured</option>
                  <option value="rating-desc">Rating</option>
                  <option value="reviews-desc">Reviews</option>
                  <option value="price-asc">Price: Low</option>
                  <option value="price-desc">Price: High</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-text-soft" />
              </div>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <span className="flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                <ArrowUpDown className="h-3 w-3 text-bridal-gold-dark" />
                Sort:
              </span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="appearance-none rounded-xl border border-bridal-beige/90 bg-bridal-ivory/95 py-2 pl-3 pr-8 font-bridal text-[12px] uppercase tracking-[0.14em] font-medium text-bridal-charcoal hover:border-bridal-gold/60 focus:border-bridal-gold focus:outline-none focus:ring-1 focus:ring-bridal-gold/30 transition-all cursor-pointer"
                >
                  <option value="recommended">Featured / Recommended</option>
                  <option value="rating-desc">Highest Rated</option>
                  <option value="reviews-desc">Most Reviewed</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-text-soft" />
              </div>
            </div>
          </div>

          {/* Filter Controls Row (Expanded on desktop, toggleable on mobile) */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-bridal-beige/70 ${
              mobileFiltersOpen ? "block" : "hidden md:grid"
            }`}
          >
            {/* 1. Budget / Price Range */}
            <div className="relative">
              <label className="block mb-1 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                Budget Range
              </label>
              <div className="relative">
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value as PriceFilterKey)}
                  className="w-full appearance-none rounded-xl border border-bridal-beige/90 bg-bridal-ivory/95 py-2 px-3 pr-8 font-bridal text-[12px] text-bridal-charcoal hover:border-bridal-gold/60 focus:border-bridal-gold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="all">All Prices</option>
                  <option value="under-100k">Under PKR 100,000</option>
                  <option value="100k-300k">PKR 100k – 300,000</option>
                  <option value="300k-600k">PKR 300k – 600,000</option>
                  <option value="600k-plus">PKR 600,000+</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-text-soft" />
              </div>
            </div>

            {/* 2. Rating */}
            <div className="relative">
              <label className="block mb-1 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                Minimum Rating
              </label>
              <div className="relative">
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-bridal-beige/90 bg-bridal-ivory/95 py-2 px-3 pr-8 font-bridal text-[12px] text-bridal-charcoal hover:border-bridal-gold/60 focus:border-bridal-gold focus:outline-none transition-all cursor-pointer"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.5}>★ 4.5 & up (Top Rated)</option>
                  <option value={4.0}>★ 4.0 & up (Very Good)</option>
                  <option value={3.5}>★ 3.5 & up (Good)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-text-soft" />
              </div>
            </div>

            {/* 3. Area / Locality */}
            <div className="relative">
              <label className="block mb-1 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                Locality / Area
              </label>
              <div className="relative">
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-bridal-beige/90 bg-bridal-ivory/95 py-2 px-3 pr-8 font-bridal text-[12px] text-bridal-charcoal hover:border-bridal-gold/60 focus:border-bridal-gold focus:outline-none transition-all cursor-pointer"
                >
                  <option value="all">All of {cityName}</option>
                  {availableAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-text-soft" />
              </div>
            </div>

            {/* 4. Verified Only Toggle */}
            <div className="flex flex-col justify-end">
              <label className="block mb-1 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">
                Trust & Verification
              </label>
              <button
                type="button"
                onClick={() => setVerifiedOnly((prev) => !prev)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2 px-3 font-bridal text-[12px] font-medium transition-all ${
                  verifiedOnly
                    ? "border-bridal-gold bg-bridal-gold/20 text-bridal-charcoal font-semibold shadow-xs"
                    : "border-bridal-beige/90 bg-bridal-ivory/95 text-bridal-text-soft hover:border-bridal-gold/60 hover:text-bridal-charcoal"
                }`}
              >
                <ShieldCheck
                  className={`h-4 w-4 ${verifiedOnly ? "text-bridal-gold-dark" : "text-bridal-text-label"}`}
                />
                Verified Only
                {verifiedOnly && <Check className="h-3.5 w-3.5 text-bridal-gold-dark" />}
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Clear Button */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-bridal-beige/60">
              <span className="font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-text-label">
                Active filters:
              </span>

              {search.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 px-2.5 py-0.5 font-bridal text-[11px] text-bridal-charcoal">
                  Search: &ldquo;{search}&rdquo;
                  <button type="button" onClick={() => setSearch("")} className="hover:text-bridal-gold-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {priceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 px-2.5 py-0.5 font-bridal text-[11px] text-bridal-charcoal">
                  Price:{" "}
                  {priceFilter === "under-100k"
                    ? "< 100k"
                    : priceFilter === "100k-300k"
                    ? "100k-300k"
                    : priceFilter === "300k-600k"
                    ? "300k-600k"
                    : "600k+"}
                  <button type="button" onClick={() => setPriceFilter("all")} className="hover:text-bridal-gold-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 px-2.5 py-0.5 font-bridal text-[11px] text-bridal-charcoal">
                  ★ {minRating}+
                  <button type="button" onClick={() => setMinRating(0)} className="hover:text-bridal-gold-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedArea !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 px-2.5 py-0.5 font-bridal text-[11px] text-bridal-charcoal">
                  Area: {selectedArea}
                  <button type="button" onClick={() => setSelectedArea("all")} className="hover:text-bridal-gold-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {verifiedOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 px-2.5 py-0.5 font-bridal text-[11px] text-bridal-charcoal">
                  Verified Only
                  <button type="button" onClick={() => setVerifiedOnly(false)} className="hover:text-bridal-gold-dark">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bridal uppercase tracking-[0.16em] text-bridal-gold-dark hover:underline ml-1"
              >
                <RotateCcw className="h-3 w-3" />
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── POPULAR LOCALITIES QUICK-FILTER PILLS ── */}
      {availableAreas.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
          <span className="shrink-0 font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-text-label font-medium mr-1">
            Areas:
          </span>
          <button
            type="button"
            onClick={() => setSelectedArea("all")}
            className={`shrink-0 rounded-full px-3 py-1 font-bridal text-[12px] font-medium transition-all ${
              selectedArea === "all"
                ? "bg-bridal-gold text-bridal-charcoal font-semibold shadow-xs"
                : "border border-bridal-beige bg-bridal-ivory/80 text-bridal-text-soft hover:border-bridal-gold/60 hover:text-bridal-charcoal"
            }`}
          >
            All {cityName}
          </button>
          {availableAreas.map((area) => {
            const isSelected = selectedArea.toLowerCase() === area.toLowerCase();
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(isSelected ? "all" : area)}
                className={`shrink-0 rounded-full px-3 py-1 font-bridal text-[12px] font-medium transition-all ${
                  isSelected
                    ? "bg-bridal-gold text-bridal-charcoal font-semibold shadow-xs"
                    : "border border-bridal-beige bg-bridal-ivory/80 text-bridal-text-soft hover:border-bridal-gold/60 hover:text-bridal-charcoal"
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>
      )}

      {/* Results Header Counter */}
      <div className="flex items-center justify-between px-1">
        <p className="font-bridal text-[13px] text-bridal-text-soft">
          Showing{" "}
          <span className="font-semibold text-bridal-charcoal">{filteredVendors.length}</span>{" "}
          {filteredVendors.length === 1 ? categoryLabel.toLowerCase() : categoryPlural.toLowerCase()}{" "}
          in <span className="font-medium text-bridal-charcoal">{cityName}</span>
          {activeFilterCount > 0 && ` (filtered from ${initialVendors.length})`}
        </p>

        {filteredVendors.length > 0 && (
          <span className="hidden sm:inline-flex items-center gap-1.5 font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold-dark font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Direct Booking & Quotes
          </span>
        )}
      </div>

      {/* ── CARD GRID ── */}
      {filteredVendors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bridal-gold/40 bg-bridal-cream/40 p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bridal-gold/10 font-display text-[22px] italic text-bridal-gold-dark">
            ✦
          </span>
          <h3 className="mt-4 font-display italic text-[22px] text-bridal-charcoal">
            No matching {categoryPlural.toLowerCase()} found
          </h3>
          <p className="mx-auto mt-2 max-w-md font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
            No listings in {cityName} matched your current filter selection. Try expanding your budget range or clearing search criteria.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 rounded-xl bg-bridal-gold px-5 py-2.5 font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory transition-all shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset all filters
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-bridal-beige bg-bridal-ivory px-5 py-2.5 font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-charcoal hover:border-bridal-gold/60 transition-all"
            >
              Ask Concierge on WhatsApp &rarr;
            </a>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((v, idx) => {
            const loc = v.subArea ? `${v.subArea}, ${v.city}` : v.city
            return (
              <li key={v.id} className="h-full">
                <VendorCard
                  id={v.id}
                  name={v.name}
                  image={v.imageUrl || "/placeholder.svg"}
                  location={loc}
                  rating={v.rating}
                  reviews={v.reviewCount}
                  price={v.priceMin}
                  type={categoryLabel}
                  vendorType={v.vendorType || categoryLabel}
                  capacity={v.capacity}
                  href={v.href}
                  business={v.raw || v}
                  priority={idx === 0}
                  className="h-full"
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
