"use client"

import Link from "next/link"
import VendorCard from "@/components/VendorCard"
import { FeaturedSwiper, SwiperSlide } from "@/components/ui/featured-swiper"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { SectionHeading } from "@/components/ui/section-heading"

export function FeaturedWeddingStationery() {
  const vendorType = getVendorTypeFromPath('wedding-stationery')
  const { data: allVendors = [], isLoading } = useVendorsByType(vendorType)
  const vendors = allVendors.slice(0, 8)

  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-br from-gold-50/20 via-white to-purple-50/30">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <SectionHeading title="Featured Wedding Stationery" subtitle="Elegant Invitations" />
            <p className="text-muted-foreground mt-2">Beautiful wedding invitations and stationery for your special day</p>
          </div>
          <Link href="/wedding-stationery" className="text-purple-600 hover:text-purple-700 hover:underline hidden md:block font-medium">
            View all wedding stationery &rarr;
          </Link>
        </div>

        <FeaturedSwiper>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <SwiperSlide key={index}>
                <div className="animate-pulse w-full">
                  <div className="bg-gold-100 h-48 rounded-t-lg" />
                  <div className="bg-white p-4 rounded-b-lg">
                    <div className="h-4 bg-gold-100 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gold-100 rounded w-1/2" />
                  </div>
                </div>
              </SwiperSlide>
            ))
          ) : (
            vendors.map((vendor) => (
              <SwiperSlide key={vendor.id}>
                <VendorCard
                  id={vendor.id}
                  name={vendor.name}
                  image={vendor.images?.[0] || "/placeholder.svg"}
                  location={vendor.location || vendor.city}
                  rating={vendor.rating}
                  reviews={vendor.reviews?.length || 0}
                  price={vendor.minimumPrice || (vendor.packages?.length > 0 ? Math.min(...vendor.packages.map((p) => p.price).filter((p) => p > 0)) : null) || vendor.price || null}
                  type={vendor.type || vendor.subBusinessType}
                  capacity={vendor.capacity}
                  amenities={vendor.amenities}
                  sponsored={vendor.sponsored}
                />
              </SwiperSlide>
            ))
          )}
        </FeaturedSwiper>

        <div className="text-center mt-8 md:hidden">
          <Link href="/wedding-stationery" className="text-purple-600 hover:text-purple-700 hover:underline font-medium">
            View all wedding stationery &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
