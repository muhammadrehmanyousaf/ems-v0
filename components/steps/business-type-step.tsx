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

// Brand palette only (WP30): five families built from the bridal tokens, so the tiles stay
// distinguishable by icon and name (23 categories cannot each own a hue) without a single
// blue, violet, indigo or rainbow tile. Icon tiles carry a white glyph, so every gradient
// stop is dark enough for it (>= 4.5:1 under white, >= 3:1 as a graphic at worst).
const TONES = {
  gold: {
    color: "from-bridal-gold-dark to-bridal-gold-deep",
    bgColor: "from-bridal-cream to-bridal-sand",
    borderColor: "border-bridal-gold/45",
    textColor: "text-bridal-gold-dark",
  },
  sage: {
    color: "from-status-success-solid to-status-success",
    bgColor: "from-status-success-soft to-bridal-cream",
    borderColor: "border-status-success-line",
    textColor: "text-status-success",
  },
  mauve: {
    color: "from-bridal-mauve to-status-info",
    bgColor: "from-status-info-soft to-bridal-cream",
    borderColor: "border-status-info-line",
    textColor: "text-status-info",
  },
  coral: {
    color: "from-bridal-coral-dark to-bridal-coral-dark",
    bgColor: "from-status-danger-soft to-bridal-cream",
    borderColor: "border-status-danger-line",
    textColor: "text-status-danger",
  },
  stone: {
    color: "from-bridal-text to-bridal-text-soft",
    bgColor: "from-status-neutral-soft to-bridal-cream",
    borderColor: "border-status-neutral-line",
    textColor: "text-status-neutral",
  },
} as const;

const businessTypes = [
  {
    id: "Photographer",
    title: "Photographer",
    subtitle: "Professional Photography Services",
    icon: Camera,
    ...TONES.mauve,
  },
  {
    id: "Makeup artist",
    title: "Makeup Artist",
    subtitle: "Beauty & Styling Services",
    icon: Heart,
    ...TONES.gold,
  },
  {
    id: "Wedding venue",
    title: "Wedding Venue",
    subtitle: "Event Spaces & Locations",
    icon: Home,
    ...TONES.sage,
  },
  {
    id: "Henna artist",
    title: "Henna Artist",
    subtitle: "Traditional Art & Design",
    icon: Palette,
    ...TONES.coral,
  },
  {
    id: "Decorator",
    title: "Decorator",
    subtitle: "Event Decoration & Design",
    icon: Gift,
    ...TONES.gold,
  },
  {
    id: "Catering",
    title: "Catering",
    subtitle: "Food & Beverage Services",
    icon: Utensils,
    ...TONES.coral,
  },
  {
    id: "Car rental",
    title: "Car Rental",
    subtitle: "Transportation Services",
    icon: Car,
    ...TONES.stone,
  },
  {
    id: "Bridal wearing",
    title: "Bridal Wear",
    subtitle: "Wedding Attire & Fashion",
    icon: Crown,
    ...TONES.gold,
  },
  {
    id: "Wedding Invitations and Stationery",
    title: "Wedding Stationery",
    subtitle: "Invitations, Bid Boxes & More",
    icon: Mail,
    ...TONES.mauve,
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
    ...TONES.sage,
  },
  {
    id: "Choreographer",
    title: "Choreographer",
    subtitle: "Mehndi & Sangeet Dance Practice",
    icon: Sparkle,
    ...TONES.mauve,
  },
  {
    id: "Dhol player",
    title: "Dhol Players",
    subtitle: "Traditional Drums for Mehndi & Baraat",
    icon: Drum,
    ...TONES.coral,
  },
  {
    id: "Event host",
    title: "Event Host / MC",
    subtitle: "Stage Anchors & Wedding MCs",
    icon: Megaphone,
    ...TONES.mauve,
  },
  {
    id: "Live streaming",
    title: "Live Streaming",
    subtitle: "Broadcast to Overseas Family",
    icon: Radio,
    ...TONES.stone,
  },
  {
    id: "Generator rental",
    title: "Generator Rental",
    subtitle: "Load-shedding Backup Power",
    icon: Zap,
    ...TONES.stone,
  },
  {
    id: "Marquee rental",
    title: "Marquee & Tents",
    subtitle: "Custom Setups for Home Weddings",
    icon: Tent,
    ...TONES.gold,
  },
  {
    id: "Furniture rental",
    title: "Furniture Rental",
    subtitle: "Chairs, Tables, Sofas, Mandap",
    icon: Sofa,
    ...TONES.stone,
  },
  {
    id: "Florist",
    title: "Florists",
    subtitle: "Fresh & Imported Flowers",
    icon: Flower2,
    ...TONES.sage,
  },
  {
    id: "Wedding cakes",
    title: "Wedding Cakes",
    subtitle: "Tiered, Themed, Custom Designs",
    icon: Cake,
    ...TONES.coral,
  },
  {
    id: "Mithai and sweets",
    title: "Mithai & Sweets",
    subtitle: "Traditional Sweets for Distribution",
    icon: Cookie,
    ...TONES.gold,
  },
  {
    id: "Live cooking stall",
    title: "Live Cooking",
    subtitle: "Tandoor, Chaat, Paan, Juice Stations",
    icon: ChefHat,
    ...TONES.coral,
  },
  {
    id: "Sound system rental",
    title: "Sound System Rental",
    subtitle: "Speakers, Mics, Stage Lighting",
    icon: Volume2,
    ...TONES.stone,
  },
  {
    id: "Qawwali and Naat",
    title: "Qawwali & Naat",
    subtitle: "Spiritual Wedding Evenings",
    icon: Mic,
    ...TONES.sage,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
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
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div
                  className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 flex-shrink-0",
                    businessType === type.id
                      ? `bg-gradient-to-r ${type.color} shadow-lg`
                      : `bg-gradient-to-r ${type.color} opacity-80`,
                  )}
                >
                  <type.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>

                <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                  <h3
                    className={cn(
                      "font-bold text-sm sm:text-base transition-colors duration-300 truncate",
                      businessType === type.id
                        ? type.textColor
                        : "text-neutral-900",
                    )}
                  >
                    {type.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-600 line-clamp-2">
                    {type.subtitle}
                  </p>

                  {businessType === type.id && (
                    <div className="flex items-center gap-2 pt-1 sm:pt-2">
                      <div className="w-2 h-2 bg-status-success-solid rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-status-success">
                        Selected
                      </span>
                    </div>
                  )}
                </div>

                {businessType === type.id && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-status-success-solid rounded-full flex items-center justify-center flex-shrink-0">
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
        <Card className="bg-gradient-to-r from-bridal-cream to-status-danger-soft border-bridal-gold/45">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-bridal-gold to-bridal-coral-dark rounded-full flex items-center justify-center flex-shrink-0">
                <MailWarning className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-status-danger">
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
