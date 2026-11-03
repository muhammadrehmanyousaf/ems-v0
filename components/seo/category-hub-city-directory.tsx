"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Search,
  X,
  MapPin,
  Sparkles,
  ArrowRight,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Building2,
  Compass,
} from "lucide-react"

export interface CityItem {
  readonly slug: string
  readonly name: string
  readonly region: string
}

export interface CategoryHubCityDirectoryProps {
  cities: readonly CityItem[]
  typeSlug: string
  categorySingular: string
  categoryPlural: string
  waLink: string
}

interface CityMeta {
  image?: string
  tag?: string
  popularAreas?: string
  peak?: string
}

const CITY_METADATA: Record<string, CityMeta> = {
  karachi: {
    image: "/images/home/cities/karachi.jpg",
    tag: "Major Hub",
    popularAreas: "DHA, Clifton, PECHS & Bahria Town",
    peak: "Nov–Feb",
  },
  lahore: {
    image: "/images/home/cities/lahore.jpg",
    tag: "Wedding Capital",
    popularAreas: "Gulberg, DHA, Johar Town & Model Town",
    peak: "Oct–Mar",
  },
  islamabad: {
    image: "/images/home/cities/islamabad.jpg",
    tag: "Capital Destination",
    popularAreas: "F-sectors, Bani Gala & Serena",
    peak: "Oct–Mar",
  },
  faisalabad: {
    image: "/images/home/cities/faisalabad.jpg",
    tag: "Major Hub",
    popularAreas: "Madina Town, D-Ground & Susan Road",
    peak: "Nov–Feb",
  },
  rawalpindi: {
    tag: "Twin City Hub",
    popularAreas: "Bahria Phase 1–8, Saddar & Westridge",
    peak: "Oct–Mar",
  },
  multan: {
    tag: "City of Saints",
    popularAreas: "Gulgasht, Bosan Road & Cantt",
    peak: "Nov–Feb",
  },
  peshawar: {
    tag: "KPK Capital",
    popularAreas: "University Town, Hayatabad & Cantt",
    peak: "Oct–Mar",
  },
  sialkot: {
    tag: "Top Hub",
    popularAreas: "Cantt, Paris Road & Defense Road",
    peak: "Nov–Feb",
  },
  gujranwala: {
    tag: "Top Hub",
    popularAreas: "DC Colony, Model Town & Cantt",
    peak: "Nov–Feb",
  },
  hyderabad: {
    tag: "Sindh Hub",
    popularAreas: "Qasimabad, Latifabad & Auto Bhan",
    peak: "Nov–Feb",
  },
  quetta: {
    tag: "Balochistan Hub",
    popularAreas: "Cantonment, Jinnah Road & Airport Road",
    peak: "Apr–Oct",
  },
  abbottabad: {
    tag: "Hill Station",
    popularAreas: "Mandian, Supply & Cantt",
    peak: "May–Sep",
  },
  bahawalpur: {
    tag: "Heritage Hub",
    popularAreas: "Model Town, Cantt & One Unit",
    peak: "Nov–Feb",
  },
  sargodha: {
    tag: "Central Hub",
    popularAreas: "Satellite Town & University Road",
    peak: "Nov–Feb",
  },
  sheikhupura: {
    tag: "Popular Hub",
    popularAreas: "Housing Colony & Stadium Road",
    peak: "Nov–Feb",
  },
  sukkur: {
    tag: "Sindh Hub",
    popularAreas: "Military Road & Barrage Colony",
    peak: "Nov–Feb",
  },
  larkana: {
    tag: "Sindh Destination",
    popularAreas: "VIP Road & Station Road",
    peak: "Nov–Feb",
  },
  mardan: {
    tag: "KPK Hub",
    popularAreas: "Baghdada & Sheikh Maltoon",
    peak: "Oct–Mar",
  },
  mingora: {
    tag: "Swat Destination",
    popularAreas: "Saidu Sharif & Fizzagat",
    peak: "Apr–Sep",
  },
  gilgit: {
    tag: "Northern Destination",
    popularAreas: "Jutial & River View Road",
    peak: "May–Oct",
  },
}

