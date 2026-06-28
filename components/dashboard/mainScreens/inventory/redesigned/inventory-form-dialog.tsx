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

  const canSave = form.name.trim() && (isEdit || businessId != null)

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
            {!isEdit && <Field label="Opening stock"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.currentStock} onChange={(e) => set("currentStock", e.target.value)} /></Field>}
            <Field label="Low-stock threshold"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.lowStockThreshold} onChange={(e) => set("lowStockThreshold", e.target.value)} /></Field>
            <Field label="Last cost / unit (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.lastRestockCostPerUnit} onChange={(e) => set("lastRestockCostPerUnit", e.target.value)} /></Field>
            <Field label="Reorder lead time (days)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.reorderLeadTimeDays} onChange={(e) => set("reorderLeadTimeDays", e.target.value)} /></Field>
            <Field label="Default supplier"><input className={inputCls} value={form.defaultSupplierName} onChange={(e) => set("defaultSupplierName", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update item" : "Save item"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InventoryFormDialog
