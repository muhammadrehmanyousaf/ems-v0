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
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { BookingPicker } from "@/components/dashboard/shared/booking-picker"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkr,
  validateNotFutureDate,
  validateTransactionRef,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const METHODS = Object.keys(RECEIPT_METHOD_LABELS) as ReceiptMethod[]
const today = () => todayInKarachi()
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

interface BookingOption { id: number; customerName: string; bookingDate: string }

/** WWL-117 — matches the `max` passed to validateOptionalText below. */
const NOTES_MAX = 1000
interface FormState { method: ReceiptMethod; amount: string; receivedDate: string; transactionRef: string; bookingId: string; notes: string }
export interface ReceiptPrefill { bookingId?: number; amount?: number; method?: string; receivedDate?: string; note?: string }
const blank = (r?: PaymentReceipt, prefill?: ReceiptPrefill): FormState => ({
  method: (r?.method as ReceiptMethod) ?? (prefill?.method as ReceiptMethod) ?? "cash",
  amount: r?.amount != null ? String(r.amount) : prefill?.amount != null ? String(prefill.amount) : "",
  receivedDate: (r?.receivedDate ?? prefill?.receivedDate ?? today()).slice(0, 10),
  transactionRef: r?.transactionRef ?? "",
  bookingId: r?.bookingId != null ? String(r.bookingId) : prefill?.bookingId != null ? String(prefill.bookingId) : "",
  notes: r?.notes ?? prefill?.note ?? "",
})

