"use client"

/**
 * Availability manager (redesigned, Track C — interactive). Self-contained
 * blocked-dates editor (BlockedDatesAPI getAll/block/unblock — scoped to the
 * vendor via auth, no businessId). Used inside the business-settings hub's
 * Availability tab. Own mutations (not the hub's save bar).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BlockedDatesAPI, type BlockedDate } from "@/lib/api/dashboard"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const fmt = (s: string) => {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })
}

export function AvailabilityManager() {
  const qc = useQueryClient()
  const { data: blocked, isLoading } = useQuery<BlockedDate[]>({ queryKey: ["blocked-dates"], queryFn: () => BlockedDatesAPI.getAll() })
  const [date, setDate] = React.useState("")
  const [reason, setReason] = React.useState("")
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blocked-dates"] })

  const blockMut = useMutation({
    mutationFn: () => BlockedDatesAPI.block(date, reason.trim() || undefined),
    onSuccess: () => { showSuccessToast("Date blocked"); setDate(""); setReason(""); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't block date"),
  })
  const unblockMut = useMutation({
    mutationFn: (d: string) => BlockedDatesAPI.unblock(d),
    onSuccess: () => { showSuccessToast("Date freed"); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't free date"),
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
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[180px,1fr,auto] sm:items-end">
          <div className="space-y-1.5"><label className={labelCls}>Date</label><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="space-y-1.5"><label className={labelCls}>Reason (optional)</label><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Personal leave, already booked" /></div>
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
                <Button size="sm" variant="ghost" className="ml-auto" disabled={unblockMut.isPending} onClick={() => unblockMut.mutate(b.blockedDate)}><Icon name="Trash2" size={14} className="mr-1 text-muted-foreground hover:text-red-600" /> Free</Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AvailabilityManager
