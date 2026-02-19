"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"
import { SectionHeading } from "@/components/ui/section-heading"

interface Props {
  vendorPath: string
  title: string
  subtitle: string
  description: string
}

export function FeaturedVendorsShowcase({ vendorPath, title, subtitle, description }: Props) {
  const vendorType = getVendorTypeFromPath(vendorPath)
  const { data: allVendors = [], isLoading } = useVendorsByType(vendorType)
  const vendors = allVendors.slice(0, 5)

  if (isLoading || vendors.length === 0) return null

  const hero = vendors[0]
  const grid = vendors.slice(1, 5)

  return (
    <section className="section-padding bg-gradient-to-br from-purple-50/30 via-white to-gold-50/20">
      <div className="container-responsive">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-10">
            <div>
              <SectionHeading title={title} subtitle={subtitle} align="left" />
              <p className="text-muted-foreground mt-2 max-w-xl">{description}</p>
            </div>
            <Link
              href={`/${vendorPath}`}
              className="hidden md:inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Hero card - left */}
          <ScrollReveal variant="fade-left" className="h-full">
            <Link href={`/${vendorPath}/${hero.id}`} className="block group h-full">
              <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[320px] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src={getFirstImage(hero.images || [])}
                  alt={hero.name}
                  fill
                  className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-purple-900/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  {hero.sponsored && (
                    <Badge className="bg-gradient-to-r from-gold-500 to-gold-600 text-white border-0 mb-3 text-xs">
                      Featured
                    </Badge>
                  )}
                  <h3 className="text-2xl font-heading font-bold mb-2">{hero.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {hero.city || hero.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                      {hero.rating?.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-lg font-bold mt-2 text-gold-300">
                    From ₹{(hero.minimumPrice || hero.price || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          </ScrollReveal>

          {/* Grid - right */}
          <StaggerContainer staggerDelay={0.12} className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
            {grid.map((vendor) => (
              <StaggerItem key={vendor.id} className="h-full">
                <Link href={`/${vendorPath}/${vendor.id}`} className="block group h-full">
                  <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[200px] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image
                      src={getFirstImage(vendor.images || [])}
                      alt={vendor.name}
                      fill
                      className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-semibold text-sm leading-tight line-clamp-1">{vendor.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{vendor.city || vendor.location}</span>
                        <Star className="w-3 h-3 fill-gold-400 text-gold-400 ml-auto flex-shrink-0" />
                        <span>{vendor.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href={`/${vendorPath}`} className="text-purple-600 hover:text-purple-700 font-medium">
            View all {title.toLowerCase()} &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
