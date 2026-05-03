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
      <section className="py-16 bg-gradient-to-br from-bridal-cream/30 via-white to-gold-50/20">
        <div className="container mx-auto px-4">
          <SectionHeading title="Featured Vendors" subtitle="Handpicked Selection" />
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin text-bridal-gold" />
          </div>
        </div>
      </section>
    )
  }

  if (error || vendors.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gradient-to-br from-bridal-cream/30 via-white to-gold-50/20">
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
                price={vendor.minimumPrice || (vendor.packages?.length > 0 ? Math.min(...vendor.packages.map((p) => p.price).filter((p) => p > 0)) : null) || vendor.price || null}
                type={vendor.type || vendor.subBusinessType || "Vendor"}
                vendorType={vendor.subBusinessType}
                capacity={vendor.maxCapacity}
                amenities={vendor.amenities || []}
                sponsored={vendor.sponsored}
                showBookButton={true}
                showDetails={true}
                business={vendor}
              />
            </SwiperSlide>
          ))}
        </FeaturedSwiper>

        <div className="text-center mt-8">
          <Link
            href="/vendors"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)] transform hover:scale-105"
          >
            View All Vendors
          </Link>
        </div>
      </div>
    </section>
  )
}
