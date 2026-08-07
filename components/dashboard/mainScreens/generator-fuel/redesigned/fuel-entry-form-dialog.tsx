"use client"

/**
 * Generator-fuel entry create/edit dialog (redesigned) — functional parity for
 * the redesigned Generator & fuel screen. Wired to GeneratorFuelAPI.create/update.
 * Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { RecordVenueField } from "@/components/dashboard/shared/record-venue-field"
import { useMutation } from "@tanstack/react-query"
import { GeneratorFuelAPI, ENTRY_TYPE_LABELS, FUEL_TYPE_LABELS, type FuelEntry, type EntryType, type FuelType } from "@/lib/api/generatorFuel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const ENTRY_TYPES = Object.keys(ENTRY_TYPE_LABELS) as EntryType[]
const FUEL_TYPES = Object.keys(FUEL_TYPE_LABELS) as FuelType[]
const today = () => todayInKarachi()
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState { type: EntryType; fuelType: FuelType; litres: string; generatorIdentifier: string; costPerLitre: string; supplierName: string; deliveryRef: string; runHours: string; occurredAt: string; notes: string }
const blank = (e?: FuelEntry): FormState => ({
  type: (e?.type as EntryType) ?? "delivery",
  fuelType: (e?.fuelType as FuelType) ?? "diesel",
  litres: e?.litres != null ? String(e.litres) : "",
  generatorIdentifier: e?.generatorIdentifier ?? "",
  costPerLitre: e?.costPerLitre != null ? String(e.costPerLitre) : "",
  supplierName: e?.supplierName ?? "",
  deliveryRef: e?.deliveryRef ?? "",
  runHours: e?.runHours != null ? String(e.runHours) : "",
  occurredAt: (e?.occurredAt ?? today()).slice(0, 10),
  notes: e?.notes ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

export function FuelEntryFormDialog({
  open, onOpenChange, entry, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  entry?: FuelEntry
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!entry
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
  const [form, setForm] = React.useState<FormState>(blank(entry))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = entry?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(entry)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, entry])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        businessId: entry?.businessId ?? effectiveBusinessId!,
        type: form.type,
        fuelType: form.fuelType,
        // Maintenance carries no fuel; the server stores 0 for it regardless,
        // so don't send a stale figure left behind by a type switch.
        litres: form.type === "maintenance" ? 0 : Number(form.litres) || 0,
        generatorIdentifier: form.generatorIdentifier.trim() || undefined,
        costPerLitre: numOrU(form.costPerLitre),
        supplierName: form.supplierName.trim() || undefined,
        deliveryRef: form.deliveryRef.trim() || undefined,
        runHours: numOrU(form.runHours),
        occurredAt: form.occurredAt,
        notes: form.notes.trim() || undefined,
      }
      if (isEdit) await GeneratorFuelAPI.update(entry!.id, body)
      else await GeneratorFuelAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Entry updated" : "Entry logged"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save entry"),
  })
  /**
   * What "litres" means depends on the entry type, and one rule for all four
   * made two of them unrecordable.
   *
   * `Number(form.litres) > 0` was applied regardless of type:
   *
   *   - WWL-302 — **Maintenance** involves no fuel. An oil change, a filter
   *     swap or a servicing visit has no litres, so Save was permanently
   *     disabled on one of the four types the form itself offers.
   *   - WWL-303 — a **Tank reading of 0** is the single most consequential
   *     reading on a generator log; it is the one that stops an event
   *     mid-baraat. Zero fails `> 0`, so "the tank is empty" could not be
   *     recorded.
   *
   * Deliveries and consumption genuinely move fuel, so those keep `> 0`.
   */
  const needsLitres = form.type === "delivery" || form.type === "consumption"
  const isReading = form.type === "tank_reading"
  const litresNum = form.litres.trim() === "" ? null : Number(form.litres)
  const litresOk = needsLitres
    ? litresNum != null && litresNum > 0
    : isReading
      ? litresNum != null && litresNum >= 0 // 0 = empty tank, the reading that matters most
      : true // maintenance — no fuel involved

  /**
   * WWL-305 — the cost guard covered deliveries only, so a **consumption** row
   * saved with `costPerLitre: -99` and `runHours: -40`, and the payload went
   * out. The header's Total cost card sums every entry type, so one negative
   * consumption row drags the whole fuel spend down, and negative run hours
   * corrupt every burn-rate figure derived from them.
   */
  const costNum = form.costPerLitre.trim() === "" ? null : Number(form.costPerLitre)
  const hoursNum = form.runHours.trim() === "" ? null : Number(form.runHours)
  const negativeCost = costNum != null && costNum < 0
  const negativeHours = hoursNum != null && hoursNum < 0
  const negativeLitres = litresNum != null && litresNum < 0
  const deliveryNeedsCost = form.type === "delivery" && !(costNum != null && costNum > 0)

  const canSave =
    litresOk &&
    !negativeCost &&
    !negativeHours &&
    !negativeLitres &&
    (isEdit || effectiveBusinessId != null) &&
    !deliveryNeedsCost

  /**
   * BUG-057 — a disabled button is not feedback. WWL-304: the hint was one
   * fixed string for four different blocked states, naming a cost per litre
   * that a maintenance entry does not need and a type that is always already
   * selected — two things that are not the problem, and never the one that is.
   */
  const blockedReason = canSave
    ? undefined
    : negativeLitres
      ? "Litres can't be negative."
      : negativeCost
        ? "Cost per litre can't be negative."
        : negativeHours
          ? "Run hours can't be negative."
          : deliveryNeedsCost
            ? "A delivery needs a cost per litre, or the fuel spend reads Rs 0."
            : !litresOk
              ? isReading
                ? "Enter the tank reading in litres (0 is allowed — it means empty)."
                : "Enter how many litres this entry is for."
              : "Pick the venue this entry belongs to."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit fuel entry" : "Log fuel entry"}</DialogTitle>
          <DialogDescription>Generator fuel deliveries, consumption and readings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <RecordVenueField value={venueId} onChange={setVenueId} noun="fuel entry" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Entry type">
              <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value as EntryType)}>
                {ENTRY_TYPES.map((t) => <option key={t} value={t}>{ENTRY_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Fuel type">
              <select className={inputCls} value={form.fuelType} onChange={(e) => set("fuelType", e.target.value as FuelType)}>
                {FUEL_TYPES.map((t) => <option key={t} value={t}>{FUEL_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            {/* WWL-302 — a maintenance entry involves no fuel, so the field
                that was blocking it is not shown for one. */}
            {form.type !== "maintenance" && (
              <Field label={isReading ? "Tank reading (litres)" : "Litres"}>
                <input
                  type="number"
                  min={0}
                  className={cn(inputCls, "tabular-nums")}
                  value={form.litres}
                  onChange={(e) => set("litres", e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </Field>
            )}
            <Field label={form.type === "delivery" ? "Cost / litre (Rs) *" : "Cost / litre (Rs)"}><input type="number" min={0} className={cn(inputCls, "tabular-nums")} value={form.costPerLitre} onChange={(e) => set("costPerLitre", e.target.value)} /></Field>
            <Field label="Generator"><input className={inputCls} value={form.generatorIdentifier} onChange={(e) => set("generatorIdentifier", e.target.value)} placeholder="e.g. 25 KVA #1" /></Field>
            <Field label="Date"><input type="date" className={inputCls} value={form.occurredAt} onChange={(e) => set("occurredAt", e.target.value)} /></Field>
            <Field label="Supplier"><input className={inputCls} value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} /></Field>
            <Field label="Run hours"><input type="number" min={0} className={cn(inputCls, "tabular-nums")} value={form.runHours} onChange={(e) => set("runHours", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Log entry"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FuelEntryFormDialog
