"use client"

/**
 * Expenses — redesigned (Track C). Wired to ExpensesAPI.list(); rendered through
 * the primitives. Read-only presentation; 
 * Route /dashboard/expenses.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ExpensesAPI, EXPENSE_PAYMENT_METHOD_LABELS, type VendorExpense } from "@/lib/api/vendorExpenses"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { ImportButton } from "@/components/dashboard/shared/import-button"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { ExpenseFormDialog, type ExpensePrefill } from "@/components/dashboard/mainScreens/expenses/redesigned/expense-form-dialog"
import { ExpenseCockpit } from "@/components/dashboard/mainScreens/expenses/expense-cockpit"
import { OutboxStatus } from "@/components/dashboard/shared/outbox-status"
import { OutboxConflicts } from "@/components/dashboard/shared/outbox-conflicts"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { CustomFieldsManager } from "@/components/dashboard/shared/custom-fields-manager"
import { useCustomFieldDefs } from "@/components/dashboard/shared/custom-fields-section"
import type { CustomFieldDef } from "@/lib/api/customFields"
import { LinkedFunctionSheetBadge } from "@/components/shared/linked-function-sheet-badge"

const fmtCf = (v: unknown, d: CustomFieldDef): string => {
  if (v == null || v === "") return "—"
  if (d.fieldType === "boolean") return v ? "Yes" : "No"
  if (Array.isArray(v)) return v.map((x) => d.optionsJson?.find((o) => o.value === x)?.label ?? String(x)).join(", ") || "—"
  if (d.fieldType === "dropdown") return d.optionsJson?.find((o) => o.value === v)?.label ?? String(v)
  if (d.fieldType === "money") return "Rs " + Number(v).toLocaleString("en-PK")
  if (d.fieldType === "date" || d.fieldType === "datetime") { const dt = new Date(String(v)); return isNaN(dt.getTime()) ? String(v) : dt.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) }
  return String(v)
}

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

/**
 * WWL-183 — the Pakistani payment rails were title-cased raw keys here:
 * "Jazzcash", "Ibft", "Bank Transfer". `Ibft` in particular reads as a word
 * rather than the initialism it is, and the Receipts module already rendered
 * the same rails correctly. The canonical map has existed all along.
 */
const methodLabel = (m?: string | null): string => {
  if (!m) return "—"
  return (EXPENSE_PAYMENT_METHOD_LABELS as Record<string, string>)[m] ?? cap(m)
}
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

/**
 * `bookingId` — when this grid is embedded in a booking's Event Financials
 * module the event is already known, so the list is filtered to that booking
 * (the backend has always supported `?bookingId=`; nothing here was passing it)
 * and a newly-recorded expense is pre-tagged to it. Standalone use passes
 * nothing and shows every expense, exactly as before.
 */
