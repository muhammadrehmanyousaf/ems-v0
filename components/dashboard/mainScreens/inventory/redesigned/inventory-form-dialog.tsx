"use client"

/**
 * Inventory item create/edit dialog (redesigned) — functional parity for the
 * redesigned Inventory screen. Wired to InventoryAPI.createItem/updateItem
 * (same endpoints as the original). Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { InventoryAPI, INVENTORY_CATEGORY_LABELS, INVENTORY_UNIT_LABELS, type InventoryItem, type InventoryCategory, type InventoryUnit } from "@/lib/api/inventory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint, FieldError, fieldAria, ERROR_INPUT_CLS } from "@/components/dashboard/primitives/field-error"

const CATEGORIES = Object.keys(INVENTORY_CATEGORY_LABELS) as InventoryCategory[]
const UNITS = Object.keys(INVENTORY_UNIT_LABELS) as InventoryUnit[]

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState {
  name: string; category: InventoryCategory; unit: InventoryUnit; sku: string
  currentStock: string; lowStockThreshold: string; lastRestockCostPerUnit: string; reorderLeadTimeDays: string
  defaultSupplierName: string; notes: string
}
const blank = (i?: InventoryItem): FormState => ({
  name: i?.name ?? "",
  category: (i?.category as InventoryCategory) ?? CATEGORIES[0],
  unit: (i?.unit as InventoryUnit) ?? UNITS[0],
  sku: i?.sku ?? "",
  currentStock: i?.currentStock != null ? String(i.currentStock) : "0",
  lowStockThreshold: i?.lowStockThreshold != null ? String(i.lowStockThreshold) : "",
  lastRestockCostPerUnit: i?.lastRestockCostPerUnit != null ? String(i.lastRestockCostPerUnit) : "",
  reorderLeadTimeDays: i?.reorderLeadTimeDays != null ? String(i.reorderLeadTimeDays) : "",
  defaultSupplierName: i?.defaultSupplierName ?? "",
  notes: i?.notes ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

export function InventoryFormDialog({
  open, onOpenChange, item, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: InventoryItem
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!item
  const [form, setForm] = React.useState<FormState>(blank(item))
  const loadedId = React.useRef<number | "new" | null>(null)

  React.useEffect(() => {
    if (open) {
      const key = item?.id ?? "new"
      if (loadedId.current !== key) { setForm(blank(item)); loadedId.current = key }
    } else { loadedId.current = null }
  }, [open, item])

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: item?.businessId ?? businessId!,
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        sku: form.sku.trim() || undefined,
        currentStock: numOrU(form.currentStock),
        lowStockThreshold: numOrU(form.lowStockThreshold),
        lastRestockCostPerUnit: numOrU(form.lastRestockCostPerUnit),
        reorderLeadTimeDays: numOrU(form.reorderLeadTimeDays),
        defaultSupplierName: form.defaultSupplierName.trim() || undefined,
        notes: form.notes.trim() || undefined,
      }
      return isEdit ? InventoryAPI.updateItem(item!.id, body) : InventoryAPI.createItem(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Item updated" : "Item added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save item"),
  })

  /*
   * All four number fields accepted negatives. Verified live: opening stock
   * -500, low-stock threshold -10, last cost -9999 and reorder lead time -30
   * were all accepted with Save enabled, no error, no aria-invalid and no min
   * attribute on any input.
   *
   * Negative stock is not a typo you can shrug off here — the list header
   * derives "Stock value" and the "Low / out of stock" count from these, so one
   * negative quantity silently corrupts both tiles for every other item too.
   */
  const neg = (v: string) => String(v ?? "").trim() !== "" && Number(v) < 0
  const numErrs = {
    currentStock: neg(form.currentStock) ? "Opening stock can't be negative." : undefined,
    lowStockThreshold: neg(form.lowStockThreshold) ? "Threshold can't be negative." : undefined,
    lastRestockCostPerUnit: neg(form.lastRestockCostPerUnit) ? "Cost can't be negative." : undefined,
    reorderLeadTimeDays: neg(form.reorderLeadTimeDays) ? "Lead time can't be negative." : undefined,
  }
  const hasNumErr = Object.values(numErrs).some(Boolean)
  const canSave = form.name.trim() && !hasNumErr && (isEdit || businessId != null)


  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave
    ? undefined
    : !form.name.trim()
      ? "Add a name to save."
      : hasNumErr
        ? "Fix the highlighted fields to save."
        : "This item needs a business before it can be saved."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add inventory item"}</DialogTitle>
          <DialogDescription>Track stock, reorder levels and last cost.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Field label="Item name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Premium photo album (12x18)" autoFocus /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as InventoryCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{INVENTORY_CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Unit">
              <select className={inputCls} value={form.unit} onChange={(e) => set("unit", e.target.value as InventoryUnit)}>
                {UNITS.map((u) => <option key={u} value={u}>{INVENTORY_UNIT_LABELS[u]}</option>)}
              </select>
            </Field>
            <Field label="SKU"><input className={inputCls} value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
            {!isEdit && (
              <Field label="Opening stock">
                <input id="inv-stock" type="number" min={0} step="any" inputMode="decimal"
                  className={cn(inputCls, "tabular-nums", numErrs.currentStock && ERROR_INPUT_CLS)}
                  value={form.currentStock} onChange={(e) => set("currentStock", e.target.value)}
                  {...fieldAria("inv-stock", numErrs.currentStock)} />
                <FieldError id="inv-stock" message={numErrs.currentStock} />
              </Field>
            )}
            <Field label="Low-stock threshold">
              <input id="inv-thresh" type="number" min={0} step="any" inputMode="decimal"
                className={cn(inputCls, "tabular-nums", numErrs.lowStockThreshold && ERROR_INPUT_CLS)}
                value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)}
                {...fieldAria("inv-thresh", numErrs.lowStockThreshold)} />
              <FieldError id="inv-thresh" message={numErrs.lowStockThreshold} />
            </Field>
            <Field label="Last cost / unit (Rs)">
              <input id="inv-cost" type="number" min={0} step="0.01" inputMode="decimal"
                className={cn(inputCls, "tabular-nums", numErrs.lastRestockCostPerUnit && ERROR_INPUT_CLS)}
                value={form.lastRestockCostPerUnit} onChange={(e) => set("lastRestockCostPerUnit", e.target.value)}
                {...fieldAria("inv-cost", numErrs.lastRestockCostPerUnit)} />
              <FieldError id="inv-cost" message={numErrs.lastRestockCostPerUnit} />
            </Field>
            <Field label="Reorder lead time (days)">
              <input id="inv-lead" type="number" min={0} step={1} inputMode="numeric"
                className={cn(inputCls, "tabular-nums", numErrs.reorderLeadTimeDays && ERROR_INPUT_CLS)}
                value={form.reorderLeadTimeDays} onChange={(e) => set("reorderLeadTimeDays", e.target.value)}
                {...fieldAria("inv-lead", numErrs.reorderLeadTimeDays)} />
              <FieldError id="inv-lead" message={numErrs.reorderLeadTimeDays} />
            </Field>
            <Field label="Default supplier"><input className={inputCls} value={form.defaultSupplierName} onChange={(e) => set("defaultSupplierName", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update item" : "Save item"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InventoryFormDialog
