"use client"

/**
 * Availability manager. Blocked-dates editor for ONE business, used inside the
 * business-settings hub's Availability tab. Owns its mutations (not the hub's
 * save bar).
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
import { minTodayKarachi, todayInKarachi, addDaysToDateString } from "@/lib/utils/pk-date"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const fmt = (s: string) => {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
}
const fmtStamp = (s?: string | null) => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * WWL-490 — the date input had no `min` and no `max`. A block on 2020-01-01 was
 * accepted and transmitted; so was 2099-12-31. Neither can ever affect a
 * booking, and both join the list forever. `min` (today in Karachi, so the
 * first five hours of a Pakistani day don't reject today as "the past") was
 * added earlier; this is the other end.
 */
const MAX_BLOCK_AHEAD_DAYS = 365 * 3
/** Mirrors MAX_BLOCK_RANGE_DAYS on the server. */
const MAX_RANGE_DAYS = 92

/** Inclusive day count between two YYYY-MM-DD strings, or null if out of order. */
function daysBetween(from: string, to: string): number | null {
  const a = new Date(`${from}T00:00:00Z`).getTime()
  const b = new Date(`${to}T00:00:00Z`).getTime()
  if (isNaN(a) || isNaN(b) || b < a) return null
  return Math.round((b - a) / 86_400_000) + 1
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
  const today = todayInKarachi()

  /**
   * WWL-495 — this asked for every blocked date the venue had ever had:
   * `getAll(undefined, businessId)` passed `undefined` for `month` even though
   * the server has supported filtering all along. A venue blocking one day a
   * week accumulates fifty-two rows a year into a flat ascending list, oldest
   * first — so the least relevant rows sat at the top, permanently.
   *
   * Upcoming is the default because it is the only view that can still change a
   * booking. Past is one click away and says how many rows it holds.
   */
  const [showPast, setShowPast] = React.useState(false)
  const range = showPast ? {} : { from: today }

  const { data: blocked, isLoading, isError, refetch } = useQuery<BlockedDate[]>({
    queryKey: ["blocked-dates", businessId ?? "all", showPast ? "all-time" : "upcoming"],
    queryFn: () => BlockedDatesAPI.getAll(undefined, businessId, range),
  })

  const [date, setDate] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [confirmFree, setConfirmFree] = React.useState<BlockedDate | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blocked-dates", businessId ?? "all"] })

  const maxDate = addDaysToDateString(today, MAX_BLOCK_AHEAD_DAYS)
  const rangeDays = date && dateTo ? daysBetween(date, dateTo) : null
  const rangeErr =
    date && dateTo
      ? rangeDays == null
        ? "The end date is before the start date."
        : rangeDays > MAX_RANGE_DAYS
          ? `That's ${rangeDays} days. Block at most ${MAX_RANGE_DAYS} at a time.`
          : undefined
      : undefined

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
    mutationFn: () => BlockedDatesAPI.block(date, reason.trim() || undefined, businessId, dateTo || null),
    onSuccess: (res) => {
      const clear = () => { setDate(""); setDateTo(""); setReason("") }
      if (res.requestedDays > 1) {
        // WWL-494 — a range that hits a booked day blocks the rest and names
        // what it skipped, rather than refusing the whole season.
        if (res.newlyBlocked > 0) {
          showSuccessToast(
            `${res.newlyBlocked} date${res.newlyBlocked === 1 ? "" : "s"} blocked` +
              (res.alreadyBlocked ? ` · ${res.alreadyBlocked} already blocked` : ""),
          )
          clear()
        } else {
          toast.info("Those dates were already blocked — nothing changed.")
        }
        if (res.conflicted.length > 0) {
          toast.warning(
            `${res.conflicted.length} date${res.conflicted.length === 1 ? "" : "s"} stayed open — ` +
              `${res.conflicted.slice(0, 3).map((c) => c.blockedDate).join(", ")}` +
              `${res.conflicted.length > 3 ? "…" : ""} already have holds or bookings.`,
            { duration: 10000 },
          )
        }
      } else if (res.newlyBlocked > 0) {
        showSuccessToast("Date blocked")
        clear()
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

  const sorted = React.useMemo(
    () => [...(blocked ?? [])].sort((a, b) => a.blockedDate.localeCompare(b.blockedDate)),
    [blocked],
  )
  const pastCount = React.useMemo(
    () => sorted.filter((b) => b.blockedDate < today).length,
    [sorted, today],
  )

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="CalendarCheck" size={16} /></span>
        <div className="mr-auto"><h2 className="text-sm font-semibold">Availability</h2><p className="text-xs text-muted-foreground">Block dates you&apos;re unavailable so couples can&apos;t book them.</p></div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowPast((v) => !v)}
        >
          {showPast ? "Show upcoming only" : "Include past dates"}
          {showPast && pastCount > 0 && (
            <span className="ml-1.5 text-muted-foreground">({pastCount} past)</span>
          )}
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* Block a date, or a run of them */}
        <div className="space-y-3 rounded-lg border border-border/70 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_160px_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="block-date">From</label>
              <input
                id="block-date" type="date"
                min={minTodayKarachi()} max={maxDate}
                className={inputCls} value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {/* WWL-494 — there was no range, no recurring rule and no bulk
                block, on a market that closes for weeks: Muharram is ten days
                one at a time, Ramadan thirty, and across three venues ninety —
                each with its own venue switch, date pick and click. */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="block-date-to">To (optional)</label>
              <input
                id="block-date-to" type="date"
                min={date || minTodayKarachi()} max={maxDate}
                className={cn(inputCls, rangeErr && "border-destructive")}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={!date}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="block-reason">Reason (optional)</label>
              <input id="block-reason" className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Personal leave, already booked" />
            </div>
            <Button disabled={!date || !!rangeErr || blockMut.isPending} onClick={() => blockMut.mutate()}>
              {blockMut.isPending ? <Spinner size={14} className="mr-1.5" /> : <Icon name="Plus" size={14} className="mr-1.5" />}
              {rangeDays && rangeDays > 1 && !rangeErr ? `Block ${rangeDays} dates` : "Block date"}
            </Button>
          </div>
          {/**
            * WWL-500 — dates are entered through a bare native date input and
            * listed as flat text rows: no month grid, no view of which dates
            * are open, and no way to see a blocked date in context with the
            * bookings around it. The Calendar module exists elsewhere in the
            * product and neither screen linked to the other.
            *
            * A month grid here would duplicate that module rather than replace
            * it, so this points at it instead — the blocked dates you set here
            * are what it draws.
            */}
          {rangeErr ? (
            <p className="text-xs font-medium text-destructive">{rangeErr}</p>
          ) : rangeDays && rangeDays > 1 ? (
            <p className="text-xs text-muted-foreground">
              {rangeDays} dates, {fmt(date)} to {fmt(dateTo)}. Any day with a hold or a booking on it
              stays open and we&apos;ll tell you which.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Leave &ldquo;To&rdquo; blank for a single day. Closing for Ramadan or Muharram? Give both dates.{" "}
              <a href="/dashboard/calendar" className="underline underline-offset-2">
                See these dates on the calendar
              </a>{" "}
              alongside the bookings around them.
            </p>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Spinner size={16} /> Loading…</div>
        ) : isError ? (
          <EmptyState
            icon="AlertTriangle"
            title="Couldn't load your blocked dates"
            description="Your calendar hasn't changed — this is the page failing to read it."
            action={<Button size="sm" onClick={() => refetch()}>Try again</Button>}
          />
        ) : !sorted.length ? (
          <EmptyState
            icon="CalendarCheck"
            title={showPast ? "No blocked dates" : "No upcoming blocked dates"}
            description={
              showPast
                ? "Your calendar is fully open. Block dates above when you're unavailable."
                : "Nothing coming up is blocked. Block dates above when you're unavailable."
            }
          />
        ) : (
          <div className="space-y-2">
            {sorted.map((b) => {
              const isPast = b.blockedDate < today
              const stamp = fmtStamp(b.createdAt)
              const by = b.user?.fullName
              return (
                <div key={b.id} className={cn("flex items-center gap-3 rounded-lg border border-border p-3", isPast && "opacity-60")}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name="Calendar" size={16} /></span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {fmt(b.blockedDate)}
                      {isPast && <span className="ml-1.5 text-xs font-normal text-muted-foreground">· past</span>}
                    </div>
                    {b.reason && <div className="truncate text-xs text-muted-foreground">{b.reason}</div>}
                    {/* WWL-497 — a row carried a date and an optional reason and
                        nothing else, so a vendor looking at a block reading "hi"
                        had no way to learn when it appeared or who added it. */}
                    {(stamp || by) && (
                      <div className="text-[11px] text-muted-foreground">
                        {by ? `Blocked by ${by}` : "Blocked"}{stamp ? ` on ${stamp}` : ""}
                      </div>
                    )}
                  </div>
                  {/* WWL-496 — `unblockMut.isPending` is one shared object and
                      every row read it, so freeing a single date greyed out the
                      Free button on every other row at the same time. Only the
                      row actually in flight is disabled now. */}
                  <Button
                    size="sm" variant="ghost" className="ml-auto shrink-0"
                    disabled={unblockMut.isPending && unblockMut.variables === b.blockedDate}
                    onClick={() => setConfirmFree(b)}
                  >
                    {unblockMut.isPending && unblockMut.variables === b.blockedDate
                      ? <Spinner size={14} className="mr-1" />
                      : <Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-destructive" />}
                    Free
                  </Button>
                </div>
              )
            })}
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
