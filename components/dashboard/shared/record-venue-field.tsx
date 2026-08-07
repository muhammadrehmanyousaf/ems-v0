"use client"

/**
 * WWL-242 / WWL-262 — which venue a NEW record is filed under.
 *
 * Both create dialogs were handed `businesses?.[0]?.id`. A vendor working under
 * "All venues" added a stock item or hired a waiter and it landed on whichever
 * venue happened to be first in the list — with no venue field in the form, so
 * they were never asked and never told. Live capture:
 *
 *   POST /api/v1/staff/members  {"businessId":3358, "fullName":"…"}
 *
 * `BusinessScopeField` is the panel-level control and deliberately renders
 * nothing when the header already has a venue selected — repeating the header
 * switcher across 36 read-only panels is noise. A create dialog is the opposite
 * case: the record is permanent, mis-filing it is silent, and moving it
 * afterwards usually means deleting and re-entering. So this always says where
 * the record is going whenever the vendor owns more than one venue — a dropdown
 * when nothing is selected, and a plain statement when the header has already
 * decided.
 *
 * A single-venue vendor sees nothing. There is nothing to get wrong.
 */

import * as React from "react"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useMyBusinesses } from "@/hooks/use-my-businesses"
import { cn } from "@/lib/utils"

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"

export function RecordVenueField({
  value,
  onChange,
  label = "Venue",
  noun = "record",
  className,
}: {
  /** Selected business id as a string; "" when nothing is chosen yet. */
  value: string
  onChange: (v: string) => void
  label?: string
  /** What is being filed — "item", "staff member", used in the confirmation line. */
  noun?: string
  className?: string
}): React.ReactElement | null {
  const activeBusinessId = useActiveBusinessId()
  const { data: businesses } = useMyBusinesses()
  const list = businesses ?? []

  // Keep the field in step with the header, and give it a value on first paint
  // so the caller never has to fall back to businesses[0] itself.
  React.useEffect(() => {
    if (activeBusinessId != null) {
      const s = String(activeBusinessId)
      if (value !== s) onChange(s)
      return
    }
    if (!value && list.length === 1) onChange(String(list[0].id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBusinessId, list.length])

  if (list.length <= 1) return null

  const activeName = list.find((b) => String(b.id) === String(activeBusinessId))?.name

  if (activeBusinessId != null) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        This {noun} will be filed under <span className="font-medium text-foreground">{activeName || `venue #${activeBusinessId}`}</span>.
        Switch venues in the header to change it.
      </p>
    )
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground" htmlFor="record-venue">
        {label} *
      </label>
      <select
        id="record-venue"
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose a venue…</option>
        {list.map((b) => (
          <option key={b.id} value={String(b.id)}>
            {b.name}
            {b.city ? ` · ${b.city}` : ""}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">
        You are on “All venues”, so this needs saying — a {noun} belongs to one venue.
      </p>
    </div>
  )
}

export default RecordVenueField
