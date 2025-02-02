"use client"

import { useFormContext } from "@/context/form-context"
import { Camera, Heart, Home, Music, Car, Gift, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function BusinessTypeStep() {
  const { formData, updateFormData } = useFormContext()

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">What is your line of business?</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {businessTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => updateFormData({ businessType: type.id as any })}
            className={cn(
              "flex items-center space-x-3 p-4 rounded-lg border transition-colors",
              formData.businessType === type.id
                ? "border-rose-600 bg-rose-50"
                : "border-gray-200 hover:border-rose-600",
            )}
          >
            <type.icon
              className={cn("w-5 h-5", formData.businessType === type.id ? "text-rose-600" : "text-gray-500")}
            />
            <span
              className={cn(
                "text-sm font-medium",
                formData.businessType === type.id ? "text-rose-600" : "text-gray-700",
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

