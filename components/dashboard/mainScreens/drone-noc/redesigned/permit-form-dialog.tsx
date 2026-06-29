"use client"

/**
 * Drone-NOC permit create/edit dialog (redesigned) — functional parity for the
 * redesigned Drone NOC screen. Wired to DroneNocAPI.create/update. Follows the
 * Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { DroneNocAPI, PERMIT_TYPE_LABELS, PERMIT_AUTHORITY_LABELS, type DroneNOC, type PermitType, type IssuingAuthority } from "@/lib/api/droneNoc"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const TYPES = Object.keys(PERMIT_TYPE_LABELS) as PermitType[]
const AUTHORITIES = Object.keys(PERMIT_AUTHORITY_LABELS) as IssuingAuthority[]
const today = () => new Date().toISOString().slice(0, 10)
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState {
  referenceNumber: string; permitType: PermitType; issuingAuthority: IssuingAuthority
  droneModel: string; droneRegNumber: string; pilotName: string; pilotLicense: string
  eventDescription: string; venueAddress: string; validFrom: string; validUntil: string; feePaid: string; notes: string
}
const blank = (p?: DroneNOC): FormState => ({
  referenceNumber: p?.referenceNumber ?? "",
  permitType: (p?.permitType as PermitType) ?? TYPES[0],
  issuingAuthority: (p?.issuingAuthority as IssuingAuthority) ?? AUTHORITIES[0],
  droneModel: p?.droneModel ?? "", droneRegNumber: p?.droneRegNumber ?? "",
  pilotName: p?.pilotName ?? "", pilotLicense: p?.pilotLicense ?? "",
  eventDescription: p?.eventDescription ?? "", venueAddress: p?.venueAddress ?? "",
  validFrom: (p?.validFrom ?? today()).slice(0, 10), validUntil: (p?.validUntil ?? "").slice(0, 10),
  feePaid: p?.feePaid != null ? String(p.feePaid) : "", notes: p?.notes ?? "",
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function PermitFormDialog({
  open, onOpenChange, permit, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  permit?: DroneNOC
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!permit
  const [form, setForm] = React.useState<FormState>(blank(permit))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = permit?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(permit)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, permit])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: permit?.businessId ?? businessId!,
        referenceNumber: form.referenceNumber.trim(),
        permitType: form.permitType,
        issuingAuthority: form.issuingAuthority,
        droneModel: form.droneModel.trim() || undefined,
        droneRegNumber: form.droneRegNumber.trim() || undefined,
        pilotName: form.pilotName.trim() || undefined,
        pilotLicense: form.pilotLicense.trim() || undefined,
        eventDescription: form.eventDescription.trim() || undefined,
        venueAddress: form.venueAddress.trim() || undefined,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        feePaid: form.feePaid.trim() === "" ? undefined : Number(form.feePaid) || 0,
        notes: form.notes.trim() || undefined,
      }
      return isEdit ? DroneNocAPI.update(permit!.id, body) : DroneNocAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Permit updated" : "Permit added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save permit"),
  })
  const canSave = form.referenceNumber.trim() && form.validFrom && form.validUntil && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit permit" : "Add drone permit / NOC"}</DialogTitle>
          <DialogDescription>Track your drone permit, validity and pilot.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Reference number"><input className={inputCls} value={form.referenceNumber} onChange={(e) => set("referenceNumber", e.target.value)} autoFocus /></Field>
            <Field label="Permit type">
              <select className={inputCls} value={form.permitType} onChange={(e) => set("permitType", e.target.value as PermitType)}>
                {TYPES.map((t) => <option key={t} value={t}>{PERMIT_TYPE_LABELS[t]}</option>)}
              </select>
            </Field>
            <Field label="Issuing authority" className="sm:col-span-2">
              <select className={inputCls} value={form.issuingAuthority} onChange={(e) => set("issuingAuthority", e.target.value as IssuingAuthority)}>
                {AUTHORITIES.map((a) => <option key={a} value={a}>{PERMIT_AUTHORITY_LABELS[a]}</option>)}
              </select>
            </Field>
            <Field label="Valid from"><input type="date" className={inputCls} value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></Field>
            <Field label="Valid until"><input type="date" className={inputCls} value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></Field>
            <Field label="Drone model"><input className={inputCls} value={form.droneModel} onChange={(e) => set("droneModel", e.target.value)} placeholder="e.g. DJI Mavic 3" /></Field>
            <Field label="Drone reg #"><input className={inputCls} value={form.droneRegNumber} onChange={(e) => set("droneRegNumber", e.target.value)} /></Field>
            <Field label="Pilot name"><input className={inputCls} value={form.pilotName} onChange={(e) => set("pilotName", e.target.value)} /></Field>
            <Field label="Pilot license"><input className={inputCls} value={form.pilotLicense} onChange={(e) => set("pilotLicense", e.target.value)} /></Field>
            <Field label="Fee paid (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.feePaid} onChange={(e) => set("feePaid", e.target.value)} /></Field>
            <Field label="Venue / area"><input className={inputCls} value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} /></Field>
          </div>
          <Field label="Event / notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.eventDescription} onChange={(e) => set("eventDescription", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save permit"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PermitFormDialog
