"use client"

/**
 * Block a date, straight from the calendar cell it belongs to.
 *
 * Blocking already existed, but only inside Business settings > Availability —
 * a vendor looking at the day they want to close had to leave the calendar,
 * find the settings hub, pick the tab, and retype the date they were already
 * looking at. This is the same API from the place the decision is made.
 *
 * Two things this deliberately does NOT inherit from the settings editor:
 *
 *  - **It refuses to guess the venue.** `BlockedDatesAPI.block` treats a null
 *    businessId as "every venue this vendor owns" (WWL-490 found that live: one
 *    click closed all of them). The calendar defaults to the All-venues roll-up,
 *    so a null scope here is the normal case, not the edge case. When the vendor
 *    owns more than one venue and has not narrowed the rail, this asks which —
 *    and blocking all of them is a deliberate menu choice with its own warning,
 *    never the default.
 *
 *  - **It reports what actually happened.** WWL-492: both writes used to toast
 *    success unconditionally, so re-blocking an already-blocked date said
 *    "Date blocked" and changed nothing. `newlyBlocked` / `alreadyBlocked` are
 *    read back and worded from the real numbers.
 */

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { BlockedDatesAPI } from "@/lib/api/dashboard"
import { useMyBusinesses } from "@/hooks/use-my-businesses"
import { errorMessage } from "@/lib/utils/api-error"

/** Sentinel for the explicit "every venue" choice — distinct from "not chosen". */
const ALL_VENUES = "__all__"

export interface BlockDateDialogProps {
    open: boolean
    onOpenChange: (v: boolean) => void
    /** YYYY-MM-DD — the cell the vendor clicked. */
    date: string
    /** The rail's current scope. `null` is the All-venues roll-up. */
    activeBusinessId: number | null
    /** Bookings already on this date, so we can warn before closing a sold day. */
    bookedCount?: number
    onBlocked?: () => void
}

export function BlockDateDialog({
    open, onOpenChange, date, activeBusinessId, bookedCount = 0, onBlocked,
}: BlockDateDialogProps) {
    const qc = useQueryClient()
    const { data: businesses } = useMyBusinesses()
    const [reason, setReason] = React.useState("")
    const [scope, setScope] = React.useState<string>("")

    const owned = businesses ?? []
    const multiVenue = owned.length > 1
    // One venue, or the rail already narrowed to one: there is nothing to ask.
    const impliedId = activeBusinessId ?? (owned.length === 1 ? Number(owned[0].id) : null)
    const mustChoose = impliedId == null && multiVenue

    React.useEffect(() => {
        if (open) { setReason(""); setScope("") }
    }, [open, date])

    const chosenId: number | null = mustChoose
        ? (scope === ALL_VENUES ? null : scope ? Number(scope) : null)
        : impliedId

    const scopeAnswered = !mustChoose || scope !== ""
    const blockingEveryVenue = mustChoose && scope === ALL_VENUES

    const blockMut = useMutation({
        mutationFn: () => BlockedDatesAPI.block(date, reason.trim() || undefined, chosenId),
        onSuccess: (res) => {
            // Both calendars on this page read blocks, under different keys:
            // the availability strip caches ["blocked-dates", businessId] and
            // ["venue-calendar", …]. Invalidating the prefix covers every
            // businessId variant, so the strip repaints without a reload.
            qc.invalidateQueries({ queryKey: ["blocked-dates"] })
            qc.invalidateQueries({ queryKey: ["venue-calendar"] })
            if (res.newlyBlocked > 0) {
                toast.success(
                    `${prettyDate(date)} blocked` +
                    (res.alreadyBlocked ? ` · ${res.alreadyBlocked} already blocked` : ""),
                )
            } else {
                toast.info("That date was already blocked — nothing changed.")
            }
            onBlocked?.()
            onOpenChange(false)
        },
        onError: (e: unknown) => toast.error(errorMessage(e, "Couldn't block the date")),
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] flex flex-col sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Block {prettyDate(date)}</DialogTitle>
                    <DialogDescription>
                        A blocked date stops showing as available. You can unblock it any time from
                        Business settings &rsaquo; Availability.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                    {bookedCount > 0 && (
                        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-400">
                            This date already has {bookedCount} booking{bookedCount === 1 ? "" : "s"}.
                            Blocking it hides the date from new enquiries — it does not cancel what is
                            already booked.
                        </p>
                    )}

                    {mustChoose && (
                        <div className="space-y-1.5">
                            <Label htmlFor="block-scope">Which venue? *</Label>
                            <Select value={scope} onValueChange={setScope}>
                                <SelectTrigger id="block-scope">
                                    <SelectValue placeholder="Choose a venue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {owned.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                    <SelectItem value={ALL_VENUES}>All {owned.length} venues</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                You are viewing all venues, so we need to know which one to close.
                            </p>
                        </div>
                    )}

                    {blockingEveryVenue && (
                        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            This closes {prettyDate(date)} at all {owned.length} of your venues.
                        </p>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="block-reason">
                            Reason
                            <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                            id="block-reason"
                            placeholder="Eid, maintenance, family function…"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={120}
                        />
                        <p className="text-xs text-muted-foreground">
                            Written on the block so you know later why the date was closed.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={blockMut.isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => blockMut.mutate()}
                        disabled={blockMut.isPending || !scopeAnswered}
                    >
                        {blockMut.isPending ? "Blocking…" : "Block date"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function prettyDate(ymd: string) {
    const d = new Date(`${ymd}T00:00:00`)
    return isNaN(d.getTime())
        ? ymd
        : d.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })
}

export default BlockDateDialog