export function ReceiptFormDialog({
  open, onOpenChange, receipt, prefill, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  receipt?: PaymentReceipt
  prefill?: ReceiptPrefill
  onSaved?: () => void
}) {
  const isEdit = !!receipt
  const [form, setForm] = React.useState<FormState>(blank(receipt, prefill))
  const loaded = React.useRef<string | null>(null)
  React.useEffect(() => {
    // Re-seed when a different record/prefill opens (prefill has no id, so key on it too).
    const k = open ? (receipt?.id != null ? `r${receipt.id}` : prefill ? `p${JSON.stringify(prefill)}` : "new") : null
    if (open) { if (loaded.current !== k) { setForm(blank(receipt, prefill)); loaded.current = k } } else { loaded.current = null }
  }, [open, receipt, prefill])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Errors appear only after a field is touched, so opening the dialog doesn't
  // immediately flag the empty amount the vendor is about to type.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  const { data: bookings } = useQuery<BookingOption[]>({
    queryKey: ["receipt-bookings"],
    enabled: open && !isEdit,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/bookings", { params: { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "DESC" } })
      return (res.data?.data?.data ?? []).map((b: any) => ({ id: b.id, customerName: b.customerName ?? `Booking #${b.id}`, bookingDate: b.bookingDate }))
    },
  })

  const saveMut = useMutation({
    mutationFn: async () => {
      const body: any = { method: form.method, amount: Number(form.amount) || 0, receivedDate: form.receivedDate, transactionRef: form.transactionRef.trim() || undefined, notes: form.notes.trim() || undefined }
      if (form.bookingId) body.bookingId = Number(form.bookingId)
      // PWA-02 — creating a receipt while offline: queue it in the outbox instead
      // of failing. It syncs idempotently on reconnect. Edits stay online-only.
      if (!isEdit && isOutboxEnabled() && isOffline()) {
        const ref = form.transactionRef.trim()
        const note = [form.notes.trim(), ref ? `Ref: ${ref}` : ""].filter(Boolean).join(" · ") || undefined
        await outboxEnqueue(
          "record_receipt",
          { bookingId: Number(form.bookingId), amount: Number(form.amount) || 0, method: form.method, receivedDate: form.receivedDate, note },
          `Rs ${Number(form.amount) || 0} · ${RECEIPT_METHOD_LABELS[form.method]}`,
        )
        return { queuedOffline: true as const }
      }
      return isEdit ? ReceiptsAPI.update(receipt!.id, body) : ReceiptsAPI.create(body)
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Saved offline — will sync when you reconnect")
      else showSuccessToast(isEdit ? "Receipt updated" : "Receipt logged")
      onSaved?.(); onOpenChange(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save receipt"),
  })
  // This is a money ledger, so the gaps here cost real reconciliation work:
  //   - amount had NO min, so the browser's spinner offered negatives
  //   - receivedDate was a bare <input type="date"> with no bounds, so a
  //     receipt could be dated NEXT YEAR and silently skew every total and
  //     aging report that reads it
  //   - transactionRef was free-text even for JazzCash / Easypaisa / Raast /
  //     bank transfer, where without the id the payment cannot be matched
  //     against a bank statement later
  const errs = {
    amount: validatePkr(form.amount, { label: "Amount" }),
    receivedDate: validateNotFutureDate(form.receivedDate, { label: "Date received" }),
    transactionRef: validateTransactionRef(form.transactionRef, form.method),
    bookingId: !isEdit && !form.bookingId ? "Choose the booking this payment is for." : undefined,
    notes: validateOptionalText(form.notes, { label: "Notes", max: 1000 }),
  }
  const shown = {
    amount: touched.amount ? errs.amount : undefined,
    receivedDate: touched.receivedDate ? errs.receivedDate : undefined,
    transactionRef: touched.transactionRef ? errs.transactionRef : undefined,
    notes: touched.notes ? errs.notes : undefined,
  }
  const canSave = !errs.amount && !errs.receivedDate && !errs.transactionRef && !errs.bookingId && !errs.notes

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason =
    !canSave && !Object.values(shown).some(Boolean)
      ? errs.bookingId ?? errs.notes ?? "Add an amount above 0 and the date it was received to save."
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit receipt" : "Record a receipt"}</DialogTitle><DialogDescription>A payment received from a customer.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount (Rs)">
              <input
                id="rcpt-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className={cn(inputCls, "tabular-nums", shown.amount && ERROR_INPUT_CLS)}
                value={form.amount}
                onChange={(e) => { set("amount", e.target.value); touch("amount") }}
                onBlur={() => touch("amount")}
                autoFocus
                {...fieldAria("rcpt-amount", shown.amount)}
              />
              <FieldError id="rcpt-amount" message={shown.amount} />
            </Field>
            <Field label="Date">
              <input
                id="rcpt-date"
                type="date"
                /* Native ceiling as well as the JS check — the picker itself
                   should not offer a future date for money already received. */
                max={todayInKarachi()}
                className={cn(inputCls, shown.receivedDate && ERROR_INPUT_CLS)}
                value={form.receivedDate}
                onChange={(e) => { set("receivedDate", e.target.value); touch("receivedDate") }}
                onBlur={() => touch("receivedDate")}
                {...fieldAria("rcpt-date", shown.receivedDate)}
              />
              <FieldError id="rcpt-date" message={shown.receivedDate} />
            </Field>
            <Field label="Method">
              <select className={inputCls} value={form.method} onChange={(e) => set("method", e.target.value as ReceiptMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{RECEIPT_METHOD_LABELS[m]}</option>)}
              </select>
            </Field>
            <Field label="Transaction ref">
              <input
                id="rcpt-ref"
                className={cn(inputCls, shown.transactionRef && ERROR_INPUT_CLS)}
                value={form.transactionRef}
                onChange={(e) => { set("transactionRef", e.target.value); touch("transactionRef") }}
                onBlur={() => touch("transactionRef")}
                maxLength={64}
                placeholder="TID / cheque #"
                {...fieldAria("rcpt-ref", shown.transactionRef)}
              />
              <FieldError id="rcpt-ref" message={shown.transactionRef} />
            </Field>
          </div>
          {!isEdit && (
            <Field label="Linked booking (registered customer)">
              {/* WWL-127 — this was a hand-rolled `name · date` select, so three
                  options read "Waheed Jutt" and cancelled bookings sat among
                  the live ones with nothing to tell them apart. The shared
                  picker carries amount, payment status and id, and groups the
                  cancelled ones under their own heading. */}
              <BookingPicker
                value={form.bookingId ? Number(form.bookingId) : null}
                onChange={(id) => set("bookingId", id == null ? "" : String(id))}
                placeholder="Select a booking…"
                className="w-full min-w-0"
                aria-label="Booking this receipt belongs to"
              />
              <p className="text-[11px] text-muted-foreground">A receipt must be tied to a booking whose customer has a registered account.</p>
            </Field>
          )}
          {/**
            * WWL-117 — `errs.notes` gated `canSave`, but this field rendered no
            * FieldError and `touch("notes")` was never called, so the message
            * could never appear. At 1001 characters Save went dead and the
            * hint said "Add an amount above 0 and the date it was received" —
            * while amount and date were both valid. The textarea had no
            * maxLength either, so nothing stopped the paste that caused it.
            */}
          <Field label="Notes">
            <textarea
              id="rcpt-notes"
              className={cn(inputCls, "h-20 resize-y py-2", shown.notes && ERROR_INPUT_CLS)}
              value={form.notes}
              maxLength={NOTES_MAX}
              onChange={(e) => { set("notes", e.target.value); touch("notes") }}
              onBlur={() => touch("notes")}
              {...fieldAria("rcpt-notes", shown.notes)}
            />
            <div className="flex items-start justify-between gap-2">
              <FieldError id="rcpt-notes" message={shown.notes} />
              {form.notes.length > NOTES_MAX - 100 && (
                <span className={cn("shrink-0 text-[11px] tabular-nums", form.notes.length >= NOTES_MAX ? "text-destructive" : "text-muted-foreground")}>
                  {form.notes.length} / {NOTES_MAX}
                </span>
              )}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Log receipt"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ReceiptFormDialog
