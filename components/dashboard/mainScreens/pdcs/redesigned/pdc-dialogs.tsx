"use client"

/**
 * Cheque (PDC) dialogs (redesigned) — functional parity for the redesigned Cheque
 * ledger. PdcFormDialog → PdcAPI.create/update (content). PdcTransitionDialog →
 * PdcAPI.transition (the enforced lifecycle held→deposited→cleared/bounced;
 * deposit needs a date, bounce needs a reason). Follows the Suppliers recipe.
 */

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { PdcAPI, type PostDatedCheque, type PdcStatus } from "@/lib/api/postDatedCheques"
import axiosInstance from "@/lib/axiosConfig"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const today = () => new Date().toISOString().slice(0, 10)
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

// ─── Create / edit ───────────────────────────────────────────────
interface BookingOption { id: number; customerName: string; bookingDate: string }
interface FormState { chequeNumber: string; bankName: string; branchCode: string; amount: string; chequeDate: string; bookingId: string; notes: string }
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
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save cheque"),
  })
  const canSave = form.chequeNumber.trim() && form.bankName.trim() && Number(form.amount) > 0 && form.chequeDate && (isEdit || !!form.bookingId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit cheque" : "Log a cheque"}</DialogTitle><DialogDescription>A post-dated cheque in your ledger.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cheque number"><input className={inputCls} inputMode="numeric" value={form.chequeNumber} onChange={(e) => set("chequeNumber", e.target.value.replace(/\D/g, ""))} placeholder="4–20 digits" autoFocus /></Field>
            <Field label="Bank"><input className={inputCls} value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="e.g. Meezan, HBL" /></Field>
            <Field label="Amount (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.amount} onChange={(e) => set("amount", e.target.value)} /></Field>
            <Field label="Cheque date"><input type="date" className={inputCls} value={form.chequeDate} onChange={(e) => set("chequeDate", e.target.value)} /></Field>
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
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
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
    onSuccess: () => { showSuccessToast(`Cheque marked ${to}`); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't update cheque"),
  })
  const canSave = !!pdc && options.length > 0 && (to !== "bounced" || bounceReason.trim().length > 0)

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
              {to === "deposited" && <Field label="Deposit date"><input type="date" className={inputCls} value={depositDate} onChange={(e) => setDepositDate(e.target.value)} /></Field>}
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
