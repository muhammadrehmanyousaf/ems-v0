"use client"

import { BusinessType, useFormContext } from "@/lib/context/form-context"
import { Camera, Heart, Home, Music, Car, Gift, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"
import React from "react"

const businessTypes = [
  {
    id: "PHOTOGRAPHER",
    title: "PHOTOGRAPHER",
    icon: Camera,
  },
  {
    id: "MAKEUP_ARTIST",
    title: "MAKEUP ARTIST",
    icon: Heart,
  },
  {
    id: "WEDDING_VENUE",
    title: "WEDDING VENUE",
    icon: Home,
  },
  {
    id: "HENNA_ARTIST",
    title: "HENNA ARTIST",
    icon: Music,
  },
  {
    id: "DECOR",
    title: "DECOR",
    icon: Gift,
  },
  {
    id: "CATERING",
    title: "CATERING",
    icon: Utensils,
  },
  {
    id: "CAR_RENTAL",
    title: "Car Rental",
    icon: Car,
  },
]

interface BussineTypeCompo {
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType | string>>,
  businessType: BusinessType | string
}
export function BusinessTypeStep({setBusinessType, businessType}: BussineTypeCompo) {
  const { setFormData } = useFormContext()

  return (
    <div className="">
      <div className="flex flex-wrap gap-y-4 gap-x-2 md:gap-4 mt-3">
        {businessTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => {setBusinessType(type.id as BusinessType); setFormData((prev) => ({ ...prev, businessType: type.id }))}}
            className={cn(
              "flex items-center space-x-2.5 md:space-x-3 p-3 sm:p-4 rounded-lg border transition-colors",
              businessType === type.id
                ? "border-rose-600 bg-rose-50"
                : "border-gray-200 hover:border-rose-600",
            )}
          >
            <type.icon
              className={cn("size-5", businessType === type.id ? "text-rose-600" : "text-gray-500")}
            />
            <span
              className={cn(
                "text-xs md:text-sm font-medium",
                businessType === type.id ? "text-rose-600" : "text-gray-700",
              )}
            >
              {type.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

