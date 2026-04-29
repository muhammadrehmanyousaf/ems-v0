"use client"

import Link from "next/link"
import {
  Camera,
  Palette,
  Heart,
  MapPin,
  Car,
  Utensils,
  Crown,
  Mail,
  Brush,
  ArrowRight,
} from "lucide-react"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"
import { SectionHeading } from "@/components/ui/section-heading"

const categoryData = [
  {
    path: "photographers",
    icon: Camera,
    title: "Photographers",
    gradient: "from-purple-600 via-purple-700 to-violet-800",
  },
  {
    path: "venues",
    icon: MapPin,
    title: "Venues",
    gradient: "from-gold-500 via-amber-600 to-orange-700",
  },
  {
    path: "decor",
    icon: Palette,
    title: "Decorators",
    gradient: "from-purple-500 via-indigo-600 to-blue-700",
  },
  {
    path: "makeup-artists",
    icon: Heart,
    title: "Makeup",
    gradient: "from-pink-500 via-rose-600 to-purple-700",
  },
  {
    path: "catering",
    icon: Utensils,
    title: "Catering",
    gradient: "from-amber-500 via-orange-600 to-red-700",
  },
  {
    path: "henna-artists",
    icon: Brush,
    title: "Henna Artists",
    gradient: "from-orange-500 via-amber-600 to-yellow-700",
  },
  {
    path: "car-rental",
    icon: Car,
    title: "Car Rental",
    gradient: "from-slate-600 via-slate-700 to-slate-900",
  },
  {
    path: "bridal-wear",
    icon: Crown,
    title: "Bridal Wear",
    gradient: "from-gold-500 via-gold-600 to-amber-700",
  },
  {
    path: "wedding-stationery",
    icon: Mail,
    title: "Stationery",
    gradient: "from-purple-800 via-purple-900 to-slate-900",
  },
]

export function FeaturedCategories() {
  return (
    <section className="section-padding bg-gradient-to-b from-purple-50/50 to-white">
      <div className="container-responsive">
        <ScrollReveal>
          <div className="flex justify-between items-end mb-10">
            <div>
              <SectionHeading title="Browse Services" subtitle="Categories" align="left" />
              <p className="text-muted-foreground mt-2">Explore different wedding service categories</p>
            </div>
            <Link
              href="/vendors"
              className="hidden md:inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group"
            >
              View all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <StaggerContainer staggerDelay={0.06} className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 sm:gap-4">
          {categoryData.map((category) => {
            const IconComponent = category.icon
            return (
              <StaggerItem key={category.path}>
                <Link href={`/${category.path}`} className="block group">
                  <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${category.gradient} p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[120px] shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300`}>
                    <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/25 transition-all duration-300">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight">
                      {category.title}
                    </h3>
                  </div>
                </Link>
              </StaggerItem>
            )
          })}
        </StaggerContainer>

        <div className="text-center mt-8 md:hidden">
          <Link href="/vendors" className="text-purple-600 hover:text-purple-700 font-medium">
            View all vendors &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
