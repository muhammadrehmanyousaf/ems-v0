import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo"
// Hero stays EAGER — it holds the LCP element (above the fold).
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

// ── Below-the-fold sections are CODE-SPLIT (next/dynamic) ─────────────────
// The whole homepage is client components; eagerly hydrating all 20 at once
// saturated the main thread and delayed the hero LCP paint by ~3.6s (verified
// via a Chrome perf trace: 56% of LCP was "render delay"). ssr stays ON (the
// default) so every section still server-renders — content + SEO + no CLS are
// preserved; only the client JS is deferred off the hero's critical path.
const FeaturedCategories = dynamic(() => import("@/components/homepage/featured-categories").then((m) => m.FeaturedCategories))
const FeaturedVendorsShowcase = dynamic(() => import("@/components/homepage/FeaturedVendorsShowcase").then((m) => m.FeaturedVendorsShowcase))
const EditorialGallerySection = dynamic(() => import("@/components/homepage/EditorialGallerySection").then((m) => m.EditorialGallerySection))
const TestimonialBand = dynamic(() => import("@/components/homepage/TestimonialBand").then((m) => m.TestimonialBand))
const BentoGridSection = dynamic(() => import("@/components/homepage/BentoGridSection").then((m) => m.BentoGridSection))
const EditorialAlternatingSection = dynamic(() => import("@/components/homepage/EditorialAlternatingSection").then((m) => m.EditorialAlternatingSection))
const RealWeddings = dynamic(() => import("@/components/homepage/real-weddings").then((m) => m.RealWeddings))
const HowItWorks = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.HowItWorks))
const PremiumPartnersStrip = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.PremiumPartnersStrip))
const SponsoredSpotlight = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.SponsoredSpotlight))
const CitySpotlights = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.CitySpotlights))
const FeaturedVenueShowcase = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.FeaturedVenueShowcase))
const BridalLookbook = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.BridalLookbook))
const VendorAwards = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.VendorAwards))
const PromotedDeals = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.PromotedDeals))
const TrustStrip = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.TrustStrip))
const VendorCTABanner = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.VendorCTABanner))
const FreeTools = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.FreeTools))
const FinalNewsletterCTA = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.FinalNewsletterCTA))
import { HOMEPAGE_DEMO_CONTENT } from "@/lib/homepage-demo-flag"

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

      {/* 3 · Premium Partners — paid placement carousel ($$) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <PremiumPartnersStrip />}

      {/* 4 · How It Works — 3 steps with Playfair italic gold numbers */}
      <HowItWorks />

      {/* 5 · Featured Photographers showcase (existing) */}
      <FeaturedVendorsShowcase
        vendorPath="photographers"
        title="Featured Photographers"
        subtitle="Capture Every Moment"
        description="Pakistan's most beloved wedding photographers, hand-picked for their craft."
      />

      {/* 6 · Sponsored Spotlight — full-bleed paid takeover ($$) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <SponsoredSpotlight />}

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

      {/* 8 · City Spotlights — paid sponsor per city ($) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <CitySpotlights />}

      {/* 9 · Couple testimonials — demo data (fake couples + stats), hidden until real */}
      {HOMEPAGE_DEMO_CONTENT && <TestimonialBand />}

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

      {/* 11 · Featured Venue Showcase — paid premium venue feature ($$) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <FeaturedVenueShowcase />}

      {/* 12 · Promoted Deals — flash deals carousel ($) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <PromotedDeals />}

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

      {/* 14 · Bridal Lookbook — paid bridal-wear placement ($) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <BridalLookbook />}

      {/* 15 · Trust strip — verified vendors, secure payments */}
      <TrustStrip />

      {/* 16 · Vendor Awards — annual paid Hall of Fame ($$$) — demo data, hidden until wired */}
      {HOMEPAGE_DEMO_CONTENT && <VendorAwards />}

      {/* 17 · Real Weddings — masonry photo gallery — demo data (fake couples), hidden until real */}
      {HOMEPAGE_DEMO_CONTENT && <RealWeddings />}

      {/* 18 · Free Planning Tools — checklist, budget, etc. */}
      <FreeTools />

      {/* 19 · Vendor acquisition CTA — mauve background, gold button */}
      <VendorCTABanner />

      {/* 20 · Final newsletter CTA — homepage closer */}
      <FinalNewsletterCTA />
    </>
  )
}
