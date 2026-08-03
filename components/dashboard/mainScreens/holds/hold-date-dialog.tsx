"use client"

/**
 * Phase-3 EPIC 4 · PWA-02 — reusable "Hold a date" dialog.
 *
 * Extracted from HoldsView so both the Date-holds screen and the Field-capture
 * hub share one implementation. Online → VendorHoldsAPI.place; offline → queues a
 * hold_date op in the outbox (syncs, and may conflict, on reconnect).
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { VendorHoldsAPI, HOLD_SLOT_PRESETS } from "@/lib/api/vendorHolds"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

export interface HoldPrefill { holdDate?: string; holdTime?: string }

export function HoldDateDialog({
  open, onOpenChange, prefill, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefill?: HoldPrefill
  onSaved?: () => void
}) {
  const activeBusinessId = useActiveBusinessId()
  const [form, setForm] = React.useState({ holdDate: prefill?.holdDate || today(), holdTime: prefill?.holdTime || "Evening" })
  const loaded = React.useRef<string | null>(null)
  React.useEffect(() => {
    const k = open ? (prefill ? `p${JSON.stringify(prefill)}` : "new") : null
    if (open) { if (loaded.current !== k) { setForm({ holdDate: prefill?.holdDate || today(), holdTime: prefill?.holdTime || "Evening" }); loaded.current = k } } else { loaded.current = null }
  }, [open, prefill])

  const placeMut = useMutation({
    mutationFn: async () => {
      const body = { businessId: activeBusinessId ?? undefined, holdDate: form.holdDate, holdTime: form.holdTime.trim() }
      if (isOutboxEnabled() && isOffline()) {
        await outboxEnqueue("hold_date", { businessId: activeBusinessId ?? undefined, holdDate: body.holdDate, holdTime: body.holdTime }, `${fmtDate(body.holdDate)} · ${body.holdTime}`)
        return { queuedOffline: true as const }
      }
      return VendorHoldsAPI.place(body)
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Held offline — will sync when you reconnect")
      else showSuccessToast(r?.alreadyHeld ? "Hold extended" : "Date held")
      onSaved?.(); onOpenChange(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't hold the date"),
  })

  const canSave = !!form.holdDate && !!form.holdTime.trim()


  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave ? undefined : "Add a date and a time to save."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || placeMut.isPending} onClick={() => placeMut.mutate()}>
            {placeMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Holding…</> : <><Icon name="CalendarCheck" size={15} className="mr-1.5" /> Hold date</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HoldDateDialog
