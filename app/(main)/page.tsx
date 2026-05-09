import type { Metadata } from "next"
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo"
import { HeroSection } from "@/components/homepage/hero-section"

export const metadata: Metadata = {
  // Homepage gets the FULL branded title (no template suffix). Without this
  // the title bar fell back to "Modern Wedding Platform | Wedding Wala" from
  // the old (main)/layout default. Now it reads the canonical SITE_TITLE.
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
}

import { FeaturedCategories } from "@/components/homepage/featured-categories"
import { FeaturedVendorsShowcase } from "@/components/homepage/FeaturedVendorsShowcase"
import { EditorialGallerySection } from "@/components/homepage/EditorialGallerySection"
import { TestimonialBand } from "@/components/homepage/TestimonialBand"
import { BentoGridSection } from "@/components/homepage/BentoGridSection"
import { EditorialAlternatingSection } from "@/components/homepage/EditorialAlternatingSection"
import { PlanningTools } from "@/components/homepage/planning-tools"
import { RealWeddings } from "@/components/homepage/real-weddings"
import { WeddingTips } from "@/components/homepage/wedding-tips"
import {
  HowItWorks,
  PremiumPartnersStrip,
  SponsoredSpotlight,
  CitySpotlights,
  FeaturedVenueShowcase,
  BridalLookbook,
  VendorAwards,
  PromotedDeals,
  TrustStrip,
  VendorCTABanner,
  FreeTools,
  FinalNewsletterCTA,
} from "@/components/homepage/monetization-sections"

/**
 * Homepage — 20 sections of bridal-grade flow.
 *
 * Composition logic: alternate ivory ↔ blush ↔ ivory ↔ mauve so adjacent
 * sections never share a background and the page reads like layered tissue
 * paper in a luxury invitation box (per the brief).
 *
 * Monetization placements are spread through the page, not stacked, so each
 * paid surface gets meaningful airtime without feeling like an ad reel:
 *   • Premium Partners Strip       — top-of-fold paid carousel
 *   • Sponsored Spotlight          — full-bleed mid-page takeover
 *   • Featured Venue Showcase      — paid premium venue feature
 *   • Promoted Deals               — flash deals in the discovery flow
 *   • Bridal Lookbook              — paid bridal-wear lookbook
 *   • Vendor Awards                — annual paid Hall of Fame
 *   • City Spotlights              — paid sponsor per city
 */
export default function Home() {
  return (
    <>
      {/* 1 · Hero — cinematic photography + Playfair italic + bridal search */}
      <HeroSection />

      {/* 2 · Featured Categories — single-line carousel, 9 categories */}
      <FeaturedCategories />

      {/* 3 · Premium Partners — paid placement carousel ($$) */}
      <PremiumPartnersStrip />

      {/* 4 · How It Works — 3 steps with Playfair italic gold numbers */}
      <HowItWorks />

      {/* 5 · Featured Photographers showcase (existing) */}
      <FeaturedVendorsShowcase
        vendorPath="photographers"
        title="Featured Photographers"
        subtitle="Capture Every Moment"
        description="Pakistan's most beloved wedding photographers, hand-picked for their craft."
      />

      {/* 6 · Sponsored Spotlight — full-bleed paid takeover ($$) */}
      <SponsoredSpotlight />

      {/* 7 · Editorial Gallery — venues + makeup artists strip (existing) */}
      <EditorialGallerySection
        title="Explore Top Vendors"
        subtitle="Curated Picks"
        description="Swipe through our handpicked selection of premium wedding partners."
        vendorTypes={[
          { path: "venues", label: "Wedding Venues" },
          { path: "makeup-artists", label: "Makeup Artists" },
        ]}
      />

      {/* 8 · City Spotlights — paid sponsor per city ($) */}
      <CitySpotlights />

      {/* 9 · Couple testimonials (existing) */}
      <TestimonialBand />

      {/* 10 · Bento masonry — decorators + henna + bridal wear (existing) */}
      <BentoGridSection
        title="Discover More"
        subtitle="Visual Showcase"
        description="Browse our curated collection of talented wedding professionals."
        vendorTypes={[
          { path: "decor", label: "Decorators" },
          { path: "henna-artists", label: "Henna Artists" },
          { path: "bridal-wear", label: "Bridal Wear" },
        ]}
      />

      {/* 11 · Featured Venue Showcase — paid premium venue feature ($$) */}
      <FeaturedVenueShowcase />

      {/* 12 · Promoted Deals — flash deals carousel ($) */}
      <PromotedDeals />

      {/* 13 · Editorial alternating rows — catering, car-rental, stationery (existing) */}
      <EditorialAlternatingSection
        title="More Wedding Services"
        subtitle="Complete Your Day"
        vendorTypes={[
          { path: "catering",            label: "Catering Services",   tagline: "Delicious food for your guests" },
          { path: "car-rental",          label: "Luxury Car Rental",   tagline: "Elegant transportation for your big day" },
          { path: "wedding-stationery",  label: "Wedding Stationery",  tagline: "Beautiful invitations and cards" },
        ]}
      />

      {/* 14 · Bridal Lookbook — paid bridal-wear placement ($) */}
      <BridalLookbook />

      {/* 15 · Trust strip — verified vendors, secure payments */}
      <TrustStrip />

      {/* 16 · Vendor Awards — annual paid Hall of Fame ($$$) */}
      <VendorAwards />

      {/* 17 · Real Weddings — masonry photo gallery (existing) */}
      <RealWeddings />

      {/* 18 · Free Planning Tools — checklist, budget, etc. */}
      <FreeTools />

      {/* 19 · Vendor acquisition CTA — mauve background, gold button */}
      <VendorCTABanner />

      {/* 20 · Final newsletter CTA — homepage closer */}
      <FinalNewsletterCTA />
    </>
  )
}
