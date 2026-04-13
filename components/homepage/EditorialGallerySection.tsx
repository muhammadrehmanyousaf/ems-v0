"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import { ScrollReveal } from "@/components/ui/motion-wrapper"
import { SectionHeading } from "@/components/ui/section-heading"

interface VendorTypeConfig {
  path: string
  label: string
}

interface Props {
  vendorTypes: VendorTypeConfig[]
  title: string
  subtitle: string
  description: string
}

function GalleryRow({ path, label }: VendorTypeConfig) {
  const vendorType = getVendorTypeFromPath(path)
  const { data: vendors = [] } = useVendorsByType(vendorType)
  const items = vendors.slice(0, 8)

  if (items.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-heading font-semibold text-foreground">{label}</h3>
        <Link
          href={`/${path}`}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 group"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none hide-scrollbar">
        {items.map((vendor) => (
          <Link
            key={vendor.id}
            href={`/${path}/${vendor.id}`}
            className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start group"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
              <Image
                src={getFirstImage(vendor.images || [])}
                alt={vendor.name}
                fill
                className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                sizes="280px"
              />
              {/* Hover reveal overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-purple-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
              {/* Always-visible bottom info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h4 className="font-bold text-sm leading-tight line-clamp-1 mb-1">{vendor.name}</h4>
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{vendor.city || vendor.location}</span>
                </div>
                {/* Hover extras */}
                <div className="max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-500">
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
                      {vendor.rating?.toFixed(1)}
                    </span>
                    <span className="font-semibold text-gold-300">
                      Rs. {(vendor.minimumPrice || vendor.price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function EditorialGallerySection({ vendorTypes, title, subtitle, description }: Props) {
  return (
    <section className="section-padding bg-gradient-to-b from-white via-purple-50/20 to-white overflow-hidden">
      <div className="container-responsive">
        <ScrollReveal>
          <div className="text-center mb-10">
            <SectionHeading title={title} subtitle={subtitle} />
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{description}</p>
          </div>
        </ScrollReveal>
      </div>

      {/* Full-width horizontal scroll galleries */}
      <div className="space-y-8 pl-[5%]">
        {vendorTypes.map((vt) => (
          <ScrollReveal key={vt.path} variant="fade-up">
            <GalleryRow {...vt} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
