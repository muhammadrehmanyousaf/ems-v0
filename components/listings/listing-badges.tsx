"use client"

/**
 * BK-listings-badges — surface backend signals on customer-facing listing cards.
 *
 * Closes 3 follow-ups in a single shared component:
 *   - BK-048 vacation mode  → amber "Back on {date}" / vacationMessage / "On vacation" pill
 *   - BK-074 outdoor permit → orange "Permit required" pill (click → permitChecklistUrl)
 *   - BK-053 last spot      → red "Last spot" / "Only N left" pill, auto-activates when
 *                             the listing response carries `lastSpot` / `availabilitySummary.lastSpot`
 *                             (today `getBusinesses` does not surface this — see follow-ups).
 *
 * Render contract: each pill is gated by its trigger field. If the field is `undefined`
 * or falsy, the pill is not rendered. If NO badge applies, the wrapper renders nothing
 * (no empty <div> in the DOM tree, keeps the card layout untouched for the 99% case).
 */

import * as React from "react"
import { Plane, ShieldCheck, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Subset of the `Business` JSON returned by GET /api/v1/businesses that
 * the listing badges actually read. Typed loosely (everything optional) so
 * we don't need a strict shape match across every call site — the badges
 * defensively skip when fields are missing.
 */
export interface ListingBadgeBusiness {
  // BK-048 vacation mode
  vacationMode?: boolean | null
  vacationStartsAt?: string | null
  vacationEndsAt?: string | null
  vacationMessage?: string | null

  // BK-074 outdoor permit
  requiresPermit?: boolean | null
  permitChecklistUrl?: string | null

  // BK-053 last-spot urgency. Backend gap today: `getBusinesses` does NOT
  // attach lastSpot — it only lives on `getBusinessAvailabilityBulk`'s per-day
  // urgency block. Surfaced here defensively so the badge auto-activates when
  // the listing response is enriched (see fix-doc follow-up).
  lastSpot?: boolean | null
  availabilitySummary?: {
    lastSpot?: boolean | null
    remaining?: number | null
  } | null
}

interface ListingBadgesProps {
  business: ListingBadgeBusiness | null | undefined
  className?: string
}

/**
 * Format a YYYY-MM-DD or ISO datestring as `dd MMM yyyy` (e.g. "16 Aug 2026").
 * Returns `null` when the input is unparseable so the caller can fall back.
 */
function formatBackOnDate(input: string | null | undefined): string | null {
  if (!input) return null
  // Accept either YYYY-MM-DD (DATEONLY) or full ISO. parse manually for the
  // DATEONLY case so we don't get bitten by host-timezone shift.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input)
  const d = dateOnly ? new Date(`${input}T00:00:00`) : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return `${str.slice(0, max - 1).trimEnd()}…`
}

export function ListingBadges({ business, className }: ListingBadgesProps) {
  if (!business) return null

  const showVacation = business.vacationMode === true
  const showPermit = business.requiresPermit === true

  // Last-spot may live at the top level or under availabilitySummary.
  const lastSpot =
    business.lastSpot === true ||
    business.availabilitySummary?.lastSpot === true
  const remaining = business.availabilitySummary?.remaining

  if (!showVacation && !showPermit && !lastSpot) return null

  // ── Vacation badge text ─────────────────────────────────────────────────
  let vacationText = "On vacation"
  if (showVacation) {
    const backOn = formatBackOnDate(business.vacationEndsAt)
    if (backOn) {
      vacationText = `Back on ${backOn}`
    } else if (business.vacationMessage && business.vacationMessage.trim()) {
      vacationText = truncate(business.vacationMessage.trim(), 32)
    }
  }

  // ── Last-spot text — "Only N left" if remaining is known, else "Last spot"
  const lastSpotText =
    typeof remaining === "number" && remaining > 0
      ? `Only ${remaining} left`
      : "Last spot"

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      data-no-navigate
    >
      {showVacation && (
        <Badge
          variant="secondary"
          className="gap-1 border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100/90 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5"
          title={
            business.vacationMessage?.trim()
              ? business.vacationMessage.trim()
              : "Vendor is on vacation — bookings inside the window will be refused"
          }
        >
          <Plane className="w-3 h-3" aria-hidden />
          <span>{vacationText}</span>
        </Badge>
      )}

      {showPermit && (
        business.permitChecklistUrl ? (
          <a
            href={business.permitChecklistUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex"
          >
            <Badge
              variant="secondary"
              className="gap-1 border border-orange-300 bg-orange-100 text-orange-800 hover:bg-orange-200 cursor-pointer font-bridal text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5"
              title="This venue requires a municipal permit — click to view the checklist"
            >
              <ShieldCheck className="w-3 h-3" aria-hidden />
              <span>Permit required</span>
            </Badge>
          </a>
        ) : (
          <Badge
            variant="secondary"
            className="gap-1 border border-orange-300 bg-orange-100 text-orange-800 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5"
            title="This venue requires a municipal permit (sound, alcohol, road closure, security)"
          >
            <ShieldCheck className="w-3 h-3" aria-hidden />
            <span>Permit required</span>
          </Badge>
        )
      )}

      {lastSpot && (
        <Badge
          variant="secondary"
          className="gap-1 border border-red-300 bg-red-100 text-red-800 hover:bg-red-100/90 font-bridal text-[10px] uppercase tracking-[0.18em] font-medium px-2 py-0.5"
          title="Selling fast — limited availability"
        >
          <Flame className="w-3 h-3" aria-hidden />
          <span>{lastSpotText}</span>
        </Badge>
      )}
    </div>
  )
}

export default ListingBadges
