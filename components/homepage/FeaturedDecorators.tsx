"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import VendorCard from "@/components/VendorCard"
import { FeaturedSwiper, SwiperSlide } from "@/components/ui/featured-swiper"
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
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Decorators</h2>
            <p className="text-gray-600">Transform your venue with stunning wedding decorations</p>
          </div>
          <Link href="/vendors/decor" className="text-primary hover:underline hidden md:block">
            View all decorators →
          </Link>
        </div>

        {/* Professional Swiper Slider */}
        <FeaturedSwiper>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 4 }).map((_, index) => (
                             <SwiperSlide key={index}>
                 <div className="flex justify-center px-2">
                   <div className="animate-pulse w-full">
                     <div className="bg-gray-300 h-48 rounded-t-lg"></div>
                     <div className="bg-white p-4 rounded-b-lg">
                       <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                       <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                     </div>
                   </div>
                 </div>
               </SwiperSlide>
            ))
          ) : (
                         vendors.map((vendor) => (
               <SwiperSlide key={vendor.id}>
                 <div className="flex justify-center px-2">
                   <div className="w-full">
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
                   </div>
                 </div>
               </SwiperSlide>
             ))
          )}
        </FeaturedSwiper>

        <div className="text-center mt-8 md:hidden">
          <Link href="/vendors/decor" className="text-primary hover:underline">
            View all decorators →
          </Link>
        </div>
      </div>
    </section>
  )
}
