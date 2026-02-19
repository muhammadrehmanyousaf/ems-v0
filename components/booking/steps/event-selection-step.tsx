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
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
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
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">What are you celebrating?</h2>
        <p className="mt-1 text-sm text-neutral-500">Select the events you&apos;d like to book</p>
      </div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
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
              variants={item}
              whileTap={{ scale: 0.97 }}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200 ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
              }`}
              onClick={() => onEventToggle?.(event)}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isSelected ? 'bg-purple-600 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-neutral-700'}`}>
                {event}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {selectedEvents.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-purple-600 font-medium"
        >
          {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
        </motion.p>
      )}
    </div>
  )
}
