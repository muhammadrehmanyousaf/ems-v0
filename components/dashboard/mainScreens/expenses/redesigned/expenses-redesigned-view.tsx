"use client"

/**
 * Expenses — redesigned (Track C). Wired to ExpensesAPI.list(); rendered through
 * the primitives. Read-only presentation; original screen untouched.
 * Route /dashboard/expenses-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ExpensesAPI, type VendorExpense } from "@/lib/api/vendorExpenses"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { ImportButton } from "@/components/dashboard/shared/import-button"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { ExpenseFormDialog } from "@/components/dashboard/mainScreens/expenses/redesigned/expense-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

export function ExpensesRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<VendorExpense | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<VendorExpense | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["expenses-redesigned"],
    queryFn: () => ExpensesAPI.list(),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ["expenses-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (e: VendorExpense) => { setEditing(e); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => ExpensesAPI.remove(id),
    onSuccess: () => { showSuccessToast("Expense removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.message || "Couldn't remove expense"),
  })

  const all = data?.expenses ?? []
  const expenses = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((e) => [e.vendorName, e.description, e.category].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const total = all.reduce((s, e) => s + num(e.amount), 0)
  const now = new Date()
  const thisMonthTotal = all.filter((e) => {
    const d = new Date(e.spentDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + num(e.amount), 0)
  const categories = new Set(all.map((e) => e.category)).size

  const columns: Column<VendorExpense>[] = [
    { key: "category", header: "Category", render: (e) => <span className="font-medium">{cap(e.category)}</span> },
    { key: "space", header: "Space", cellClassName: "text-muted-foreground", render: (e) => e.subVenue?.name || "—" },
    { key: "payee", header: "Paid to", cellClassName: "text-muted-foreground", render: (e) => e.vendorName || "—" },
    { key: "note", header: "Note", cellClassName: "max-w-[260px] truncate text-muted-foreground", render: (e) => e.description || "—" },
    { key: "method", header: "Method", render: (e) => <StatusPill tone="neutral">{cap(e.paymentMethod)}</StatusPill> },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground", render: (e) => fmtDate(e.spentDate) },
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Expenses"
        description="Every cost in one ledger — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add expense</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total spent" value={formatPkr(total)} icon="Wallet" />
        <StatCard label="This month" value={formatPkr(thisMonthTotal)} icon="Calendar" trend="down" delta="outflow" />
        <StatCard label="Entries" value={all.length} icon="FileText" />
        <StatCard label="Categories" value={categories} icon="LayoutGrid" />
      </div>

      <DataTable
        columns={columns}
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
              <ImportButton target="expenses" label="expenses" />
              <ExportMenu selectedIds={selected} getRowId={(e) => String(e.id)} rows={expenses} filename="expenses" columns={[
                { header: "Category", value: (e) => e.category },
                { header: "Paid to", value: (e) => e.vendorName ?? "" },
                { header: "Note", value: (e) => e.description ?? "" },
                { header: "Method", value: (e) => e.paymentMethod ?? "" },
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
              <div className="mt-1"><StatusPill tone="neutral">{cap(e.paymentMethod)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(e.amount)} tone="error" className="text-sm font-medium" />
          </div>
        )}
      />

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} onSaved={invalidate} />

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
