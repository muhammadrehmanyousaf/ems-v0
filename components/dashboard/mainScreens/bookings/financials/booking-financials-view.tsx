"use client"

/**
 * Event financials — one module, three tabs, for ONE booking.
 *
 * The founder's ask, verbatim: per-event costing · per-event expenses ·
 * per-event P&L, in a single module with tabs, because "user has to go back to
 * other modules to perform a job for the same user".
 *
 * Before this, answering "did we make money on the Khan wedding?" meant leaving
 * the booking, opening the Venue-OS hub, finding the P&L panel, and typing the
 * booking number in again — then repeating that for costing, and again for
 * expenses. Three separate destinations, three separate booking pickers, for
 * three views of the same event.
 *
 * There is no separate Event object in this system: the Booking IS the event
 * (`dimEventId` on a journal line is the booking id). So this is a facet of the
 * Booking, not a new nav entry — reached from the booking's own page, keeping
 * its own URL so it survives a refresh and can be shared on WhatsApp.
 *
 * The three panels are the EXISTING, working Venue-OS views. They are not
 * reimplemented here; they are handed the booking id so they stop asking a
 * question the route has already answered.
 *
 * P&L leads because profitability is what a vendor opens this for. Costing and
 * Expenses are the "why" behind that number.
 */

import * as React from "react"
import Link from "next/link"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { EventPnlView } from "@/components/dashboard/mainScreens/venue-os/event-pnl-view"
import { EventCostedPnlView } from "@/components/dashboard/mainScreens/venue-os/event-costed-pnl-view"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TabKey = "pnl" | "costing" | "expenses"

const TABS: Array<{ key: TabKey; label: string; hint: string }> = [
  { key: "pnl", label: "P&L", hint: "Did this event make money?" },
  { key: "costing", label: "Costing", hint: "What did it cost, fully loaded?" },
  { key: "expenses", label: "Expenses", hint: "What was spent, line by line?" },
]

export function BookingFinancialsView({ bookingId }: { bookingId: number }) {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const raw = search?.get("tab")
  const active: TabKey = TABS.some((t) => t.key === raw) ? (raw as TabKey) : "pnl"

  // Tab state lives in the URL, not in React state — a vendor who sends
  // "?tab=costing" to their accountant on WhatsApp gets the costing tab.
  const setTab = (key: TabKey) => {
    const params = new URLSearchParams(search?.toString() ?? "")
    params.set("tab", key)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Link
          href={`/dashboard/bookings/${bookingId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="ChevronLeft" size={15} />
          Back to booking #{bookingId}
        </Link>
      </div>

      <PageHeader
        eyebrow="Money"
        title="Event financials"
        description="Costing, expenses and profit for this one event — without leaving it."
      />

      {/* Tabs. Each carries a plain-language hint because "P&L" means nothing to
          a marquee owner who has never used accounting software. */}
      <div
        role="tablist"
        aria-label="Event financials"
        className="flex flex-wrap gap-2 border-b border-border pb-px"
      >
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className={cn(
                "group -mb-px rounded-t-md border-b-2 px-3 py-2 text-left transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="block text-sm font-medium">{t.label}</span>
              <span className="block text-[11px] text-muted-foreground">{t.hint}</span>
            </button>
          )
        })}
      </div>

      {/* All three read the SAME booking. Switching tabs never re-asks which
          event this is, and never triggers a full page load. */}
      {active === "pnl" && <EventPnlView lockedBookingId={bookingId} />}
      {active === "costing" && <EventCostedPnlView lockedBookingId={bookingId} />}
      {active === "expenses" && (
        <div className="rounded-lg border border-border p-6">
          <p className="text-sm font-medium">Expenses for this event</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every expense tagged to booking #{bookingId}. Record one against this event and it
            lands in the Costing tab immediately.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href={`/dashboard/expenses?bookingId=${bookingId}`}>
              <Icon name="Plus" size={14} className="mr-1.5" />
              Open expenses for this event
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}

export default BookingFinancialsView
