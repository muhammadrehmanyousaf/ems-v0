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

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "quoted", "booked", "lost", "archived"]
const SOURCES: LeadSource[] = ["manual_phone", "manual_walkin", "whatsapp", "form_inquiry", "in_app_chat", "other"]
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
const blank = (l?: Lead): FormState => ({
  contactName: l?.contactName ?? "", contactPhone: l?.contactPhone ?? "", contactWhatsapp: l?.contactWhatsapp ?? "", contactEmail: l?.contactEmail ?? "",
  source: (l?.source as LeadSource) ?? "manual_phone", eventType: (l?.eventType as LeadEventType) ?? "walima",
  eventDate: (l?.eventDate ?? "").slice(0, 10), estimatedBudget: l?.estimatedBudget != null ? String(l.estimatedBudget) : "",
  estimatedGuests: l?.estimatedGuests != null ? String(l.estimatedGuests) : "", status: (l?.status as LeadStatus) ?? "new", inquiry: l?.inquiry ?? "",
})

export function LeadFormDialog({
  open, onOpenChange, lead, businessId, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  lead?: Lead
  businessId?: number
  onSaved?: () => void
}) {
  const isEdit = !!lead
  const [form, setForm] = React.useState<FormState>(blank(lead))
  const loaded = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const k = lead?.id ?? "new"; if (loaded.current !== k) { setForm(blank(lead)); loaded.current = k } } else { loaded.current = null }
  }, [open, lead])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
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
      return isEdit ? LeadAPI.update(lead!.id, body) : LeadAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Lead updated" : "Lead added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save lead"),
  })
  const canSave = form.contactName.trim() && (isEdit || businessId != null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit lead" : "Log a lead"}</DialogTitle><DialogDescription>An inquiry to follow up and convert.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact name"><input className={inputCls} value={form.contactName} onChange={(e) => set("contactName", e.target.value)} autoFocus /></Field>
            <Field label="Phone"><input className={inputCls} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
            <Field label="WhatsApp"><input className={inputCls} value={form.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)} /></Field>
            <Field label="Email"><input className={inputCls} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} /></Field>
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
            <Field label="Budget (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.estimatedBudget} onChange={(e) => set("estimatedBudget", e.target.value)} /></Field>
            <Field label="Guests"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.estimatedGuests} onChange={(e) => set("estimatedGuests", e.target.value)} /></Field>
          </div>
          <Field label="Inquiry / notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.inquiry} onChange={(e) => set("inquiry", e.target.value)} placeholder="What are they asking for?" /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>{saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update lead" : "Save lead"}</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LeadFormDialog
