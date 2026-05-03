"use client"

import type { EventBooking } from "@/lib/types"
import { CheckCircle } from "lucide-react"

interface EventTabsProps {
  events: EventBooking[]
  activeEventIndex: number
  onTabChange: (index: number) => void
}

export default function EventTabs({ events, activeEventIndex, onTabChange }: EventTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar justify-center">
      {events.map((event, index) => {
        const isActive = index === activeEventIndex
        const isCompleted = event.isSubmitted

        return (
          <button
            key={`${event.eventType}-${index}`}
            type="button"
            onClick={() => onTabChange(index)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 font-bridal text-[11.5px] uppercase tracking-[0.22em] font-medium transition-all duration-300 ${
              isActive
                ? "bg-bridal-gold text-bridal-charcoal border border-bridal-gold-dark shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)]"
                : isCompleted
                  ? "bg-bridal-sage/20 text-[#3F6B43] border border-bridal-sage/45 hover:bg-bridal-sage/30"
                  : "bg-bridal-cream text-bridal-charcoal border border-bridal-beige hover:border-bridal-gold/55 hover:text-bridal-gold-dark"
            }`}
          >
            {isCompleted && <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} />}
            {event.eventType}
          </button>
        )
      })}
    </div>
  )
}
