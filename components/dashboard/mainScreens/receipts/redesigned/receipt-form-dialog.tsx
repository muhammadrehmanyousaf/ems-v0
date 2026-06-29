"use client"

/**
 * Payment-receipt create/edit dialog (redesigned) — functional parity for the
 * redesigned Receipts screen. Wired to ReceiptsAPI.create/update. Like a PDC, a
 * receipt must link to a customer; on create the user picks a booking (whose
 * customer must have a registered account) — the backend resolves the customer.
 */

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ReceiptsAPI, RECEIPT_METHOD_LABELS, type PaymentReceipt, type ReceiptMethod } from "@/lib/api/paymentReceipts"
import axiosInstance from "@/lib/axiosConfig"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const METHODS = Object.keys(RECEIPT_METHOD_LABELS) as ReceiptMethod[]
const today = () => new Date().toISOString().slice(0, 10)
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

interface BookingOption { id: number; customerName: string; bookingDate: string }
interface FormState { method: ReceiptMethod; amount: string; receivedDate: string; transactionRef: string; bookingId: string; notes: string }
const blank = (r?: PaymentReceipt): FormState => ({
  method: (r?.method as ReceiptMethod) ?? "cash",
  amount: r?.amount != null ? String(r.amount) : "",
  receivedDate: (r?.receivedDate ?? today()).slice(0, 10),
  transactionRef: r?.transactionRef ?? "",
  bookingId: r?.bookingId != null ? String(r.bookingId) : "",
  notes: r?.notes ?? "",
})

export function ReceiptFormDialog({
  open, onOpenChange, receipt, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  receipt?: PaymentReceipt
  onSaved?: () => void
}) {
  const isEdit = !!receipt
  const [form, setForm] = React.useState<FormState>(blank(receipt))
  const loaded = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const k = receipt?.id ?? "new"; if (loaded.current !== k) { setForm(blank(receipt)); loaded.current = k } } else { loaded.current = null }
  }, [open, receipt])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { data: bookings } = useQuery<BookingOption[]>({
    queryKey: ["receipt-bookings"],
    enabled: open && !isEdit,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/bookings", { params: { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "DESC" } })
      return (res.data?.data?.data ?? []).map((b: any) => ({ id: b.id, customerName: b.customerName ?? `Booking #${b.id}`, bookingDate: b.bookingDate }))
    },
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const body: any = { method: form.method, amount: Number(form.amount) || 0, receivedDate: form.receivedDate, transactionRef: form.transactionRef.trim() || undefined, notes: form.notes.trim() || undefined }
      if (form.bookingId) body.bookingId = Number(form.bookingId)
      return isEdit ? ReceiptsAPI.update(receipt!.id, body) : ReceiptsAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Receipt updated" : "Receipt logged"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save receipt"),
  })
  const canSave = Number(form.amount) > 0 && form.receivedDate && (isEdit || !!form.bookingId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit receipt" : "Record a receipt"}</DialogTitle><DialogDescription>A payment received from a customer.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.amount} onChange={(e) => set("amount", e.target.value)} autoFocus /></Field>
            <Field label="Date"><input type="date" className={inputCls} value={form.receivedDate} onChange={(e) => set("receivedDate", e.target.value)} /></Field>
            <Field label="Method">
              <select className={inputCls} value={form.method} onChange={(e) => set("method", e.target.value as ReceiptMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{RECEIPT_METHOD_LABELS[m]}</option>)}
              </select>
            </Field>
            <Field label="Transaction ref"><input className={inputCls} value={form.transactionRef} onChange={(e) => set("transactionRef", e.target.value)} placeholder="TID / cheque #" /></Field>
          </div>
          {!isEdit && (
            <Field label="Linked booking (registered customer)">
              <select className={inputCls} value={form.bookingId} onChange={(e) => set("bookingId", e.target.value)}>
                <option value="">Select a booking…</option>
                {(bookings ?? []).map((b) => <option key={b.id} value={b.id}>{b.customerName}{b.bookingDate ? ` · ${b.bookingDate.slice(0, 10)}` : ""}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">A receipt must be tied to a booking whose customer has a registered account.</p>
            </Field>
          )}
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Log receipt"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptFormDialog
