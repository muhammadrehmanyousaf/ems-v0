"use client";

import { BusinessType, useFormContext } from "@/lib/context/form-context";
import {
  Camera,
  Heart,
  Home,
  Music,
  Car,
  Gift,
  Utensils,
  Sparkles,
  Crown,
  Palette,
  Users,
  CheckCircle,
  MailWarning,
  Mail,
  // BK-100.55 Layer 2 — icons for the 14 new categories.
  Mic,
  Drum,
  Megaphone,
  Radio,
  Zap,
  Tent,
  Sofa,
  Flower2,
  Cake,
  Cookie,
  ChefHat,
  Volume2,
  BookOpen,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const businessTypes = [
  {
    id: "Photographer",
    title: "Photographer",
    subtitle: "Professional Photography Services",
    icon: Camera,
    color: "from-blue-500 to-indigo-600",
    bgColor: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600",
  },
  {
    id: "Makeup artist",
    title: "Makeup Artist",
    subtitle: "Beauty & Styling Services",
    icon: Heart,
    color: "from-bridal-gold to-bridal-gold-dark",
    bgColor: "from-bridal-cream to-bridal-cream/80",
    borderColor: "border-bridal-gold/45",
    textColor: "text-bridal-gold-dark",
  },
  {
    id: "Wedding venue",
    title: "Wedding Venue",
    subtitle: "Event Spaces & Locations",
    icon: Home,
    color: "from-green-500 to-emerald-600",
    bgColor: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    textColor: "text-green-600",
  },
  {
    id: "Henna artist",
    title: "Henna Artist",
    subtitle: "Traditional Art & Design",
    icon: Palette,
    color: "from-orange-500 to-amber-600",
    bgColor: "from-orange-50 to-amber-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-600",
  },
  {
    id: "Decorator",
    title: "Decorator",
    subtitle: "Event Decoration & Design",
    icon: Gift,
    color: "from-bridal-gold to-bridal-gold-dark",
    bgColor: "from-bridal-cream to-violet-50",
    borderColor: "border-bridal-gold/45",
    textColor: "text-bridal-gold-dark",
  },
  {
    id: "Catering",
    title: "Catering",
    subtitle: "Food & Beverage Services",
    icon: Utensils,
    color: "from-red-500 to-red-600",
    bgColor: "from-red-50 to-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-600",
  },
  {
    id: "Car rental",
    title: "Car Rental",
    subtitle: "Transportation Services",
    icon: Car,
    color: "from-gray-500 to-slate-600",
    bgColor: "from-gray-50 to-slate-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
  },
  {
    id: "Bridal wearing",
    title: "Bridal Wear",
    subtitle: "Wedding Attire & Fashion",
    icon: Crown,
    color: "from-yellow-500 to-amber-600",
    bgColor: "from-yellow-50 to-amber-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-600",
  },
  {
    id: "Wedding Invitations and Stationery",
    title: "Wedding Stationery",
    subtitle: "Invitations, Bid Boxes & More",
    icon: Mail,
    color: "from-rose-500 to-pink-600",
    bgColor: "from-rose-50 to-pink-50",
    borderColor: "border-rose-200",
    textColor: "text-rose-600",
  },
  // ── BK-100.55 Layer 2 — 14 new Pakistani vendor categories ──
  // All route to the same `GenericSteps` flow (see
  // business-registration-form.tsx). Per-category specialty UI lives
  // behind a free-text textarea today; Layer 3 will polish per category.
  {
    id: "Nikahkhwan",
    title: "Nikahkhwan",
    subtitle: "Certified Officiant for Islamic Ceremony",
    icon: BookOpen,
    color: "from-emerald-500 to-green-600",
    bgColor: "from-emerald-50 to-green-50",
    borderColor: "border-emerald-200",
    textColor: "text-emerald-600",
  },
  {
    id: "Choreographer",
    title: "Choreographer",
    subtitle: "Mehndi & Sangeet Dance Practice",
    icon: Sparkle,
    color: "from-fuchsia-500 to-pink-600",
    bgColor: "from-fuchsia-50 to-pink-50",
    borderColor: "border-fuchsia-200",
    textColor: "text-fuchsia-600",
  },
  {
    id: "Dhol player",
    title: "Dhol Players",
    subtitle: "Traditional Drums for Mehndi & Baraat",
    icon: Drum,
    color: "from-orange-500 to-amber-600",
    bgColor: "from-orange-50 to-amber-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-600",
  },
  {
    id: "Event host",
    title: "Event Host / MC",
    subtitle: "Stage Anchors & Wedding MCs",
    icon: Megaphone,
    color: "from-indigo-500 to-purple-600",
    bgColor: "from-indigo-50 to-purple-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-600",
  },
  {
    id: "Live streaming",
    title: "Live Streaming",
    subtitle: "Broadcast to Overseas Family",
    icon: Radio,
    color: "from-sky-500 to-blue-600",
    bgColor: "from-sky-50 to-blue-50",
    borderColor: "border-sky-200",
    textColor: "text-sky-600",
  },
  {
    id: "Generator rental",
    title: "Generator Rental",
    subtitle: "Load-shedding Backup Power",
    icon: Zap,
    color: "from-yellow-500 to-orange-600",
    bgColor: "from-yellow-50 to-orange-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-700",
  },
  {
    id: "Marquee rental",
    title: "Marquee & Tents",
    subtitle: "Custom Setups for Home Weddings",
    icon: Tent,
    color: "from-stone-500 to-amber-700",
    bgColor: "from-stone-50 to-amber-50",
    borderColor: "border-stone-200",
    textColor: "text-stone-700",
  },
  {
    id: "Furniture rental",
    title: "Furniture Rental",
    subtitle: "Chairs, Tables, Sofas, Mandap",
    icon: Sofa,
    color: "from-amber-500 to-yellow-600",
    bgColor: "from-amber-50 to-yellow-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  {
    id: "Florist",
    title: "Florists",
    subtitle: "Fresh & Imported Flowers",
    icon: Flower2,
    color: "from-pink-500 to-rose-600",
    bgColor: "from-pink-50 to-rose-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-600",
  },
  {
    id: "Wedding cakes",
    title: "Wedding Cakes",
    subtitle: "Tiered, Themed, Custom Designs",
    icon: Cake,
    color: "from-pink-400 to-fuchsia-500",
    bgColor: "from-pink-50 to-fuchsia-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-600",
  },
  {
    id: "Mithai and sweets",
    title: "Mithai & Sweets",
    subtitle: "Traditional Sweets for Distribution",
    icon: Cookie,
    color: "from-amber-500 to-orange-600",
    bgColor: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
  },
  {
    id: "Live cooking stall",
    title: "Live Cooking",
    subtitle: "Tandoor, Chaat, Paan, Juice Stations",
    icon: ChefHat,
    color: "from-red-500 to-orange-600",
    bgColor: "from-red-50 to-orange-50",
    borderColor: "border-red-200",
    textColor: "text-red-600",
  },
  {
    id: "Sound system rental",
    title: "Sound System Rental",
    subtitle: "Speakers, Mics, Stage Lighting",
    icon: Volume2,
    color: "from-slate-500 to-zinc-600",
    bgColor: "from-slate-50 to-zinc-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
  },
  {
    id: "Qawwali and Naat",
    title: "Qawwali & Naat",
    subtitle: "Spiritual Wedding Evenings",
    icon: Mic,
    color: "from-teal-500 to-emerald-600",
    bgColor: "from-teal-50 to-emerald-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-600",
  },
];

interface BussineTypeCompo {
  setBusinessType: React.Dispatch<React.SetStateAction<BusinessType | string>>;
  businessType: BusinessType | string;
  errors: { [key: string]: string };
}

export function BusinessTypeStep({
  setBusinessType,
  businessType,
  errors,
}: BussineTypeCompo) {
  const { setFormData } = useFormContext();
  console.log(
    "BusinessTypeStep rendered with businessType:",
    businessType,
    "and errors:",
    errors,
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {businessTypes.map((type) => (
          <Card
            key={type.id}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2",
              businessType === type.id
                ? `bg-gradient-to-br ${type.bgColor} ${type.borderColor} shadow-lg scale-105`
                : "bg-white/80 backdrop-blur-sm border-neutral-200 hover:border-neutral-300",
            )}
            onClick={() => {
              setBusinessType(type.id as BusinessType);
              setFormData((prev) => ({ ...prev, businessType: type.id }));
            }}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 flex-shrink-0",
                    businessType === type.id
                      ? `bg-gradient-to-r ${type.color} shadow-xl`
                      : `bg-gradient-to-r ${type.color} opacity-80`,
                  )}
                >
                  <type.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <h3
                    className={cn(
                      "font-bold text-base sm:text-lg transition-colors duration-300 truncate",
                      businessType === type.id
                        ? type.textColor
                        : "text-neutral-900",
                    )}
                  >
                    {type.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2">
                    {type.subtitle}
                  </p>

                  {businessType === type.id && (
                    <div className="flex items-center gap-2 pt-1 sm:pt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-green-600">
                        Selected
                      </span>
                    </div>
                  )}
                </div>

                {businessType === type.id && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {businessType && (
        <Card className="bg-gradient-to-r from-bridal-cream to-bridal-cream/80 border-bridal-gold/45">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-bridal-gold to-bridal-gold-dark rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-bridal-charcoal">
                  You selected:{" "}
                  <span className="font-bold">{businessType}</span>
                </p>
                <p className="text-xs text-bridal-gold-dark">
                  Click "Continue" to proceed with your registration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}{" "}
      {!businessType && Object.keys(errors || {}).length > 0 && (
        <Card className="bg-gradient-to-r from-bridal-cream to-red-50/80 border-bridal-gold/45">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-bridal-gold to-red-700 rounded-full flex items-center justify-center flex-shrink-0">
                <MailWarning className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-red-900">
                  You have not selected any business yet! Please select at least
                  one business type to proceed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
