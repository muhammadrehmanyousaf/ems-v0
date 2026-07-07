"use client"

/**
 * Phase-3 EPIC 4 · PWA-02 — vendor date-holds screen (/dashboard/holds).
 *
 * A vendor tentatively holds a date for a lead. Works OFFLINE: at a bridal expo
 * with no signal, "Hold this date" queues a hold_date op in the outbox and it
 * syncs on reconnect. If the slot was taken meanwhile, the conflict surfaces in
 * the OutboxConflicts panel ("that date was taken while you were offline") with a
 * Re-enter action. Dark until FEAT_OFFLINE_OUTBOX (the API 404s → list stays empty).
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { VendorHoldsAPI, HOLD_SLOT_PRESETS, type VendorHold } from "@/lib/api/vendorHolds"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { OutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts, type ReenterPayload } from "@/components/dashboard/shared/outbox-conflicts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const fmtWhen = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? s : d.toLocaleString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) }

interface HoldForm { holdDate: string; holdTime: string }

export function HoldsView() {
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<HoldForm>({ holdDate: today(), holdTime: "Evening" })

  const { data: holds, isLoading, isError, refetch } = useQuery<VendorHold[]>({
    queryKey: ["vendor-holds"],
    queryFn: () => VendorHoldsAPI.list(),
    retry: false, // 404 when the feature is dark — don't hammer
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendor-holds"] })

  const openCreate = (prefill?: ReenterPayload) => {
    setForm({ holdDate: prefill?.holdDate || today(), holdTime: prefill?.holdTime || "Evening" })
    setOpen(true)
  }

  const placeMut = useMutation({
    mutationFn: async () => {
      const body = { businessId: activeBusinessId ?? undefined, holdDate: form.holdDate, holdTime: form.holdTime.trim() }
      // Offline → queue the hold; it syncs (and may conflict) on reconnect.
      if (isOutboxEnabled() && isOffline()) {
        await outboxEnqueue("hold_date", { businessId: activeBusinessId ?? undefined, holdDate: body.holdDate, holdTime: body.holdTime }, `${fmtDate(body.holdDate)} · ${body.holdTime}`)
        return { queuedOffline: true as const }
      }
      return VendorHoldsAPI.place(body)
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Held offline — will sync when you reconnect")
      else showSuccessToast(r?.alreadyHeld ? "Hold extended" : "Date held")
      setOpen(false); invalidate()
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || "Couldn't hold the date"
      // 409 → the slot was taken (online path). Surface plainly.
      toast.error(e?.response?.status === 409 ? msg : msg)
    },
  })

  const releaseMut = useMutation({
    mutationFn: (id: number) => VendorHoldsAPI.release(id),
    onSuccess: () => { showSuccessToast("Hold released"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't release"),
  })

  const canSave = !!form.holdDate && !!form.holdTime.trim()
  const list = holds ?? []

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Calendar"
        title="Date holds"
        description="Tentatively hold a date for a lead — even offline at an expo. Holds expire automatically."
        actions={<div className="flex items-center gap-2"><OutboxStatus /><Button onClick={() => openCreate()}><Icon name="Plus" size={16} className="mr-1.5" /> Hold a date</Button></div>}
      />

      <OutboxConflicts reenterOps={["hold_date"]} onReenter={(p) => openCreate(p)} />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground"><Spinner size={16} /> Loading…</div>
      ) : isError ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Date holds aren&apos;t enabled for your account yet.</div>
      ) : list.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <div className="text-sm font-medium">No active holds</div>
          <p className="mt-1 text-xs text-muted-foreground">Hold a date to tentatively reserve it while you follow up with a lead.</p>
          <Button size="sm" className="mt-3" onClick={() => openCreate()}><Icon name="Plus" size={14} className="mr-1" /> Hold a date</Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hold a date</DialogTitle>
            <DialogDescription>A tentative reservation on your calendar. It expires on its own if you don&apos;t confirm a booking.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <input type="date" className={inputCls} value={form.holdDate} min={today()} onChange={(e) => setForm((f) => ({ ...f, holdDate: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Slot</label>
              <select className={inputCls} value={HOLD_SLOT_PRESETS.includes(form.holdTime as any) ? form.holdTime : "__custom"} onChange={(e) => setForm((f) => ({ ...f, holdTime: e.target.value === "__custom" ? "" : e.target.value }))}>
                {HOLD_SLOT_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="__custom">Custom…</option>
              </select>
              {!HOLD_SLOT_PRESETS.includes(form.holdTime as any) && (
                <input className={cn(inputCls, "mt-1.5")} value={form.holdTime} onChange={(e) => setForm((f) => ({ ...f, holdTime: e.target.value }))} placeholder="e.g. 6pm, Nikah" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!canSave || placeMut.isPending} onClick={() => placeMut.mutate()}>
              {placeMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Holding…</> : <><Icon name="CalendarCheck" size={15} className="mr-1.5" /> Hold date</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HoldsView
