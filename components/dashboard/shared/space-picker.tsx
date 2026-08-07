"use client"

/**
 * WWL-050 / WWL-100 — pick the hall a booking is in.
 *
 * The offline booking dialog already had a hall picker, and it was empty on
 * every venue that has halls. It listed `BusinessResource` rows of kind 'hall',
 * created only by the older capacity screen — while vendors build their halls
 * in the SubVenue tree (the venue-spaces manager, the onboarding space builder,
 * the public "Choose your space" selector). Two disjoint tables, and the
 * booking flow was reading the empty one, which is why no booking ever recorded
 * a space and the availability grid had nothing per-hall to show.
 *
 * This reads the tree the vendor actually builds. It renders nothing when there
 * is nothing to choose — a venue with one bookable space needs no dropdown, and
 * the server pins such bookings to that space automatically.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { venueSpacesApi, type SubVenueNode } from "@/lib/api/venueSpaces"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** Flatten the tree depth-first so parents sit directly above their children. */
export function flattenSpaces(nodes: SubVenueNode[] | undefined): SubVenueNode[] {
  const out: SubVenueNode[] = []
  const walk = (list: SubVenueNode[] | undefined) => {
    for (const n of list || []) {
      if (n.active === false) continue
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/**
 * Which spaces can actually be sold.
 *
 * A parent hall is not extra capacity on top of its own partitions, but it IS
 * sellable whole — so both are offered, and the server's tree rule stops the
 * two being sold at once.
 */
export function useVenueSpaces(businessId: number | null | undefined) {
  const q = useQuery({
    queryKey: ["venue-spaces-tree", businessId],
    queryFn: () => venueSpacesApi.getTree(Number(businessId)),
    enabled: !!businessId,
    staleTime: 5 * 60_000,
    retry: 0, // an unavailable tree must not stall the booking dialog
  })
  const spaces = React.useMemo(() => flattenSpaces(q.data?.tree), [q.data])
  // One space means no choice to make; the picker hides and the server assigns.
  const leaves = spaces.filter((s) => !spaces.some((c) => c.parentSubVenueId === s.id))
  return { spaces, hasChoice: leaves.length > 1, isLoading: q.isLoading, failed: q.isError }
}

export function SpacePicker({
  businessId,
  value,
  onChange,
  label = "Which hall / space?",
  hint,
  className,
  disabled,
}: {
  businessId: number | null | undefined
  value: string
  onChange: (v: string) => void
  label?: string
  hint?: string
  className?: string
  disabled?: boolean
}) {
  const { spaces, hasChoice, failed } = useVenueSpaces(businessId)

  // Nothing to choose (single-space venue, or the tree is unavailable) — render
  // nothing rather than an empty dropdown that looks broken. That empty
  // dropdown is exactly what the old picker did.
  if (!hasChoice || failed) return null

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor="booking-space">{label}</Label>
      <select
        id="booking-space"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Not decided yet</option>
        {spaces.map((s) => (
          <option key={s.id} value={String(s.id)}>
            {`${"  ".repeat(Math.max(0, s.depth))}${s.name}`}
            {s.comfortCapacity ? ` · ${s.comfortCapacity} guests` : ""}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        {hint ??
          "Recording the hall is what lets the calendar show one hall booked while the others stay sellable."}
      </p>
    </div>
  )
}

export default SpacePicker
