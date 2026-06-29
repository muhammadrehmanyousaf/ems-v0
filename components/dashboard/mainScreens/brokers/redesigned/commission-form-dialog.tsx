"use client"

/**
 * Broker-commission create/edit dialog (redesigned) — functional parity for the
 * redesigned Brokers screen (which lists commission accruals). Wired to
 * BrokerAPI.createCommission/updateCommission. Broker is captured as a snapshot
 * name + type (brokerId optional). Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { BrokerAPI, BROKER_TYPE_LABELS, type BrokerCommission, type BrokerType, type CommissionType } from "@/lib/api/brokers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const BROKER_TYPES = Object.keys(BROKER_TYPE_LABELS) as BrokerType[]
const today = () => new Date().toISOString().slice(0, 10)
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState {
  brokerNameSnapshot: string; brokerTypeSnapshot: BrokerType; commissionType: CommissionType
  commissionPct: string; commissionFlat: string; bookingAmountSnapshot: string
  accruedDate: string; dueDate: string; description: string
}
const blank = (c?: BrokerCommission): FormState => ({
  brokerNameSnapshot: c?.brokerNameSnapshot ?? "",
  brokerTypeSnapshot: (c?.brokerTypeSnapshot as BrokerType) ?? BROKER_TYPES[0],
  commissionType: (c?.commissionType as CommissionType) ?? "percentage",
  commissionPct: c?.commissionPct != null ? String(c.commissionPct) : "",
  commissionFlat: c?.commissionFlat != null ? String(c.commissionFlat) : "",
  bookingAmountSnapshot: c?.bookingAmountSnapshot != null ? String(c.bookingAmountSnapshot) : "",
  accruedDate: (c?.accruedDate ?? today()).slice(0, 10),
  dueDate: (c?.dueDate ?? "").slice(0, 10),
  description: c?.description ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

export function CommissionFormDialog({
  open, onOpenChange, commission, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  commission?: BrokerCommission
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!commission
  const [form, setForm] = React.useState<FormState>(blank(commission))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = commission?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(commission)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, commission])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: commission?.businessId ?? businessId!,
        brokerNameSnapshot: form.brokerNameSnapshot.trim() || undefined,
        brokerTypeSnapshot: form.brokerTypeSnapshot,
        commissionType: form.commissionType,
        commissionPct: form.commissionType === "percentage" ? numOrU(form.commissionPct) : undefined,
        commissionFlat: form.commissionType === "flat" ? numOrU(form.commissionFlat) : undefined,
        bookingAmountSnapshot: numOrU(form.bookingAmountSnapshot),
        accruedDate: form.accruedDate,
        dueDate: form.dueDate || undefined,
        description: form.description.trim() || undefined,
      }
      return isEdit ? BrokerAPI.updateCommission(commission!.id, body) : BrokerAPI.createCommission(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Commission updated" : "Commission added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save commission"),
  })
  const amountOk = form.commissionType === "percentage"
    ? (Number(form.commissionPct) || 0) > 0 && (Number(form.bookingAmountSnapshot) || 0) > 0
    : (Number(form.commissionFlat) || 0) > 0
  const canSave = form.brokerNameSnapshot.trim() && form.accruedDate && amountOk && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit commission" : "Add broker commission"}</DialogTitle>
          <DialogDescription>A commission owed to a broker for a referral.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Broker name"><input className={inputCls} value={form.brokerNameSnapshot} onChange={(e) => set("brokerNameSnapshot", e.target.value)} autoFocus /></Field>
            <Field label="Broker type">
              <select className={inputCls} value={form.brokerTypeSnapshot} onChange={(e) => set("brokerTypeSnapshot", e.target.value as BrokerType)}>
                {BROKER_TYPES.map((t) => <option key={t} value={t}>{BROKER_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Commission type">
              <select className={inputCls} value={form.commissionType} onChange={(e) => set("commissionType", e.target.value as CommissionType)}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat amount</option>
              </select>
            </Field>
            {form.commissionType === "percentage"
              ? <Field label="Commission %"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.commissionPct} onChange={(e) => set("commissionPct", e.target.value)} placeholder="e.g. 5" /></Field>
              : <Field label="Commission (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.commissionFlat} onChange={(e) => set("commissionFlat", e.target.value)} /></Field>}
            <Field label={form.commissionType === "percentage" ? "Booking amount (Rs) — required" : "Booking amount (Rs)"}><input type="number" className={cn(inputCls, "tabular-nums")} value={form.bookingAmountSnapshot} onChange={(e) => set("bookingAmountSnapshot", e.target.value)} placeholder={form.commissionType === "percentage" ? "needed to compute %" : ""} /></Field>
            <Field label="Accrued date"><input type="date" className={inputCls} value={form.accruedDate} onChange={(e) => set("accruedDate", e.target.value)} /></Field>
            <Field label="Due date"><input type="date" className={inputCls} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
          </div>
          <Field label="Description"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What this commission is for" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save commission"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CommissionFormDialog
