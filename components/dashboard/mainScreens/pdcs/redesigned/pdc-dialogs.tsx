"use client"

/**
 * Cheque (PDC) dialogs (redesigned) — functional parity for the redesigned Cheque
 * ledger. PdcFormDialog → PdcAPI.create/update (content). PdcTransitionDialog →
 * PdcAPI.transition (the enforced lifecycle held→deposited→cleared/bounced;
 * deposit needs a date, bounce needs a reason). Follows the Suppliers recipe.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PDC_STATUS_LABELS, PdcAPI, type PostDatedCheque, type PdcStatus } from "@/lib/api/postDatedCheques"
import axiosInstance from "@/lib/axiosConfig"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkr,
  validateName,
  validateChequeNumber,
  validateChequeDate,
  validateNotFutureDate,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const today = () => todayInKarachi()
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

// ─── Create / edit ───────────────────────────────────────────────
interface BookingOption { id: number; customerName: string; bookingDate: string }
interface FormState { chequeNumber: string; bankName: string; branchCode: string; amount: string; chequeDate: string; bookingId: string; notes: string }

/** WWL-117 — matches the `max` passed to validateOptionalText. */
const NOTES_MAX = 1000
const blank = (p?: PostDatedCheque): FormState => ({
  chequeNumber: p?.chequeNumber ?? "", bankName: p?.bankName ?? "", branchCode: p?.branchCode ?? "",
  amount: p?.amount != null ? String(p.amount) : "", chequeDate: (p?.chequeDate ?? today()).slice(0, 10),
  bookingId: p?.bookingId != null ? String(p.bookingId) : "", notes: p?.notes ?? "",
})

