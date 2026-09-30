"use client"

/**
 * Multi-event tabs (§6.5) — one tab per function, in the desk top bar's second
 * row (48) or the phone's 44px row under the header. The row is a real
 * tablist: `role="tablist"`, `role="tab"` + `aria-selected`, roving tabIndex
 * with arrow-key movement, 44px tall, left-aligned. A submitted function
 * carries a sage ✓. The shell owns what a tab switch does (re-keying the
 * frame, scrolling the body); this component only reports the index.
 */

import type { KeyboardEvent } from "react"
import type { EventBooking } from "@/lib/types"
import { Check } from "lucide-react"

interface EventTabsProps {
  events: EventBooking[]
  activeEventIndex: number
  onTabChange: (index: number) => void
}

export default function EventTabs({ events, activeEventIndex, onTabChange }: EventTabsProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!events.length) return
    let next: number | null = null
    if (e.key === "ArrowRight") next = (activeEventIndex + 1) % events.length
    else if (e.key === "ArrowLeft") next = (activeEventIndex - 1 + events.length) % events.length
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = events.length - 1
    if (next === null) return
    e.preventDefault()
    onTabChange(next)
    const tab = e.currentTarget.querySelector<HTMLButtonElement>(`[data-event-tab="${next}"]`)
    tab?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Functions"
      onKeyDown={onKeyDown}
      className="hide-scrollbar flex h-11 items-stretch gap-1 overflow-x-auto"
    >
      {events.map((event, index) => {
        const isActive = index === activeEventIndex
        const isCompleted = Boolean(event.isSubmitted)

        return (
          <button
            key={`${event.eventType}-${index}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            data-event-tab={index}
            onClick={() => onTabChange(index)}
            className={`relative inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-[4px] px-3 font-bridal text-[13px] leading-[18px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
              isActive
                ? "font-medium text-bridal-charcoal"
                : "text-bridal-text-soft hover:bg-bridal-blush/45 hover:text-bridal-charcoal"
            }`}
          >
            {isCompleted && (
              <Check className="h-3.5 w-3.5 text-[#3F6B43]" strokeWidth={2.5} aria-hidden />
            )}
            <span>{event.eventType}</span>
            {isCompleted && <span className="sr-only">(request sent)</span>}
            {/* 2px gold-dark underline on the active tab; width animates 0→100% */}
            <span
              aria-hidden
              className={`absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full bg-bridal-gold-dark transition-transform duration-200 ease-out ${
                isActive ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}
