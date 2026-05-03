"use client"

import { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Palette, Music, Heart, Cake, Gift, Calendar, Check } from "lucide-react"
import { motion } from "framer-motion"

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

const iconMap: Record<string, any> = {
  Engagement: Gift,
  Wedding: Heart,
  Parties: Music,
  "Fashion Show": Palette,
  Dinner: Cake,
}

export default function EventSelectionStep({ selectedEvents = [], onEventToggle, setFormData, formData, venue }: EventSelectionStepProps) {
  const getAvailableEvents = () => {
    if (!venue) return []
    if ('expertise' in venue && venue.expertise && Array.isArray(venue.expertise)) return venue.expertise
    if ('serviceProvided' in venue && venue.serviceProvided && Array.isArray(venue.serviceProvided)) return venue.serviceProvided
    if ('services' in venue && venue.services) {
      if (typeof venue.services === 'string') return venue.services.split(',').map((s: string) => s.trim())
      return venue.services
    }
    return ["Wedding", "Engagement", "Parties", "Fashion Show", "Dinner"]
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
