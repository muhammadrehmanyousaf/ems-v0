"use client"

/**
 * Receipts — redesigned (Track C). Wired to ReceiptsAPI.list(); rendered through
 * the primitives. Read-only presentation; original screen untouched.
 * Route /dashboard/receipts-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ReceiptsAPI, type PaymentReceipt } from "@/lib/api/paymentReceipts"
import { ReceiptFormDialog } from "@/components/dashboard/mainScreens/receipts/redesigned/receipt-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const methodLabel = (m: string) =>
  ({ cash: "Cash", jazzcash: "JazzCash", easypaisa: "Easypaisa", raast: "Raast", ibft: "IBFT", bank_transfer: "Bank transfer", other: "Other" } as Record<string, string>)[m] ?? m
const methodTone = (m: string): StatusTone => (m === "cash" ? "success" : m === "other" ? "neutral" : "info")

export function ReceiptsRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PaymentReceipt | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<PaymentReceipt | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["receipts-redesigned"],
    queryFn: () => ReceiptsAPI.list(),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["receipts-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (r: PaymentReceipt) => { setEditing(r); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => ReceiptsAPI.remove(id),
    onSuccess: () => { showSuccessToast("Receipt removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove receipt"),
  })

  const all = data?.receipts ?? []
  const receipts = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) => [r.customer?.fullName, r.transactionRef, r.method, r.notes].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const total = all.reduce((s, r) => s + num(r.amount), 0)
  const now = new Date()
  const thisMonth = all.filter((r) => {
    const d = new Date(r.receivedDate)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const thisMonthTotal = thisMonth.reduce((s, r) => s + num(r.amount), 0)
  const cashTotal = all.filter((r) => r.method === "cash").reduce((s, r) => s + num(r.amount), 0)

  const columns: Column<PaymentReceipt>[] = [
    { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer?.fullName || "—"}</span> },
    { key: "method", header: "Method", render: (r) => <StatusPill tone={methodTone(r.method)} variant="icon">{methodLabel(r.method)}</StatusPill> },
    { key: "ref", header: "Txn ref", cellClassName: "text-muted-foreground", render: (r) => r.transactionRef || "—" },
    { key: "date", header: "Received", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.receivedDate) },
    { key: "amount", header: "Amount", align: "right", render: (r) => <MoneyCell amount={num(r.amount)} tone="success" /> },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit receipt"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(r)} aria-label="Remove receipt"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Receipts"
        description="Every payment received, with proof — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Record receipt</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total received" value={formatPkr(total)} icon="Wallet" trend="up" />
        <StatCard label="This month" value={formatPkr(thisMonthTotal)} icon="Calendar" trend="up" delta={`${thisMonth.length} receipts`} />
        <StatCard label="Cash collected" value={formatPkr(cashTotal)} icon="DollarSign" />
        <StatCard label="Receipts" value={all.length} icon="FileText" />
      </div>

      <DataTable
        columns={columns}
        data={receipts}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load receipts." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "FileText",
          title: "No receipts yet",
          description: "Record cash, JazzCash, Easypaisa and bank payments so every rupee is accounted for.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Record receipt</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search receipts…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)} rows={receipts} filename="receipts" columns={[
                { header: "Customer", value: (r) => r.customer?.fullName ?? "" },
                { header: "Method", value: (r) => methodLabel(r.method) },
                { header: "Txn ref", value: (r) => r.transactionRef ?? "" },
                { header: "Received", value: (r) => fmtDate(r.receivedDate) },
                { header: "Amount", value: (r) => num(r.amount) },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.customer?.fullName || "—"}</div>
              <div className="text-xs text-muted-foreground">{fmtDate(r.receivedDate)} · {r.transactionRef || "no ref"}</div>
              <div className="mt-1"><StatusPill tone={methodTone(r.method)} variant="icon">{methodLabel(r.method)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(r.amount)} tone="success" className="text-sm font-medium" />
          </div>
        )}
      />

      <ReceiptFormDialog open={dialogOpen} onOpenChange={setDialogOpen} receipt={editing} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this receipt?</AlertDialogTitle>
            <AlertDialogDescription>This {deleting ? formatPkr(num(deleting.amount)) : ""} receipt will be removed. This can't be undone.</AlertDialogDescription>
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

export default ReceiptsRedesignedView
