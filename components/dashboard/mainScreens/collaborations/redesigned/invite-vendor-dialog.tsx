"use client"

/**
 * Invite-vendor dialog (redesigned) — functional parity for the redesigned
 * Collaborations screen. Wired to CollaborationsAPI.send (invite another vendor
 * by phone/email for a shared job). Accept/decline of incoming invites are wired
 * as row actions in the view.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { CollaborationsAPI } from "@/lib/api/collaborations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function InviteVendorDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [toName, setToName] = React.useState("")
  const [toPhone, setToPhone] = React.useState("")
  const [toEmail, setToEmail] = React.useState("")
  const [eventLabel, setEventLabel] = React.useState("")
  const [scope, setScope] = React.useState("")
  const [agreedAmount, setAgreedAmount] = React.useState("")
  React.useEffect(() => { if (open) { setToName(""); setToPhone(""); setToEmail(""); setEventLabel(""); setScope(""); setAgreedAmount("") } }, [open])

  const saveMut = useMutation({
    mutationFn: () => CollaborationsAPI.send({
      toName: toName.trim() || undefined,
      toPhone: toPhone.trim() || undefined,
      toEmail: toEmail.trim() || undefined,
      eventLabel: eventLabel.trim() || undefined,
      scope: scope.trim() || undefined,
      agreedAmount: agreedAmount.trim() === "" ? undefined : Number(agreedAmount) || 0,
    }),
    onSuccess: (res: any) => { showSuccessToast(res?.matched ? "Invite sent — vendor matched!" : "Invite sent"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't send invite"),
  })
  const canSave = toName.trim() && (toPhone.trim() || toEmail.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Invite a vendor</DialogTitle><DialogDescription>Bring another vendor onto a job. They'll get an invite to accept.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Vendor name"><input className={inputCls} value={toName} onChange={(e) => setToName(e.target.value)} autoFocus /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone"><input className={inputCls} value={toPhone} onChange={(e) => setToPhone(e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
            <Field label="Email"><input className={inputCls} value={toEmail} onChange={(e) => setToEmail(e.target.value)} /></Field>
          </div>
          <Field label="Event / job"><input className={inputCls} value={eventLabel} onChange={(e) => setEventLabel(e.target.value)} placeholder="e.g. Ahmed & Fatima walima" /></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Scope"><input className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="e.g. Drone coverage" /></Field>
            <Field label="Agreed amount (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={agreedAmount} onChange={(e) => setAgreedAmount(e.target.value)} /></Field>
          </div>
          <p className="text-[11px] text-muted-foreground">Provide a phone or email so we can match the vendor.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Sending…</> : <><Icon name="Send" size={15} className="mr-1.5" /> Send invite</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InviteVendorDialog
