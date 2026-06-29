"use client"

/**
 * Generator-fuel entry create/edit dialog (redesigned) — functional parity for
 * the redesigned Generator & fuel screen. Wired to GeneratorFuelAPI.create/update.
 * Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { GeneratorFuelAPI, ENTRY_TYPE_LABELS, FUEL_TYPE_LABELS, type FuelEntry, type EntryType, type FuelType } from "@/lib/api/generatorFuel"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ENTRY_TYPES = Object.keys(ENTRY_TYPE_LABELS) as EntryType[]
const FUEL_TYPES = Object.keys(FUEL_TYPE_LABELS) as FuelType[]
const today = () => new Date().toISOString().slice(0, 10)
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
  const [form, setForm] = React.useState<FormState>(blank(entry))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = entry?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(entry)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, entry])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        businessId: entry?.businessId ?? businessId!,
        type: form.type,
        fuelType: form.fuelType,
        litres: Number(form.litres) || 0,
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
  const canSave = Number(form.litres) > 0 && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit fuel entry" : "Log fuel entry"}</DialogTitle>
          <DialogDescription>Generator fuel deliveries, consumption and readings.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
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
            <Field label="Litres"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.litres} onChange={(e) => set("litres", e.target.value)} placeholder="0" autoFocus /></Field>
            <Field label="Cost / litre (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.costPerLitre} onChange={(e) => set("costPerLitre", e.target.value)} /></Field>
            <Field label="Generator"><input className={inputCls} value={form.generatorIdentifier} onChange={(e) => set("generatorIdentifier", e.target.value)} placeholder="e.g. 25 KVA #1" /></Field>
            <Field label="Date"><input type="date" className={inputCls} value={form.occurredAt} onChange={(e) => set("occurredAt", e.target.value)} /></Field>
            <Field label="Supplier"><input className={inputCls} value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} /></Field>
            <Field label="Run hours"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.runHours} onChange={(e) => set("runHours", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Log entry"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FuelEntryFormDialog
