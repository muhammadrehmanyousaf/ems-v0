"use client"

import { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Palette, Music, Heart, Cake, Gift, Calendar, Check, Utensils, Briefcase, Baby, GraduationCap, Moon } from "lucide-react"
import { motion } from "framer-motion"
import { EVENT_OPTIONS } from "@/lib/event-options"

interface EventSelectionStepProps {
  selectedEvents?: string[]
  onEventToggle?: (eventId: string) => void
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  formData: BookingFormData
  venue: EventVenue | Vendor | null
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
}

// Anything unlisted falls back to Calendar, so a new event type never renders
// without an icon.
const iconMap: Record<string, any> = {
  Mehndi: Palette,
  Baraat: Heart,
  Walima: Utensils,
  Nikah: Heart,
  Mayoun: Palette,
  Dholki: Music,
  Reception: Music,
  Engagement: Gift,
  Birthday: Cake,
  Corporate: Briefcase,
  Aqiqa: Baby,
  Graduation: GraduationCap,
  Milaad: Moon,
  Soyem: Moon,
  Other: Calendar,
}

export default function EventSelectionStep({ selectedEvents = [], onEventToggle, setFormData, formData, venue }: EventSelectionStepProps) {
  const getAvailableEvents = () => {
    if (!venue) return []
    // venue is a loosely-typed union across booking surfaces; read these dynamic
    // fields off an `any` alias (as the original code effectively did).
    const v = venue as any
    // BUG-023 — guard on LENGTH, not just presence + array-ness. An empty array
    // is truthy and IS an array, so `expertise: []` used to be returned as the
    // answer, making the fallback below unreachable and killing the booking page
    // (no event options, "Continue" disabled forever). Only use a populated list.
    if (Array.isArray(v.expertise) && v.expertise.length > 0) return v.expertise
    if (Array.isArray(v.serviceProvided) && v.serviceProvided.length > 0) return v.serviceProvided
    if (v.services) {
      if (typeof v.services === 'string') {
        const parsed = v.services.split(',').map((s: string) => s.trim()).filter(Boolean)
        if (parsed.length > 0) return parsed
      } else if (Array.isArray(v.services) && v.services.length > 0) {
        return v.services
      }
    }
    return EVENT_OPTIONS
  }

  const availableEvents = getAvailableEvents()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display italic text-[22px] sm:text-[24px] text-bridal-charcoal leading-tight">
          What are you celebrating?
        </h2>
        <p className="mt-1 font-bridal text-[12.5px] text-bridal-text-soft">
          Select the events you&apos;d like to book — each one gets its own configuration.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {availableEvents.map((event: string) => {
          const isSelected = selectedEvents.includes(event)
          const Icon = iconMap[event] || Calendar

          return (
            <motion.button
              key={event}
              type="button"
              variants={item}
              whileTap={{ scale: 0.97 }}
              // BUG-024 — the selected state was carried only by border colour, so
              // a screen-reader user (and anyone who can't tell the two browns
              // apart) had no way to confirm their choice on this multi-select
              // step before paying. aria-pressed exposes the toggle state.
              aria-pressed={isSelected}
              aria-label={`${event}${isSelected ? " (selected)" : ""}`}
              className={`group relative flex flex-col items-center gap-1.5 rounded-md border p-2.5 transition-all duration-200 ${
                isSelected
                  ? 'border-bridal-gold-dark bg-bridal-cream shadow-[0_8px_22px_-14px_rgba(176,125,84,0.45)]'
                  : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
              }`}
              onClick={() => onEventToggle?.(event)}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-bridal-charcoal" strokeWidth={3} />
                </span>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-bridal-gold/20 text-bridal-gold-dark'
                  : 'bg-bridal-blush/55 text-bridal-mauve group-hover:bg-bridal-gold/15 group-hover:text-bridal-gold-dark'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={1.6} />
              </div>
              <span className={`font-display italic text-[13px] leading-tight ${
                isSelected ? 'text-bridal-gold-dark' : 'text-bridal-charcoal'
              }`}>
                {event}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {selectedEvents.length > 0 && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bridal-cream border border-bridal-gold/45">
          <Check className="w-3 h-3 text-bridal-gold-dark" strokeWidth={3} />
          <span className="font-bridal text-[10.5px] uppercase tracking-[0.18em] font-medium text-bridal-gold-dark">
            <span className="font-display italic text-[13px] tracking-normal text-bridal-charcoal mr-0.5">{selectedEvents.length}</span>
            event{selectedEvents.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}
    </div>
  )
}
