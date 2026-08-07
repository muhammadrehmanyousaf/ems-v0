"use client"

/**
 * Halal certificate create/edit dialog (redesigned) — functional parity for the
 * redesigned Halal certs screen. Wired to HalalCertAPI.create/update. Follows the
 * Suppliers parity recipe.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { RecordVenueField } from "@/components/dashboard/shared/record-venue-field"
import { useMutation, useQuery } from "@tanstack/react-query"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { SupplierAPI, type Supplier } from "@/lib/api/suppliers"
import { HalalCertAPI, ISSUING_AUTHORITY_LABELS, type HalalCert, type IssuingAuthority } from "@/lib/api/halalCerts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FormBlockedHint } from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const AUTHORITIES = Object.keys(ISSUING_AUTHORITY_LABELS) as IssuingAuthority[]
const today = () => todayInKarachi()
const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState { certNumber: string; itemDescription: string; issuingAuthority: IssuingAuthority; supplierId: string; supplierNameSnapshot: string; issuedDate: string; expiryDate: string; renewalLeadTimeDays: string; notes: string; certPhotoUrl: string }
const blank = (c?: HalalCert): FormState => ({
  certNumber: c?.certNumber ?? "",
  itemDescription: c?.itemDescription ?? "",
  issuingAuthority: (c?.issuingAuthority as IssuingAuthority) ?? AUTHORITIES[0],
  supplierId: c?.supplierId != null ? String(c.supplierId) : "",
  supplierNameSnapshot: c?.supplierNameSnapshot ?? c?.supplier?.name ?? "",
  certPhotoUrl: c?.certPhotoUrl ?? "",
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
  /**
   * WWL-293/311/332/350 — the record used to be filed under whichever venue was
   * first in the array. `businessId` now arrives undefined when the header is
   * on "All venues" and the vendor owns more than one, so the dialog asks
   * instead of guessing. RecordVenueField renders nothing for a single-venue
   * vendor, who has nothing to get wrong.
   */
  const [venueId, setVenueId] = React.useState<string>(businessId != null ? String(businessId) : "")
  React.useEffect(() => {
    if (businessId != null) setVenueId(String(businessId))
  }, [businessId])
  const effectiveBusinessId = venueId ? Number(venueId) : businessId
  const [form, setForm] = React.useState<FormState>(blank(cert))
  const loadedId = React.useRef<number | "new" | null>(null)
  React.useEffect(() => {
    if (open) { const key = cert?.id ?? "new"; if (loadedId.current !== key) { setForm(blank(cert)); loadedId.current = key } } else { loadedId.current = null }
  }, [open, cert])
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const saveMut = useMutation({
    mutationFn: () => {
      const body = {
        businessId: cert?.businessId ?? effectiveBusinessId!,
        certNumber: form.certNumber.trim(),
        itemDescription: form.itemDescription.trim(),
        issuingAuthority: form.issuingAuthority,
        // WWL-324 — the joined relation the view PREFERS, finally reachable.
        supplierId: form.supplierId ? Number(form.supplierId) : undefined,
        supplierNameSnapshot: form.supplierNameSnapshot.trim() || undefined,
        // WWL-322 — the certificate itself.
        certPhotoUrl: form.certPhotoUrl.trim() || undefined,
        issuedDate: form.issuedDate,
        expiryDate: form.expiryDate,
        renewalLeadTimeDays: form.renewalLeadTimeDays.trim() === "" ? undefined : Number(form.renewalLeadTimeDays) || 0,
        notes: form.notes.trim() || undefined,
      }
      return isEdit ? HalalCertAPI.update(cert!.id, body) : HalalCertAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Certificate updated" : "Certificate added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save certificate")),
  })
  const [uploading, setUploading] = React.useState(false)
  /** The 18 supplier records this form was asking the vendor to retype. */
  const { data: supplierData } = useQuery({
    queryKey: ["suppliers-for-halal", effectiveBusinessId],
    queryFn: () => SupplierAPI.list(effectiveBusinessId ? { businessId: effectiveBusinessId } : {}),
    enabled: open,
    staleTime: 5 * 60_000,
  })
  const suppliers = supplierData?.suppliers ?? []

  const canSave = form.certNumber.trim() && form.itemDescription.trim() && form.issuedDate && form.expiryDate && (isEdit || effectiveBusinessId != null)

  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  /**
   * WWL-290 — the hint listed the content fields and never the venue, so a
   * vendor on "All venues" who had filled the form correctly read a list of
   * things they had already done and a Save button that stayed dead. Name the
   * thing that is actually missing first.
   */
  const blockedReason = canSave
    ? undefined
    : !isEdit && effectiveBusinessId == null
      ? "Choose which venue this certificate belongs to."
      /**
       * WWL-326 — one string for four fields: the hint listed all of them
       * regardless of which was missing, so a vendor who had filled three read
       * a list of things they had already done. Name the one that is missing.
       */
      : !form.certNumber.trim()
        ? "Add the certificate number to save."
        : !form.itemDescription.trim()
          ? "Add what this certificate covers (the item or category) to save."
          : !form.issuedDate
            ? "Add the date the certificate was issued."
            : !form.expiryDate
              ? "Add the date the certificate expires."
              : "Fill in the highlighted fields to save."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit certificate" : "Add halal certificate"}</DialogTitle>
          <DialogDescription>Track halal certification and its expiry.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <RecordVenueField value={venueId} onChange={setVenueId} noun="certificate" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Certificate number"><input className={inputCls} value={form.certNumber} onChange={(e) => set("certNumber", e.target.value)} autoFocus /></Field>
            <Field label="Issuing authority">
              <select className={inputCls} value={form.issuingAuthority} onChange={(e) => set("issuingAuthority", e.target.value as IssuingAuthority)}>
                {AUTHORITIES.map((a) => <option key={a} value={a}>{ISSUING_AUTHORITY_LABELS[a]}</option>)}
              </select>
            </Field>
          </div>
          <Field label="What it covers"><input className={inputCls} value={form.itemDescription} onChange={(e) => set("itemDescription", e.target.value)} placeholder="e.g. Beef & mutton supply" /></Field>
          {/**
            * WWL-324 — the form captured `supplierNameSnapshot` as free text
            * while the view's own accessor is
            * `c.supplier?.name ?? c.supplierNameSnapshot`, preferring a joined
            * relation that NOTHING in the UI could ever populate. The same
            * account already holds 18 supplier records — including Bismillah
            * Meat Supply on all three venues — which this field was asking the
            * vendor to retype. Identical shape to WWL-289 in Brokers.
            */}
          <Field label="Supplier">
            <select
              className={inputCls}
              value={form.supplierId}
              onChange={(e) => {
                const id = e.target.value
                const sup = suppliers.find((x: Supplier) => String(x.id) === id)
                setForm((f) => ({
                  ...f,
                  supplierId: id,
                  supplierNameSnapshot: sup?.name ?? f.supplierNameSnapshot,
                }))
              }}
            >
              <option value="">Not one of my saved suppliers — type a name</option>
              {suppliers.map((sup: Supplier) => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </Field>
          {!form.supplierId && (
            <Field label="Supplier name">
              <input className={inputCls} value={form.supplierNameSnapshot} onChange={(e) => set("supplierNameSnapshot", e.target.value)} />
            </Field>
          )}
          {/**
            * WWL-322 — a halal certificate is a piece of paper issued by an
            * authority, and this register held its NUMBER and nothing else:
            * no file input in the dialog, no document column in the table, and
            * no screen anywhere in the product that could produce the
            * certificate if an inspector or a caterer asked for it. The column
            * (`certPhotoUrl`) and the validator that writes it both already
            * existed; only the way in was missing.
            */}
          <Field label="Certificate document">
            {form.certPhotoUrl ? (
              <div className="flex items-center gap-2">
                <a href={form.certPhotoUrl} target="_blank" rel="noopener noreferrer" className="truncate text-sm text-primary underline underline-offset-2">
                  View attached certificate
                </a>
                <Button size="sm" variant="ghost" onClick={() => set("certPhotoUrl", "")}>Replace</Button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  disabled={uploading}
                  className="block w-full text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const [url] = await BusinessesAPI.uploadImages([file], effectiveBusinessId)
                      if (url) set("certPhotoUrl", url)
                      else toast.error("That file didn't upload. Try a JPG, PNG or PDF.")
                    } catch (err) {
                      toast.error(errorMessage(err, "Couldn't upload that file."))
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
                <p className="text-[11px] text-muted-foreground">
                  {uploading ? "Uploading…" : "A photo or scan of the certificate, so you can show it without finding the file."}
                </p>
              </>
            )}
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Issued"><input type="date" className={inputCls} value={form.issuedDate} onChange={(e) => set("issuedDate", e.target.value)} /></Field>
            <Field label="Expires"><input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></Field>
            <Field label="Renewal lead (days)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.renewalLeadTimeDays} onChange={(e) => set("renewalLeadTimeDays", e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update" : "Save certificate"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HalalCertFormDialog
