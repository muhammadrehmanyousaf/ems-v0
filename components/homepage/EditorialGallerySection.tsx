"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import { ScrollReveal } from "@/components/ui/motion-wrapper"

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
      <div className="flex items-center justify-between pr-[5%] sm:pr-[7%] lg:pr-[9%]">
        <div>
          <span className="font-bridal text-[10px] uppercase tracking-[0.28em] text-bridal-gold font-medium">
            Curated Picks
          </span>
          <h3 className="font-display italic text-[22px] sm:text-[26px] text-bridal-charcoal leading-tight mt-1">
            {label}
          </h3>
        </div>
        <Link
          href={`/${path}`}
          className="
            inline-flex items-center gap-1.5 font-bridal text-[11px] uppercase tracking-[0.22em]
            font-medium text-bridal-mauve hover:text-bridal-gold transition-colors group
          "
        >
          View all
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar pr-[5%]">
        {items.map((vendor) => (
          <Link
            key={vendor.id}
            href={`/${path}/${vendor.id}`}
            className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start group"
          >
            <div className="relative aspect-[3/4] rounded-md overflow-hidden bridal-card p-0">
              <Image
                src={getFirstImage(vendor.images || [])}
                alt={vendor.name}
                fill
                className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
                sizes="280px"
              />
              {/* Bridal veils */}
              <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-bridal-mauve/20 via-transparent to-bridal-blush/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <span className="inline-flex items-center gap-1.5 font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-rose">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{vendor.city || vendor.location}</span>
                </span>
                <h4 className="mt-1 font-display italic text-[18px] text-bridal-ivory leading-tight line-clamp-1">
                  {vendor.name}
                </h4>
                <div className="max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-500">
                  <div className="mt-2 flex items-center gap-3 font-bridal text-[12px]">
                    <span className="flex items-center gap-1 text-bridal-ivory/85">
                      <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                      {vendor.rating?.toFixed(1) ?? "—"}
                    </span>
                    <span className="font-semibold text-bridal-gold">
                      Rs.{" "}
                      {(vendor.minimumPrice || vendor.price)?.toLocaleString() ??
                        "Contact us"}
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

export function EditorialGallerySection({
  vendorTypes,
  title,
  subtitle,
  description,
}: Props) {
  return (
    <section className="relative bg-bridal-blush/30 section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-30" />

      <div className="relative container-responsive">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
                {subtitle}
              </span>
              <span className="block w-10 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
            </div>
            <h2 className="font-display italic text-[28px] sm:text-[34px] md:text-[40px] leading-[1.1] text-bridal-charcoal">
              {title}
            </h2>
            <p className="font-bridal text-bridal-text-soft text-[14px] sm:text-[15px] mt-3 leading-relaxed">
              {description}
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Full-width horizontal scroll galleries — bleed into the right edge */}
      <div className="relative space-y-8 pl-[5%] sm:pl-[7%] lg:pl-[9%]">
        {vendorTypes.map((vt) => (
          <ScrollReveal key={vt.path} variant="fade-up">
            <GalleryRow {...vt} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  )
}
