"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Star, ArrowRight } from "lucide-react"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion-wrapper"
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

function BentoCard({
  vendor,
  path,
  size,
}: {
  vendor: Vendor
  path: string
  size: "large" | "medium" | "small"
}) {
  return (
    <Link
      href={`/${path}/${vendor.id}`}
      className="block group h-full"
    >
      <div className="relative h-full rounded-md overflow-hidden bridal-card p-0">
        <Image
          src={getFirstImage(vendor.images || [])}
          alt={vendor.name}
          fill
          className="object-cover transition-all duration-[2500ms] group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/15 to-transparent" />

        {/* Bottom panel */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
            <span className="inline-flex items-center gap-1 font-bridal text-[10px] uppercase tracking-[0.22em] text-bridal-rose">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{vendor.city || vendor.location}</span>
            </span>
            <h4
              className={`mt-1 font-display italic text-bridal-ivory leading-tight line-clamp-2 ${
                size === "large" ? "text-[24px] sm:text-[28px]" : "text-[16px]"
              }`}
            >
              {vendor.name}
            </h4>
            <div className="mt-1.5 flex items-center gap-3 font-bridal text-[12px]">
              <span className="flex items-center gap-1 text-bridal-ivory/85">
                <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                {vendor.rating?.toFixed(1) ?? "—"}
              </span>
              <div className="max-h-0 group-hover:max-h-10 overflow-hidden transition-all duration-500 ease-out">
                <span className="font-semibold text-bridal-gold">
                  From Rs.{" "}
                  {(vendor.minimumPrice || vendor.price)?.toLocaleString() ??
                    "Contact us"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function BentoGridSection({
  vendorTypes,
  title,
  subtitle,
  description,
}: Props) {
  return (
    <BentoGridInner
      vendorTypes={vendorTypes}
      title={title}
      subtitle={subtitle}
      description={description}
    />
  )
}

function BentoGridInner({
  vendorTypes,
  title,
  subtitle,
  description,
}: Props) {
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

  const sizes: ("large" | "medium" | "small")[] = [
    "large",
    "medium",
    "small",
    "small",
    "medium",
    "small",
  ]

  return (
    <section className="relative bg-bridal-ivory section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />

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
              <BentoCard
                vendor={item.vendor}
                path={item.path}
                size={sizes[i] || "small"}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Category chip pills */}
        <div className="flex justify-center gap-2.5 mt-9 flex-wrap">
          {vendorTypes.map((vt) => (
            <Link
              key={vt.path}
              href={`/${vt.path}`}
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                font-bridal text-[12px] uppercase tracking-[0.18em] font-medium
                bg-bridal-blush border border-bridal-rose/55 text-bridal-mauve
                hover:border-bridal-gold hover:bg-bridal-blush/80 hover:text-bridal-charcoal
                transition-colors
              "
            >
              {vt.label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
