"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  Camera,
  Palette,
  Heart,
  MapPin,
  Car,
  Utensils,
  Crown,
  Mail,
  Flower2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  // BK-100.55 — 14 new categories
  Cake,
  Candy,
  ChefHat,
  Flower,
  Tent,
  Sofa,
  Zap,
  Speaker,
  Drum,
  Music2,
  PersonStanding,
  Mic,
  Video,
  ScrollText,
} from "lucide-react"
import { ScrollReveal } from "@/components/ui/motion-wrapper"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, FreeMode } from "swiper/modules"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import "swiper/css/free-mode"

// All 23 wedding categories. Taglines feed the hover overlay so each card
// reads like a small editorial vignette rather than a button label. Paths
// match lib/vendor-types.ts VENDOR_TYPE_PATHS (each has a live browse route).
const categoryData = [
  // Core
  { path: "photographers",       icon: Camera,         title: "Photographers", tagline: "Capture every moment" },
  { path: "venues",              icon: MapPin,         title: "Venues",        tagline: "Where memories begin" },
  { path: "decor",               icon: Palette,        title: "Decorators",    tagline: "Transform every space" },
  { path: "makeup-artists",      icon: Heart,          title: "Makeup",        tagline: "The bridal glow" },
  { path: "catering",            icon: Utensils,       title: "Catering",      tagline: "Flavours to remember" },
  { path: "henna-artists",       icon: Flower2,        title: "Henna Artists", tagline: "The mehndi tradition" },
  { path: "car-rental",          icon: Car,            title: "Car Rental",    tagline: "Arrive in elegance" },
  { path: "bridal-wear",         icon: Crown,          title: "Bridal Wear",   tagline: "Couture for the bride" },
  { path: "wedding-stationery",  icon: Mail,           title: "Stationery",    tagline: "Invitations that last" },
  // Food & Sweets
  { path: "wedding-cakes",       icon: Cake,           title: "Wedding Cakes", tagline: "Tiered & themed" },
  { path: "mithai",              icon: Candy,          title: "Mithai & Sweets", tagline: "Sweeten the day" },
  { path: "live-cooking-stalls", icon: ChefHat,        title: "Live Cooking",  tagline: "Tandoor, chaat & paan" },
  // Décor & Rentals
  { path: "florists",            icon: Flower,         title: "Florists",      tagline: "Fresh blooms" },
  { path: "marquee-rental",      icon: Tent,           title: "Marquee & Tent", tagline: "Canopies & shamiana" },
  { path: "furniture-rental",    icon: Sofa,           title: "Furniture",     tagline: "Seating & stage" },
  { path: "generator-rental",    icon: Zap,            title: "Generators",    tagline: "Power backup" },
  { path: "sound-system-rental", icon: Speaker,        title: "Sound System",  tagline: "Speakers & mics" },
  // Entertainment & Hosting
  { path: "dhol-players",        icon: Drum,           title: "Dhol Players",  tagline: "Set the rhythm" },
  { path: "qawwali",             icon: Music2,         title: "Qawwali & Naat", tagline: "Spiritual evenings" },
  { path: "wedding-choreographers", icon: PersonStanding, title: "Choreographers", tagline: "Mehndi performances" },
  { path: "event-hosts",         icon: Mic,            title: "Event Hosts",   tagline: "MCs & anchors" },
  { path: "live-streaming",      icon: Video,          title: "Live Streaming", tagline: "Stream to family abroad" },
  // Ceremony
  { path: "wedding-officiants",  icon: ScrollText,     title: "Nikahkhwan",    tagline: "Officiate the nikah" },
]

export function FeaturedCategories() {
  const swiperRef = useRef<SwiperType | null>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)

  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      {/* Faint ivory grain + Mughal jaal watermark */}
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-50" />

      <div className="relative container-responsive">
        {/* ── Editorial section header ── */}
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold">
                Browse by Category
              </span>
              <span className="block w-10 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
            </div>
            <h2 className="font-display italic text-[30px] sm:text-[36px] md:text-[40px] leading-[1.1] text-bridal-charcoal">
              Every detail of your{" "}
              <span className="text-bridal-gold">shaadi</span>, in one place
            </h2>
            <p className="font-bridal text-bridal-text-soft text-[14px] sm:text-[15px] mt-3">
              Browse Pakistan&apos;s most trusted vendors across every wedding
              category — from mehndi and dhol to catering, cakes and qawwali.
            </p>

            {/* Carousel arrows — centered below the header */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={!canPrev}
                className="
                  inline-flex w-11 h-11 items-center justify-center
                  rounded-full border border-bridal-beige bg-bridal-cream
                  text-bridal-mauve transition-all duration-200
                  hover:border-bridal-gold/55 hover:bg-bridal-blush/40 hover:text-bridal-charcoal
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-bridal-beige disabled:hover:bg-bridal-cream
                "
                aria-label="Previous categories"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                disabled={!canNext}
                className="
                  inline-flex w-11 h-11 items-center justify-center
                  rounded-full border border-bridal-gold/55 bg-bridal-gold
                  text-bridal-charcoal transition-all duration-200
                  hover:bg-bridal-gold-dark hover:text-bridal-ivory
                  disabled:opacity-30 disabled:cursor-not-allowed
                "
                aria-label="Next categories"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Single-line category carousel ── */}
        <Swiper
          modules={[Navigation, FreeMode]}
          freeMode
          spaceBetween={16}
          slidesPerView={1.6}
          breakpoints={{
            480: { slidesPerView: 2.4 },
            640: { slidesPerView: 3.2 },
            768: { slidesPerView: 4.2 },
            1024: { slidesPerView: 5.2 },
            1280: { slidesPerView: 6.2 },
            1536: { slidesPerView: 7 },
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper
            setCanPrev(!swiper.isBeginning)
            setCanNext(!swiper.isEnd)
          }}
          onSlideChange={(swiper) => {
            setCanPrev(!swiper.isBeginning)
            setCanNext(!swiper.isEnd)
          }}
          className="!overflow-visible"
        >
          {categoryData.map((category) => {
            const Icon = category.icon
            return (
              <SwiperSlide key={category.path} className="!h-auto">
                <Link
                  href={`/${category.path}`}
                  className="group block h-full"
                >
                  <article
                    className="
                      relative h-full min-h-[200px]
                      rounded-md bg-bridal-cream
                      border border-bridal-beige
                      overflow-hidden
                      transition-all duration-300 ease-out
                      hover:border-bridal-gold/55
                      hover:-translate-y-1
                      hover:shadow-[0_24px_40px_-28px_rgba(176,125,84,0.5)]
                    "
                  >
                    {/* Gold corner accents on hover */}
                    {[
                      "top-3 left-3 border-t border-l rounded-tl-sm",
                      "top-3 right-3 border-t border-r rounded-tr-sm",
                      "bottom-3 left-3 border-b border-l rounded-bl-sm",
                      "bottom-3 right-3 border-b border-r rounded-br-sm",
                    ].map((cls, i) => (
                      <span
                        key={i}
                        aria-hidden
                        className={`absolute ${cls} w-3 h-3 border-bridal-gold/0 group-hover:border-bridal-gold/70 transition-colors duration-300`}
                      />
                    ))}

                    {/* Sage mehndi wash on hover */}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-bridal-blush/0 group-hover:bg-[#EFF5EC]/55 transition-colors duration-300"
                    />

                    <div className="relative h-full p-5 flex flex-col items-center justify-center text-center">
                      {/* Icon ring */}
                      <div
                        className="
                          w-14 h-14 rounded-full
                          bg-bridal-blush/55 border border-bridal-beige
                          flex items-center justify-center
                          transition-all duration-300
                          group-hover:bg-bridal-gold/15
                          group-hover:border-bridal-gold/55
                          group-hover:scale-105
                        "
                      >
                        <Icon
                          className="w-6 h-6 text-bridal-gold-dark group-hover:text-bridal-gold transition-colors duration-300"
                          strokeWidth={1.6}
                        />
                      </div>

                      {/* Title */}
                      <h3 className="mt-3.5 font-display italic text-[17px] sm:text-[18px] text-bridal-charcoal leading-tight">
                        {category.title}
                      </h3>

                      {/* Tagline */}
                      <p className="mt-1 font-bridal text-[11.5px] sm:text-[12px] text-bridal-text-soft">
                        {category.tagline}
                      </p>

                      {/* Hover hint */}
                      <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-bridal uppercase tracking-[0.22em] text-bridal-gold opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        Explore
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                </Link>
              </SwiperSlide>
            )
          })}
        </Swiper>

        {/* ── Bottom CTA ── */}
        <div className="text-center mt-10">
          <Link
            href="/vendors"
            className="
              inline-flex items-center gap-2
              font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
              text-bridal-mauve hover:text-bridal-gold transition-colors group
            "
          >
            <span>View all vendors</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
