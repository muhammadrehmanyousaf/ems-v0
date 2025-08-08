"use client"

import { Camera, Home, Palette, Utensils, Car, Music, Cake, Heart, Scissors, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const categories = [
  {
    name: "Venues",
    icon: Home,
    href: "/venues",
    image:
      "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Photographers",
    icon: Camera,
    href: "/photographers",
    image:
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Makeup Artists",
    icon: Heart,
    href: "/makeup-artists",
    image:
      "https://images.pexels.com/photos/457701/pexels-photo-457701.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Decorators",
    icon: Palette,
    href: "/decor",
    image:
      "https://images.pexels.com/photos/1616113/pexels-photo-1616113.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Henna Artists",
    icon: Scissors,
    href: "/henna-artists",
    image:
      "https://images.pexels.com/photos/3775132/pexels-photo-3775132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Catering",
    icon: Utensils,
    href: "/catering",
    image:
      "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Car Rental",
    icon: Car,
    href: "/car-rental",
    image:
      "https://images.pexels.com/photos/2526128/pexels-photo-2526128.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Bridal Wear",
    icon: Heart,
    href: "/bridal-wear",
    image:
      "https://images.pexels.com/photos/3775132/pexels-photo-3775132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
  {
    name: "Wedding Stationery",
    icon: FileText,
    href: "/wedding-stationery",
    image:
      "https://images.pexels.com/photos/1702373/pexels-photo-1702373.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
  },
]

export function FeaturedCategories() {
  return (
    <section className="py-12 bg-gradient-to-br from-neutral-50 via-white to-rose-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">Find Every Wedding Vendor You Need</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Discover the perfect vendors for your special day
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group flex flex-col items-center p-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-neutral-100 min-w-[120px]"
            >
              <div className="relative w-16 h-16 mb-2 overflow-hidden rounded-lg">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-opacity duration-300" />
                <category.icon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-neutral-700 group-hover:text-rose-600 transition-colors duration-200 text-center">
                {category.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link 
            href="/vendors"
            className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-semibold transition-colors duration-200"
          >
            View All Categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

