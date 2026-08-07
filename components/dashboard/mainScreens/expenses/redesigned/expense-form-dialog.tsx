"use client"

/**
 * Expense create/edit dialog (redesigned) — functional parity for the redesigned
 * Expenses screen. Wired to ExpensesAPI.create/update (same endpoints as the
 * original). Vendor-scoped, so no businessId needed. Follows the Suppliers
 * parity recipe.
 */

import * as React from "react"
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExpensesAPI, EXPENSE_CATEGORY_LABELS, type VendorExpense, type ExpenseCategory, type ExpensePaymentMethod } from "@/lib/api/vendorExpenses"
import { useBusinessIdField } from "@/lib/store/use-business-id-field";
import { venueSpacesApi } from "@/lib/api/venueSpaces"
import axiosInstance from "@/lib/axiosConfig"
import { CustomFieldsSection } from "@/components/dashboard/shared/custom-fields-section"
import { CustomFieldsAPI, type CustomFieldValues } from "@/lib/api/customFields"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { enqueue as outboxEnqueue, isOutboxEnabled, isOffline } from "@/lib/outbox"
// Phase 5 — receipt OCR. Self-hides unless the deployment has ANTHROPIC_API_KEY.
import { AiAPI, fileToBase64 } from "@/lib/api/ai"
import { useAiFeature } from "@/hooks/use-ai-status"
import { validateReceiptFile, coerceReceipt } from "@/lib/ai/coerce"
import {
  FormBlockedHint,
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkr,
  validateNotFutureDate,
  validateOptionalText,
} from "@/components/dashboard/primitives/field-error"
import { todayInKarachi } from "@/lib/utils/pk-date"

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
const METHODS: ExpensePaymentMethod[] = ["cash", "bank_transfer", "cheque", "jazzcash", "easypaisa", "raast", "ibft", "card", "other"]
const methodLabel = (m: string) => m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
const today = () => todayInKarachi()

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

/** WWL-117 — matches the `max` passed to validateOptionalText. */
const NOTES_MAX = 1000

interface FormState { amount: string; category: ExpenseCategory; vendorName: string; description: string; spentDate: string; paymentMethod: ExpensePaymentMethod; subcategory: string; subVenueId: string; bookingId: string }
// `bookingId` lets a caller pre-tag the expense to an event — used when this
// dialog is opened from inside a booking's Event Financials module, so the
// vendor never has to remember to attach the cost to the event they are in.
export interface ExpensePrefill { amount?: number; category?: string; paymentMethod?: string; spentDate?: string; note?: string; bookingId?: number }
const blank = (e?: VendorExpense, prefill?: ExpensePrefill): FormState => ({
  amount: e?.amount != null ? String(e.amount) : prefill?.amount != null ? String(prefill.amount) : "",
  category: (e?.category as ExpenseCategory) ?? (prefill?.category as ExpenseCategory) ?? "supplies",
  vendorName: e?.vendorName ?? "",
  description: e?.description ?? prefill?.note ?? "",
  spentDate: (e?.spentDate ?? prefill?.spentDate ?? today()).slice(0, 10),
  paymentMethod: (e?.paymentMethod as ExpensePaymentMethod) ?? (prefill?.paymentMethod as ExpensePaymentMethod) ?? "cash",
  subcategory: e?.subcategory ?? "",
  subVenueId: e?.subVenueId != null ? String(e.subVenueId) : "",
  bookingId: e?.bookingId != null ? String(e.bookingId) : prefill?.bookingId != null ? String(prefill.bookingId) : "",
})

// Flatten the Hall→Floor→Partition tree into an indented option list.
function flattenSpaces(nodes: { id: number; name: string; kind: string; depth: number; children?: any[] }[] | undefined): { id: number; name: string; kind: string; depth: number }[] {
  const out: { id: number; name: string; kind: string; depth: number }[] = []
  const walk = (ns?: any[]) => (ns || []).forEach((n) => { out.push({ id: n.id, name: n.name, kind: n.kind, depth: n.depth }); walk(n.children) })
  walk(nodes)
  return out
}
const scopeForDepth = (d: number): string => (d <= 0 ? "HALL" : d === 1 ? "FLOOR" : "PARTITION")

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}><label className={labelCls}>{label}</label>{children}</div>
}


