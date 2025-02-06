import { HeroSection } from "@/components/homepage/hero-section"
import { FeaturedCategories } from "@/components/homepage/featured-categories"
import { FeaturedVendors } from "@/components/homepage/featured-vendors"
import { PlanningTools } from "@/components/homepage/planning-tools"
import { RealWeddings } from "@/components/homepage/real-weddings"
import { WeddingTips } from "@/components/homepage/wedding-tips"
import { FeaturedVenues } from "@/components/homepage/FeaturedVenues"
import { FeaturedMakeupArtists } from "@/components/homepage/FeaturedMakeupArtists"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedVendors />
      <FeaturedVenues />
      <FeaturedMakeupArtists />
      <PlanningTools />
      <RealWeddings />
      <WeddingTips />
    </>
  )
}