export function ExpensesRedesignedView({ bookingId }: { bookingId?: number } = {}) {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<VendorExpense | undefined>(undefined)
  const [prefill, setPrefill] = React.useState<ExpensePrefill | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<VendorExpense | null>(null)
  const [managerOpen, setManagerOpen] = React.useState(false)

  // Per-venue custom fields (Space-level EAV overlay). showInList defs become extra columns.
  const activeBusinessId = useActiveBusinessId()
  const cfDefsQ = useCustomFieldDefs("expense", activeBusinessId)
  const listCfDefs = React.useMemo(
    () => (cfDefsQ.data ?? []).filter((d) => d.isActive && d.showInList).sort((a, b) => a.displayOrder - b.displayOrder),
    [cfDefsQ.data],
  )
  const cfEnabled = activeBusinessId != null

  const { data, isLoading, isError, refetch } = useQuery({
    // bookingId is part of the key: without it, opening two bookings' financials
    // in one session would serve the first booking's expenses for the second.
    queryKey: ["expenses-redesigned", activeBusinessId, bookingId ?? null],
    queryFn: () => ExpensesAPI.list(bookingId != null ? { bookingId } : {}),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["expenses-redesigned"] })
  // Recording an expense from inside an event pre-tags it to that event, so the
  // vendor never has to remember to attach it — and the Costing tab reflects it.
  const openCreate = () => {
    setEditing(undefined)
    setPrefill(bookingId != null ? ({ bookingId } as ExpensePrefill) : undefined)
    setDialogOpen(true)
  }
  const openEdit = (e: VendorExpense) => { setEditing(e); setPrefill(undefined); setDialogOpen(true) }
  // PWA-03 — re-enter a conflicted offline expense with its values seeded.
  const openReenter = (p: ExpensePrefill) => { setEditing(undefined); setPrefill(p); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => ExpensesAPI.remove(id),
    onSuccess: () => { showSuccessToast("Expense removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(
        e?.response?.data?.message || e?.message || "Couldn't remove expense",
        { duration: 8000 },
      ),
  })

  const all = data?.expenses ?? []
  const expenses = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((e) => [e.vendorName, e.description, e.category].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const columns: Column<VendorExpense>[] = [
    { key: "category", header: "Category", render: (e) => <span className="font-medium">{cap(e.category)}</span> },
    { key: "space", header: "Space", cellClassName: "text-muted-foreground", render: (e) => e.subVenue?.name || "—" },
    { key: "payee", header: "Paid to", cellClassName: "text-muted-foreground", render: (e) => e.vendorName || "—" },
    { key: "note", header: "Note", cellClassName: "max-w-[260px] truncate text-muted-foreground", render: (e) => e.description || "—" },
    { key: "method", header: "Method", render: (e) => <StatusPill tone="neutral">{methodLabel(e.paymentMethod)}</StatusPill> },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground", render: (e) => fmtDate(e.spentDate) },
    // Reverse link back to the event. A vendor looking at "Rs 45,000 catering"
    // needs to know WHICH wedding it was for; without this the money screens
    // and the event screens are two unconnected worlds.
    { key: "event", header: "Event", render: (e) => <LinkedFunctionSheetBadge bookingId={e.bookingId} variant="inline" /> },
    { key: "amount", header: "Amount", align: "right", render: (e) => <MoneyCell amount={num(e.amount)} tone="error" /> },
    {
      key: "actions", header: "", align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(e)} aria-label="Edit expense"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(e)} aria-label="Remove expense"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  // Splice vendor-defined "show in list" custom fields in just before the actions column.
  const cfCols: Column<VendorExpense>[] = listCfDefs.map((d) => ({
    key: `cf_${d.fieldKey}`,
    header: d.label,
    cellClassName: "text-muted-foreground",
    render: (e) => fmtCf((e as any).customFields?.[d.fieldKey], d),
  }))
  const tableColumns = cfCols.length ? [...columns.slice(0, -1), ...cfCols, columns[columns.length - 1]] : columns

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Expenses"
        description="Every cost in one ledger."
        actions={<div className="flex items-center gap-2"><OutboxStatus /><Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add expense</Button></div>}
      />

      <OutboxConflicts reenterOps={["record_expense"]} onReenter={(p) => openReenter(p)} />

      {/* Command-centre: day/month/year spend, category split (incl. hall rent
          & overheads), and per-function profit. The detailed ledger follows. */}
      <ExpenseCockpit />

      {/*
        WWL-185 — "Spent · month stayed at Rs 745,200 while the ledger filtered
        from 55 rows to 5, to 0, and back."

        The cockpit above is a PERIOD summary and is labelled as one, so making
        it follow a text search would trade one wrong headline for another. What
        was missing is the ledger saying what it is currently showing, so the two
        numbers stop looking like they disagree. The divider carries that now.
      */}
      <div className="flex items-center gap-2 pt-1">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {search.trim()
            ? `Full ledger — showing ${expenses.length} of ${all.length}`
            : "Full ledger"}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {search.trim() && (
        <p className="-mt-3 text-center text-[11px] text-muted-foreground">
          The summary above covers the whole period, not just these {expenses.length}
          {expenses.length === 1 ? " row" : " rows"}.
        </p>
      )}

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Expenses"
        columns={tableColumns}
        data={expenses}
        getRowId={(e) => String(e.id)}
        loading={isLoading}
        error={isError ? "Couldn't load expenses." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Wallet",
          title: "No expenses logged",
          description: "Track fuel, salaries, rentals and supplies to see your true per-event profit.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add expense</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              {cfEnabled && (
                <Button variant="outline" size="sm" onClick={() => setManagerOpen(true)} title="Add or edit your own expense fields">
                  <Icon name="Settings2" size={15} className="mr-1.5" /> Fields
                </Button>
              )}
              <ImportButton target="expenses" label="expenses" />
              <ExportMenu selectedIds={selected} getRowId={(e) => String(e.id)} rows={expenses} filename="expenses" columns={[
                { header: "Category", value: (e) => e.category },
                { header: "Paid to", value: (e) => e.vendorName ?? "" },
                { header: "Note", value: (e) => e.description ?? "" },
                { header: "Method", value: (e) => methodLabel(e.paymentMethod) },
                { header: "Date", value: (e) => fmtDate(e.spentDate) },
                { header: "Amount", value: (e) => num(e.amount) },
              ]} />
            </div>
          </>
        }
        renderCard={(e) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{cap(e.category)}</div>
              <div className="truncate text-xs text-muted-foreground">{e.vendorName || e.description || "—"} · {fmtDate(e.spentDate)}</div>
              <div className="mt-1"><StatusPill tone="neutral">{methodLabel(e.paymentMethod)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(e.amount)} tone="error" className="text-sm font-medium" />
          </div>
        )}
      />

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} prefill={prefill} onSaved={invalidate} />

      {cfEnabled && (
        <CustomFieldsManager
          open={managerOpen}
          onOpenChange={setManagerOpen}
          entityType="expense"
          entityLabel="Expenses"
          businessId={activeBusinessId as number}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this expense?</AlertDialogTitle>
            <AlertDialogDescription>This {deleting ? formatPkr(num(deleting.amount)) : ""} entry will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ExpensesRedesignedView
