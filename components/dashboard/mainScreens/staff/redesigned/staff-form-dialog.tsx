"use client"

/**
 * Staff member create/edit dialog (redesigned) — functional parity for the
 * redesigned Staff screen. Wired to StaffAPI.createMember/updateMember. Follows
 * the Suppliers parity recipe.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation } from "@tanstack/react-query"
import { StaffAPI, type StaffMember, type StaffRole, type EmploymentType } from "@/lib/api/staff"
import { RecordVenueField } from "@/components/dashboard/shared/record-venue-field"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkPhone,
  validatePkCnic,
  validateAccountNumber,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"

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
    // Reset `touched` alongside the form — otherwise reopening the dialog for a
    // different member carries the previous one's touched flags across and the
    // fields are flagged red before this vendor has typed anything.
    if (open) { const k = member?.id ?? "new"; if (loaded.current !== k) { setForm(blank(member)); setTouched({}); loaded.current = k } } else { loaded.current = null }
  }, [open, member])
  /**
   * WWL-262 — a new hire was filed under `businesses?.[0]?.id`, so under
   * "All venues" a waiter landed on whichever venue happened to be first and
   * the vendor was never asked and never told. The venue is now part of the
   * form, and the record cannot be saved without one.
   */
  const [venueId, setVenueId] = React.useState<string>(businessId != null ? String(businessId) : "")
  const effectiveBusinessId = member?.businessId ?? (venueId ? Number(venueId) : businessId)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const set = (k: keyof FormState, v: string | boolean) => { setForm((f) => ({ ...f, [k]: v })); touch(String(k)) }

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: effectiveBusinessId!,
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
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save staff member")),
  })
  /*
   * Every field except the full name accepted anything at all.
   *
   * Verified live on production: phone "abc-not-phone", CNIC "not-a-cnic",
   * dihari rate -1500, monthly salary -90000 and emergency phone "!!!" were ALL
   * accepted — aria-invalid null on every one, no error rendered, and Save
   * unlocked the moment a name was typed. Same defect already fixed in the
   * public enquiry form, Capacity & pricing, the lead inbox and Inventory.
   *
   * This one lands on payroll rather than on a listing. A negative rate does
   * not sit still: the shift and payroll screens multiply it out, so one
   * staff member on -1500/day drags the whole payroll run and the Khata it
   * feeds. And an emergency contact that cannot be dialled is a safety gap on
   * a wedding floor, not merely untidy data — it is only ever read at the one
   * moment it has to work.
   *
   * `numOrU` above compounds it: Number("banana") || 0 silently becomes 0, so
   * junk in a pay field lands as a real zero rather than an error.
   *
   * Rates are allowed to be 0 (unpaid family help is genuinely common) but not
   * negative, and are ceilinged to catch a slipped digit.
   */
  const nonNeg = (v: string, label: string, max: number) => {
    const raw = String(v ?? "").trim()
    if (!raw) return undefined
    const n = Number(raw)
    if (!Number.isFinite(n)) return `${label} must be a number.`
    if (n < 0) return `${label} can't be negative.`
    if (n > max) return `${label} looks too large — please check the amount.`
    return undefined
  }
  const errs = {
    phoneNumber: validatePkPhone(form.phoneNumber, { label: "Phone", required: false }),
    whatsappNumber: validatePkPhone(form.whatsappNumber, { label: "WhatsApp", required: false }),
    nicNumber: validatePkCnic(form.nicNumber, { required: false }),
    defaultDihariRate: nonNeg(form.defaultDihariRate, "Dihari rate", 1_000_000),
    monthlySalary: nonNeg(form.monthlySalary, "Monthly salary", 10_000_000),
    bankAccountNumber: validateAccountNumber(form.bankAccountNumber, { required: false }),
    emergencyContactPhone: validatePkPhone(form.emergencyContactPhone, { label: "Emergency phone", required: false }),
    notes: validateOptionalText(form.notes, { label: "Notes", max: 2000 }),
  }
  // Errors only after a field is touched, so opening the dialog doesn't flag
  // the empty CNIC the vendor is about to type.
  const shown = Object.fromEntries(
    Object.entries(errs).map(([k, v]) => [k, touched[k] ? v : undefined]),
  ) as Record<string, string | undefined>

  const hasError = Object.values(errs).some(Boolean)
  const canSave = form.fullName.trim() && !hasError && (isEdit || effectiveBusinessId != null)

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave
    ? undefined
    : !form.fullName.trim()
      ? "Add a full name to save."
      : hasError
        ? "Fix the highlighted fields to save."
        : "This staff member needs a business before they can be saved."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit staff member" : "Add staff member"}</DialogTitle><DialogDescription>Team member details, pay and payout.</DialogDescription></DialogHeader>
        <div className="space-y-5 py-1">
          {/* WWL-262 — say which venue this hire is filed under, and ask when
              the vendor is on "All venues". */}
          {!isEdit && <RecordVenueField value={venueId} onChange={setVenueId} noun="staff member" />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className={inputCls} value={form.fullName} onChange={(e) => set("fullName", e.target.value)} autoFocus /></Field>
            <Field label="Role">
              <select className={inputCls} value={form.role} onChange={(e) => set("role", e.target.value as StaffRole)}>{ROLES.map((r) => <option key={r} value={r}>{lbl(r)}</option>)}</select>
            </Field>
            <Field label="Employment">
              <select className={inputCls} value={form.employmentType} onChange={(e) => set("employmentType", e.target.value as EmploymentType)}>{EMPLOYMENT.map((r) => <option key={r} value={r}>{lbl(r)}</option>)}</select>
            </Field>
            <Field label="Joined date"><input type="date" className={inputCls} value={form.joinedDate} onChange={(e) => set("joinedDate", e.target.value)} /></Field>
            <Field label="Phone">
              <input id="staff-phone" className={cn(inputCls, shown.phoneNumber && ERROR_INPUT_CLS)} value={form.phoneNumber}
                onChange={(e) => set("phoneNumber", e.target.value)} onBlur={() => touch("phoneNumber")}
                placeholder="03xx-xxxxxxx" inputMode="tel" {...fieldAria("staff-phone", shown.phoneNumber)} />
              <FieldError id="staff-phone" message={shown.phoneNumber} />
            </Field>
            <Field label="WhatsApp">
              <input id="staff-wa" className={cn(inputCls, shown.whatsappNumber && ERROR_INPUT_CLS)} value={form.whatsappNumber}
                onChange={(e) => set("whatsappNumber", e.target.value)} onBlur={() => touch("whatsappNumber")}
                placeholder="03xx-xxxxxxx" inputMode="tel" {...fieldAria("staff-wa", shown.whatsappNumber)} />
              <FieldError id="staff-wa" message={shown.whatsappNumber} />
            </Field>
            <Field label="CNIC">
              <input id="staff-cnic" className={cn(inputCls, shown.nicNumber && ERROR_INPUT_CLS)} value={form.nicNumber}
                onChange={(e) => set("nicNumber", e.target.value)} onBlur={() => touch("nicNumber")}
                placeholder="12345-1234567-1" inputMode="numeric" {...fieldAria("staff-cnic", shown.nicNumber)} />
              <FieldError id="staff-cnic" message={shown.nicNumber} />
            </Field>
            <Field label="Dihari rate (Rs/day)">
              <input id="staff-dihari" type="number" min={0} step="any" inputMode="decimal"
                className={cn(inputCls, "tabular-nums", shown.defaultDihariRate && ERROR_INPUT_CLS)}
                value={form.defaultDihariRate} onChange={(e) => set("defaultDihariRate", e.target.value)}
                {...fieldAria("staff-dihari", shown.defaultDihariRate)} />
              <FieldError id="staff-dihari" message={shown.defaultDihariRate} />
            </Field>
            <Field label="Monthly salary (Rs)">
              <input id="staff-salary" type="number" min={0} step="any" inputMode="decimal"
                className={cn(inputCls, "tabular-nums", shown.monthlySalary && ERROR_INPUT_CLS)}
                value={form.monthlySalary} onChange={(e) => set("monthlySalary", e.target.value)}
                {...fieldAria("staff-salary", shown.monthlySalary)} />
              <FieldError id="staff-salary" message={shown.monthlySalary} />
            </Field>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Payout & emergency</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Bank name"><input className={inputCls} value={form.bankName} onChange={(e) => set("bankName", e.target.value)} /></Field>
              <Field label="Bank account #">
                <input id="staff-acct" className={cn(inputCls, shown.bankAccountNumber && ERROR_INPUT_CLS)} value={form.bankAccountNumber}
                  onChange={(e) => set("bankAccountNumber", e.target.value)} onBlur={() => touch("bankAccountNumber")}
                  inputMode="numeric" {...fieldAria("staff-acct", shown.bankAccountNumber)} />
                <FieldError id="staff-acct" message={shown.bankAccountNumber} />
              </Field>
              <Field label="JazzCash"><input className={inputCls} value={form.jazzcashNumber} onChange={(e) => set("jazzcashNumber", e.target.value)} /></Field>
              <Field label="Easypaisa"><input className={inputCls} value={form.easypaisaNumber} onChange={(e) => set("easypaisaNumber", e.target.value)} /></Field>
              <Field label="Emergency contact"><input className={inputCls} value={form.emergencyContactName} onChange={(e) => set("emergencyContactName", e.target.value)} /></Field>
              <Field label="Emergency phone">
                <input id="staff-emg" className={cn(inputCls, shown.emergencyContactPhone && ERROR_INPUT_CLS)} value={form.emergencyContactPhone}
                  onChange={(e) => set("emergencyContactPhone", e.target.value)} onBlur={() => touch("emergencyContactPhone")}
                  placeholder="03xx-xxxxxxx" inputMode="tel" {...fieldAria("staff-emg", shown.emergencyContactPhone)} />
                <FieldError id="staff-emg" message={shown.emergencyContactPhone} />
              </Field>
            </div>
          </div>
          <Field label="Notes">
            <textarea id="staff-notes" className={cn(inputCls, "h-20 resize-y py-2", shown.notes && ERROR_INPUT_CLS)}
              value={form.notes} onChange={(e) => set("notes", e.target.value)} onBlur={() => touch("notes")}
              {...fieldAria("staff-notes", shown.notes)} />
            <FieldError id="staff-notes" message={shown.notes} />
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active</label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save staff"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default StaffFormDialog
