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
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-purple-600 text-white shadow-md shadow-purple-300 scale-105'
                : isCompleted
                  ? 'bg-purple-400 text-white shadow-sm'
                  : 'bg-purple-500 text-white shadow-sm hover:bg-purple-600'
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
