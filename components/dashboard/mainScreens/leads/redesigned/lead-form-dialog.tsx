"use client"

/**
 * Lead create/edit dialog (redesigned) — functional parity for the redesigned
 * Leads screen. Wired to LeadAPI.create/update. Free-text contact (no registered
 * customer needed). Follows the Suppliers parity recipe.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { LeadAPI, type Lead, type LeadStatus, type LeadSource, type LeadEventType } from "@/lib/api/leads"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkPhone,
  validateEmail,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "booked", "lost", "archived"]
const SOURCES: LeadSource[] = ["manual_phone", "manual_walkin", "whatsapp", "instagram", "referral", "form_inquiry", "in_app_chat", "other"]
const EVENTS: LeadEventType[] = ["mehndi", "nikah", "baraat", "walima", "engagement", "dholki", "other"]
const lbl = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"
function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}
const numOrU = (s: string) => (s.trim() === "" ? undefined : Number(s) || 0)

interface FormState {
  contactName: string; contactPhone: string; contactWhatsapp: string; contactEmail: string
  source: LeadSource; eventType: LeadEventType; eventDate: string; estimatedBudget: string; estimatedGuests: string
  status: LeadStatus; inquiry: string
}
export interface LeadPrefill { contactName?: string; contactPhone?: string; contactWhatsapp?: string; contactEmail?: string; source?: string; eventType?: string; eventDate?: string; estimatedBudget?: number; estimatedGuests?: number; inquiry?: string }
const blank = (l?: Lead, p?: LeadPrefill): FormState => ({
  contactName: l?.contactName ?? p?.contactName ?? "", contactPhone: l?.contactPhone ?? p?.contactPhone ?? "", contactWhatsapp: l?.contactWhatsapp ?? p?.contactWhatsapp ?? "", contactEmail: l?.contactEmail ?? p?.contactEmail ?? "",
  source: (l?.source as LeadSource) ?? (p?.source as LeadSource) ?? "manual_phone", eventType: (l?.eventType as LeadEventType) ?? (p?.eventType as LeadEventType) ?? "walima",
  eventDate: (l?.eventDate ?? p?.eventDate ?? "").slice(0, 10), estimatedBudget: l?.estimatedBudget != null ? String(l.estimatedBudget) : p?.estimatedBudget != null ? String(p.estimatedBudget) : "",
  estimatedGuests: l?.estimatedGuests != null ? String(l.estimatedGuests) : p?.estimatedGuests != null ? String(p.estimatedGuests) : "", status: (l?.status as LeadStatus) ?? "new", inquiry: l?.inquiry ?? p?.inquiry ?? "",
})

export function LeadFormDialog({
  open, onOpenChange, lead, prefill, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  lead?: Lead
  prefill?: LeadPrefill
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!lead
  const [form, setForm] = React.useState<FormState>(blank(lead, prefill))
  const loaded = React.useRef<string | null>(null)
  React.useEffect(() => {
    const k = open ? (lead?.id != null ? `l${lead.id}` : prefill ? `p${JSON.stringify(prefill)}` : "new") : null
    if (open) { if (loaded.current !== k) { setForm(blank(lead, prefill)); loaded.current = k } } else { loaded.current = null }
  }, [open, lead, prefill])
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))
  const set = (k: keyof FormState, v: string) => { setForm((f) => ({ ...f, [k]: v })); touch(String(k)) }

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        businessId: lead?.businessId ?? businessId!,
        contactName: form.contactName.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        contactWhatsapp: form.contactWhatsapp.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        source: form.source, eventType: form.eventType,
        eventDate: form.eventDate || undefined,
        estimatedBudget: numOrU(form.estimatedBudget),
        estimatedGuests: numOrU(form.estimatedGuests),
        status: form.status,
        inquiry: form.inquiry.trim() || undefined,
      }
      // PWA-02 — a lead grabbed offline (bridal expo, dead signal) queues instead
      // of failing, and syncs on reconnect. This is the killer field case: never
      // lose a walk-in. Edits stay online-only.
      if (!isEdit && isOutboxEnabled() && isOffline()) {
        await outboxEnqueue(
          "capture_lead",
          { businessId: body.businessId, contactName: body.contactName, contactPhone: body.contactPhone, contactWhatsapp: body.contactWhatsapp, contactEmail: body.contactEmail, source: form.source, eventType: form.eventType, eventDate: body.eventDate, estimatedBudget: body.estimatedBudget, estimatedGuests: body.estimatedGuests, inquiry: body.inquiry },
          `${form.contactName.trim() || form.contactPhone.trim()} · ${lbl(form.eventType)}`,
        )
        return { queuedOffline: true as const }
      }
      return isEdit ? LeadAPI.update(lead!.id, body) : LeadAPI.create(body)
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Saved offline — will sync when you reconnect")
      else showSuccessToast(isEdit ? "Lead updated" : "Lead added")
      onSaved?.(); onOpenChange(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save lead"),
  })
  /*
   * Every field except the contact name accepted anything at all.
   *
   * Verified live on production: phone "abc-not-phone", WhatsApp "!!!", email
   * "bad-email", budget -5000, guests -10 and an event date of 2020-01-01 were
   * ALL accepted — aria-invalid was null on every one, no error rendered, and
   * Save unlocked the moment a name was typed. A lead whose phone cannot be
   * rung is a lead the vendor cannot convert, which is the whole point of the
   * inbox; a negative budget and a wedding six years in the past are simply
   * typos nobody caught.
   *
   * Same rules the public enquiry form and the customer dialog already use, so
   * the portal validates a phone number the same way everywhere.
   */
  const errs = {
    contactPhone: validatePkPhone(form.contactPhone, { label: "Phone", required: false }),
    contactWhatsapp: validatePkPhone(form.contactWhatsapp, { label: "WhatsApp", required: false }),
    contactEmail: validateEmail(form.contactEmail, { required: false }),
    estimatedBudget: numOrU(form.estimatedBudget) != null && Number(form.estimatedBudget) < 0
      ? "Budget can't be negative."
      : undefined,
    estimatedGuests: numOrU(form.estimatedGuests) != null && Number(form.estimatedGuests) < 0
      ? "Guests can't be negative."
      : undefined,
    inquiry: validateOptionalText(form.inquiry, { label: "Inquiry / notes", max: 2000 }),
  }
  // Errors only after a field is touched, so opening the dialog doesn't flag
  // the empty phone the vendor is about to type.
  const shown = Object.fromEntries(
    Object.entries(errs).map(([k, v]) => [k, touched[k] ? v : undefined]),
  ) as Record<string, string | undefined>

  const hasError = Object.values(errs).some(Boolean)
  const canSave = form.contactName.trim() && !hasError && (isEdit || businessId != null)

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason = canSave
    ? undefined
    : !form.contactName.trim()
      ? "Add a contact name to save."
      : hasError
        ? "Fix the highlighted fields to save."
        : "This lead needs a business before it can be saved."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit lead" : "Log a lead"}</DialogTitle><DialogDescription>An inquiry to follow up and convert.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name"><input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} autoFocus /></Field>
            <Field label="Phone">
              <input id="lead-phone" className={cn(inputCls, shown.contactPhone && ERROR_INPUT_CLS)} value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)} onBlur={() => touch("contactPhone")}
                placeholder="03xx-xxxxxxx" inputMode="tel" {...fieldAria("lead-phone", shown.contactPhone)} />
              <FieldError id="lead-phone" message={shown.contactPhone} />
            </Field>
            <Field label="WhatsApp">
              <input id="lead-wa" className={cn(inputCls, shown.contactWhatsapp && ERROR_INPUT_CLS)} value={form.contactWhatsapp}
                onChange={(e) => set("contactWhatsapp", e.target.value)} onBlur={() => touch("contactWhatsapp")}
                placeholder="03xx-xxxxxxx" inputMode="tel" {...fieldAria("lead-wa", shown.contactWhatsapp)} />
              <FieldError id="lead-wa" message={shown.contactWhatsapp} />
            </Field>
            <Field label="Email">
              <input id="lead-email" type="email" className={cn(inputCls, shown.contactEmail && ERROR_INPUT_CLS)} value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)} onBlur={() => touch("contactEmail")}
                {...fieldAria("lead-email", shown.contactEmail)} />
              <FieldError id="lead-email" message={shown.contactEmail} />
            </Field>
            <Field label="Source">
              <select className={inputCls} value={form.source} onChange={(e) => set("source", e.target.value as LeadSource)}>{SOURCES.map((s) => <option key={s} value={s}>{lbl(s)}</option>)}</select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value as LeadStatus)}>{STATUSES.map((s) => <option key={s} value={s}>{lbl(s)}</option>)}</select>
            </Field>
            <Field label="Event type">
              <select className={inputCls} value={form.eventType} onChange={(e) => set("eventType", e.target.value as LeadEventType)}>{EVENTS.map((s) => <option key={s} value={s}>{lbl(s)}</option>)}</select>
            </Field>
            <Field label="Event date"><input type="date" className={inputCls} value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} /></Field>
            <Field label="Budget (Rs)">
              <input id="lead-budget" type="number" min={0} step={1} inputMode="numeric"
                className={cn(inputCls, "tabular-nums", shown.estimatedBudget && ERROR_INPUT_CLS)} value={form.estimatedBudget}
                onChange={(e) => set("estimatedBudget", e.target.value)} onBlur={() => touch("estimatedBudget")}
                {...fieldAria("lead-budget", shown.estimatedBudget)} />
              <FieldError id="lead-budget" message={shown.estimatedBudget} />
            </Field>
            <Field label="Guests">
              <input id="lead-guests" type="number" min={0} step={1} inputMode="numeric"
                className={cn(inputCls, "tabular-nums", shown.estimatedGuests && ERROR_INPUT_CLS)} value={form.estimatedGuests}
                onChange={(e) => set("estimatedGuests", e.target.value)} onBlur={() => touch("estimatedGuests")}
                {...fieldAria("lead-guests", shown.estimatedGuests)} />
              <FieldError id="lead-guests" message={shown.estimatedGuests} />
            </Field>
          </div>
          <Field label="Inquiry / notes">
            <textarea id="lead-inq" className={cn(inputCls, "h-20 resize-y py-2", shown.inquiry && ERROR_INPUT_CLS)} value={form.inquiry}
              onChange={(e) => set("inquiry", e.target.value)} onBlur={() => touch("inquiry")}
              placeholder="What are they asking for?" {...fieldAria("lead-inq", shown.inquiry)} />
            <FieldError id="lead-inq" message={shown.inquiry} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update lead" : "Save lead"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeadFormDialog
