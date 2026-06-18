"use client"

/**
 * Monetization + content sections for the homepage.
 *
 * These are paid placement surfaces vendors purchase to appear in:
 *   • PremiumPartnersStrip       — paid carousel, top-of-fold ($)
 *   • SponsoredSpotlight         — full-bleed single-vendor takeover ($$)
 *   • CitySpotlights             — paid sponsor per city ($)
 *   • VenueShowcase              — paid premium venue feature ($$)
 *   • BridalLookbook             — paid bridal-wear lookbook ($)
 *   • VendorAwards               — annual paid Hall of Fame ($$$)
 *   • PromotedDeals              — flash deals, paid placement ($)
 *
 * Plus content sections:
 *   • HowItWorks
 *   • TrustStrip
 *   • CTABanner — list your business (acquisition for vendor signups)
 */

import Link from "next/link"
import {
  Award,
  Star,
  Heart,
  Sparkles,
  Crown,
  Shield,
  CreditCard,
  CheckCircle,
  ArrowRight,
  MapPin,
  Camera,
  Trophy,
  Flame,
  Tag,
  Users,
  Quote,
  Calendar,
  Lock,
  Verified,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useRef, useState } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, FreeMode } from "swiper/modules"
import "swiper/css"
import "swiper/css/free-mode"

import { ScrollReveal } from "@/components/ui/motion-wrapper"
import { BridalButton } from "@/components/bridal/bridal-button"
import { FloralDivider } from "@/components/bridal/floral-divider"
import { FloatingPetals } from "@/components/bridal/floating-petals"

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER — used by every section below
// ─────────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
  cta,
}: {
  eyebrow: string
  title: string
  highlight?: string
  description?: string
  align?: "left" | "center"
  cta?: { href: string; label: string }
}) {
  // Every section header is CENTERED for a consistent vertical rhythm down the
  // page (matches the RealWeddings reference: gold line · eyebrow · gold line,
  // centered title + description). A `cta`, when present, renders as a centered
  // link BELOW the heading — the same place RealWeddings puts "View more". The
  // `align` prop is kept for call-site compatibility but no longer varies layout.
  void align
  return (
    <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
        <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
          {eyebrow}
        </span>
        <span className="block w-10 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
      </div>
      <h2 className="font-display italic text-[28px] sm:text-[34px] md:text-[40px] leading-[1.1] text-bridal-charcoal">
        {title}{" "}
        {highlight && <span className="text-bridal-gold">{highlight}</span>}
      </h2>
      {description && (
        <p className="font-bridal text-bridal-text-soft text-[14px] sm:text-[15px] mt-3 leading-relaxed">
          {description}
        </p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="
            mt-5 inline-flex items-center gap-2 font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
            text-bridal-mauve hover:text-bridal-gold transition-colors group
          "
        >
          <span>{cta.label}</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW IT WORKS — 3 steps with Playfair italic gold numbers
// ─────────────────────────────────────────────────────────────────────────────

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: Search,
      title: "Discover & Compare",
      desc: "Browse Pakistan's most-trusted vendors. Filter by city, budget, and style — see real reviews from verified couples.",
    },
    {
      n: "02",
      icon: Calendar,
      title: "Book with Confidence",
      desc: "Lock in your date with secure deposits, a transparent cancellation policy, and live availability calendars.",
    },
    {
      n: "03",
      icon: Heart,
      title: "Celebrate the Day",
      desc: "Track everything from one dashboard — bookings, payments, vendor messages, the full guest list, and timeline.",
    },
  ]
  return (
    <section className="relative bg-bridal-blush/30 section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="How It Works"
            title="Three steps to your"
            highlight="dream shaadi"
            description="From the first browse to the final rukhsati — designed to feel calm at every step."
            align="center"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-7 max-w-5xl mx-auto">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <article
                key={s.n}
                className="
                  relative bridal-card p-7 sm:p-8 text-center
                  group hover:-translate-y-1 transition-transform duration-300
                "
              >
                {/* Big italic gold step number, faded behind the content */}
                <span
                  aria-hidden
                  className="absolute top-3 right-4 font-display italic text-[60px] leading-none text-bridal-gold/15 group-hover:text-bridal-gold/25 transition-colors"
                >
                  {s.n}
                </span>
                <div className="relative">
                  <span className="inline-flex w-14 h-14 mb-4 rounded-full bg-bridal-gold/15 border border-bridal-gold/45 items-center justify-center">
                    <Icon className="w-6 h-6 text-bridal-gold-dark" strokeWidth={1.6} />
                  </span>
                  <span className="block font-bridal text-[10px] uppercase tracking-[0.32em] text-bridal-gold mb-2">
                    Step {s.n}
                  </span>
                  <h3 className="font-display italic text-[22px] text-bridal-charcoal leading-tight">
                    {s.title}
                  </h3>
                  <p className="mt-3 font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM PARTNERS STRIP — paid carousel placement ($)
// ─────────────────────────────────────────────────────────────────────────────

export function PremiumPartnersStrip() {
  // Demo data — production wires to /api/v1/vendors?featured=true
  const partners = [
    { name: "SQ Photo's",       city: "Lahore",     img: "/images/home/partners/photography.jpg", price: "Rs. 2,000+",  category: "Photography" },
    { name: "Royal Lawns",      city: "Karachi",    img: "/images/home/partners/venue.jpg",       price: "Rs. 8 Lakh+", category: "Wedding Venue" },
    { name: "Bridal by Sana",   city: "Islamabad",  img: "/images/home/partners/makeup.jpg",      price: "Rs. 25,000+", category: "Bridal Makeup" },
    { name: "Mehndi Atelier",   city: "Lahore",     img: "/images/home/partners/henna.jpg",       price: "Rs. 12,000+", category: "Henna Artist" },
    { name: "Decor Diaries",    city: "Karachi",    img: "/images/home/partners/decor.jpg",       price: "Rs. 1.5 Lakh+", category: "Decoration" },
    { name: "Spice Studio",     city: "Islamabad",  img: "/images/home/partners/catering.jpg",    price: "Rs. 800/plate+", category: "Catering" },
  ]

  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Premium Partners"
            title="Hand-picked vendors,"
            highlight="trusted by 10K+ couples"
            description="A curated selection of Pakistan's most loved wedding partners — verified, top-rated, and ready to book."
            cta={{ href: "/vendors?featured=true", label: "View all featured" }}
          />
        </ScrollReveal>

        <Swiper
          modules={[FreeMode]}
          freeMode
          spaceBetween={20}
          slidesPerView={1.2}
          breakpoints={{
            640: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3.2 },
            1280: { slidesPerView: 4.1 },
          }}
          className="!overflow-visible"
        >
          {partners.map((p, i) => (
            <SwiperSlide key={i} className="!h-auto">
              <article className="bridal-card overflow-hidden p-0 group hover:-translate-y-1 transition-transform duration-300">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Gold "Featured Partner" ribbon */}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-gold/95 border border-bridal-gold-dark/30 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-bridal-charcoal" />
                    Featured
                  </span>
                  {/* Bottom gradient + city */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/30 to-transparent p-4">
                    <span className="inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-rose">
                      <MapPin className="w-3 h-3" />
                      {p.city}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-text-label font-medium">
                    {p.category}
                  </p>
                  <h3 className="mt-1 font-display italic text-[19px] text-bridal-charcoal leading-tight group-hover:text-bridal-gold-dark transition-colors">
                    {p.name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bridal text-[13px] font-semibold text-bridal-gold-dark">
                      {p.price}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-mauve">
                      <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                      4.9
                    </span>
                  </div>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SPONSORED SPOTLIGHT — single-vendor full-bleed takeover ($$)
// ─────────────────────────────────────────────────────────────────────────────

export function SponsoredSpotlight() {
  return (
    <section className="relative section-padding overflow-hidden bg-bridal-charcoal">
      {/* Backdrop image */}
      <img
        src="/images/home/spotlight/spotlight.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-50"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-bridal-charcoal/80 via-bridal-charcoal/55 to-bridal-charcoal/80" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-20 mix-blend-soft-light" />
      <FloatingPetals />

      <div className="relative container-responsive flex justify-center">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-5 rounded-full bg-bridal-gold/15 border border-bridal-gold/55 backdrop-blur-sm font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-gold">
              <Sparkles className="w-3 h-3" />
              Sponsored Spotlight
            </span>
            <h2 className="font-display italic text-[36px] sm:text-[44px] md:text-[52px] leading-[1.05] text-bridal-ivory">
              Royal Palace, where{" "}
              <span className="text-bridal-gold">grand weddings</span> begin
            </h2>
            <p className="mt-4 font-bridal text-[15px] text-bridal-ivory/85 leading-relaxed max-w-2xl mx-auto">
              Pakistan&apos;s most-booked Wedding Venue of the year — 2,000+ guest
              capacity, in-house catering, and a courtyard built for cinematic
              ceremonies. Now booking 2026 dates.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/venues/1">
                <BridalButton variant="primary" size="lg">
                  View Venue
                  <ArrowRight className="w-4 h-4" />
                </BridalButton>
              </Link>
              <Link href="/venues">
                <BridalButton
                  variant="ghost"
                  size="lg"
                  className="!border-bridal-ivory/40 !text-bridal-ivory hover:!bg-bridal-ivory/10"
                >
                  Browse all venues
                </BridalButton>
              </Link>
            </div>
            {/* Quick stats */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
              {[
                { v: "2,000+", l: "Guest capacity" },
                { v: "120+",   l: "Weddings hosted" },
                { v: "4.9★",   l: "Couple rating" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col items-center">
                  <span className="font-display italic text-[24px] text-bridal-gold leading-none">
                    {s.v}
                  </span>
                  <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-rose mt-1">
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY SPOTLIGHTS — paid sponsor per city ($)
// ─────────────────────────────────────────────────────────────────────────────

export function CitySpotlights() {
  const cities = [
    { city: "Lahore",     count: "320+",  img: "/images/home/cities/lahore.jpg",     tag: "City of Heritage" },
    { city: "Karachi",    count: "240+",  img: "/images/home/cities/karachi.jpg",    tag: "Coastal Elegance" },
    { city: "Islamabad",  count: "180+",  img: "/images/home/cities/islamabad.jpg",  tag: "Hill Romance" },
    { city: "Faisalabad", count: "95+",   img: "/images/home/cities/faisalabad.jpg", tag: "Textile Heart" },
  ]
  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-40" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="By City"
            title="Discover wedding partners in"
            highlight="your city"
            description="Pakistan's wedding scene, mapped — local vendors, venues, and stylists across every major city."
            align="center"
          />
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {cities.map((c, i) => (
            <Link
              key={c.city}
              href={`/vendors?location=${encodeURIComponent(c.city)}`}
              className="group block"
            >
              <article className="relative aspect-[3/4] rounded-md overflow-hidden bridal-card p-0">
                <img
                  src={c.img}
                  alt={c.city}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/30 to-transparent" />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-gold/95 text-bridal-charcoal text-[9.5px] font-bridal font-medium uppercase tracking-[0.18em]">
                  Sponsored
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] text-bridal-rose">
                    {c.tag}
                  </p>
                  <h3 className="font-display italic text-[26px] sm:text-[30px] text-bridal-ivory leading-tight">
                    {c.city}
                  </h3>
                  <span className="mt-2 inline-flex items-center gap-1.5 font-bridal text-[12px] text-bridal-ivory/85">
                    <Sparkles className="w-3 h-3 text-bridal-gold" />
                    <span>{c.count} vendors</span>
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VENUE SHOWCASE — paid premium venue feature ($$)
// ─────────────────────────────────────────────────────────────────────────────

export function FeaturedVenueShowcase() {
  const venues = [
    { name: "Royal Palace Lahore",    img: "/images/home/venues/v1.jpg", price: "Rs. 8 Lakh+", city: "Lahore", capacity: "2,000+ guests" },
    { name: "Coastal Crest Karachi",  img: "/images/home/venues/v2.jpg", price: "Rs. 12 Lakh+", city: "Karachi", capacity: "1,500 guests" },
  ]
  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Featured Venues"
            title="Where Pakistan's most beautiful"
            highlight="weddings happen"
            description="Hand-selected venues, rated by real couples, with verified availability and instant booking."
            cta={{ href: "/venues", label: "All venues" }}
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {venues.map((v, i) => (
            <Link key={v.name} href="/venues" className="group block">
              <article className="relative aspect-[16/10] rounded-md overflow-hidden bridal-card p-0">
                <img
                  src={v.img}
                  alt={v.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/95 via-bridal-charcoal/35 to-transparent" />

                {/* "Premium" coral badge */}
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF1EC]/95 border border-bridal-coral/55 text-[#9B4A38] text-[10px] font-bridal font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                  <Crown className="w-3 h-3" />
                  Premium
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <span className="inline-flex items-center gap-1 font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-rose">
                    <MapPin className="w-3 h-3" />
                    {v.city}
                  </span>
                  <h3 className="mt-1 font-display italic text-[24px] sm:text-[28px] text-bridal-ivory leading-tight">
                    {v.name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-bridal text-[14px] font-semibold text-bridal-gold">
                      {v.price}
                    </span>
                    <span className="font-bridal text-[12px] text-bridal-ivory/80 inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-bridal-gold/80" />
                      {v.capacity}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDAL LOOKBOOK — paid bridal-wear lookbook ($)
// ─────────────────────────────────────────────────────────────────────────────

export function BridalLookbook() {
  const looks = [
    { brand: "Sana Safinaz",      img: "/images/home/lookbook/l1.jpg", price: "From Rs. 4.5 Lakh" },
    { brand: "Élan Couture",      img: "/images/home/lookbook/l2.jpg", price: "From Rs. 6 Lakh" },
    { brand: "Zara Shahjahan",    img: "/images/home/lookbook/l3.jpg", price: "From Rs. 5.5 Lakh" },
    { brand: "Bunto Kazmi",       img: "/images/home/lookbook/l4.jpg", price: "From Rs. 8 Lakh" },
  ]
  return (
    <section className="relative bg-bridal-blush/35 section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Bridal Lookbook"
            title="The bride's"
            highlight="couture edit"
            description="Sponsored picks from Pakistan's couture houses — book a fitting in one tap."
            cta={{ href: "/bridal-wear", label: "Open lookbook" }}
          />
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {looks.map((l, i) => (
            <Link key={l.brand} href="/bridal-wear" className="group block">
              <article className="relative aspect-[3/4] rounded-md overflow-hidden bridal-card p-0">
                <img
                  src={l.img}
                  alt={l.brand}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-display italic text-[20px] text-bridal-ivory leading-tight">
                    {l.brand}
                  </h3>
                  <p className="mt-1 font-bridal text-[11.5px] uppercase tracking-[0.22em] text-bridal-rose">
                    {l.price}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR AWARDS — annual paid Hall of Fame ($$$)
// ─────────────────────────────────────────────────────────────────────────────

export function VendorAwards() {
  const awards = [
    { award: "Photographer of the Year",   winner: "SQ Photo's",       city: "Lahore" },
    { award: "Best Wedding Venue",         winner: "Royal Palace",     city: "Karachi" },
    { award: "Top Bridal Studio",          winner: "Bridal by Sana",   city: "Islamabad" },
    { award: "Most Booked Caterer",        winner: "Spice Studio",     city: "Lahore" },
  ]
  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-50" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="2026 Awards"
            title="Pakistan's most loved"
            highlight="wedding partners"
            description="Voted by 10,000+ couples on Wedding Wala — the verified Hall of Fame of the year."
            align="center"
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {awards.map((a, i) => (
            <article
              key={a.award}
              className="bridal-card p-6 text-center group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_24px_40px_-28px_rgba(176,125,84,0.5)]"
            >
              <div className="relative mx-auto w-16 h-16 mb-4">
                <span className="absolute inset-0 rounded-full bg-bridal-gold/10 group-hover:bg-bridal-gold/20 transition-colors" />
                <span className="absolute inset-2 rounded-full bg-bridal-gold/20 group-hover:bg-bridal-gold/35 transition-colors" />
                <span className="absolute inset-4 rounded-full bg-bridal-gold flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-bridal-charcoal" strokeWidth={1.8} />
                </span>
              </div>
              <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] text-bridal-gold">
                {a.award}
              </p>
              <h3 className="mt-2 font-display italic text-[20px] text-bridal-charcoal leading-tight">
                {a.winner}
              </h3>
              <p className="mt-1 font-bridal text-[12px] text-bridal-text-soft inline-flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-bridal-gold/70" />
                {a.city}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMOTED DEALS — flash deals carousel ($)
// ─────────────────────────────────────────────────────────────────────────────

export function PromotedDeals() {
  const deals = [
    { title: "20% off Pre-Wedding Shoots",  vendor: "SQ Photo's",       expires: "31 May",  saving: "Save Rs. 8,000" },
    { title: "Free Hair Styling with Makeup", vendor: "Bridal by Sana", expires: "15 Jun",  saving: "Worth Rs. 12,000" },
    { title: "Buy-2 Henna Sets",            vendor: "Mehndi Atelier",   expires: "30 Jun",  saving: "Save 25%" },
    { title: "Early Bird Venue Booking",    vendor: "Royal Palace",     expires: "30 Jul",  saving: "Save 1.5 Lakh" },
  ]
  return (
    <section className="relative bg-[#FFF1EC]/50 section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-80" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Limited-Time Offers"
            title="Hot deals from"
            highlight="featured vendors"
            description="Limited-time promotions — bookable today."
            cta={{ href: "/deals", label: "All deals" }}
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {deals.map((d, i) => (
            <article
              key={i}
              className="relative bridal-card p-5 group hover:-translate-y-1 transition-transform duration-300 overflow-hidden"
            >
              <span aria-hidden className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-bridal-coral/15 blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF1EC] border border-bridal-coral/55 text-[#9B4A38] text-[10px] font-bridal font-medium uppercase tracking-[0.2em]">
                    <Flame className="w-3 h-3" />
                    Hot
                  </span>
                  <span className="font-bridal text-[10.5px] uppercase tracking-[0.18em] text-bridal-text-soft">
                    Until {d.expires}
                  </span>
                </div>
                <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight min-h-[42px]">
                  {d.title}
                </h3>
                <p className="mt-2 font-bridal text-[12.5px] text-bridal-text-soft">
                  by{" "}
                  <span className="text-bridal-charcoal font-medium">
                    {d.vendor}
                  </span>
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 font-bridal text-[12px] font-semibold text-bridal-gold-dark">
                    <Tag className="w-3 h-3" />
                    {d.saving}
                  </span>
                  <span className="font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-mauve group-hover:text-bridal-gold transition-colors">
                    Claim →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TRUST STRIP — verified vendors, secure payments, money-back
// ─────────────────────────────────────────────────────────────────────────────

export function TrustStrip() {
  const items = [
    { icon: Verified,    title: "Verified Vendors",    desc: "Every vendor manually vetted by our editorial team" },
    { icon: Lock,        title: "Secure Payments",     desc: "Encrypted Stripe checkout, never share card details" },
    { icon: Shield,      title: "Money-Back Guarantee", desc: "Full refund if your vendor cancels last-minute" },
    { icon: Quote,       title: "Real Reviews",        desc: "Reviews only from couples who actually booked" },
  ]
  return (
    <section className="relative bg-bridal-cream section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Why Wedding Wala"
            title="Built for the most important"
            highlight="day of your life"
            description="Bridal-grade tooling, end-to-end."
            align="center"
          />
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {items.map((it) => {
            const Icon = it.icon
            return (
              <div
                key={it.title}
                className="bridal-card p-5 text-center hover:border-bridal-gold/55 transition-colors"
              >
                <span className="inline-flex w-12 h-12 mb-3 rounded-full bg-bridal-blush/55 border border-bridal-beige items-center justify-center">
                  <Icon className="w-5 h-5 text-bridal-gold-dark" strokeWidth={1.6} />
                </span>
                <h3 className="font-display italic text-[17px] text-bridal-charcoal leading-tight">
                  {it.title}
                </h3>
                <p className="mt-1.5 font-bridal text-[12px] text-bridal-text-soft leading-relaxed">
                  {it.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA BANNER — vendor acquisition (List Your Business)
// ─────────────────────────────────────────────────────────────────────────────

export function VendorCTABanner() {
  return (
    <section className="relative section-padding overflow-hidden bg-bridal-mauve">
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-30 mix-blend-soft-light" />
      <span aria-hidden className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-bridal-rose/30 blur-3xl" />
      <span aria-hidden className="absolute -bottom-12 -right-12 w-80 h-80 rounded-full bg-bridal-gold/25 blur-3xl" />
      <FloatingPetals />

      {/* Floral SVG corner ornaments */}
      <span aria-hidden className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-bridal-gold/55 rounded-tl-md" />
      <span aria-hidden className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-bridal-gold/55 rounded-tr-md" />
      <span aria-hidden className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-bridal-gold/55 rounded-bl-md" />
      <span aria-hidden className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-bridal-gold/55 rounded-br-md" />

      <div className="relative container-responsive text-center max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bridal-gold/15 border border-bridal-gold/55 backdrop-blur-sm font-bridal text-[10px] uppercase tracking-[0.28em] text-bridal-gold">
          <Sparkles className="w-3 h-3" />
          For Vendors
        </span>
        <h2 className="mt-5 font-display italic text-[36px] sm:text-[44px] md:text-[52px] leading-[1.05] text-bridal-ivory">
          Join Pakistan&apos;s{" "}
          <span className="text-bridal-gold">premier wedding marketplace</span>
        </h2>
        <p className="mt-5 font-bridal text-[15px] sm:text-[17px] text-bridal-ivory/85 leading-relaxed">
          Reach 10,000+ engaged couples a month. Free profile, paid promotion
          options, calendar + booking tools, and a vendor success team
          on-call.
        </p>
        <FloralDivider className="mt-7 [&>svg]:opacity-90" width={220} />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/business-registration">
            <BridalButton variant="primary" size="lg">
              List Your Business
              <ArrowRight className="w-4 h-4" />
            </BridalButton>
          </Link>
          <Link href="/vendor-guide">
            <BridalButton
              variant="ghost"
              size="lg"
              className="!border-bridal-ivory/40 !text-bridal-ivory hover:!bg-bridal-ivory/10"
            >
              Vendor Guide
            </BridalButton>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FREE TOOLS — lead magnet
// ─────────────────────────────────────────────────────────────────────────────

export function FreeTools() {
  const tools = [
    { icon: CheckCircle, title: "Wedding Checklist",  desc: "12-month timeline, fully customisable" },
    { icon: CreditCard,  title: "Budget Calculator",  desc: "Track every rupee, by category" },
    { icon: Users,       title: "Guest List Manager", desc: "RSVPs, dietary needs, table plans" },
    { icon: Calendar,    title: "Event Timeline",     desc: "Day-of schedule, vendor coordinator" },
  ]
  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <SectionHeader
            eyebrow="Free Planning Tools"
            title="Plan your shaadi like a"
            highlight="pro"
            description="Free interactive tools — no signup required."
            cta={{ href: "/planning-tools", label: "All tools" }}
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tools.map((t, i) => {
            const Icon = t.icon
            return (
              <Link
                key={t.title}
                href="/planning-tools"
                className="group block"
              >
                <article className="bridal-card p-5 h-full hover:-translate-y-1 transition-all duration-300">
                  <span className="inline-flex w-12 h-12 mb-4 rounded-md bg-bridal-blush/55 border border-bridal-beige items-center justify-center group-hover:bg-bridal-gold/15 group-hover:border-bridal-gold/55 transition-colors">
                    <Icon className="w-5 h-5 text-bridal-gold-dark" strokeWidth={1.6} />
                  </span>
                  <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                    {t.title}
                  </h3>
                  <p className="mt-2 font-bridal text-[13px] text-bridal-text-soft leading-relaxed">
                    {t.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-mauve group-hover:text-bridal-gold transition-colors">
                    Open
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FINAL NEWSLETTER CTA — homepage closer
// ─────────────────────────────────────────────────────────────────────────────

export function FinalNewsletterCTA() {
  return (
    <section className="relative bg-bridal-cream section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-40" />
      <div className="relative container-responsive max-w-3xl mx-auto text-center">
        <ScrollReveal>
          <span className="inline-flex items-center gap-2 mb-3">
            <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
            <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
              Stay in the Loop
            </span>
            <span className="block w-10 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
          </span>
          <h2 className="font-display italic text-[32px] sm:text-[40px] leading-[1.1] text-bridal-charcoal">
            Real Pakistani weddings,{" "}
            <span className="text-bridal-gold">in your inbox</span>
          </h2>
          <p className="mt-3 font-bridal text-bridal-text-soft text-[15px]">
            Curated stories, vendor edits, real budgets — once a week, no spam.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md mx-auto px-4 sm:px-0"
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="
                w-full sm:flex-1 min-w-0 h-12 px-4 rounded-[4px]
                bg-bridal-cream border border-bridal-beige
                font-bridal text-[14px] text-bridal-charcoal
                placeholder:text-bridal-text-label/70
                focus:outline-none focus:ring-2 focus:ring-bridal-gold/25 focus:border-bridal-gold
                transition-all
              "
            />
            <BridalButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shrink-0"
            >
              Subscribe
            </BridalButton>
          </form>
          <FloralDivider className="mt-7" width={200} />
        </ScrollReveal>
      </div>
    </section>
  )
}
