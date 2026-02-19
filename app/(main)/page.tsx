import { HeroSection } from "@/components/homepage/hero-section"
import { FeaturedCategories } from "@/components/homepage/featured-categories"
import { FeaturedVendors } from "@/components/homepage/featured-vendors"
import { FeaturedVendorsShowcase } from "@/components/homepage/FeaturedVendorsShowcase"
import { EditorialGallerySection } from "@/components/homepage/EditorialGallerySection"
import { TestimonialBand } from "@/components/homepage/TestimonialBand"
import { BentoGridSection } from "@/components/homepage/BentoGridSection"
import { EditorialAlternatingSection } from "@/components/homepage/EditorialAlternatingSection"
import { PlanningTools } from "@/components/homepage/planning-tools"
import { RealWeddings } from "@/components/homepage/real-weddings"
import { WeddingTips } from "@/components/homepage/wedding-tips"

export default function Home() {
  return (
    <>
      {/* 1. Hero with Swiper Ken Burns + glassmorphism search */}
      <HeroSection />

      {/* 2. Category icon grid with stagger animation */}
      <FeaturedCategories />

      {/* 3. Layout A: Editorial hero+grid showcase (Photographers) */}
      <FeaturedVendorsShowcase
        vendorPath="photographers"
        title="Featured Photographers"
        subtitle="Capture Every Moment"
        description="Professional wedding photographers to capture your special moments"
      />

      {/* 4. Layout B: Horizontal scroll galleries (Venues + Makeup Artists) */}
      <EditorialGallerySection
        title="Explore Top Vendors"
        subtitle="Curated Picks"
        description="Swipe through our handpicked selection of premium wedding vendors"
        vendorTypes={[
          { path: "venues", label: "Wedding Venues" },
          { path: "makeup-artists", label: "Makeup Artists" },
        ]}
      />

      {/* 5. Social proof band */}
      <TestimonialBand />

      {/* 6. Layout C: Bento masonry grid (Decorators + Henna + Bridal Wear) */}
      <BentoGridSection
        title="Discover More"
        subtitle="Visual Showcase"
        description="Browse our curated collection of talented wedding professionals"
        vendorTypes={[
          { path: "decor", label: "Decorators" },
          { path: "henna-artists", label: "Henna Artists" },
          { path: "bridal-wear", label: "Bridal Wear" },
        ]}
      />

      {/* 7. Layout D: Alternating left-right editorial rows */}
      <EditorialAlternatingSection
        title="More Wedding Services"
        subtitle="Complete Your Day"
        vendorTypes={[
          { path: "catering", label: "Catering Services", tagline: "Delicious food for your guests" },
          { path: "car-rental", label: "Luxury Car Rental", tagline: "Elegant transportation for your big day" },
          { path: "wedding-stationery", label: "Wedding Stationery", tagline: "Beautiful invitations and cards" },
        ]}
      />

      {/* 8. Planning tools with dialogs */}
      <PlanningTools />

      {/* 9. Real wedding stories */}
      <RealWeddings />

      {/* 10. Wedding tips */}
      <WeddingTips />
    </>
  )
}
