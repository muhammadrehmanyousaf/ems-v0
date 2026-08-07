"use client"

/**
 * WWL-100 — put an unassigned booking into a hall.
 *
 * Bookings taken before a booking recorded its space carry none, and at a
 * multi-space venue nobody but the vendor knows which hall a given wedding was
 * in. Until they say, the availability grid can only report the ambiguity — it
 * cannot show one hall booked and the others sellable, which is the entire
 * point of a halls × days grid.
 *
 * This is where they say it: one tap from the grid's unassigned row or from the
 * booking itself. The server checks the choice against the same occupancy rule
 * the grid paints with, so a hall shown free here cannot be refused there.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { BookingSpaceAPI } from "@/lib/api/bookingSpace"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function AssignSpaceDialog({
  bookingId,
  businessId,
  open,
  onOpenChange,
  onAssigned,
}: {
  bookingId: number | null
  businessId?: number | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onAssigned?: (subVenueId: number | null) => void
}) {
  const qc = useQueryClient()
  const [picked, setPicked] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)
  const [conflict, setConflict] = React.useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-space", bookingId, businessId ?? null],
    queryFn: () => BookingSpaceAPI.get(Number(bookingId), businessId),
    enabled: open && !!bookingId,
  })

  React.useEffect(() => {
    if (data) setPicked(data.subVenueId != null ? String(data.subVenueId) : "")
    setConflict(null)
  }, [data])

  const save = async () => {
    if (!bookingId) return
    setSaving(true)
    setConflict(null)
    try {
      const next = picked ? Number(picked) : null
      await BookingSpaceAPI.set(bookingId, next, businessId ?? data?.businessId)
      // Every surface that reads occupancy has to catch up, or the vendor sees
      // the grid they just corrected still showing the old answer.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["venue-calendar"] }),
        qc.invalidateQueries({ queryKey: ["booking-space", bookingId] }),
        qc.invalidateQueries({ queryKey: ["bookings"] }),
      ])
      toast.success(next ? "Hall recorded" : "Hall cleared")
      onAssigned?.(next)
      onOpenChange(false)
    } catch (e: any) {
      // A 409 is not a failure to report as "something went wrong" — it is the
      // product telling the vendor that hall is already taken, and by which
      // booking. Show that, and leave the dialog open so they can pick another.
      const res = e?.response?.data
      if (e?.response?.status === 409) {
        setConflict(res?.message || "That hall is already taken on this date.")
      } else {
        toast.error(res?.message || "Could not record the hall")
      }
    } finally {
      setSaving(false)
    }
  }

  const spaces = data?.spaces ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Which hall is this booking in?</DialogTitle>
          <DialogDescription>
            {data
              ? `Booking #${data.bookingId} · ${data.bookingDate}${data.bookingTime ? ` · ${data.bookingTime}` : ""}`
              : "Loading the booking…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Loading halls…</p>}

        {isError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Couldn’t load this booking’s halls. Close and try again.
          </p>
        )}

        {data && data.assignable === false && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Recording halls isn’t switched on for this environment yet.
          </p>
        )}

        {data && data.assignable !== false && (
          <div className="space-y-2">
            <Label htmlFor="assign-space">Hall / Space</Label>
            <select
              id="assign-space"
              value={picked}
              onChange={(e) => { setPicked(e.target.value); setConflict(null) }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Not recorded</option>
              {spaces.map((s) => (
                <option key={s.subVenueId} value={String(s.subVenueId)}>
                  {`${"  ".repeat(Math.max(0, s.depth))}${s.name}`}
                  {s.comfortCapacity ? ` · ${s.comfortCapacity} guests` : ""}
                </option>
              ))}
            </select>

            {conflict && (
              <p className={cn(
                "rounded-md px-3 py-2 text-sm",
                "bg-destructive/10 text-destructive",
              )}>
                {conflict}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Once every booking on a date has a hall, the calendar can show that
              hall booked while the rest stay sellable.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || isLoading || data?.assignable === false}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignSpaceDialog
