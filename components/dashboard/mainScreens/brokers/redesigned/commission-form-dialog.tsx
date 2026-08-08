"use client"

/**
 * Broker-commission create/edit dialog (redesigned) — functional parity for the
 * redesigned Brokers screen (which lists commission accruals). Wired to
 * BrokerAPI.createCommission/updateCommission. Broker is captured as a snapshot
 * name + type (brokerId optional). Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { RecordVenueField } from "@/components/dashboard/shared/record-venue-field"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useVendorBookings, formatBookingLabel, isCancelledBooking } from "@/hooks/use-vendor-bookings"
import { BrokerAPI, BROKER_TYPE_LABELS, type BrokerCommission, type BrokerType, type CommissionType } from "@/lib/api/brokers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const BROKER_TYPES = Object.keys(BROKER_TYPE_LABELS) as BrokerType[]
const today = () => todayInKarachi()
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState {
  brokerId: string; bookingId: string
  brokerNameSnapshot: string; brokerTypeSnapshot: BrokerType; commissionType: CommissionType
  commissionPct: string; commissionFlat: string; bookingAmountSnapshot: string
  accruedDate: string; dueDate: string; description: string
}
const blank = (c?: BrokerCommission): FormState => ({
  brokerId: c?.brokerId != null ? String(c.brokerId) : "",
  bookingId: c?.bookingId != null ? String(c.bookingId) : "",
  brokerNameSnapshot: c?.brokerNameSnapshot ?? "",
  brokerTypeSnapshot: (c?.brokerTypeSnapshot as BrokerType) ?? BROKER_TYPES[0],
  commissionType: (c?.commissionType as CommissionType) ?? "percentage",
  commissionPct: c?.commissionPct != null ? String(c.commissionPct) : "",
  commissionFlat: c?.commissionFlat != null ? String(c.commissionFlat) : "",
  bookingAmountSnapshot: c?.bookingAmountSnapshot != null ? String(c.bookingAmountSnapshot) : "",
  accruedDate: (c?.accruedDate ?? today()).slice(0, 10),
  dueDate: (c?.dueDate ?? "").slice(0, 10),
  description: c?.description ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

export function CommissionFormDialog({
  open, onOpenChange, commission, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  commission?: BrokerCommission
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!commission
  /**
   * WWL-293/311/332/350 — the record used to be filed under whichever venue was
   * first in the array. `businessId` now arrives undefined when the header is
   * on "All venues" and the vendor owns more than one, so the dialog asks
   * instead of guessing. RecordVenueField renders nothing for a single-venue
   * vendor, who has nothing to get wrong.
   */
  const [venueId, setVenueId] = React.useState<string>(businessId != null ? String(businessId) : "")
  React.useEffect(() => {
    if (businessId != null) setVenueId(String(businessId))
  }, [businessId])
  const effectiveBusinessId = venueId ? Number(venueId) : businessId
  const [form, setForm] = React.useState<FormState>(blank(commission))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = commission?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(commission)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, commission])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  /**
   * WWL-289 — Broker name was a free text box on a screen that ALREADY fetches
   * all 12 broker records, and there was no booking picker at all. The captured
   * create body carried no `brokerId` and no `bookingId`, so a commission
   * created through the UI could never be attached to the broker who earned it
   * or the event that generated it — while the seeded rows link through to a
   * real function sheet, so the Event column works and simply stays empty
   * forever for anything a vendor enters.
   *
   * Both ids have been accepted by the API the whole time.
   *
   * WWL-295 — picking a broker also pulls across what the record already knows:
   * their type and their `defaultCommissionPct`. Twelve brokers carry a default
   * rate and the form made the vendor retype it from memory.
   */
  const { data: brokerData } = useQuery({
    queryKey: ["brokers-for-commission", effectiveBusinessId],
    queryFn: () => BrokerAPI.list(effectiveBusinessId ? { businessId: effectiveBusinessId } : {}),
    enabled: open,
    staleTime: 5 * 60_000,
  })
  const brokers = brokerData?.brokers ?? []
  const { data: bookings } = useVendorBookings(open)

  const pickBroker = (id: string) => {
    setForm((f) => {
      const b = brokers.find((x) => String(x.id) === id)
      if (!b) return { ...f, brokerId: "" }
      const pct = b.defaultCommissionPct != null ? String(b.defaultCommissionPct) : f.commissionPct
      return {
        ...f,
        brokerId: id,
        brokerNameSnapshot: b.name,
        brokerTypeSnapshot: (b.brokerType as BrokerType) ?? f.brokerTypeSnapshot,
        // Only pre-fill a rate the vendor has not already typed over.
        commissionPct: f.commissionPct.trim() === "" ? pct : f.commissionPct,
      }
    })
  }

  /** Picking the event fills the booking amount the percentage is computed on. */
  const pickBooking = (id: string) => {
    setForm((f) => {
      const b = (bookings ?? []).find((x) => String(x.id) === id)
      if (!b) return { ...f, bookingId: "" }
      const amt = Number(b.totalAmount)
      return {
        ...f,
        bookingId: id,
        bookingAmountSnapshot:
          f.bookingAmountSnapshot.trim() === "" && Number.isFinite(amt) && amt > 0
            ? String(Math.round(amt))
            : f.bookingAmountSnapshot,
      }
    })
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: commission?.businessId ?? effectiveBusinessId!,
        // WWL-289 — both ids have been accepted by the API all along.
        brokerId: form.brokerId ? Number(form.brokerId) : null,
        bookingId: form.bookingId ? Number(form.bookingId) : null,
        brokerNameSnapshot: form.brokerNameSnapshot.trim() || undefined,
        brokerTypeSnapshot: form.brokerTypeSnapshot,
        commissionType: form.commissionType,
        commissionPct: form.commissionType === "percentage" ? numOrU(form.commissionPct) : undefined,
        commissionFlat: form.commissionType === "flat" ? numOrU(form.commissionFlat) : undefined,
        bookingAmountSnapshot: numOrU(form.bookingAmountSnapshot),
        accruedDate: form.accruedDate,
        dueDate: form.dueDate || undefined,
        description: form.description.trim() || undefined,
      }
      return isEdit ? BrokerAPI.updateCommission(commission!.id, body) : BrokerAPI.createCommission(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Commission updated" : "Commission added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save commission")),
  })
  const amountOk = form.commissionType === "percentage"
    ? (Number(form.commissionPct) || 0) > 0 && (Number(form.bookingAmountSnapshot) || 0) > 0
    : (Number(form.commissionFlat) || 0) > 0
  const canSave = form.brokerNameSnapshot.trim() && form.accruedDate && amountOk && (isEdit || effectiveBusinessId != null)

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  /**
   * WWL-290 — the hint listed the content fields and never the venue, so a
   * vendor on "All venues" who had filled the form correctly read a list of
   * things they had already done and a Save button that stayed dead. Name the
   * thing that is actually missing first.
   */
  const blockedReason = canSave
    ? undefined
    : !isEdit && effectiveBusinessId == null
      ? "Choose which venue this commission belongs to."
      : "Add a broker name and the date it accrued to save."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit commission" : "Add broker commission"}</DialogTitle>
          <DialogDescription>A commission owed to a broker for a referral.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <RecordVenueField value={venueId} onChange={setVenueId} noun="commission" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Broker" className="sm:col-span-2">
              <select className={inputCls} value={form.brokerId} onChange={(e) => pickBroker(e.target.value)} autoFocus>
                <option value="">Not one of my saved brokers — type a name</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.agencyName ? ` · ${b.agencyName}` : ""}{b.phoneNumber ? ` · ${b.phoneNumber}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            {/* A one-off broker is a real case (a guest's uncle who sent a
                family), so the free-text name stays — it just is not the only
                way in any more. */}
            <Field label={form.brokerId ? "Broker name (from their record)" : "Broker name"}>
              <input
                className={inputCls}
                value={form.brokerNameSnapshot}
                onChange={(e) => { set("brokerNameSnapshot", e.target.value); if (form.brokerId) set("brokerId", "") }}
              />
            </Field>
            <Field label="Broker type">
              <select className={inputCls} value={form.brokerTypeSnapshot} onChange={(e) => set("brokerTypeSnapshot", e.target.value as BrokerType)}>
                {BROKER_TYPES.map((t) => <option key={t} value={t}>{BROKER_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Commission type">
              <select className={inputCls} value={form.commissionType} onChange={(e) => set("commissionType", e.target.value as CommissionType)}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </Field>
            {form.commissionType === "percentage"
              ? <Field label="Commission %"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.commissionPct} onChange={(e) => set("commissionPct", e.target.value)} placeholder="e.g. 5" /></Field>
              : <Field label="Commission (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.commissionFlat} onChange={(e) => set("commissionFlat", e.target.value)} /></Field>}
            <Field label={form.commissionType === "percentage" ? "Booking amount (Rs) — required" : "Booking amount (Rs)"}><input type="number" className={cn(inputCls, "tabular-nums")} value={form.bookingAmountSnapshot} onChange={(e) => set("bookingAmountSnapshot", e.target.value)} placeholder={form.commissionType === "percentage" ? "needed to compute %" : ""} /></Field>
            <Field label="Event / booking" className="sm:col-span-2">
              <select className={inputCls} value={form.bookingId} onChange={(e) => pickBooking(e.target.value)}>
                <option value="">Not tied to one booking</option>
                {(bookings ?? []).filter((b) => !isCancelledBooking(b)).map((b) => (
                  <option key={b.id} value={b.id}>{formatBookingLabel(b)}</option>
                ))}
              </select>
            </Field>
            <Field label="Accrued date"><input type="date" className={inputCls} value={form.accruedDate} onChange={(e) => set("accruedDate", e.target.value)} /></Field>
            <Field label="Due date"><input type="date" className={inputCls} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          </div>
          <Field label="Description"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What this commission is for" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save commission"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CommissionFormDialog
