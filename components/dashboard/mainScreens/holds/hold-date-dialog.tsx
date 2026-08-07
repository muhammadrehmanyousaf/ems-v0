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
import { useBusinessIdField } from "@/lib/store/use-business-id-field"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { DangerousAction } from "@/components/dashboard/primitives/dangerous-action"
import { todayInKarachi } from "@/lib/utils/pk-date"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
// WWL-062 / F10 — `new Date().toISOString()` is UTC, so for the first five hours
// of every Pakistani day this returned YESTERDAY and used it as the `min`,
// making today unselectable at 2am in Lahore.
const today = () => todayInKarachi()
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
  // WWL-608 / F3 — `useActiveBusinessId() ?? undefined` sends NO venue under the
  // header's persisted "All venues" default, so a hold captured at an expo
  // attached to nothing. `useBusinessIdField` falls back to the vendor's first
  // venue without ever overriding an active header selection.
  const [businessIdStr] = useBusinessIdField()
  const resolvedBusinessId = businessIdStr ? Number(businessIdStr) : undefined
  const [form, setForm] = React.useState({ holdDate: prefill?.holdDate || today(), holdTime: prefill?.holdTime || "Evening" })
  const loaded = React.useRef<string | null>(null)
  React.useEffect(() => {
    const k = open ? (prefill ? `p${JSON.stringify(prefill)}` : "new") : null
    if (open) { if (loaded.current !== k) { setForm({ holdDate: prefill?.holdDate || today(), holdTime: prefill?.holdTime || "Evening" }); loaded.current = k } } else { loaded.current = null }
  }, [open, prefill])

  const placeMut = useMutation({
    mutationFn: async () => {
      const body = { businessId: resolvedBusinessId, holdDate: form.holdDate, holdTime: form.holdTime.trim() }
      if (isOutboxEnabled() && isOffline()) {
        await outboxEnqueue("hold_date", { businessId: resolvedBusinessId, holdDate: body.holdDate, holdTime: body.holdTime }, `${fmtDate(body.holdDate)} · ${body.holdTime}`)
        return { queuedOffline: true as const }
      }
      return VendorHoldsAPI.place(body)
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Held offline — will sync when you reconnect")
      else showSuccessToast(r?.alreadyHeld ? "Hold extended" : "Date held")

      /**
       * WWL-060 — a date that already carried a confirmed booking accepted a
       * hold with no warning of any kind, so the holds list showed a slot as
       * tentatively reserved when it had in fact already been sold. The hold
       * still succeeds — a vendor may legitimately hold a second hall or a
       * second function on the same day — but they are told what is there.
       */
      const clashes: Array<{ customerName?: string; bookingTime?: string; status?: string }> =
        r?.conflictingBookings ?? []
      if (clashes.length > 0) {
        const first = clashes[0]
        toast.warning(
          clashes.length === 1
            ? `Heads up — ${first.customerName || "a booking"} is already booked on this date${first.bookingTime ? ` at ${first.bookingTime}` : ""}.`
            : `Heads up — this date already has ${clashes.length} bookings against this venue.`,
          { duration: 8000 },
        )
      }

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
          {/* WWL-604 (S2) — this form arrives already valid (date = today,
              slot = Evening), so one click on an untouched dialog placed a real
              hold on a real calendar. Confirm names the date it is about to
              take. */}
          <DangerousAction
            title="Hold this date?"
            consequence={
              <>
                <strong>{fmtDate(form.holdDate)} · {form.holdTime || "—"}</strong> will be marked as
                held on your calendar, so it stops showing as free. Holds expire on their own if you
                don&apos;t confirm a booking, and you can release one from Date holds.
              </>
            }
            confirmLabel="Hold the date"
            confirmVariant="default"
            disabled={!canSave || placeMut.isPending}
            onConfirm={() => placeMut.mutateAsync()}
          >
            <Button disabled={!canSave || placeMut.isPending}>
              {placeMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Holding…</> : <><Icon name="CalendarCheck" size={15} className="mr-1.5" /> Hold date</>}
            </Button>
          </DangerousAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HoldDateDialog
