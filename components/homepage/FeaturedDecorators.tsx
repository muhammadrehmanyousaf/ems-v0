"use client"

import { useState, useEffect } from "react"
import VendorCard from "@/components/VendorCard"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { VendorAPI } from "@/lib/api/vendors"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import type { Vendor } from "@/lib/types"

export function FeaturedDecorators() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedDecorators = async () => {
      try {
        const vendorType = getVendorTypeFromPath('decor')
        const featuredDecorators = await VendorAPI.getBusinessesByVendorType(vendorType)
        setVendors(featuredDecorators.slice(0, 8)) // Limit to 8 featured
      } catch (error) {
        console.error('Error fetching featured decorators:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedDecorators()
  }, [])

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Decorators</h2>
            <p className="text-gray-600">Transform your venue with stunning wedding decorations</p>
          </div>
          <a href="/decor" className="text-primary hover:underline hidden md:block">
            View all decorators →
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
          <a href="/decor" className="text-primary hover:underline">
            View all decorators →
          </a>
        </div>
      </div>
    </section>
  )
} 