export function CategoryHubCityDirectory({
  cities,
  typeSlug,
  categorySingular,
  categoryPlural,
  waLink,
}: CategoryHubCityDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")

  // Regional breakdown counts
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: cities.length,
      punjab: 0,
      sindh: 0,
      islamabad: 0,
      kpk: 0,
      balochistan: 0,
      other: 0,
    }

    for (const c of cities) {
      const r = c.region.toLowerCase()
      if (r.includes("islamabad") || c.slug === "rawalpindi") {
        counts.islamabad++
      }
      if (r === "punjab" && c.slug !== "rawalpindi") {
        counts.punjab++
      } else if (r === "sindh") {
        counts.sindh++
      } else if (r.includes("khyber") || r.includes("kpk")) {
        counts.kpk++
      } else if (r.includes("balochistan")) {
        counts.balochistan++
      } else if (!r.includes("islamabad") && r !== "punjab" && r !== "sindh") {
        counts.other++
      }
    }
    return counts
  }, [cities])

  // Filtered cities based on search + selected region
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return cities.filter((c) => {
      // If user typed a search query, search nationwide across all cities
      if (q) {
        const meta = CITY_METADATA[c.slug]
        const nameMatch = c.name.toLowerCase().includes(q)
        const regionMatch = c.region.toLowerCase().includes(q)
        const areaMatch = meta?.popularAreas?.toLowerCase().includes(q)
        const tagMatch = meta?.tag?.toLowerCase().includes(q)
        return Boolean(nameMatch || regionMatch || areaMatch || tagMatch)
      }

      // If no search query, filter by selected province/region
      if (selectedRegion !== "all") {
        const r = c.region.toLowerCase()
        if (selectedRegion === "islamabad") {
          return r.includes("islamabad") || c.slug === "rawalpindi" || c.name.toLowerCase() === "islamabad"
        } else if (selectedRegion === "punjab") {
          return r === "punjab" && c.slug !== "rawalpindi"
        } else if (selectedRegion === "sindh") {
          return r === "sindh"
        } else if (selectedRegion === "kpk") {
          return r.includes("khyber") || r.includes("kpk")
        } else if (selectedRegion === "balochistan") {
          return r.includes("balochistan")
        } else if (selectedRegion === "other") {
          return !["punjab", "sindh", "balochistan"].includes(r) && !r.includes("khyber") && !r.includes("islamabad")
        }
      }

      return true
    })
  }, [cities, selectedRegion, searchQuery])

  const handleReset = () => {
    setSearchQuery("")
    setSelectedRegion("all")
  }

  return (
    <section id="city-directory" className="mb-16 scroll-mt-24">
      {/* ── SECTION HEADER ── */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <span className="bridal-crown">
          <span className="bridal-label">Nationwide Coverage</span>
        </span>
        <h2 className="mt-3 font-display italic text-[28px] sm:text-[36px] text-bridal-charcoal leading-tight">
          Browse {categoryPlural.toLowerCase()} by city
        </h2>
        <p className="mt-3 font-bridal text-[15px] text-bridal-text-soft leading-relaxed">
          Select your wedding city to explore verified {categoryPlural.toLowerCase()}, indicative pricing, customer reviews, and direct availability.
        </p>
      </div>

      {/* ── INTERACTIVE SEARCH & REGION FILTERS ── */}
      <div className="rounded-2xl border border-bridal-beige bg-bridal-cream/70 p-4 sm:p-6 shadow-sm backdrop-blur mb-8">
        <div className="flex flex-col gap-4">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bridal-gold-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search city or area for ${categoryPlural.toLowerCase()} (e.g. Lahore, Karachi, Islamabad, Clifton, Gulberg)...`}
              className="w-full rounded-xl border border-bridal-beige/90 bg-white py-3 pl-11 pr-10 font-bridal text-[14px] text-bridal-charcoal placeholder:text-bridal-text-label/70 focus:border-bridal-gold focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-bridal-text-soft hover:bg-bridal-sand/40 hover:text-bridal-charcoal transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Province / Region Quick-Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-text-label shrink-0 mr-1 hidden sm:inline-block">
              Region:
            </span>

            {[
              { id: "all", label: "All Cities", count: regionCounts.all },
              { id: "punjab", label: "Punjab", count: regionCounts.punjab },
              { id: "sindh", label: "Sindh", count: regionCounts.sindh },
              { id: "islamabad", label: "Islamabad & Pindi", count: regionCounts.islamabad },
              { id: "kpk", label: "KPK", count: regionCounts.kpk },
              { id: "balochistan", label: "Balochistan", count: regionCounts.balochistan },
              ...(regionCounts.other > 0 ? [{ id: "other", label: "Other Regions", count: regionCounts.other }] : []),
            ].map((r) => {
              const active = selectedRegion === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRegion(r.id)
                    setSearchQuery("")
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bridal text-[12px] uppercase tracking-[0.12em] font-medium transition-all shrink-0 ${
                    active
                      ? "bg-bridal-gold text-bridal-charcoal font-semibold shadow-xs"
                      : "border border-bridal-beige bg-bridal-ivory/80 text-bridal-charcoal hover:border-bridal-gold/60 hover:bg-white"
                  }`}
                >
                  {r.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? "bg-bridal-charcoal text-bridal-ivory" : "bg-bridal-beige/60 text-bridal-text-soft"
                    }`}
                  >
                    {r.count}
                  </span>
                </button>
              )
            })}

            {(searchQuery.trim() || selectedRegion !== "all") && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[11px] font-bridal uppercase tracking-[0.16em] text-bridal-gold-dark hover:underline ml-auto shrink-0 pl-2"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Counter Bar */}
      <div className="flex items-center justify-between px-1 mb-5">
        <p className="font-bridal text-[13px] text-bridal-text-soft">
          Showing{" "}
          <span className="font-semibold text-bridal-charcoal">{filteredCities.length}</span>{" "}
          {filteredCities.length === 1 ? "Pakistani city" : "Pakistani cities"} for {categoryPlural.toLowerCase()}
          {selectedRegion !== "all" && ` in ${selectedRegion.toUpperCase()}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>

        <span className="hidden sm:inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.16em] text-bridal-gold-dark font-medium">
          <Compass className="h-3.5 w-3.5" />
          Direct Local Quotes
        </span>
      </div>

      {/* ── CITY CARDS GRID ── */}
      {filteredCities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-bridal-gold/40 bg-bridal-cream/40 p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-bridal-gold/10 font-display text-[22px] italic text-bridal-gold-dark">
            ✦
          </span>
          <h3 className="mt-4 font-display italic text-[22px] text-bridal-charcoal">
            No cities found matching &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="mx-auto mt-2 max-w-md font-bridal text-[14px] leading-relaxed text-bridal-text-soft">
            We couldn&apos;t find a city matching your search. Try checking your spelling or clear filters to view all {cities.length} covered cities.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-bridal-gold px-5 py-2.5 font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-charcoal hover:bg-bridal-gold-dark hover:text-bridal-ivory transition-all shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              View all cities
            </button>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-bridal-beige bg-bridal-ivory px-5 py-2.5 font-bridal text-[12px] uppercase tracking-[0.18em] font-medium text-bridal-charcoal hover:border-bridal-gold/60 transition-all"
            >
              Ask on WhatsApp &rarr;
            </a>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCities.map((c) => {
            const meta = CITY_METADATA[c.slug]
            const href = `/${typeSlug}/${c.slug}`

            return (
              <li key={c.slug} className="h-full">
                <Link
                  href={href}
                  className="group flex flex-col justify-between h-full rounded-2xl border border-bridal-beige bg-white/90 hover:bg-bridal-cream/40 hover:border-bridal-gold/80 transition-all duration-300 hover:-translate-y-1.5 shadow-[0_2px_12px_rgba(176,125,84,0.06)] hover:shadow-[0_20px_45px_-18px_rgba(176,125,84,0.35)] overflow-hidden relative"
                >
                  {/* Card Header (Photo Banner for Hub Cities or Luxury Gradient Strip) */}
                  {meta?.image ? (
                    <div className="relative h-28 w-full overflow-hidden bg-bridal-cream">
                      <Image
                        src={meta.image}
                        alt={`${c.name} wedding venues and vendors`}
                        fill
                        className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/80 via-bridal-charcoal/25 to-transparent" />

                      {/* Top floating pills on image */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-ivory/90 backdrop-blur-xs font-bridal text-[10px] uppercase tracking-[0.16em] text-bridal-charcoal font-medium">
                          <MapPin className="w-2.5 h-2.5 text-bridal-gold-dark" />
                          {c.region}
                        </span>

                        {meta.tag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-gold/95 backdrop-blur-xs font-bridal text-[9.5px] uppercase tracking-[0.16em] text-bridal-charcoal font-semibold shadow-xs">
                            <Sparkles className="w-2.5 h-2.5 text-bridal-charcoal" />
                            {meta.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative pt-3.5 px-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bridal-ivory border border-bridal-beige font-bridal text-[10px] uppercase tracking-[0.16em] text-bridal-text-soft font-medium">
                        <MapPin className="w-2.5 h-2.5 text-bridal-gold-dark" />
                        {c.region}
                      </span>

                      {meta?.tag ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-gold/15 border border-bridal-gold/30 font-bridal text-[9.5px] uppercase tracking-[0.16em] text-bridal-gold-dark font-semibold">
                          {meta.tag}
                        </span>
                      ) : (
                        <span className="font-bridal text-[10px] text-bridal-text-label uppercase tracking-[0.14em]">
                          Pakistan
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Main Info */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal group-hover:text-bridal-gold-dark transition-colors leading-tight">
                        {c.name}
                      </h3>
                      <p className="font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold-dark font-medium mt-1">
                        {categoryPlural}
                      </p>

                      {/* Informative Highlights */}
                      {meta?.popularAreas ? (
                        <div className="mt-3 flex items-start gap-1.5 text-[12px] font-bridal text-bridal-text-soft leading-snug">
                          <Building2 className="w-3.5 h-3.5 text-bridal-gold-dark shrink-0 mt-0.5" />
                          <span>
                            Key areas: <strong className="font-medium text-bridal-charcoal">{meta.popularAreas}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-start gap-1.5 text-[12px] font-bridal text-bridal-text-soft leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-bridal-gold shrink-0 mt-0.5" />
                          <span>Verified {categoryPlural.toLowerCase()}, portfolio photos & real quotes</span>
                        </div>
                      )}
                    </div>

                    {/* Season / Availability Pill */}
                    <div className="mt-3 pt-3 border-t border-bridal-beige/50 flex items-center justify-between text-[11px] font-bridal text-bridal-text-label">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-bridal-gold-dark" />
                        Peak: {meta?.peak || "Oct–Feb"}
                      </span>
                      <span className="text-status-success font-medium">
                        Live Listings
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom CTA Bar */}
                  <div className="px-4 py-3 bg-bridal-ivory/60 border-t border-bridal-beige/70 group-hover:bg-bridal-cream/80 transition-colors flex items-center justify-between">
                    <span className="font-bridal text-[11.5px] uppercase tracking-[0.18em] font-semibold text-bridal-charcoal group-hover:text-bridal-gold-dark transition-colors">
                      Explore {c.name}
                    </span>
                    <ArrowRight className="w-4 h-4 text-bridal-gold-dark group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
