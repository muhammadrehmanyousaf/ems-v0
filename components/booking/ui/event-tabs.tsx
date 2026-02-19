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
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
      {events.map((event, index) => {
        const isActive = index === activeEventIndex
        const isCompleted = event.isSubmitted

        return (
          <button
            key={`${event.eventType}-${index}`}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-purple-600 text-white shadow-sm'
                : isCompleted
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white text-neutral-500 border border-neutral-200 hover:text-neutral-700 hover:border-neutral-300'
            }`}
            onClick={() => onTabChange(index)}
          >
            {isCompleted && <CheckCircle className="w-3.5 h-3.5" />}
            {event.eventType}
          </button>
        )
      })}
    </div>
  )
}
