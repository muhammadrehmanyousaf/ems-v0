"use client"

/**
 * Issue #65 — vendor cards section for the SEO vendor-type hub pages.
 *
 * The hub pages (/bridal-wear, /wedding-stationery, /catering, etc.) used
 * to render only the city directory + FAQ + "other categories" tile row.
 * Vendors approved for that type lived a click away on the per-city
 * sub-pages. Couples landing on /bridal-wear expected to see actual bridal
 * shops on the page; instead they got an FAQ and bounced.
 *
 * This component renders the top approved vendors of the given type at the
 * top of the hub page. When there are no approved vendors yet (true today
 * for several BK-100.55 categories) the section silently doesn't render,
 * so the rest of the SEO hub (city directory + FAQ) is unaffected.
 */

import Link from "next/link"
import VendorCard from "@/components/VendorCard"
import { FeaturedSwiper, SwiperSlide } from "@/components/ui/featured-swiper"
import { useVendorsByType } from "@/hooks/use-vendors"
import { SectionHeading } from "@/components/ui/section-heading"

interface HubFeaturedVendorsProps {
  /** Backend vendorType label, e.g. "Bridal wearing". */
  vendorType: string
  /** Section heading, e.g. "Featured Bridal Wear". */
  title: string
  /** Subheading or category line, e.g. "Wedding Couture". */
  subtitle: string
  /** Hub slug for the "View all" link, e.g. "bridal-wear". */
  slug: string
  /** Marketing one-liner shown beneath the title. */
  blurb: string
}

export function HubFeaturedVendors({
  vendorType,
  title,
  subtitle,
  slug,
  blurb,
}: HubFeaturedVendorsProps) {
  const { data: allVendors = [], isLoading } = useVendorsByType(vendorType)
  const vendors = allVendors.slice(0, 8)

  // No approved vendors yet → silently render nothing so the city
  // directory + FAQ still anchor the page.
  if (!isLoading && vendors.length === 0) return null

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <SectionHeading title={title} subtitle={subtitle} />
          <p className="text-muted-foreground mt-2">{blurb}</p>
        </div>
        <Link
          href={`/${slug}`}
          className="text-bridal-gold-dark hover:text-bridal-gold-dark hover:underline hidden md:block font-medium"
        >
          View all &rarr;
        </Link>
      </div>

      <FeaturedSwiper>
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
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
          : vendors.map((vendor) => (
              <SwiperSlide key={vendor.id}>
                <VendorCard
                  id={vendor.id}
                  name={vendor.name}
                  image={vendor.images?.[0] || "/placeholder.svg"}
                  location={vendor.location || vendor.city}
                  rating={vendor.rating}
                  reviews={vendor.reviews?.length || 0}
                  price={
                    vendor.minimumPrice ||
                    (vendor.packages?.length > 0
                      ? Math.min(
                          ...vendor.packages.map((p) => p.price).filter((p) => p > 0),
                        )
                      : null) ||
                    vendor.price ||
                    null
                  }
                  type={
                    typeof vendor.type === 'string'
                      ? vendor.type
                      : Array.isArray(vendor.subBusinessType)
                        ? vendor.subBusinessType.join(', ')
                        : (vendor.subBusinessType as string | undefined) ?? ''
                  }
                  capacity={vendor.capacity}
                  amenities={vendor.amenities}
                  sponsored={vendor.sponsored}
                  business={vendor}
                />
              </SwiperSlide>
            ))}
      </FeaturedSwiper>
    </section>
  )
}
