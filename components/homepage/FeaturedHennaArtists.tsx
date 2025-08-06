"use client"

import { useState, useEffect } from "react"
import VendorCard from "@/components/VendorCard"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { VendorAPI } from "@/lib/api/vendors"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import type { Vendor } from "@/lib/types"

export function FeaturedHennaArtists() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedHennaArtists = async () => {
      try {
        const vendorType = getVendorTypeFromPath('henna-artists')
        console.log('🔍 Henna Artist - Vendor Type:', vendorType)
        const featuredHennaArtists = await VendorAPI.getBusinessesByVendorType(vendorType)
        console.log('📊 Henna Artist - Found:', featuredHennaArtists.length, 'vendors')
        
        // If no data found, use mock data for testing
        if (featuredHennaArtists.length === 0) {
          console.log('⚠️ No henna artists found, using mock data')
          const mockHennaArtists = [
            {
              id: 1,
              name: "Beautiful Henna Designs",
              type: "Henna artist",
              subBusinessType: "Henna artist",
              images: ["https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg"],
              location: "Mumbai, Maharashtra",
              city: "Mumbai",
              rating: 4.8,
              reviews: [{ id: 1, rating: 5, comment: "Amazing henna work!" }],
              price: 5000,
              minimumPrice: 5000,
              capacity: 50,
              amenities: ["Traditional Designs", "Modern Patterns", "Bridal Henna"],
              sponsored: true
            },
            {
              id: 2,
              name: "Royal Henna Studio",
              type: "Henna artist",
              subBusinessType: "Henna artist",
              images: ["https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg"],
              location: "Delhi, NCR",
              city: "Delhi",
              rating: 4.6,
              reviews: [{ id: 2, rating: 4, comment: "Beautiful traditional designs!" }],
              price: 4500,
              minimumPrice: 4500,
              capacity: 40,
              amenities: ["Traditional Designs", "Arabic Patterns", "Bridal Packages"],
              sponsored: false
            },
            {
              id: 3,
              name: "Glamour Henna Art",
              type: "Henna artist",
              subBusinessType: "Henna artist",
              images: ["https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg"],
              location: "Bangalore, Karnataka",
              city: "Bangalore",
              rating: 4.7,
              reviews: [{ id: 3, rating: 5, comment: "Perfect for weddings!" }],
              price: 6000,
              minimumPrice: 6000,
              capacity: 60,
              amenities: ["Modern Designs", "Bridal Henna", "Party Packages"],
              sponsored: true
            },
            {
              id: 4,
              name: "Elegant Henna Creations",
              type: "Henna artist",
              subBusinessType: "Henna artist",
              images: ["https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg"],
              location: "Chennai, Tamil Nadu",
              city: "Chennai",
              rating: 4.5,
              reviews: [{ id: 4, rating: 4, comment: "Stunning designs!" }],
              price: 4000,
              minimumPrice: 4000,
              capacity: 45,
              amenities: ["Traditional Patterns", "Modern Designs", "Bridal Packages"],
              sponsored: false
            }
          ]
          setVendors(mockHennaArtists)
        } else {
          setVendors(featuredHennaArtists.slice(0, 8)) // Limit to 8 featured
        }
      } catch (error) {
        console.error('❌ Error fetching featured henna artists:', error)
        // Use mock data on error
        console.log('🔄 Using mock data due to API error')
        const mockHennaArtists = [
          {
            id: 1,
            name: "Beautiful Henna Designs",
            type: "Henna artist",
            subBusinessType: "Henna artist",
            images: ["https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg"],
            location: "Mumbai, Maharashtra",
            city: "Mumbai",
            rating: 4.8,
            reviews: [{ id: 1, rating: 5, comment: "Amazing henna work!" }],
            price: 5000,
            minimumPrice: 5000,
            capacity: 50,
            amenities: ["Traditional Designs", "Modern Patterns", "Bridal Henna"],
            sponsored: true
          },
          {
            id: 2,
            name: "Royal Henna Studio",
            type: "Henna artist",
            subBusinessType: "Henna artist",
            images: ["https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg"],
            location: "Delhi, NCR",
            city: "Delhi",
            rating: 4.6,
            reviews: [{ id: 2, rating: 4, comment: "Beautiful traditional designs!" }],
            price: 4500,
            minimumPrice: 4500,
            capacity: 40,
            amenities: ["Traditional Designs", "Arabic Patterns", "Bridal Packages"],
            sponsored: false
          },
          {
            id: 3,
            name: "Glamour Henna Art",
            type: "Henna artist",
            subBusinessType: "Henna artist",
            images: ["https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg"],
            location: "Bangalore, Karnataka",
            city: "Bangalore",
            rating: 4.7,
            reviews: [{ id: 3, rating: 5, comment: "Perfect for weddings!" }],
            price: 6000,
            minimumPrice: 6000,
            capacity: 60,
            amenities: ["Modern Designs", "Bridal Henna", "Party Packages"],
            sponsored: true
          },
          {
            id: 4,
            name: "Elegant Henna Creations",
            type: "Henna artist",
            subBusinessType: "Henna artist",
            images: ["https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg"],
            location: "Chennai, Tamil Nadu",
            city: "Chennai",
            rating: 4.5,
            reviews: [{ id: 4, rating: 4, comment: "Stunning designs!" }],
            price: 4000,
            minimumPrice: 4000,
            capacity: 45,
            amenities: ["Traditional Patterns", "Modern Designs", "Bridal Packages"],
            sponsored: false
          }
        ]
        setVendors(mockHennaArtists)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedHennaArtists()
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Henna Artists</h2>
            <p className="text-gray-600">Beautiful henna designs for your wedding celebrations</p>
          </div>
          <a href="/henna-artists" className="text-primary hover:underline hidden md:block">
            View all henna artists →
          </a>
        </div>

        {/* ShadCN Carousel with Responsive Items Per Slide */}
        <div className="relative w-full overflow-hidden">
          <Carousel className="relative">
            {/* Bigger and Spaced Arrows */}
            <CarouselPrevious className="hidden sm:flex absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-700 text-white rounded-full hover:bg-gray-900 transition z-50 pointer-events-auto" />
            <CarouselNext className="hidden sm:flex absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-gray-700 text-white rounded-full hover:bg-gray-900 transition z-50 pointer-events-auto" />

            <CarouselContent className="flex gap-2 sm:gap-4 w-full justify-start" style={{ scrollSnapType: "x mandatory" }}>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 4 }).map((_, index) => (
                  <CarouselItem
                    key={index}
                    className={`basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4 flex-shrink-0 scroll-snap-start`}
                  >
                    <div className="animate-pulse">
                      <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                      <div className="bg-white p-4 rounded-b-lg">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CarouselItem>
                ))
              ) : (
                vendors.map((vendor) => (
                  <CarouselItem
                    key={vendor.id}
                    className={`basis-[85%] sm:basis-[70%] md:basis-1/2 lg:basis-1/3 xl:basis-1/4 flex-shrink-0 scroll-snap-start`}
                  >
                                         <VendorCard
                       id={vendor.id}
                       name={vendor.name}
                       image={vendor.images?.[0] || "/placeholder.svg"}
                       location={vendor.location || vendor.city}
                       rating={vendor.rating}
                       reviews={vendor.reviews?.length || 0}
                       price={vendor.minimumPrice || vendor.price}
                       type={vendor.subBusinessType || vendor.type}
                       capacity={vendor.capacity}
                       amenities={vendor.amenities}
                       sponsored={vendor.sponsored}
                     />
                  </CarouselItem>
                ))
              )}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="text-center mt-8 md:hidden">
          <a href="/henna-artists" className="text-primary hover:underline">
            View all henna artists →
          </a>
        </div>
      </div>
    </section>
  )
} 