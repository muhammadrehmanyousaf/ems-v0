"use client"

/**
 * Broker-commission money actions (redesigned) — restores the per-commission
 * Record payment / Dispute / Void actions that the original Brokers screen has.
 *
 * Built on the redesign primitives (Dialog, Button, Icon, Spinner) so they sit
 * inside the new shell, but wired to the SAME backend the original calls:
 *   - Record payment  → BrokerAPI.recordPayment   (POST /commissions/:id/payment)
 *   - Dispute / Void   → BrokerAPI.transitionCommission (POST /commissions/:id/transition)
 * Backend error messages are surfaced via toast.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import {
  BrokerAPI,
  COMMISSION_PAYMENT_METHOD_LABELS,
  type BrokerCommission,
  type CommissionPaymentMethod,
} from "@/lib/api/brokers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const PAYMENT_METHODS = Object.keys(COMMISSION_PAYMENT_METHOD_LABELS) as CommissionPaymentMethod[]
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const today = () => new Date().toISOString().slice(0, 10)
const errMsg = (e: any, fallback: string) => e?.response?.data?.message || e?.message || fallback

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

// ─── Record payment ──────────────────────────────────────────────────

export function RecordPaymentDialog({
  commission, onOpenChange, onSaved,
}: {
  commission: BrokerCommission | null
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const outstanding = commission ? Math.max(0, num(commission.commissionAmount) - num(commission.amountPaid)) : 0
  const [amount, setAmount] = React.useState("")
  const [method, setMethod] = React.useState<CommissionPaymentMethod>("cash")
  const [ref, setRef] = React.useState("")
  const [paymentDate, setPaymentDate] = React.useState(today())
  const loadedId = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (commission && loadedId.current !== commission.id) {
      const out = Math.max(0, num(commission.commissionAmount) - num(commission.amountPaid))
      setAmount(String(Math.round(out)))
      setMethod("cash")
      setRef("")
      setPaymentDate(today())
      loadedId.current = commission.id
    }
    if (!commission) loadedId.current = null
  }, [commission])

  const payMut = useMutation({
    mutationFn: () =>
      BrokerAPI.recordPayment(commission!.id, {
        amount: Number(amount),
        method,
        ref: ref.trim() || undefined,
        paymentDate: paymentDate || undefined,
      }),
    onSuccess: (res) => {
      if (res.result.newStatus === "paid") showSuccessToast("Commission fully paid")
      else showSuccessToast(`Payment recorded — outstanding ${formatPkr(res.result.newAmountOutstanding)}`)
      onSaved?.()
      onOpenChange(false)
    },
    onError: (e: any) => toast.error(errMsg(e, "Could not record payment")),
  })

  const canSave = !!commission && Number(amount) > 0

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record payment{commission ? ` — ${commission.brokerNameSnapshot}` : ""}</DialogTitle>
          <DialogDescription>
            {commission ? <>Outstanding <strong>{formatPkr(outstanding)}</strong> of {formatPkr(num(commission.commissionAmount))} total.</> : null}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount (Rs)">
              <input type="number" min={0} step="0.01" className={cn(inputCls, "tabular-nums")} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
            </Field>
            <Field label="Method">
              <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value as CommissionPaymentMethod)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{COMMISSION_PAYMENT_METHOD_LABELS[m]}</option>)}
              </select>
            </Field>
            <Field label="Reference">
              <input className={cn(inputCls, "font-mono")} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Txn id / cheque #" />
            </Field>
            <Field label="Payment date">
              <input type="date" className={inputCls} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || payMut.isPending} onClick={() => payMut.mutate()}>
            {payMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Recording…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Record</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Dispute ─────────────────────────────────────────────────────────

export function DisputeCommissionDialog({
  commission, onOpenChange, onSaved,
}: {
  commission: BrokerCommission | null
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [reason, setReason] = React.useState("")
  const loadedId = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (commission && loadedId.current !== commission.id) { setReason(commission.statusReason ?? ""); loadedId.current = commission.id }
    if (!commission) loadedId.current = null
  }, [commission])

  const mut = useMutation({
    mutationFn: () => BrokerAPI.transitionCommission(commission!.id, { to: "disputed", statusReason: reason.trim() }),
    onSuccess: () => { showSuccessToast("Moved to disputed"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errMsg(e, "Could not dispute")),
  })

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dispute{commission ? ` — ${commission.brokerNameSnapshot}` : ""}</DialogTitle>
          <DialogDescription>Capture what's wrong (broker disputes the rate, claims a different booking amount, etc.).</DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <Field label="Dispute reason">
            <textarea rows={4} className={cn(inputCls, "h-24 resize-y py-2")} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Broker disputes; says we agreed 15% not 12.5%" autoFocus />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!reason.trim() || mut.isPending} onClick={() => mut.mutate()}>
            {mut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="AlertTriangle" size={15} className="mr-1.5" /> Mark disputed</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Void ────────────────────────────────────────────────────────────

export function VoidCommissionDialog({
  commission, onOpenChange, onSaved,
}: {
  commission: BrokerCommission | null
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [reason, setReason] = React.useState("")
  const loadedId = React.useRef<number | null>(null)
  React.useEffect(() => {
    if (commission && loadedId.current !== commission.id) { setReason(""); loadedId.current = commission.id }
    if (!commission) loadedId.current = null
  }, [commission])

  const mut = useMutation({
    mutationFn: () => BrokerAPI.transitionCommission(commission!.id, { to: "void", statusReason: reason.trim() || undefined }),
    onSuccess: () => { showSuccessToast("Commission voided"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errMsg(e, "Could not void")),
  })

  return (
    <Dialog open={!!commission} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Void{commission ? ` — ${commission.brokerNameSnapshot}` : ""}</DialogTitle>
          <DialogDescription>Use for cancelled bookings or commissions never actually owed.</DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <Field label="Reason (optional)">
            <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" autoFocus />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={mut.isPending} onClick={() => mut.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {mut.isPending ? <><Spinner size={14} className="mr-1.5" /> Voiding…</> : <><Icon name="XCircle" size={15} className="mr-1.5" /> Void</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
