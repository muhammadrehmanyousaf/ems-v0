"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import VendorCard from "@/components/VendorCard"
import { FeaturedSwiper, SwiperSlide } from "@/components/ui/featured-swiper"
import { useFeaturedVendors } from "@/hooks/use-vendors"
import { Loader2 } from "lucide-react"

export function FeaturedVendors() {
  const { data: vendors = [], isLoading, error } = useFeaturedVendors()

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-rose-50 via-white to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Vendors
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our handpicked selection of premium wedding vendors
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          </div>
        </div>
      </section>
    )
  }

  if (error || vendors.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Vendors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of premium wedding vendors
          </p>
        </div>

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
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            View All Vendors
          </Link>
        </div>
      </div>
    </section>
  )
}
