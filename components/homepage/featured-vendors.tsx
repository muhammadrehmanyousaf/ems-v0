"use client"

import Link from "next/link"
import VendorCard from "@/components/VendorCard"
import { FeaturedSwiper, SwiperSlide } from "@/components/ui/featured-swiper"
import { useFeaturedVendors } from "@/hooks/use-vendors"
import { Loader2 } from "lucide-react"
import { SectionHeading } from "@/components/ui/section-heading"

export function FeaturedVendors() {
  const { data: vendors = [], isLoading, error } = useFeaturedVendors()

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-50/30 via-white to-gold-50/20">
        <div className="container mx-auto px-4">
          <SectionHeading title="Featured Vendors" subtitle="Handpicked Selection" />
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        </div>
      </section>
    )
  }

  if (error || vendors.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50/30 via-white to-gold-50/20">
      <div className="container mx-auto px-4">
        <SectionHeading
          title="Featured Vendors"
          subtitle="Handpicked Selection"
        />
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center mt-3 mb-12">
          Discover our handpicked selection of premium wedding vendors
        </p>

        <FeaturedSwiper>
          {vendors.map((vendor) => (
            <SwiperSlide key={vendor.id}>
              <VendorCard
                id={vendor.id}
                name={vendor.name}
                image={vendor.images?.[0] || "/placeholder.svg"}
                location={vendor.city || vendor.location || "Location not specified"}
                rating={vendor.rating || 0}
                reviews={vendor.reviews || 0}
                price={vendor.minimumPrice || 0}
                type={vendor.type || vendor.subBusinessType || "Vendor"}
                vendorType={vendor.subBusinessType}
                capacity={vendor.maxCapacity}
                amenities={vendor.amenities || []}
                sponsored={vendor.sponsored}
                showBookButton={true}
                showDetails={true}
              />
            </SwiperSlide>
          ))}
        </FeaturedSwiper>

        <div className="text-center mt-8">
          <Link
            href="/vendors"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105"
          >
            View All Vendors
          </Link>
        </div>
      </div>
    </section>
  )
}
