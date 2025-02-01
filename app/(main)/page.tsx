import { HeroSection } from "@/components/hero-section"
import { FeaturedCategories } from "@/components/featured-categories"
import { FeaturedVendors } from "@/components/featured-vendors"
import { PlanningTools } from "@/components/planning-tools"
import { RealWeddings } from "@/components/real-weddings"
import { WeddingTips } from "@/components/wedding-tips"

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedVendors />
      <PlanningTools />
      <RealWeddings />
      <WeddingTips />
    </>
  )
}

