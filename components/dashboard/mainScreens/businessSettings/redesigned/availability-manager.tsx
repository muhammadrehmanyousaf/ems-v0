"use client"

/**
 * Availability manager (redesigned, Track C — interactive). Self-contained
 * blocked-dates editor (BlockedDatesAPI getAll/block/unblock — scoped to the
 * vendor via auth, no businessId). Used inside the business-settings hub's
 * Availability tab. Own mutations (not the hub's save bar).
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BlockedDatesAPI, type BlockedDate } from "@/lib/api/dashboard"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { minTodayKarachi } from "@/lib/utils/pk-date"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const fmt = (s: string) => {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
}

/**
 * Scoped to ONE business. Previously this component took no businessId at all,
 * so blocking a date hit every venue the vendor owned — verified live: one click
 * created rows on both business 3361 (Lahore) and 3362 (Karachi), and the list
 * then showed the same date twice with no way to tell them apart or release one.
 * The query key includes businessId so switching venue refetches that venue's
 * calendar rather than reusing the previous one's.
 */
export function AvailabilityManager({ businessId }: { businessId?: number | null }) {
  const qc = useQueryClient()
  const { data: blocked, isLoading } = useQuery<BlockedDate[]>({
    queryKey: ["blocked-dates", businessId ?? "all"],
    queryFn: () => BlockedDatesAPI.getAll(undefined, businessId),
  })
  const [date, setDate] = React.useState("")
  const [reason, setReason] = React.useState("")
  // WWL-491 — Free went straight to the DELETE with no dialog.
  const [confirmFree, setConfirmFree] = React.useState<BlockedDate | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blocked-dates", businessId ?? "all"] })

  /**
   * WWL-492 — both writes reported success unconditionally. Blocking a date
   * that was already blocked cleared the form and toasted "Date blocked" while
   * writing nothing, and freeing toasted "Date freed" even when the DELETE
   * removed zero rows. The list then refetched to prove the toast wrong.
   *
   * The API now says what it did; this says the same thing. And the typed
   * reason is only cleared when a row was actually created — losing it after
   * a no-op made the vendor retype it.
   */
  const blockMut = useMutation({
    mutationFn: () => BlockedDatesAPI.block(date, reason.trim() || undefined, businessId),
    onSuccess: (res) => {
      if (res.newlyBlocked > 0) {
        showSuccessToast("Date blocked")
        setDate("")
        setReason("")
      } else {
        toast.info("That date was already blocked — nothing changed.")
      }
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't block date")),
  })
  const unblockMut = useMutation({
    mutationFn: (d: string) => BlockedDatesAPI.unblock(d, businessId),
    onSuccess: (deleted) => {
      if (deleted > 0) showSuccessToast("Date freed")
      else
        toast.error("Nothing was freed — that date is no longer blocked here.", {
          duration: 8000,
        })
      setConfirmFree(null)
      invalidate()
    },
    onError: (e: any) => toast.error(
        errorMessage(e, "Couldn't free date"),
        { duration: 8000 },
      ),
  })

  const sorted = React.useMemo(() => [...(blocked ?? [])].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)), [blocked])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="CalendarCheck" size={16} /></span>
        <div><h2 className="text-sm font-semibold">Availability</h2><p className="text-xs text-muted-foreground">Block dates you're unavailable so couples can't book them.</p></div>
      </div>

      <div className="space-y-4 p-4">
        {/* Block a date */}
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <div className="space-y-1.5"><label className={labelCls} htmlFor="block-date">Date</label>{/* WWL-455 — blocking a past date protects nothing; `min` is today in
                  Karachi, so the first five hours of a Pakistani day don't
                  reject today as "the past". */}
              <input id="block-date" aria-label="Block date" type="date" min={minTodayKarachi()} className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><label className={labelCls} htmlFor="block-reason">Reason (optional)</label><input id="block-reason" aria-label="Reason for blocking" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Personal leave, already booked" /></div>
          <Button disabled={!date || blockMut.isPending} onClick={() => blockMut.mutate()}>{blockMut.isPending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Plus" size={14} className="mr-1.5" />} Block date</Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner size={16} /> Loading…</div>
        ) : !sorted.length ? (
          <EmptyState icon="CalendarCheck" title="No blocked dates" description="Your calendar is fully open. Block dates above when you're unavailable." />
        ) : (
          <div className="space-y-2">
            {sorted.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Calendar" size={16} /></span>
                <div className="min-w-0"><div className="text-sm font-medium">{fmt(b.blockedDate)}</div>{b.reason && <div className="truncate text-xs text-muted-foreground">{b.reason}</div>}</div>
                <Button size="sm" variant="ghost" className="ml-auto" disabled={unblockMut.isPending} onClick={() => setConfirmFree(b)}><Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-destructive" /> Free</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/**
        * WWL-491 — one click restored a date to public availability, on a panel
        * whose own description is "Block dates you're unavailable so couples
        * can't book them". Freeing a block is the action that can lose the
        * venue a date; it deserves at least as much friction as withdrawing a
        * chat message, which already had a confirmation.
        */}
      <AlertDialog open={!!confirmFree} onOpenChange={(v) => !v && setConfirmFree(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open this date back up?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmFree ? fmt(confirmFree.blockedDate) : ""} will become publicly bookable again,
              and couples will be able to request it immediately.
              {confirmFree?.reason ? ` You blocked it for: ${confirmFree.reason}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it blocked</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmFree && unblockMut.mutate(confirmFree.blockedDate)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Free the date
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AvailabilityManager
