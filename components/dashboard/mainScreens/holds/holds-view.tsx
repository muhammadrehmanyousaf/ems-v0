"use client"

/**
 * Phase-3 EPIC 4 · PWA-02 — vendor date-holds screen (/dashboard/holds).
 *
 * A vendor tentatively holds a date for a lead. Works OFFLINE via the shared
 * HoldDateDialog (queues a hold_date op that syncs on reconnect); if the slot was
 * taken meanwhile the conflict surfaces in OutboxConflicts with Re-enter. Dark
 * until FEAT_OFFLINE_OUTBOX (the API 404s → the list shows the disabled note).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { VendorHoldsAPI, type VendorHold } from "@/lib/api/vendorHolds"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { OutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts, type ReenterPayload } from "@/components/dashboard/shared/outbox-conflicts"
import { HoldDateDialog, type HoldPrefill } from "@/components/dashboard/mainScreens/holds/hold-date-dialog"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const fmtWhen = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? s : d.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }

export function HoldsView() {
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const [open, setOpen] = React.useState(false)
  const [prefill, setPrefill] = React.useState<HoldPrefill | undefined>(undefined)

  const { data: holds, isLoading, isError, refetch } = useQuery<VendorHold[]>({
    // key on the active business so switching venues refetches that venue's holds
    queryKey: ["vendor-holds", activeBusinessId],
    queryFn: () => VendorHoldsAPI.list(activeBusinessId ?? undefined),
    retry: false, // 404 when the feature is dark — don't hammer
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendor-holds"] })

  const openCreate = () => { setPrefill(undefined); setOpen(true) }
  const openReenter = (p: ReenterPayload) => { setPrefill({ holdDate: p.holdDate, holdTime: p.holdTime }); setOpen(true) }

  const releaseMut = useMutation({
    mutationFn: (id: number) => VendorHoldsAPI.release(id),
    onSuccess: () => { showSuccessToast("Hold released"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't release"),
  })

  const list = holds ?? []

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Calendar"
        title="Date holds"
        description="Tentatively hold a date for a lead — even offline at an expo. Holds expire automatically."
        actions={<div className="flex items-center gap-2"><OutboxStatus /><Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Hold a date</Button></div>}
      />

      <OutboxConflicts reenterOps={["hold_date"]} onReenter={openReenter} />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Spinner size={16} /> Loading…</div>
      ) : isError ? (
        // This used to read "Date holds aren't enabled for your account yet",
        // written when the feature was flag-dark and the API 404'd. The API is
        // live now, so that message is simply false — the common cause is a
        // vendor with no business selected, which returns 400. Telling someone
        // a working feature is switched off sends them to support for a
        // problem they could have solved in one click.
        <div className="rounded-lg border p-6 text-center">
          <div className="text-sm font-medium">
            {activeBusinessId ? "Couldn't load your holds" : "Pick a business first"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {activeBusinessId
              ? "Something went wrong fetching them."
              : "Date holds belong to one business. Choose one and its holds appear here."}
          </p>
          {activeBusinessId ? (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="text-sm font-medium">No active holds</div>
          <p className="mt-1 text-xs text-muted-foreground">Hold a date to tentatively reserve it while you follow up with a lead.</p>
          <Button size="sm" className="mt-3" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Hold a date</Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium">{fmtDate(h.holdDate)} · {h.holdTime}</div>
                <div className="text-xs text-muted-foreground">Expires {fmtWhen(h.expiresAt)}{h.bookingId ? " · converting to a booking" : ""}</div>
              </div>
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => releaseMut.mutate(h.id)} disabled={releaseMut.isPending}>Release</Button>
            </li>
          ))}
        </ul>
      )}

      <HoldDateDialog open={open} onOpenChange={setOpen} prefill={prefill} onSaved={invalidate} />
    </div>
  )
}

export default HoldsView
