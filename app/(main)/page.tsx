import { HeroSection } from "@/components/homepage/hero-section"
import { FeaturedCategories } from "@/components/homepage/featured-categories"
import { FeaturedVendors } from "@/components/homepage/featured-vendors"
import { FeaturedPhotographers } from "@/components/homepage/FeaturedPhotographers"
import { FeaturedVenues } from "@/components/homepage/FeaturedVenues"
import { FeaturedMakeupArtists } from "@/components/homepage/FeaturedMakeupArtists"
import { FeaturedDecorators } from "@/components/homepage/FeaturedDecorators"
import { FeaturedHennaArtists } from "@/components/homepage/FeaturedHennaArtists"
import { FeaturedCatering } from "@/components/homepage/FeaturedCatering"
import { FeaturedCarRental } from "@/components/homepage/FeaturedCarRental"
import { FeaturedBridalWear } from "@/components/homepage/FeaturedBridalWear"
import { FeaturedWeddingStationery } from "@/components/homepage/FeaturedWeddingStationery"
import { PlanningTools } from "@/components/homepage/planning-tools"
import { RealWeddings } from "@/components/homepage/real-weddings"
import { WeddingTips } from "@/components/homepage/wedding-tips"
import { UserProvider } from "@/context/UserContext"

export default function Home() {
  return (
    <UserProvider>
      <HeroSection />
      <FeaturedCategories />
      <FeaturedVendors />
      <FeaturedPhotographers />
      <FeaturedVenues />
      <FeaturedMakeupArtists />
      <FeaturedDecorators />
      <FeaturedHennaArtists />
      <FeaturedCatering />
      <FeaturedCarRental />
      <FeaturedBridalWear />
      <FeaturedWeddingStationery />
      <PlanningTools />
      <RealWeddings />
      <WeddingTips />
    </UserProvider>
  )
}

