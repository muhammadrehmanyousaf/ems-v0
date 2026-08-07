"use client"

/**
 * Stock-movement dialog (redesigned) — the audit-safe way to change an inventory
 * item's stock (direct PATCH refuses currentStock by design). Wired to
 * InventoryAPI.createMovement. Part of Inventory functional parity.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation } from "@tanstack/react-query"
import { InventoryAPI, MOVEMENT_TYPE_LABELS, type InventoryItem, type MovementType } from "@/lib/api/inventory"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { BookingPicker } from "@/components/dashboard/shared/booking-picker"
import { todayInKarachi, maxTodayKarachi } from "@/lib/utils/pk-date"

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
  // WWL-247 — see the note above `saveMut`. These four are accepted by the API
  // and were unreachable from the UI.
  const [supplierName, setSupplierName] = React.useState("")
  const [bookingId, setBookingId] = React.useState("")
  const [occurredAt, setOccurredAt] = React.useState(todayInKarachi())
  const [notes, setNotes] = React.useState("")
  const loaded = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (open && item && loaded.current !== item.id) {
      loaded.current = item.id
      setType("restock"); setQuantity(""); setCostPerUnit(""); setReason("")
      // Default the supplier to whoever last restocked this item — the answer
      // is right nine times in ten and the field is optional either way.
      setSupplierName(item.defaultSupplierName ?? "")
      setBookingId(""); setOccurredAt(todayInKarachi()); setNotes("")
    }
    if (!open) loaded.current = null
  }, [open, item])

  const cur = num(item?.currentStock)
  const qty = num(quantity)
  const projected = ADDS.includes(type) ? cur + qty : SUBTRACTS.includes(type) ? cur - qty : qty // adjustment = stock-take to qty
  const unit = String(item?.unit ?? "")

  /**
   * WWL-247 — the API accepts nine fields; the dialog offered four, and its own
   * placeholder advertised two of the five it was missing ("Restock from
   * supplier", "used at Ahmed wedding"). The consequences were not cosmetic:
   *
   *  - without `bookingId`, consumption could NEVER be attributed to an event,
   *    which is the only reason that column exists on the model — and it is
   *    what per-event costing reads;
   *  - without `occurredAt`, every movement was stamped `now()`, so yesterday's
   *    usage could not be recorded on yesterday and the stock ledger drifted
   *    away from what actually happened on the night.
   */
  const saveMut = useMutation({
    mutationFn: () => InventoryAPI.createMovement({
      inventoryItemId: item!.id,
      type,
      quantity: qty,
      costPerUnit: costPerUnit.trim() === "" ? undefined : Number(costPerUnit) || 0,
      reason: reason.trim() || undefined,
      supplierName: ADDS.includes(type) && supplierName.trim() ? supplierName.trim() : undefined,
      bookingId: bookingId ? Number(bookingId) : undefined,
      // Sent as a date-only string; the vendor picked a day, not an instant.
      occurredAt: occurredAt && occurredAt !== todayInKarachi() ? occurredAt : undefined,
      notes: notes.trim() || undefined,
    }),
    onSuccess: () => { showSuccessToast("Stock updated"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't record movement")),
  })

  /**
   * WWL-245 — `qty > 0` for every movement type made the app's own corrective
   * instruction impossible to follow.
   *
   * Deleting an item with stock returns:
   *   "Cannot delete item with non-zero stock. Record an adjustment movement to
   *    zero it first."
   *
   * A stock-take counted at 0 is exactly that adjustment — the projection even
   * read "New stock: 0 piece" — and Save stayed disabled, so the instruction
   * could not be carried out and the item could never be removed. The server
   * allows it; only this gate did not.
   *
   * The distinction is by type, not by number. A restock or a wastage OF ZERO is
   * a no-op and stays blocked; a stock-take of zero is the whole point ("we
   * counted, there is none left").
   */
  const isStockTake = !ADDS.includes(type) && !SUBTRACTS.includes(type)
  const qtyValid = quantity.trim() !== "" && Number.isFinite(qty) && (isStockTake ? qty >= 0 : qty > 0)

  /**
   * WWL-253 — consuming 9999 against a stock of 755 rendered the projection as
   * −9244 in destructive red and left Record movement ENABLED. The screen had
   * already worked out that the movement was impossible, showed the vendor the
   * impossible number, and then let them send it — with only the server's
   * `insufficient_stock` refusal standing between the click and a failure.
   *
   * A stock-take is exempt: counting a shelf to a number lower than the book
   * says is the whole purpose of a stock-take, and the projection IS the count.
   */
  const wouldGoNegative = !isStockTake && projected < 0
  const canSave = !!item && qtyValid && !wouldGoNegative

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for,
  // and say the right thing: the old hint named "the required fields above"
  // while the only field was filled in correctly.
  const blockedReason = canSave
    ? undefined
    : wouldGoNegative
      ? `You only have ${cur} ${unit} in stock — you can't take out ${qty}.`
      : !item
        ? "Pick an item to adjust."
        : quantity.trim() === ""
          ? isStockTake ? "Enter the counted quantity (0 is allowed)." : "Enter a quantity."
          : qty < 0
            ? "Quantity can't be negative."
            : "A restock or wastage of zero changes nothing — use Stock-take to set the count to 0."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ADDS.includes(type) && <Field label="Cost / unit (Rs, optional)"><input type="number" min={0} className={cn(inputCls, "tabular-nums")} value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} /></Field>}
            {/* WWL-455 — the day the movement happened, capped at today in
                Karachi so stock can be recorded on the morning after an event
                without the native input rejecting the only correct answer. */}
            <Field label="Date">
              <input type="date" max={maxTodayKarachi()} className={inputCls} value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
            </Field>
          </div>

          {ADDS.includes(type) && (
            <Field label="Supplier (optional)">
              <input className={inputCls} value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="e.g. Al-Madina Traders" />
            </Field>
          )}

          {SUBTRACTS.includes(type) && (
            <Field label="Used at (optional)">
              <BookingPicker
                value={bookingId ? Number(bookingId) : null}
                onChange={(id) => setBookingId(id == null ? "" : String(id))}
                placeholder="Not tied to an event"
                className="w-full min-w-0"
                aria-label="Event this stock was used at"
              />
            </Field>
          )}

          <Field label="Reason / note">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ADDS.includes(type) ? "e.g. Monthly restock" : "e.g. Broken during setup"} />
          </Field>
          <Field label="Notes (optional)">
            <textarea className={cn(inputCls, "h-16 resize-y py-2")} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the next person should know" />
          </Field>
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">New stock: </span>
            <span className={cn("font-semibold tabular-nums", projected < 0 ? "text-destructive" : "text-foreground")}>{projected} {unit}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Record movement</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InventoryMovementDialog
