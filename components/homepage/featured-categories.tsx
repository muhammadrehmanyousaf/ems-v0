"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  Palette, 
  Heart, 
  MapPin, 
  Car, 
  Utensils, 
  Crown, 
  Mail,
  ArrowRight
} from "lucide-react"
import { VENDOR_TYPE_PATHS, VENDOR_TYPE_DISPLAY_NAMES } from "@/lib/vendor-types"

const categoryData = [
  {
    path: "photographers",
    icon: Camera,
    title: "Photographers",
    description: "Capture your special moments",
    color: "from-blue-500 to-indigo-600",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    path: "venues",
    icon: MapPin,
    title: "Wedding Venues",
    description: "Find the perfect venue",
    color: "from-green-500 to-emerald-600",
    bgColor: "bg-green-50",
    textColor: "text-green-600"
  },
  {
    path: "decor",
    icon: Palette,
    title: "Decorators",
    description: "Transform your venue",
    color: "from-purple-500 to-violet-600",
    bgColor: "bg-purple-50",
    textColor: "text-purple-600"
  },
  {
    path: "makeup-artists",
    icon: Heart,
    title: "Makeup Artists",
    description: "Perfect wedding look",
    color: "from-pink-500 to-rose-600",
    bgColor: "bg-pink-50",
    textColor: "text-pink-600"
  },
  {
    path: "catering",
    icon: Utensils,
    title: "Catering",
    description: "Delicious wedding food",
    color: "from-orange-500 to-red-600",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600"
  },
  {
    path: "car-rental",
    icon: Car,
    title: "Car Rental",
    description: "Luxury transportation",
    color: "from-gray-500 to-slate-600",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600"
  },
  {
    path: "bridal-wear",
    icon: Crown,
    title: "Bridal Wear",
    description: "Stunning wedding dresses",
    color: "from-rose-500 to-pink-600",
    bgColor: "bg-rose-50",
    textColor: "text-rose-600"
  },
  {
    path: "wedding-stationery",
    icon: Mail,
    title: "Wedding Stationery",
    description: "Beautiful invitations",
    color: "from-teal-500 to-cyan-600",
    bgColor: "bg-teal-50",
    textColor: "text-teal-600"
  }
]

export function FeaturedCategories() {
  return (
    <section className="py-6 sm:py-8 md:py-12 lg:py-16 bg-gray-50">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Categories</h2>
            <p className="text-gray-600">Explore different wedding service categories</p>
          </div>
          <Link href="/vendors" className="text-primary hover:underline hidden md:block">
            View all vendors →
          </Link>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categoryData.map((category) => {
            const IconComponent = category.icon
            return (
              <Link key={category.path} href={`/${category.path}`} className="w-full">
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/95 backdrop-blur-sm overflow-hidden h-full">
                  <CardContent className="p-3 sm:p-4 lg:p-3">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-r ${category.color}`}>
                        <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 text-white" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-xs sm:text-sm lg:text-xs font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 leading-tight">
                          {category.title}
                        </h3>
                        <p className="text-xs lg:text-xs text-gray-600 leading-tight hidden sm:block lg:hidden">
                          {category.description}
                        </p>
                      </div>

                      <div className="mt-auto">
                        <Badge 
                          variant="secondary" 
                          className={`${category.bgColor} ${category.textColor} border-0 hover:opacity-80 transition-opacity duration-200 text-xs px-2 py-1`}
                        >
                          Explore
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/vendors" className="text-primary hover:underline">
            View all vendors →
          </Link>
        </div>
      </div>
    </section>
  )
}