export function PdcFormDialog({ open, onOpenChange, pdc, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; pdc?: PostDatedCheque; onSaved?: () => void }) {
  const isEdit = !!pdc
  const [form, setForm] = React.useState<FormState>(blank(pdc))
  const loaded = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const k = pdc?.id ?? "new"; if (loaded.current !== k) { setForm(blank(pdc)); loaded.current = k } } else { loaded.current = null }
  }, [open, pdc])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Errors appear only after a field is touched, so a freshly-opened dialog
  // doesn't greet the vendor with red text before they've typed anything.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  // Bookings to link the cheque to a customer (backend requires a customer/booking on create).
  const { data: bookings } = useQuery<BookingOption[]>({
    queryKey: ["pdc-bookings"],
    enabled: open,
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/bookings", { params: { page: 1, limit: 100, sortBy: "createdAt", sortOrder: "DESC" } })
      const rows = res.data?.data?.data ?? []
      return rows.map((b: any) => ({ id: b.id, customerName: b.customerName ?? `Booking #${b.id}`, bookingDate: b.bookingDate }))
    },
  })

  const saveMut = useMutation({
    mutationFn: () => {
      const body: any = { chequeNumber: form.chequeNumber.trim(), bankName: form.bankName.trim(), branchCode: form.branchCode.trim() || undefined, amount: Number(form.amount) || 0, chequeDate: form.chequeDate, notes: form.notes.trim() || undefined }
      if (form.bookingId) body.bookingId = Number(form.bookingId)
      return isEdit ? PdcAPI.update(pdc!.id, body) : PdcAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Cheque updated" : "Cheque logged"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save cheque")),
  })
  // NOTE: chequeDate deliberately does NOT use validateNotFutureDate. A PDC is a
  // POST-dated cheque, so a future date is the entire point. What matters here
  // is the Pakistani staleness rule (a bank refuses a cheque over six months
  // old) and a sanity ceiling to catch a mistyped year.
  const errs = {
    chequeNumber: validateChequeNumber(form.chequeNumber),
    bankName: validateName(form.bankName, { label: "Bank", min: 2, max: 100 }),
    amount: validatePkr(form.amount, { label: "Amount" }),
    chequeDate: validateChequeDate(form.chequeDate),
    bookingId: !isEdit && !form.bookingId ? "Choose the booking this cheque is for." : undefined,
    notes: validateOptionalText(form.notes, { label: "Notes", max: 1000 }),
  }
  const shown = {
    chequeNumber: touched.chequeNumber ? errs.chequeNumber : undefined,
    bankName: touched.bankName ? errs.bankName : undefined,
    amount: touched.amount ? errs.amount : undefined,
    chequeDate: touched.chequeDate ? errs.chequeDate : undefined,
    notes: touched.notes ? errs.notes : undefined,
  }
  const canSave = !errs.chequeNumber && !errs.bankName && !errs.amount && !errs.chequeDate && !errs.bookingId && !errs.notes

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason =
    !canSave && !Object.values(shown).some(Boolean)
      ? errs.bookingId ?? errs.notes ?? "Add a cheque number, a bank name, an amount above 0 and a cheque date to save."
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit cheque" : "Log a cheque"}</DialogTitle><DialogDescription>A post-dated cheque in your ledger.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cheque number">
              <input id="pdc-num" className={cn(inputCls, shown.chequeNumber && ERROR_INPUT_CLS)} inputMode="numeric" maxLength={20}
                /* WWL-173 — this stripped non-digits as you typed, so "ABC123XYZ"
                   became "123" with no explanation and the form then said the
                   cheque number "looks too short". The vendor saw their input
                   silently rewritten and then blamed for it. `validateChequeNumber`
                   already carries the honest message ("should contain digits
                   only"), which the stripping made unreachable. Keep what was
                   typed and let the rule explain itself. */
                value={form.chequeNumber} onChange={(e) => { set("chequeNumber", e.target.value); touch("chequeNumber") }}
                onBlur={() => touch("chequeNumber")} placeholder="4–20 digits" autoFocus {...fieldAria("pdc-num", shown.chequeNumber)} />
              <FieldError id="pdc-num" message={shown.chequeNumber} />
            </Field>
            <Field label="Bank">
              <input id="pdc-bank" className={cn(inputCls, shown.bankName && ERROR_INPUT_CLS)} maxLength={100}
                value={form.bankName} onChange={(e) => { set("bankName", e.target.value); touch("bankName") }}
                onBlur={() => touch("bankName")} placeholder="e.g. Meezan, HBL" {...fieldAria("pdc-bank", shown.bankName)} />
              <FieldError id="pdc-bank" message={shown.bankName} />
            </Field>
            <Field label="Amount (Rs)">
              <input id="pdc-amt" type="number" min={0} step="0.01" inputMode="decimal"
                className={cn(inputCls, "tabular-nums", shown.amount && ERROR_INPUT_CLS)}
                value={form.amount} onChange={(e) => { set("amount", e.target.value); touch("amount") }}
                onBlur={() => touch("amount")} {...fieldAria("pdc-amt", shown.amount)} />
              <FieldError id="pdc-amt" message={shown.amount} />
            </Field>
            <Field label="Cheque date">
              <input id="pdc-date" type="date" className={cn(inputCls, shown.chequeDate && ERROR_INPUT_CLS)}
                value={form.chequeDate} onChange={(e) => { set("chequeDate", e.target.value); touch("chequeDate") }}
                onBlur={() => touch("chequeDate")} {...fieldAria("pdc-date", shown.chequeDate)} />
              <FieldError id="pdc-date" message={shown.chequeDate} />
            </Field>
            <Field label="Branch code"><input className={inputCls} value={form.branchCode} onChange={(e) => set("branchCode", e.target.value)} /></Field>
          </div>
          {!isEdit && (
            <Field label="Linked booking (registered customer)">
              <select className={inputCls} value={form.bookingId} onChange={(e) => set("bookingId", e.target.value)}>
                <option value="">Select a booking…</option>
                {(bookings ?? []).map((b) => <option key={b.id} value={b.id}>{b.customerName}{b.bookingDate ? ` · ${b.bookingDate.slice(0, 10)}` : ""}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground">A cheque must be tied to a booking whose customer has a registered account.</p>
            </Field>
          )}
          {/**
            * WWL-164 (WWL-117's second recurrence) — `errs.notes` gated `canSave` while this field
            * rendered no FieldError and never called `touch("notes")`, so the
            * message could never appear. At 1001 characters Save went dead and
            * the hint named a different field entirely. No maxLength either, so
            * nothing stopped the paste that caused it.
            */}
          <Field label="Notes">
            <textarea
              id="pdc-notes"
              className={cn(inputCls, "h-20 resize-y py-2", shown.notes && ERROR_INPUT_CLS)}
              value={form.notes}
              maxLength={NOTES_MAX}
              onChange={(e) => { set("notes", e.target.value); touch("notes") }}
              onBlur={() => touch("notes")}
              {...fieldAria("pdc-notes", shown.notes)}
            />
            <div className="flex items-start justify-between gap-2">
              <FieldError id="pdc-notes" message={shown.notes} />
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
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Log cheque"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Status transition ───────────────────────────────────────────
const NEXT: Record<string, PdcStatus[]> = {
  held: ["deposited", "cancelled"],
  deposited: ["cleared", "bounced"],
  cleared: [], bounced: [], cancelled: [],
}
export function PdcTransitionDialog({ open, onOpenChange, pdc, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; pdc?: PostDatedCheque; onSaved?: () => void }) {
  const options = pdc ? (NEXT[pdc.status] ?? []) : []
  const [to, setTo] = React.useState<PdcStatus>("deposited")
  const [depositDate, setDepositDate] = React.useState(today())
  const [bounceReason, setBounceReason] = React.useState("")
  const loaded = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (open && pdc && loaded.current !== pdc.id) { loaded.current = pdc.id; setTo((NEXT[pdc.status] ?? ["deposited"])[0] ?? "deposited"); setDepositDate(today()); setBounceReason("") }
    if (!open) loaded.current = null
  }, [open, pdc])
  const mut = useMutation({
    mutationFn: () => PdcAPI.transition(pdc!.id, { to, depositDate: to === "deposited" ? depositDate : undefined, bounceReason: to === "bounced" ? bounceReason.trim() : undefined }),
    // WWL-174 — this interpolated the raw enum, so the toast read "Cheque
    // marked deposited" while every pill, filter and column in the module reads
    // "Deposited (awaiting clearance)". The canonical map already existed.
    onSuccess: () => { showSuccessToast(`Cheque marked ${PDC_STATUS_LABELS[to] ?? to}`); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't update cheque")),
  })
  const depositErr = to === "deposited" ? validateNotFutureDate(depositDate, { label: "Deposit date" }) : undefined
  /**
   * WWL-166 — this checked `options.length > 0` but never `options.includes(to)`,
   * so it only asked "does this cheque have ANY legal next status", not "is the
   * one selected legal". The initial `to` is "deposited" before the effect
   * seeds it, so a cheque whose only legal move is elsewhere could be submitted
   * with a transition the server would refuse.
   */
  const targetAllowed = !!pdc && options.includes(to)
  const canSave = !!pdc && targetAllowed && !depositErr && (to !== "bounced" || bounceReason.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Update cheque status</DialogTitle><DialogDescription>{pdc ? `Cheque ${pdc.chequeNumber} — currently ${pdc.status}.` : ""}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          {options.length === 0 ? (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">This cheque is {pdc?.status} — no further status changes.</div>
          ) : (
            <>
              <Field label="Mark as">
                <select className={inputCls} value={to} onChange={(e) => setTo(e.target.value as PdcStatus)}>
                  {options.map((o) => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
                </select>
              </Field>
              {to === "deposited" && (
                <Field label="Deposit date">
                  {/* A cheque cannot have been banked tomorrow — unlike the
                      cheque date above, this one IS bounded to today. */}
                  <input id="pdc-dep" type="date" max={todayInKarachi()}
                    className={cn(inputCls, depositErr && ERROR_INPUT_CLS)} value={depositDate}
                    onChange={(e) => setDepositDate(e.target.value)} {...fieldAria("pdc-dep", depositErr)} />
                  <FieldError id="pdc-dep" message={depositErr} />
                </Field>
              )}
              {to === "bounced" && <Field label="Bounce reason"><input className={inputCls} value={bounceReason} onChange={(e) => setBounceReason(e.target.value)} placeholder="e.g. Insufficient funds" /></Field>}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Update status</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
