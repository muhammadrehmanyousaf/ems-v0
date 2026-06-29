"use client"

/**
 * Staff member create/edit dialog (redesigned) — functional parity for the
 * redesigned Staff screen. Wired to StaffAPI.createMember/updateMember. Follows
 * the Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { StaffAPI, type StaffMember, type StaffRole, type EmploymentType } from "@/lib/api/staff"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ROLES: StaffRole[] = ["waiter", "cook_helper", "lead_cook", "cleaner", "parking_valet", "dhol_player", "qari", "imam", "decorator", "florist", "lighting_tech", "security", "driver", "photographer", "videographer", "manager", "bagpiper", "stage_host", "dj", "sound_tech", "other"]
const EMPLOYMENT: EmploymentType[] = ["permanent_monthly", "casual_dihari", "contract"]
const lbl = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

interface FormState {
  fullName: string; role: StaffRole; employmentType: EmploymentType; phoneNumber: string; whatsappNumber: string; nicNumber: string
  defaultDihariRate: string; monthlySalary: string; bankName: string; bankAccountNumber: string; jazzcashNumber: string; easypaisaNumber: string
  emergencyContactName: string; emergencyContactPhone: string; joinedDate: string; notes: string; isActive: boolean
}
const blank = (s?: StaffMember): FormState => ({
  fullName: s?.fullName ?? "", role: (s?.role as StaffRole) ?? "waiter", employmentType: (s?.employmentType as EmploymentType) ?? "casual_dihari",
  phoneNumber: s?.phoneNumber ?? "", whatsappNumber: s?.whatsappNumber ?? "", nicNumber: s?.nicNumber ?? "",
  defaultDihariRate: s?.defaultDihariRate != null ? String(s.defaultDihariRate) : "", monthlySalary: s?.monthlySalary != null ? String(s.monthlySalary) : "",
  bankName: s?.bankName ?? "", bankAccountNumber: s?.bankAccountNumber ?? "", jazzcashNumber: s?.jazzcashNumber ?? "", easypaisaNumber: s?.easypaisaNumber ?? "",
  emergencyContactName: s?.emergencyContactName ?? "", emergencyContactPhone: s?.emergencyContactPhone ?? "",
  joinedDate: (s?.joinedDate ?? "").slice(0, 10), notes: s?.notes ?? "", isActive: s?.isActive ?? true,
})

export function StaffFormDialog({
  open, onOpenChange, member, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  member?: StaffMember
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!member
  const [form, setForm] = React.useState<FormState>(blank(member))
  const loaded = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const k = member?.id ?? "new"; if (loaded.current !== k) { setForm(blank(member)); loaded.current = k } } else { loaded.current = null }
  }, [open, member])
  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: member?.businessId ?? businessId!,
        fullName: form.fullName.trim(),
        role: form.role, employmentType: form.employmentType,
        phoneNumber: form.phoneNumber.trim() || undefined,
        whatsappNumber: form.whatsappNumber.trim() || undefined,
        nicNumber: form.nicNumber.trim() || undefined,
        defaultDihariRate: numOrU(form.defaultDihariRate),
        monthlySalary: numOrU(form.monthlySalary),
        bankName: form.bankName.trim() || undefined,
        bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        jazzcashNumber: form.jazzcashNumber.trim() || undefined,
        easypaisaNumber: form.easypaisaNumber.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
        joinedDate: form.joinedDate || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      }
      return isEdit ? StaffAPI.updateMember(member!.id, body) : StaffAPI.createMember(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Staff updated" : "Staff added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save staff member"),
  })
  const canSave = form.fullName.trim() && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit staff member" : "Add staff member"}</DialogTitle><DialogDescription>Team member details, pay and payout.</DialogDescription></DialogHeader>
        <div className="space-y-5 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoFocus /></Field>
            <Field label="Role">
              <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value as StaffRole)}>{ROLES.map((r) => <option key={r} value={r}>{lbl(r)}</option>)}</select>
            </Field>
            <Field label="Employment">
              <select className={inputCls} value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>{EMPLOYMENT.map((r) => <option key={r} value={r}>{lbl(r)}</option>)}</select>
            </Field>
            <Field label="Joined date"><input type="date" className={inputCls} value={form.joinedDate} onChange={(e) => set("joinedDate", e.target.value)} /></Field>
            <Field label="Phone"><input className={inputCls} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
            <Field label="WhatsApp"><input className={inputCls} value={form.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} /></Field>
            <Field label="CNIC"><input className={inputCls} value={form.nicNumber} onChange={(e) => set("nicNumber", e.target.value)} /></Field>
            <Field label="Dihari rate (Rs/day)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.defaultDihariRate} onChange={(e) => set("defaultDihariRate", e.target.value)} /></Field>
            <Field label="Monthly salary (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.monthlySalary} onChange={(e) => set("monthlySalary", e.target.value)} /></Field>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Payout & emergency</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank name"><input className={inputCls} value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></Field>
              <Field label="Bank account #"><input className={inputCls} value={form.bankAccountNumber} onChange={(e) => set("bankAccountNumber", e.target.value)} /></Field>
              <Field label="JazzCash"><input className={inputCls} value={form.jazzcashNumber} onChange={(e) => set("jazzcashNumber", e.target.value)} /></Field>
              <Field label="Easypaisa"><input className={inputCls} value={form.easypaisaNumber} onChange={(e) => set("easypaisaNumber", e.target.value)} /></Field>
              <Field label="Emergency contact"><input className={inputCls} value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} /></Field>
              <Field label="Emergency phone"><input className={inputCls} value={form.emergencyContactPhone} onChange={(e) => set("emergencyContactPhone", e.target.value)} /></Field>
            </div>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save staff"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StaffFormDialog
