"use client"

/**
 * Supplier create/edit dialog (redesigned design system) — the FUNCTIONAL-PARITY
 * piece for the redesigned Suppliers screen. Wired to SupplierAPI.create/update
 * (the same endpoints the original screen uses). Reference implementation for
 * bringing read-only redesigned list screens up to create/edit parity ahead of
 * cutover. Props mirror a controlled dialog: { open, onOpenChange, supplier?,
 * businessId, onSaved }.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { SupplierAPI, type Supplier, type SupplierCategory } from "@/lib/api/suppliers"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES: SupplierCategory[] = [
  "meat", "produce", "atta_grains", "dairy", "oil_ghee", "spices", "frozen_seafood", "bakery_sweets",
  "flowers", "decor_materials", "linen_uniforms", "equipment_rental", "generator_rental", "vehicle_rental",
  "brokerage", "utilities", "transport_fuel", "stationery", "professional_services", "other",
]
const catLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState {
  name: string; category: SupplierCategory; contactPerson: string; phoneNumber: string; whatsappNumber: string
  address: string; creditLimit: string; defaultPaymentTermsDays: string
  bankName: string; bankAccountNumber: string; jazzcashNumber: string; easypaisaNumber: string; raastId: string
  ntn: string; strn: string; notes: string; isActive: boolean
}
const blank = (s?: Supplier): FormState => ({
  name: s?.name ?? "", category: (s?.category as SupplierCategory) ?? "meat",
  contactPerson: s?.contactPerson ?? "", phoneNumber: s?.phoneNumber ?? "", whatsappNumber: s?.whatsappNumber ?? "",
  address: s?.address ?? "", creditLimit: s?.creditLimit != null ? String(s.creditLimit) : "", defaultPaymentTermsDays: String(s?.defaultPaymentTermsDays ?? 0),
  bankName: s?.bankName ?? "", bankAccountNumber: s?.bankAccountNumber ?? "", jazzcashNumber: s?.jazzcashNumber ?? "",
  easypaisaNumber: s?.easypaisaNumber ?? "", raastId: s?.raastId ?? "", ntn: s?.ntn ?? "", strn: s?.strn ?? "",
  notes: s?.notes ?? "", isActive: s?.isActive ?? true,
})

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}

export function SupplierFormDialog({
  open, onOpenChange, supplier, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  supplier?: Supplier
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!supplier
  const [form, setForm] = React.useState<FormState>(blank(supplier))
  const loadedId = React.useRef<number | "new" | null>(null)

  // Reset the form whenever the dialog opens for a different target.
  React.useEffect(() => {
    if (open) {
      const key = supplier?.id ?? "new"
      if (loadedId.current !== key) { setForm(blank(supplier)); loadedId.current = key }
    } else {
      loadedId.current = null
    }
  }, [open, supplier])

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: supplier?.businessId ?? businessId!,
        name: form.name.trim(),
        category: form.category,
        contactPerson: form.contactPerson.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        whatsappNumber: form.whatsappNumber.trim() || undefined,
        address: form.address.trim() || undefined,
        creditLimit: form.creditLimit.trim() === "" ? undefined : Number(form.creditLimit) || 0,
        defaultPaymentTermsDays: Number(form.defaultPaymentTermsDays) || 0,
        bankName: form.bankName.trim() || undefined,
        bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        jazzcashNumber: form.jazzcashNumber.trim() || undefined,
        easypaisaNumber: form.easypaisaNumber.trim() || undefined,
        raastId: form.raastId.trim() || undefined,
        ntn: form.ntn.trim() || undefined,
        strn: form.strn.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      }
      return isEdit ? SupplierAPI.update(supplier!.id, body) : SupplierAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Supplier updated" : "Supplier added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save supplier"),
  })

  const canSave = form.name.trim() && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit supplier" : "Add supplier"}</DialogTitle>
          <DialogDescription>Your vendor's details, payment terms and payout methods.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Supplier / company name" /></Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as SupplierCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
            </Field>
            <Field label="Contact person"><input className={inputCls} value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
            <Field label="WhatsApp"><input className={inputCls} value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} /></Field>
            <Field label="Address"><input className={inputCls} value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Credit limit (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.creditLimit} onChange={(e) => set("creditLimit", e.target.value)} /></Field>
            <Field label="Payment terms (days)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.defaultPaymentTermsDays} onChange={(e) => set("defaultPaymentTermsDays", e.target.value)} /></Field>
          </div>

          <div className="rounded-lg border border-border/70 p-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Payout methods</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank name"><input className={inputCls} value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></Field>
              <Field label="Bank account #"><input className={inputCls} value={form.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} /></Field>
              <Field label="JazzCash"><input className={inputCls} value={form.jazzcashNumber} onChange={(e) => set("jazzcashNumber", e.target.value)} /></Field>
              <Field label="Easypaisa"><input className={inputCls} value={form.easypaisaNumber} onChange={(e) => set("easypaisaNumber", e.target.value)} /></Field>
              <Field label="Raast ID"><input className={inputCls} value={form.raastId} onChange={(e) => set("raastId", e.target.value)} /></Field>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="NTN"><input className={inputCls} value={form.ntn} onChange={(e) => set("ntn", e.target.value)} /></Field>
            <Field label="STRN"><input className={inputCls} value={form.strn} onChange={(e) => set("strn", e.target.value)} /></Field>
          </div>

          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active supplier</label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update supplier" : "Save supplier"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SupplierFormDialog
