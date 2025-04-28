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
              className={`flex items-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-blue-500 text-white"
                  : isCompleted
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
