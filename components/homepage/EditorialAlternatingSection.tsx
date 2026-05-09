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
  tagline: string
}

interface Props {
  vendorTypes: VendorTypeConfig[]
  title: string
  subtitle: string
}

function AlternatingRow({
  path,
  label,
  tagline,
  reversed,
}: VendorTypeConfig & { reversed: boolean }) {
  const vendorType = getVendorTypeFromPath(path)
  const { data: vendors = [] } = useVendorsByType(vendorType)
  const items = vendors.slice(0, 4)

  if (items.length === 0) return null

  const hero = items[0]
  const cards = items.slice(1)

  return (
    <ScrollReveal variant={reversed ? "fade-left" : "fade-right"}>
      <div
        className={`flex flex-col lg:flex-row gap-6 items-stretch ${
          reversed ? "lg:flex-row-reverse" : ""
        }`}
      >
        {/* Hero image side */}
        <Link href={`/${path}/${hero.id}`} className="lg:w-1/2 group block">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[300px] rounded-md overflow-hidden bridal-card p-0">
            <Image
              src={getFirstImage(hero.images || [])}
              alt={hero.name}
              fill
              className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/15 to-transparent" />

            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bridal-cream/95 border border-bridal-gold/55 backdrop-blur-sm font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-charcoal">
              {label}
            </span>

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <span className="inline-flex items-center gap-1.5 font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-rose">
                <MapPin className="w-3 h-3" />
                {hero.city || hero.location}
              </span>
              <h4 className="mt-1 font-display italic text-[24px] sm:text-[26px] text-bridal-ivory leading-tight">
                {hero.name}
              </h4>
              <div className="mt-2 flex items-center gap-3 font-bridal text-[12.5px] text-bridal-ivory/85">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-bridal-gold fill-bridal-gold" />
                  {hero.rating?.toFixed(1) ?? "—"}
                </span>
                <span className="font-semibold text-bridal-gold">
                  From Rs.{" "}
                  {(hero.minimumPrice || hero.price)?.toLocaleString() ??
                    "Contact us"}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Content side */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="mb-5">
            <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
              Explore the Edit
            </span>
            <h3 className="mt-1 font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">
              {label}
            </h3>
            <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft leading-relaxed">
              {tagline}
            </p>
          </div>

          <div className="flex-1 space-y-2">
            {cards.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/${path}/${vendor.id}`}
                className="
                  flex items-center gap-4 p-3 rounded-md
                  hover:bg-bridal-blush/40 transition-colors group/card
                "
              >
                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-bridal-beige">
                  <Image
                    src={getFirstImage(vendor.images || [])}
                    alt={vendor.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-display italic text-[16px] text-bridal-charcoal leading-tight truncate group-hover/card:text-bridal-gold-dark transition-colors">
                    {vendor.name}
                  </h5>
                  <div className="mt-0.5 flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                    <MapPin className="w-3 h-3 text-bridal-gold/80 flex-shrink-0" />
                    <span className="truncate">
                      {vendor.city || vendor.location}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-center gap-1 font-bridal text-[12px] text-bridal-text-soft">
                    <Star className="w-3 h-3 text-bridal-gold fill-bridal-gold" />
                    <span className="font-semibold text-bridal-charcoal">
                      {vendor.rating?.toFixed(1) ?? "—"}
                    </span>
                  </div>
                  <p className="font-bridal text-[12px] font-semibold text-bridal-gold-dark mt-0.5">
                    Rs.{" "}
                    {(vendor.minimumPrice || vendor.price)?.toLocaleString() ??
                      "Contact us"}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={`/${path}`}
            className="
              inline-flex items-center gap-1.5 mt-5 self-start
              font-bridal text-[12px] uppercase tracking-[0.22em] font-medium
              text-bridal-mauve hover:text-bridal-gold transition-colors group/link
            "
          >
            View all {label.toLowerCase()}
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </ScrollReveal>
  )
}

export function EditorialAlternatingSection({
  vendorTypes,
  title,
  subtitle,
}: Props) {
  return (
    <section className="relative bg-bridal-cream section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div className="relative container-responsive">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
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
          </div>
        </ScrollReveal>

        <div className="space-y-12 lg:space-y-16">
          {vendorTypes.map((vt, i) => (
            <AlternatingRow key={vt.path} {...vt} reversed={i % 2 !== 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
