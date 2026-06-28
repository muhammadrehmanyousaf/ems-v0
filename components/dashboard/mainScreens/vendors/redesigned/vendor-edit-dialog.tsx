"use client"

/**
 * Vendor edit dialog (redesigned, admin). Functional parity for the redesigned
 * Vendors screen — mirrors the original edit-vendor-dialog 1:1: PATCH
 * /api/v1/users?id= with name/email/phone. Vendors have no create path (they
 * self-register), so this is edit-only.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import axiosInstance from "@/lib/axiosConfig"
import { type ApiUser } from "@/lib/api/dashboard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className={labelCls}>{label}</label>{children}</div>
}

export function VendorEditDialog({
  open, onOpenChange, vendor, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  vendor?: ApiUser
  onSaved?: () => void
}) {
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phoneNumber, setPhoneNumber] = React.useState("")
  React.useEffect(() => {
    if (open && vendor) { setFullName(vendor.fullName ?? ""); setEmail(vendor.email ?? ""); setPhoneNumber(vendor.phoneNumber ?? "") }
  }, [open, vendor])

  const saveMut = useMutation({
    mutationFn: () => axiosInstance.patch(`/api/v1/users?id=${vendor!.id}`, {
      fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(),
    }),
    onSuccess: () => { showSuccessToast("Vendor updated"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't update vendor"),
  })
  const canSave = fullName.trim() && email.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit vendor</DialogTitle><DialogDescription>Update this vendor's contact details.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Full name"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus /></Field>
          <Field label="Email"><input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><input className={inputCls} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="03001234567" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save changes</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default VendorEditDialog
