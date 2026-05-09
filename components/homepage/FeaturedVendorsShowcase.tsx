"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Star, Award } from "lucide-react"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper"

interface Props {
  vendorPath: string
  title: string
  subtitle: string
  description: string
}

export function FeaturedVendorsShowcase({
  vendorPath,
  title,
  subtitle,
  description,
}: Props) {
  const vendorType = getVendorTypeFromPath(vendorPath)
  const { data: allVendors = [], isLoading } = useVendorsByType(vendorType)
  const vendors = allVendors.slice(0, 5)

  if (isLoading || vendors.length === 0) return null

  const hero = vendors[0]
  const grid = vendors.slice(1, 5)

  return (
    <section className="relative bg-bridal-cream section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />

      <div className="relative container-responsive">
        <ScrollReveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
                <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
                  {subtitle}
                </span>
              </div>
              <h2 className="font-display italic text-[28px] sm:text-[34px] md:text-[40px] leading-[1.1] text-bridal-charcoal">
                {title.replace(/Featured\s+/i, "Featured ")}
              </h2>
              <p className="font-bridal text-bridal-text-soft text-[14px] sm:text-[15px] mt-3 leading-relaxed">
                {description}
              </p>
            </div>
            <Link
              href={`/${vendorPath}`}
              className="
                hidden lg:inline-flex items-center gap-2
                font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
                text-bridal-mauve hover:text-bridal-gold transition-colors group self-end
              "
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Hero card */}
          <ScrollReveal variant="fade-left" className="h-full">
            <Link
              href={`/${vendorPath}/${hero.id}`}
              className="block group h-full"
            >
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[340px] rounded-md overflow-hidden bridal-card p-0">
                <Image
                  src={getFirstImage(hero.images || [])}
                  alt={hero.name}
                  fill
                  className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {/* Bridal veil — charcoal at the bottom, transparent at top */}
                <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/30 to-transparent" />

                {hero.sponsored && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-gold/95 border border-bridal-gold-dark/30 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.2em] backdrop-blur-sm">
                    <Award className="w-3 h-3" />
                    Featured
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                  <span className="inline-flex items-center gap-1.5 font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-rose">
                    <MapPin className="w-3 h-3" />
                    {hero.city || hero.location}
                  </span>
                  <h3 className="mt-1 font-display italic text-[28px] sm:text-[32px] leading-[1.05] text-bridal-ivory">
                    {hero.name}
                  </h3>
                  <div className="mt-3 flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 font-bridal text-[12.5px] text-bridal-ivory/85">
                      <Star className="w-3.5 h-3.5 text-bridal-gold fill-bridal-gold" />
                      {hero.rating?.toFixed(1) ?? "—"}
                    </span>
                    <span className="font-bridal text-[14px] font-semibold text-bridal-gold">
                      From Rs.{" "}
                      {(hero.minimumPrice || hero.price)?.toLocaleString() ??
                        "Contact us"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Right grid */}
          <StaggerContainer
            staggerDelay={0.12}
            className="grid grid-cols-2 grid-rows-2 gap-4 h-full"
          >
            {grid.map((vendor) => (
              <StaggerItem key={vendor.id} className="h-full">
                <Link
                  href={`/${vendorPath}/${vendor.id}`}
                  className="block group h-full"
                >
                  <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[210px] rounded-md overflow-hidden bridal-card p-0 w-full">
                    <Image
                      src={getFirstImage(vendor.images || [])}
                      alt={vendor.name}
                      fill
                      className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5">
                      <h4 className="font-display italic text-[16px] text-bridal-ivory leading-tight line-clamp-1">
                        {vendor.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-2 font-bridal text-[11px] text-bridal-ivory/80">
                        <MapPin className="w-3 h-3 text-bridal-gold/85" />
                        <span className="truncate">
                          {vendor.city || vendor.location}
                        </span>
                        <Star className="w-3 h-3 ml-auto text-bridal-gold fill-bridal-gold flex-shrink-0" />
                        <span className="font-medium text-bridal-gold">
                          {vendor.rating?.toFixed(1) ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <div className="text-center mt-8 lg:hidden">
          <Link
            href={`/${vendorPath}`}
            className="
              inline-flex items-center gap-2
              font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
              text-bridal-mauve hover:text-bridal-gold transition-colors group
            "
          >
            <span>View all {title.toLowerCase()}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