export function ExpenseFormDialog({
  open, onOpenChange, expense, prefill, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  expense?: VendorExpense
  prefill?: ExpensePrefill
  onSaved?: () => void
}) {
  const isEdit = !!expense
  const [form, setForm] = React.useState<FormState>(blank(expense, prefill))
  const [cf, setCf] = React.useState<CustomFieldValues>({})
  const loadedId = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (open) {
      const key = expense?.id != null ? `e${expense.id}` : prefill ? `p${JSON.stringify(prefill)}` : "new"
      if (loadedId.current !== key) {
        setForm(blank(expense, prefill))
        setCf(((expense as any)?.customFields as CustomFieldValues) || {})
        setScanned(null) // a fresh form must not claim it was scanned
        loadedId.current = key
      }
    } else { loadedId.current = null }
  }, [open, expense, prefill])

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Errors appear only after a field is touched, so opening the dialog doesn't
  // immediately flag the empty amount the vendor is about to type.
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const touch = (k: string) => setTouched((t) => (t[k] ? t : { ...t, [k]: true }))

  // Phase 5 — scan a receipt photo into the form. Create-mode only: re-scanning
  // over a saved expense would silently rewrite ledger values the vendor already
  // reconciled. OCR needs the network (the offline path here is the outbox, not
  // OCR), so a scan attempted offline says so instead of hanging.
  const ocrOn = useAiFeature("receiptOcr") && !isEdit
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = React.useState(false)
  const [scanned, setScanned] = React.useState<{ fields: number; confidence?: number } | null>(null)

  const onPickReceipt = async (file?: File | null) => {
    if (!file) return
    if (isOffline()) { toast.error("Scanning needs a connection. Enter the details and they'll save offline."); return }
    const bad = validateReceiptFile(file)
    if (bad) { toast.error(bad); return }
    setScanning(true)
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const r = await AiAPI.parseReceipt(base64, mediaType)
      if (!r) { toast.error("Receipt scanning isn't configured on this deployment yet."); return }
      // CATEGORIES is the form's own enum — a model-invented category is dropped.
      const patch = coerceReceipt(r.data, CATEGORIES)
      const n = Object.keys(patch).length
      if (n === 0) { toast.error("Couldn't read that receipt. Enter the details by hand."); return }
      setForm((f) => ({ ...f, ...(patch as Partial<FormState>) }))
      setScanned({ fields: n, confidence: r.data?.confidence })
      toast.success(`Read ${n} field${n === 1 ? "" : "s"} — check them before saving`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Couldn't scan that receipt")
    } finally {
      setScanning(false)
      if (fileRef.current) fileRef.current.value = "" // allow re-picking the same file
    }
  }

  // Load the active venue's spaces so the expense can be tagged to a hall/floor/partition.
  // F3 — resolve through the shared primitive so the space picker still loads
  // under "All venues" instead of silently offering nothing to tag against.
  const [activeBusinessIdStr] = useBusinessIdField()
  const activeBusinessId = activeBusinessIdStr ? Number(activeBusinessIdStr) : null
  const spacesQ = useQuery({
    queryKey: ["venueSpacesTree", activeBusinessId],
    queryFn: () => venueSpacesApi.publicTree(activeBusinessId as number),
    enabled: open && activeBusinessId != null,
    staleTime: 5 * 60_000,
  })
  const spaces = React.useMemo(() => flattenSpaces(spacesQ.data?.tree as any), [spacesQ.data])

  // Per-function tagging: load the vendor's recent bookings so a cost can be
  // attributed to a specific shaadi/function (drives per-event profit). Leaving
  // it blank keeps the expense as a recurring overhead (rent, utilities, salary).
  const bookingsQ = useQuery({
    queryKey: ["expense-form-bookings"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/bookings", {
        params: { page: 1, limit: 100, sortBy: "bookingDate", sortOrder: "DESC" },
      })
      return (res.data?.data?.data ?? []) as { id: number; customerName: string | null; bookingDate: string | null }[]
    },
    enabled: open,
    staleTime: 5 * 60_000,
  })
  const bookings = bookingsQ.data ?? []
  const bookingLabel = (b: { id: number; customerName: string | null; bookingDate: string | null }) =>
    `${b.customerName || `Booking #${b.id}`}${b.bookingDate ? ` · ${new Date(b.bookingDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}` : ""}`

  const saveMut = useMutation({
    mutationFn: async () => {
      // PWA-02 — adding an expense while offline: queue it in the outbox instead
      // of failing. It syncs idempotently on reconnect. Edits stay online-only.
      // (The offline path records amount/category/method/date/note; space +
      // custom-field tagging is an online-only refinement.)
      if (!isEdit && isOutboxEnabled() && isOffline()) {
        const note = [form.description.trim(), form.vendorName.trim() ? `Paid to: ${form.vendorName.trim()}` : ""].filter(Boolean).join(" · ") || undefined
        await outboxEnqueue(
          "record_expense",
          { amount: Number(form.amount) || 0, category: form.category, paymentMethod: form.paymentMethod, spentDate: form.spentDate, note },
          `Rs ${Number(form.amount) || 0} · ${EXPENSE_CATEGORY_LABELS[form.category]}`,
        )
        return { queuedOffline: true as const }
      }
      const sv = form.subVenueId ? Number(form.subVenueId) : null
      const scopeType = sv != null ? scopeForDepth(spaces.find((s) => s.id === sv)?.depth ?? 2) : undefined
      const body = {
        amount: Number(form.amount) || 0,
        category: form.category,
        subcategory: form.subcategory.trim() || undefined,
        vendorName: form.vendorName.trim() || undefined,
        description: form.description.trim() || undefined,
        spentDate: form.spentDate,
        paymentMethod: form.paymentMethod,
        // Per-function tagging (null = recurring overhead).
        bookingId: form.bookingId ? Number(form.bookingId) : null,
        // Venue-hierarchy: attribute this cost to the active venue + chosen space.
        businessId: activeBusinessId ?? undefined,
        subVenueId: sv,
        scopeType,
      }
      const saved = isEdit ? await ExpensesAPI.update(expense!.id, body) : await ExpensesAPI.create(body)
      // Persist custom field values against the saved expense (safe no-op when off).
      const savedId = (saved as any)?.expense?.id ?? (saved as any)?.id ?? expense?.id
      if (activeBusinessId != null && savedId != null && cf && Object.keys(cf).length) {
        try { await CustomFieldsAPI.putValues("expense", Number(savedId), activeBusinessId, cf) } catch { /* non-fatal */ }
      }
      return saved
    },
    onSuccess: (r: any) => {
      if (r?.queuedOffline) toast.success("Saved offline — will sync when you reconnect")
      else showSuccessToast(isEdit ? "Expense updated" : "Expense added")
      onSaved?.(); onOpenChange(false)
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't save expense")),
  })

  // Same ledger discipline as receipts: amount had NO min (the browser spinner
  // offered negatives on an expense book) and spentDate had NO bounds, so money
  // could be recorded as spent NEXT YEAR and quietly distort every cost and
  // margin report that reads it.
  const errs = {
    amount: validatePkr(form.amount, { label: "Amount" }),
    spentDate: validateNotFutureDate(form.spentDate, { label: "Date spent" }),
    vendorName: validateOptionalText(form.vendorName, { label: "Paid to", max: 150 }),
    description: validateOptionalText(form.description, { label: "Note", max: 1000 }),
  }
  const shown = {
    amount: touched.amount ? errs.amount : undefined,
    spentDate: touched.spentDate ? errs.spentDate : undefined,
    vendorName: touched.vendorName ? errs.vendorName : undefined,
    description: touched.description ? errs.description : undefined,
  }
  const canSave = !errs.amount && !errs.spentDate && !errs.vendorName && !errs.description


  // BUG-057 — a disabled button is not feedback. Say what it is waiting for.
  const blockedReason =
    !canSave && !Object.values(shown).some(Boolean)
      ? errs.description ?? "Add an amount above 0 and the date it was spent to save."
      : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Log a cost against your business ledger.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {ocrOn && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">Scan a receipt</p>
                <p className="text-[11px] text-muted-foreground">
                  {scanned
                    ? `Filled ${scanned.fields} field${scanned.fields === 1 ? "" : "s"}${scanned.confidence != null ? ` · ${Math.round(scanned.confidence * 100)}% confident` : ""} — check them.`
                    : "Photograph the parchi and we'll fill in the amount, payee and date."}
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickReceipt(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => fileRef.current?.click()}>
                {scanning ? <><Spinner size={14} className="mr-1.5" /> Reading…</> : <><Icon name="Sparkles" size={14} className="mr-1.5 text-bridal-gold" /> {scanned ? "Rescan" : "Scan"}</>}
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount (Rs)">
              <input
                id="exp-amount"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                className={cn(inputCls, "tabular-nums", shown.amount && ERROR_INPUT_CLS)}
                value={form.amount}
                onChange={(e) => { set("amount", e.target.value); touch("amount") }}
                onBlur={() => touch("amount")}
                placeholder="0"
                autoFocus
                {...fieldAria("exp-amount", shown.amount)}
              />
              <FieldError id="exp-amount" message={shown.amount} />
            </Field>
            <Field label="Date">
              <input
                id="exp-date"
                type="date"
                max={todayInKarachi()}
                className={cn(inputCls, shown.spentDate && ERROR_INPUT_CLS)}
                value={form.spentDate}
                onChange={(e) => { set("spentDate", e.target.value); touch("spentDate") }}
                onBlur={() => touch("spentDate")}
                {...fieldAria("exp-date", shown.spentDate)}
              />
              <FieldError id="exp-date" message={shown.spentDate} />
            </Field>
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value as ExpenseCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Payment method">
              <select className={inputCls} value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value as ExpensePaymentMethod)}>
                {METHODS.map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
              </select>
            </Field>
            <Field label="Paid to">
              <input
                id="exp-payee"
                className={cn(inputCls, shown.vendorName && ERROR_INPUT_CLS)}
                value={form.vendorName}
                onChange={(e) => { set("vendorName", e.target.value); touch("vendorName") }}
                onBlur={() => touch("vendorName")}
                maxLength={150}
                placeholder="Supplier / payee"
                {...fieldAria("exp-payee", shown.vendorName)}
              />
              <FieldError id="exp-payee" message={shown.vendorName} />
            </Field>
            <Field label="Subcategory (optional)"><input className={inputCls} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} /></Field>
            {spaces.length > 0 && (
              <Field label="Space (optional)" className="sm:col-span-2">
                <select className={inputCls} value={form.subVenueId} onChange={(e) => set("subVenueId", e.target.value)}>
                  <option value="">Whole business (no specific space)</option>
                  {spaces.map((s) => (
                    <option key={s.id} value={String(s.id)}>{" ".repeat(s.depth * 2)}{s.name} · {s.kind}</option>
                  ))}
                </select>
              </Field>
            )}
            {/* Per-function tagging — attribute this cost to one shaadi/booking so
                it appears in that event's profit. Blank = recurring overhead. */}
            <Field label="Function / booking (optional)" className="sm:col-span-2">
              <select className={inputCls} value={form.bookingId} onChange={(e) => set("bookingId", e.target.value)}>
                <option value="">Recurring overhead — not tied to one function (rent, utilities, salary)</option>
                {bookings.map((b) => (
                  <option key={b.id} value={String(b.id)}>{bookingLabel(b)}</option>
                ))}
              </select>
              {bookingsQ.isLoading && <p className="text-[11px] text-muted-foreground">Loading your bookings…</p>}
            </Field>
          </div>
          {/**
            * WWL-117 recurrence — `errs.description` gated `canSave` while this field
            * rendered no FieldError and never called `touch("description")`, so the
            * message could never appear. At 1001 characters Save went dead and
            * the hint named a different field entirely. No maxLength either, so
            * nothing stopped the paste that caused it.
            */}
          <Field label="Note">
            <textarea
              id="exp-note"
              className={cn(inputCls, "h-20 resize-y py-2", shown.description && ERROR_INPUT_CLS)}
              value={form.description}
              maxLength={NOTES_MAX}
              onChange={(e) => { set("description", e.target.value); touch("description") }}
              onBlur={() => touch("description")} placeholder="What was this for?"
              {...fieldAria("exp-note", shown.description)}
            />
            <div className="flex items-start justify-between gap-2">
              <FieldError id="exp-note" message={shown.description} />
              {form.description.length > NOTES_MAX - 100 && (
                <span className={cn("shrink-0 text-[11px] tabular-nums", form.description.length >= NOTES_MAX ? "text-destructive" : "text-muted-foreground")}>
                  {form.description.length} / {NOTES_MAX}
                </span>
              )}
            </div>
          </Field>
          <CustomFieldsSection entityType="expense" businessId={activeBusinessId} values={cf} onChange={setCf} heading="Your custom fields" />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <FormBlockedHint message={blockedReason} />
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update expense" : "Save expense"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExpenseFormDialog
