"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Star, ArrowRight } from "lucide-react"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"
import { SectionHeading } from "@/components/ui/section-heading"
import type { Vendor } from "@/lib/types"

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

function BentoCard({ vendor, path, size }: { vendor: Vendor; path: string; size: "large" | "medium" | "small" }) {
  return (
    <Link href={`/${path}/${vendor.id}`} className="block group h-full">
      <div className="relative h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500">
        <Image
          src={getFirstImage(vendor.images || [])}
          alt={vendor.name}
          fill
          className="object-cover transition-all duration-[2500ms] group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/80 via-transparent to-transparent" />

        {/* Hover reveal panel sliding up */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <h4 className={`font-bold text-white leading-tight line-clamp-2 ${size === "large" ? "text-xl" : "text-sm"}`}>
              {vendor.name}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-white/70">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{vendor.city || vendor.location}</span>
              <Star className="w-3 h-3 fill-gold-400 text-gold-400 ml-auto flex-shrink-0" />
              <span>{vendor.rating?.toFixed(1)}</span>
            </div>
            <div className="max-h-0 group-hover:max-h-12 overflow-hidden transition-all duration-500 ease-out">
              <p className="text-sm font-semibold text-gold-300 mt-2">
                From Rs. {(vendor.minimumPrice || vendor.price)?.toLocaleString() ?? 'Contact us'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function BentoGridSection({ vendorTypes, title, subtitle, description }: Props) {
  // Collect vendors from multiple types
  const allItems: { vendor: Vendor; path: string }[] = []

  return (
    <BentoGridInner
      vendorTypes={vendorTypes}
      title={title}
      subtitle={subtitle}
      description={description}
    />
  )
}

function BentoGridInner({ vendorTypes, title, subtitle, description }: Props) {
  // We need to call hooks at the top level, so we use a fixed set
  const type0 = getVendorTypeFromPath(vendorTypes[0]?.path || "")
  const type1 = getVendorTypeFromPath(vendorTypes[1]?.path || "")
  const type2 = getVendorTypeFromPath(vendorTypes[2]?.path || "")

  const { data: vendors0 = [] } = useVendorsByType(type0)
  const { data: vendors1 = [] } = useVendorsByType(type1)
  const { data: vendors2 = [] } = useVendorsByType(type2)

  const allItems: { vendor: Vendor; path: string }[] = [
    ...vendors0.slice(0, 2).map((v) => ({ vendor: v, path: vendorTypes[0]?.path || "" })),
    ...vendors1.slice(0, 2).map((v) => ({ vendor: v, path: vendorTypes[1]?.path || "" })),
    ...vendors2.slice(0, 2).map((v) => ({ vendor: v, path: vendorTypes[2]?.path || "" })),
  ]

  if (allItems.length < 4) return null

  // Bento layout: first item large (span 2 cols, 2 rows), rest fill grid
  const sizes: ("large" | "medium" | "small")[] = ["large", "medium", "small", "small", "medium", "small"]

  return (
    <section className="section-padding bg-gradient-to-br from-purple-50/40 via-white to-gold-50/20">
      <div className="container-responsive">
        <ScrollReveal>
          <div className="text-center mb-10">
            <SectionHeading title={title} subtitle={subtitle} />
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{description}</p>
          </div>
        </ScrollReveal>

        <StaggerContainer
          staggerDelay={0.1}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px] sm:auto-rows-[240px]"
        >
          {allItems.slice(0, 6).map((item, i) => (
            <StaggerItem
              key={item.vendor.id}
              className={`${
                i === 0
                  ? "col-span-2 row-span-2"
                  : i === 4
                  ? "col-span-2 md:col-span-1"
                  : ""
              } h-full`}
            >
              <BentoCard vendor={item.vendor} path={item.path} size={sizes[i] || "small"} />
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="flex justify-center gap-3 mt-8">
          {vendorTypes.map((vt) => (
            <Link
              key={vt.path}
              href={`/${vt.path}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors"
            >
              {vt.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
