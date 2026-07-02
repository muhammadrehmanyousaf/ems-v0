"use client"

/**
 * Expense create/edit dialog (redesigned) — functional parity for the redesigned
 * Expenses screen. Wired to ExpensesAPI.create/update (same endpoints as the
 * original). Vendor-scoped, so no businessId needed. Follows the Suppliers
 * parity recipe.
 */

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ExpensesAPI, EXPENSE_CATEGORY_LABELS, type VendorExpense, type ExpenseCategory, type ExpensePaymentMethod } from "@/lib/api/vendorExpenses"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { venueSpacesApi } from "@/lib/api/venueSpaces"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[]
const METHODS: ExpensePaymentMethod[] = ["cash", "bank_transfer", "cheque", "jazzcash", "easypaisa", "raast", "ibft", "card", "other"]
const methodLabel = (m: string) => m.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
const today = () => new Date().toISOString().slice(0, 10)

const inputCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

interface FormState { amount: string; category: ExpenseCategory; vendorName: string; description: string; spentDate: string; paymentMethod: ExpensePaymentMethod; subcategory: string; subVenueId: string }
const blank = (e?: VendorExpense): FormState => ({
  amount: e?.amount != null ? String(e.amount) : "",
  category: (e?.category as ExpenseCategory) ?? "supplies",
  vendorName: e?.vendorName ?? "",
  description: e?.description ?? "",
  spentDate: (e?.spentDate ?? today()).slice(0, 10),
  paymentMethod: (e?.paymentMethod as ExpensePaymentMethod) ?? "cash",
  subcategory: e?.subcategory ?? "",
  subVenueId: e?.subVenueId != null ? String(e.subVenueId) : "",
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
  open, onOpenChange, expense, onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  expense?: VendorExpense
  onSaved?: () => void
}) {
  const isEdit = !!expense
  const [form, setForm] = React.useState<FormState>(blank(expense))
  const loadedId = React.useRef<number | "new" | null>(null)

  React.useEffect(() => {
    if (open) {
      const key = expense?.id ?? "new"
      if (loadedId.current !== key) { setForm(blank(expense)); loadedId.current = key }
    } else { loadedId.current = null }
  }, [open, expense])

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  // Load the active venue's spaces so the expense can be tagged to a hall/floor/partition.
  const activeBusinessId = useActiveBusinessId()
  const spacesQ = useQuery({
    queryKey: ["venueSpacesTree", activeBusinessId],
    queryFn: () => venueSpacesApi.publicTree(activeBusinessId as number),
    enabled: open && activeBusinessId != null,
    staleTime: 5 * 60_000,
  })
  const spaces = React.useMemo(() => flattenSpaces(spacesQ.data?.tree as any), [spacesQ.data])

  const saveMut = useMutation({
    mutationFn: () => {
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
        // Venue-hierarchy: attribute this cost to the active venue + chosen space.
        businessId: activeBusinessId ?? undefined,
        subVenueId: sv,
        scopeType,
      }
      return isEdit ? ExpensesAPI.update(expense!.id, body) : ExpensesAPI.create(body)
    },
    onSuccess: () => { showSuccessToast(isEdit ? "Expense updated" : "Expense added"); onSaved?.(); onOpenChange(false) },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't save expense"),
  })

  const canSave = Number(form.amount) > 0 && !!form.spentDate

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Log a cost against your business ledger.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Amount (Rs)"><input type="number" className={cn(inputCls, "tabular-nums")} value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0" autoFocus /></Field>
            <Field label="Date"><input type="date" className={inputCls} value={form.spentDate} onChange={(e) => set("spentDate", e.target.value)} /></Field>
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
            <Field label="Paid to"><input className={inputCls} value={form.vendorName} onChange={(e) => set("vendorName", e.target.value)} placeholder="Supplier / payee" /></Field>
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
          </div>
          <Field label="Note"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What was this for?" /></Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSave || saveMut.isPending} onClick={() => saveMut.mutate()}>
            {saveMut.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> {isEdit ? "Update expense" : "Save expense"}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExpenseFormDialog
