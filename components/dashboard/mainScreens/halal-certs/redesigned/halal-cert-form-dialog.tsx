"use client"

/**
 * Halal certificate create/edit dialog (redesigned) — functional parity for the
 * redesigned Halal certs screen. Wired to HalalCertAPI.create/update. Follows the
 * Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { HalalCertAPI, ISSUING_AUTHORITY_LABELS, type HalalCert, type IssuingAuthority } from "@/lib/api/halalCerts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const AUTHORITIES = Object.keys(ISSUING_AUTHORITY_LABELS) as IssuingAuthority[]
const today = () => new Date().toISOString().slice(0, 10)
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState { certNumber: string; itemDescription: string; issuingAuthority: IssuingAuthority; supplierNameSnapshot: string; issuedDate: string; expiryDate: string; renewalLeadTimeDays: string; notes: string }
const blank = (c?: HalalCert): FormState => ({
  certNumber: c?.certNumber ?? "",
  itemDescription: c?.itemDescription ?? "",
  issuingAuthority: (c?.issuingAuthority as IssuingAuthority) ?? AUTHORITIES[0],
  supplierNameSnapshot: c?.supplierNameSnapshot ?? c?.supplier?.name ?? "",
  issuedDate: (c?.issuedDate ?? today()).slice(0, 10),
  expiryDate: (c?.expiryDate ?? "").slice(0, 10),
  renewalLeadTimeDays: c?.renewalLeadTimeDays != null ? String(c.renewalLeadTimeDays) : "",
  notes: c?.notes ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function HalalCertFormDialog({
  open, onOpenChange, cert, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  cert?: HalalCert
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!cert
  const [form, setForm] = React.useState<FormState>(blank(cert))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = cert?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(cert)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, cert])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: cert?.businessId ?? businessId!,
        certNumber: form.certNumber.trim(),
        itemDescription: form.itemDescription.trim(),
        issuingAuthority: form.issuingAuthority,
        supplierNameSnapshot: form.supplierNameSnapshot.trim() || undefined,
        issuedDate: form.issuedDate,
        expiryDate: form.expiryDate,
        renewalLeadTimeDays: form.renewalLeadTimeDays.trim() === "" ? undefined : Number(form.renewalLeadTimeDays) || 0,
        notes: form.notes.trim() || undefined,
      }
      return isEdit ? HalalCertAPI.update(cert!.id, body) : HalalCertAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Certificate updated" : "Certificate added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save certificate"),
  })
  const canSave = form.certNumber.trim() && form.itemDescription.trim() && form.issuedDate && form.expiryDate && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit certificate" : "Add halal certificate"}</DialogTitle>
          <DialogDescription>Track halal certification and its expiry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Certificate number"><input className={inputCls} value={form.certNumber} onChange={(e) => set("certNumber", e.target.value)} autoFocus /></Field>
            <Field label="Issuing authority">
              <select className={inputCls} value={form.issuingAuthority} onChange={(e) => set("issuingAuthority", e.target.value as IssuingAuthority)}>
                {AUTHORITIES.map((a) => <option key={a} value={a}>{ISSUING_AUTHORITY_LABELS[a]}</option>)}
              </select>
            </Field>
          </div>
          <Field label="What it covers"><input className={inputCls} value={form.itemDescription} onChange={(e) => set("itemDescription", e.target.value)} placeholder="e.g. Beef & mutton supply" /></Field>
          <Field label="Supplier"><input className={inputCls} value={form.supplierNameSnapshot} onChange={(e) => set("supplierNameSnapshot", e.target.value)} /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Issued"><input type="date" className={inputCls} value={form.issuedDate} onChange={(e) => set("issuedDate", e.target.value)} /></Field>
            <Field label="Expires"><input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></Field>
            <Field label="Renewal lead (days)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.renewalLeadTimeDays} onChange={(e) => set("renewalLeadTimeDays", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save certificate"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HalalCertFormDialog
