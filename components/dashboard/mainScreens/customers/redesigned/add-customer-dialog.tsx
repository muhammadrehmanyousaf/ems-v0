"use client"

/**
 * Add-customer dialog (redesigned) — functional parity for the redesigned
 * Customers screen. Customers are otherwise DERIVED from bookings (read-only
 * analytics list); the one create action adds an offline-customer roster entry
 * via POST /api/v1/offlineCustomers. Name, phone and address are required.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import axiosInstance from "@/lib/axiosConfig"
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

export function AddCustomerDialog({
  open, onOpenChange, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: () => void
}) {
  const [name, setName] = React.useState("")
  const [phoneno, setPhoneno] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [email, setEmail] = React.useState("")
  React.useEffect(() => { if (open) { setName(""); setPhoneno(""); setAddress(""); setEmail("") } }, [open])

  const saveMut = useMutation({
    mutationFn: () => axiosInstance.post("/api/v1/offlineCustomers", { name: name.trim(), phoneno: phoneno.trim(), address: address.trim(), email: email.trim() || undefined }),
    onSuccess: () => { showSuccessToast("Customer added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't add customer"),
  })
  const canSave = name.trim() && phoneno.trim() && address.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add customer</DialogTitle><DialogDescription>Add a customer to your roster (most appear automatically from bookings).</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <Field label="Name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
          <Field label="Phone"><input className={inputCls} value={phoneno} onChange={(e) => setPhoneno(e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
          <Field label="Address"><input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City / area" /></Field>
          <Field label="Email (optional)"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save customer</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddCustomerDialog
