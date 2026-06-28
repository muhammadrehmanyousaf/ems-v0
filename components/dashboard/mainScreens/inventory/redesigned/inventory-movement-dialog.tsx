"use client"

/**
 * Stock-movement dialog (redesigned) — the audit-safe way to change an inventory
 * item's stock (direct PATCH refuses currentStock by design). Wired to
 * InventoryAPI.createMovement. Part of Inventory functional parity.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { InventoryAPI, MOVEMENT_TYPE_LABELS, type InventoryItem, type MovementType } from "@/lib/api/inventory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TYPES = Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]
const ADDS: MovementType[] = ["restock", "transfer_in"]
const SUBTRACTS: MovementType[] = ["consumed", "wastage", "transfer_out"]

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function InventoryMovementDialog({
  open, onOpenChange, item, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item?: InventoryItem
  onSaved?: () => void
}) {
  const [type, setType] = React.useState<MovementType>("restock")
  const [quantity, setQuantity] = React.useState("")
  const [costPerUnit, setCostPerUnit] = React.useState("")
  const [reason, setReason] = React.useState("")
  const loaded = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (open && item && loaded.current !== item.id) {
      loaded.current = item.id
      setType("restock"); setQuantity(""); setCostPerUnit(""); setReason("")
    }
    if (!open) loaded.current = null
  }, [open, item])

  const cur = num(item?.currentStock)
  const qty = num(quantity)
  const projected = ADDS.includes(type) ? cur + qty : SUBTRACTS.includes(type) ? cur - qty : qty // adjustment = stock-take to qty
  const unit = String(item?.unit ?? "")

  const saveMut = useMutation({
    mutationFn: () => InventoryAPI.createMovement({
      inventoryItemId: item!.id,
      type,
      quantity: qty,
      costPerUnit: costPerUnit.trim() === "" ? undefined : Number(costPerUnit) || 0,
      reason: reason.trim() || undefined,
    }),
    onSuccess: () => { showSuccessToast("Stock updated"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't record movement"),
  })

  const canSave = !!item && qty > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock{item ? ` — ${item.name}` : ""}</DialogTitle>
          <DialogDescription>Record a stock movement. Current: <span className="font-medium text-foreground tabular-nums">{cur} {unit}</span></DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Movement">
              <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as MovementType)}>
                {TYPES.map((t) => <option key={t} value={t}>{MOVEMENT_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label={type === "adjustment" ? "Counted quantity" : "Quantity"}><input type="number" className={cn(inputCls, "tabular-nums")} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" autoFocus /></Field>
          </div>
          {ADDS.includes(type) && <Field label="Cost / unit (Rs, optional)"><input type="number" className={cn(inputCls, "tabular-nums")} value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} /></Field>}
          <Field label="Reason / note"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Restock from supplier, used at Ahmed wedding" /></Field>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">New stock: </span>
            <span className={cn("font-semibold tabular-nums", projected < 0 ? "text-destructive" : "text-foreground")}>{projected} {unit}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Record movement</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InventoryMovementDialog
