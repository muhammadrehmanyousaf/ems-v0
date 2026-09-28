import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from "@/lib/seo"
// Hero stays EAGER — it holds the LCP element (above the fold).
import { HeroSection } from "@/components/homepage/hero-section"
import { BelowFold } from "@/components/homepage/below-fold"

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
const BentoGridSection = dynamic(() => import("@/components/homepage/BentoGridSection").then((m) => m.BentoGridSection))
const EditorialAlternatingSection = dynamic(() => import("@/components/homepage/EditorialAlternatingSection").then((m) => m.EditorialAlternatingSection))
const HowItWorks = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.HowItWorks))
const TrustStrip = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.TrustStrip))
const VendorCTABanner = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.VendorCTABanner))
const FreeTools = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.FreeTools))
const FinalNewsletterCTA = dynamic(() => import("@/components/homepage/monetization-sections").then((m) => m.FinalNewsletterCTA))

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
      <BelowFold minHeight={420}>
        <FeaturedCategories />
      </BelowFold>

      {/* 4 · How It Works — 3 steps with Playfair italic gold numbers */}
      <BelowFold minHeight={620}>
        <HowItWorks />
      </BelowFold>

      {/* 5 · Featured Photographers showcase (existing) */}
      <BelowFold minHeight={900}>
        <FeaturedVendorsShowcase
          vendorPath="photographers"
          title="Featured Photographers"
          subtitle="Capture Every Moment"
          description="Pakistan's most beloved wedding photographers, hand-picked for their craft."
        />
      </BelowFold>

      {/* 7 · Editorial Gallery — venues + makeup artists strip (existing) */}
      <BelowFold minHeight={900}>
        <EditorialGallerySection
          title="Explore Top Vendors"
          subtitle="Curated Picks"
          description="Swipe through our handpicked selection of premium wedding partners."
          vendorTypes={[
            { path: "venues", label: "Wedding Venues" },
            { path: "makeup-artists", label: "Makeup Artists" },
          ]}
        />
      </BelowFold>

      {/* 10 · Bento masonry — decorators + henna + bridal wear (existing) */}
      <BelowFold minHeight={1100}>
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
      </BelowFold>

      {/* 13 · Editorial alternating rows — catering, car-rental, stationery (existing) */}
      <BelowFold minHeight={1400}>
        <EditorialAlternatingSection
          title="More Wedding Services"
          subtitle="Complete Your Day"
          vendorTypes={[
            { path: "catering",            label: "Catering Services",   tagline: "Delicious food for your guests" },
            { path: "car-rental",          label: "Luxury Car Rental",   tagline: "Elegant transportation for your big day" },
            { path: "wedding-stationery",  label: "Wedding Stationery",  tagline: "Beautiful invitations and cards" },
          ]}
        />
      </BelowFold>

      {/* 15 · Trust strip — verified vendors, secure payments */}
      <BelowFold minHeight={320}>
        <TrustStrip />
      </BelowFold>

      {/* 18 · Free Planning Tools — checklist, budget, etc. */}
      <BelowFold minHeight={700}>
        <FreeTools />
      </BelowFold>

      {/* 19 · Vendor acquisition CTA — mauve background, gold button */}
      <BelowFold minHeight={460}>
        <VendorCTABanner />
      </BelowFold>

      {/* 20 · Final newsletter CTA — homepage closer */}
      <BelowFold minHeight={460}>
        <FinalNewsletterCTA />
      </BelowFold>
    </>
  )
}
