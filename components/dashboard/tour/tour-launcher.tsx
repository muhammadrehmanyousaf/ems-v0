"use client"

/**
 * "Take the tour" — the way back in.
 *
 * A tour you can only see once is a tour most people miss, because the first
 * time you open a product you are trying to do one specific thing, not learn
 * it. This is deliberately placed where someone goes when they are stuck
 * (Set up) rather than only firing at first login.
 */

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/shared/icon"
import { useProductTour } from "@/components/dashboard/tour/product-tour"

export function TourLauncherCard() {
  const { start } = useProductTour()
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon name="Sparkles" size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold">Take a tour of the system</p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Eight short steps through enquiries, bookings, khata and your calendar. Start it as
            often as you like — nothing changes while you look around.
          </p>
        </div>
      </div>
      <Button size="sm" onClick={start} className="shrink-0">
        <Icon name="Play" size={14} className="mr-1.5" /> Start tour
      </Button>
    </div>
  )
}

/** Compact variant for a header or menu. */
export function TourLauncherButton({ className }: { className?: string }) {
  const { start } = useProductTour()
  return (
    <Button size="sm" variant="ghost" onClick={start} className={className} aria-label="Take a tour">
      <Icon name="Sparkles" size={15} className="mr-1.5" /> Take a tour
    </Button>
  )
}

export default TourLauncherCard
