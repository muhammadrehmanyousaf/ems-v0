"use client"

/**
 * Blocked dates — moved out of Business Settings onto the Calendar module
 * (founder, 2026-08-29: "remove availability from here and it should be on
 * calender and the name should be blocked dates").
 *
 * It is the SAME editor, not a copy: `AvailabilityManager` renders unchanged,
 * so its mutations, the upcoming/past split and the WWL-490 date bounds all
 * come with it. Only its home and its name have changed. "Blocked dates" is
 * what the thing is; "Availability" read as a settings switch and sat beside
 * NTN numbers and payout accounts, which is not where a vendor looks when a
 * hall is unavailable next Saturday.
 *
 * NOT to be confused with /dashboard/availability, a different screen — the
 * availability PRIMITIVE setup (crew lanes, rental stock, daily capacity) for
 * non-venue vendor types. For a venue that page renders one sentence pointing
 * at the Calendar; this is the thing it was pointing at.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { AvailabilityManager } from "@/components/dashboard/mainScreens/businessSettings/redesigned/availability-manager"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Spinner } from "@/components/dashboard/shared/icon"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { cn } from "@/lib/utils"

export function BlockedDatesScreen() {
  /**
   * Which venue's blocked dates?
   *
   * Measured while moving this: the rail switcher's persisted default is "All
   * venues", where `useActiveBusinessId()` is null. Gating on it alone put
   * "Choose a venue first" in front of the feature for anyone who had not
   * changed the switcher — which is most vendors, and is NOT how this behaved
   * in Settings. That hub resolved `picked ?? businesses[0]` and simply worked.
   *
   * So: follow the switcher when it names a venue, otherwise fall back to the
   * first, and carry Settings' own hard-won lesson with it — a multi-venue
   * owner must be able to reach venue two. Hard-coding `businesses[0]` there
   * once made every venue after the first permanently unreachable, verified
   * live on an account owning 3361 + 3362.
   */
  const activeBusinessId = useActiveBusinessId()
  const { data: businesses, isLoading, isError } = useQuery({
    queryKey: ["blocked-dates-businesses"],
    queryFn: () => BusinessesAPI.getUserBusinesses(),
  })
  const list = businesses ?? []
  const [pickedId, setPickedId] = React.useState<number | null>(null)
  const biz =
    list.find((b) => b.id === (pickedId ?? activeBusinessId)) ?? list[0]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Calendar"
        title="Blocked dates"
        description="Dates you are not taking bookings on — the calendar and your public listing both respect these."
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Spinner /> Loading your venues…
        </div>
      )}

      {isError && (
        <EmptyState
          variant="error"
          title="Couldn't load your venues"
          description="Blocked dates are set per venue, and we couldn't read the list just now. Reload to try again."
        />
      )}

      {!isLoading && !isError && !biz && (
        <EmptyState
          icon="CalendarDays"
          title="No venue yet"
          description="Blocked dates are set per venue. Add your business first and this fills in."
        />
      )}

      {biz && (
        <>
          {/* Only for owners who actually have a choice to make. */}
          {list.length > 1 && (
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Blocking dates for — choose a venue
              </p>
              <div className="flex flex-wrap gap-2">
                {list.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setPickedId(b.id)}
                    aria-pressed={b.id === biz.id}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-left text-sm transition-colors",
                      b.id === biz.id
                        ? "border-primary bg-primary/5 font-medium text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {b.name || `Venue ${b.id}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AvailabilityManager businessId={biz.id} />
        </>
      )}
    </div>
  )
}

export default BlockedDatesScreen
