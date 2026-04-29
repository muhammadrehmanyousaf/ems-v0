"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getVendorTypeFromPath } from "@/lib/vendor-types"
import { useVendorsByType } from "@/hooks/use-vendors"
import { getFirstImage } from "@/lib/utils/image-utils"
import { ScrollReveal } from "@/components/ui/motion-wrapper"
import { SectionHeading } from "@/components/ui/section-heading"

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

function AlternatingRow({ path, label, tagline, reversed }: VendorTypeConfig & { reversed: boolean }) {
  const vendorType = getVendorTypeFromPath(path)
  const { data: vendors = [] } = useVendorsByType(vendorType)
  const items = vendors.slice(0, 4)

  if (items.length === 0) return null

  const hero = items[0]
  const cards = items.slice(1)

  return (
    <ScrollReveal variant={reversed ? "fade-left" : "fade-right"}>
      <div className={`flex flex-col lg:flex-row gap-6 items-stretch ${reversed ? "lg:flex-row-reverse" : ""}`}>
        {/* Image side */}
        <Link href={`/${path}/${hero.id}`} className="lg:w-1/2 group">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[280px] rounded-2xl overflow-hidden shadow-lg">
            <Image
              src={getFirstImage(hero.images || [])}
              alt={hero.name}
              fill
              className="object-cover transition-all duration-[2000ms] group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 text-xs mb-2">{label}</Badge>
              <h4 className="text-xl font-heading font-bold">{hero.name}</h4>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {hero.city || hero.location}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                  {hero.rating?.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Content side */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="mb-4">
            <h3 className="text-2xl font-heading font-bold text-foreground">{label}</h3>
            <p className="text-muted-foreground mt-1">{tagline}</p>
          </div>

          <div className="flex-1 space-y-3">
            {cards.map((vendor) => (
              <Link
                key={vendor.id}
                href={`/${path}/${vendor.id}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-purple-50/50 transition-colors group/card"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-purple-100">
                  <Image
                    src={getFirstImage(vendor.images || [])}
                    alt={vendor.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-sm text-foreground group-hover/card:text-purple-700 transition-colors truncate">
                    {vendor.name}
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{vendor.city || vendor.location}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                    <span className="font-semibold">{vendor.rating?.toFixed(1)}</span>
                  </div>
                  <p className="text-xs font-semibold text-purple-600 mt-0.5">
                    Rs. {(vendor.minimumPrice || vendor.price)?.toLocaleString() ?? 'Contact us'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href={`/${path}`}
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-purple-600 hover:text-purple-700 group/link"
          >
            View all {label.toLowerCase()}
            <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </ScrollReveal>
  )
}

export function EditorialAlternatingSection({ vendorTypes, title, subtitle }: Props) {
  return (
    <section className="section-padding bg-white">
      <div className="container-responsive">
        <ScrollReveal>
          <div className="text-center mb-12">
            <SectionHeading title={title} subtitle={subtitle} />
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
