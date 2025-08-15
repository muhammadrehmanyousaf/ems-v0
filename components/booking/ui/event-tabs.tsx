"use client"

import { eventTypes } from "@/lib/data"
import type { EventBooking } from "@/lib/types"
import { CheckCircle, Calendar } from "lucide-react"

interface EventTabsProps {
  events: EventBooking[]
  activeEventIndex: number
  onTabChange: (index: number) => void
}

export default function EventTabs({ events, activeEventIndex, onTabChange }: EventTabsProps) {
  // Get event name from event type
  const getEventName = (eventType: string) => {
    const event = eventTypes.find((e) => e.id === eventType)
    return event ? event.name : eventType
  }

  return (
    <div className="flex overflow-x-auto pb-2">
      <div className="flex space-x-2">
        {events.map((event, index) => {
          const isActive = index === activeEventIndex
          const isCompleted = event.isSubmitted

          return (
            <button
              key={`${event.eventType}-${index}`}
              className={`flex items-center whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md ${
                isActive
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg"
                  : isCompleted
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200"
                    : "bg-white/80 backdrop-blur-sm text-neutral-700 border border-neutral-200 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 hover:border-rose-200"
              }`}
              onClick={() => onTabChange(index)}
            >
              {isCompleted ? <CheckCircle className="mr-1.5 h-4 w-4" /> : <Calendar className="mr-1.5 h-4 w-4" />}
              {getEventName(event.eventType)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
