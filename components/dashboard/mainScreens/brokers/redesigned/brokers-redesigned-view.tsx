"use client"

/**
 * Brokers — redesigned (Track C). Wired to BrokerAPI.listCommissions() — the
 * per-event broker commission ledger — rendered through the primitives.
 * Route /dashboard/brokers.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BrokerAPI,
  type BrokerCommission,
  type CommissionStatus,
  BROKER_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
} from "@/lib/api/brokers"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { CommissionFormDialog } from "@/components/dashboard/mainScreens/brokers/redesigned/commission-form-dialog"
import { RecordPaymentDialog, DisputeCommissionDialog, VoidCommissionDialog } from "@/components/dashboard/mainScreens/brokers/redesigned/commission-action-dialogs"
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
import { LinkedFunctionSheetBadge } from "@/components/shared/linked-function-sheet-badge"
import { daysOverdueInKarachi } from "@/lib/utils/pk-date"
import { cn } from "@/lib/utils"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

const brokerTypeLabel = (c: BrokerCommission) => {
  const t = c.brokerTypeSnapshot
  return t ? BROKER_TYPE_LABELS[t] ?? cap(t) : "—"
}

const STATUS_TONE: Record<CommissionStatus, StatusTone> = {
  paid: "success",
  pending: "info",
  partially_paid: "warning",
  overdue: "error",
  disputed: "error",
  void: "neutral",
}

const statusTone = (s?: CommissionStatus | null): StatusTone =>
  (s && STATUS_TONE[s]) || "neutral"
const statusLabel = (s?: CommissionStatus | null) =>
  (s && COMMISSION_STATUS_LABELS[s]) || cap(s)

export function BrokersRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<BrokerCommission | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<BrokerCommission | null>(null)
  const [paying, setPaying] = React.useState<BrokerCommission | null>(null)
  const [disputing, setDisputing] = React.useState<BrokerCommission | null>(null)
  const [voiding, setVoiding] = React.useState<BrokerCommission | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["brokers-redesigned"],
    queryFn: () => BrokerAPI.listCommissions(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessId = businesses?.[0]?.id
  const invalidate = () => qc.invalidateQueries({ queryKey: ["brokers-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (c: BrokerCommission) => { setEditing(c); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => BrokerAPI.removeCommission(id),
    onSuccess: () => { showSuccessToast("Commission removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove commission"),
  })

  const all = data?.commissions ?? []

  /**
   * WWL-286 (S2) — the Overdue card read `status === "overdue"`, and NO
   * commission in production ever carries that status: nothing recomputes it
   * against the due date. So the card sat at 0 while Rs 138,750 was between 36
   * and 122 days late. Lateness is derived from the due date now, in Karachi,
   * exactly like every other overdue figure in the product.
   */
  const isLate = React.useCallback((c: BrokerCommission) => {
    if (c.status === "paid" || c.status === "void") return false
    if (num(c.commissionAmount) - num(c.amountPaid) <= 0) return false
    if (!c.dueDate) return false
    return daysOverdueInKarachi(c.dueDate) > 0
  }, [])

  const [statusFilter, setStatusFilter] = React.useState<"all" | "late" | "unpaid" | "paid">("all")

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = all
    if (q) {
      list = list.filter((c) =>
        [c.brokerNameSnapshot, c.description, brokerTypeLabel(c), statusLabel(c.status)].some((v) =>
          (v ?? "").toLowerCase().includes(q),
        ),
      )
    }
    // WWL-288 (S2) — there was no status filter of ANY kind, and the Overdue
    // card was inert, so there was no path from "something is late" to "which
    // ones" short of exporting the CSV and opening a spreadsheet.
    if (statusFilter === "late") list = list.filter(isLate)
    else if (statusFilter === "unpaid") list = list.filter((c) => num(c.commissionAmount) - num(c.amountPaid) > 0 && c.status !== "void")
    else if (statusFilter === "paid") list = list.filter((c) => c.status === "paid")
    return list
  }, [all, search, statusFilter, isLate])

  const totalCommission = all.reduce((s, c) => s + num(c.commissionAmount), 0)
  const totalPaid = all.reduce((s, c) => s + num(c.amountPaid), 0)
  const outstanding = Math.max(0, totalCommission - totalPaid)
  const lateRows = all.filter(isLate)
  const overdueCount = lateRows.length
  const overdueAmount = lateRows.reduce((s, c) => s + Math.max(0, num(c.commissionAmount) - num(c.amountPaid)), 0)

  const columns: Column<BrokerCommission>[] = [
    {
      key: "broker",
      header: "Broker",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(c.brokerNameSnapshot)}
          </span>
          <span className="font-medium">{c.brokerNameSnapshot || "—"}</span>
        </div>
      ),
    },
    { key: "type", header: "Type", cellClassName: "text-muted-foreground", render: (c) => brokerTypeLabel(c) },
    { key: "event", header: "Event", render: (c) => <LinkedFunctionSheetBadge bookingId={c.bookingId} variant="inline" /> },
    {
      key: "commission",
      header: "Commission",
      align: "right",
      cellClassName: "tabular-nums",
      render: (c) => <MoneyCell amount={num(c.commissionAmount)} />,
    },
    {
      key: "paid",
      header: "Paid",
      align: "right",
      cellClassName: "tabular-nums",
      render: (c) => <MoneyCell amount={num(c.amountPaid)} tone="success" />,
    },
    {
      key: "accrued",
      header: "Accrued",
      cellClassName: "text-muted-foreground",
      render: (c) => fmtDate(c.accruedDate),
    },
    {
      // WWL-287 (S2) — every row carries a dueDate and the CSV export wrote it,
      // but the screen showed only the ACCRUAL date. The one field that makes
      // lateness visible was exported and never displayed.
      key: "due",
      header: "Due",
      cellClassName: "text-muted-foreground",
      render: (c) => {
        if (!c.dueDate) return "—"
        const late = isLate(c)
        const days = late ? daysOverdueInKarachi(c.dueDate) : 0
        return (
          <span className={late ? "font-medium text-destructive" : undefined}>
            {fmtDate(c.dueDate)}
            {late && <span className="block text-[11px]">{days} day{days === 1 ? "" : "s"} late</span>}
          </span>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      render: (c) =>
        isLate(c) ? (
          <StatusPill tone="error">Overdue</StatusPill>
        ) : (
          <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
        ),
    },
    {
      key: "actions", header: "", align: "right",
      render: (c) => {
        const canPay = c.status !== "paid" && c.status !== "void"
        const canVoid = c.status !== "paid" && c.status !== "void"
        const canDispute = c.status !== "void"
        return (
          <div className="flex items-center justify-end gap-0.5">
            {canPay && (
              <Button size="sm" variant="ghost" onClick={() => setPaying(c)} aria-label="Record payment" title="Record payment">
                <Icon name="CheckCircle2" size={14} className="text-emerald-600" />
              </Button>
            )}
            {canDispute && (
              <Button size="sm" variant="ghost" onClick={() => setDisputing(c)} aria-label="Dispute commission" title="Dispute">
                <Icon name="AlertTriangle" size={14} className="text-amber-600" />
              </Button>
            )}
            {canVoid && (
              <Button size="sm" variant="ghost" onClick={() => setVoiding(c)} aria-label="Void commission" title="Void">
                <Icon name="XCircle" size={14} className="text-muted-foreground hover:text-destructive" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit commission" title="Edit"><Icon name="Pencil" size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} aria-label="Remove commission" title="Remove"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Brokers"
        description="Broker commission ledger — accruals, payments and outstanding."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add commission</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Commissions" value={all.length} icon="Users" />
        <StatCard label="Total commission" value={formatPkr(totalCommission)} icon="Wallet" />
        <StatCard label="Outstanding" value={formatPkr(outstanding)} icon="DollarSign" trend={outstanding > 0 ? "up" : undefined} />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon="AlertTriangle"
          delta={overdueAmount > 0 ? `${formatPkr(overdueAmount)} late` : undefined}
          trend={overdueCount > 0 ? "down" : undefined}
        />
      </div>

      {/* WWL-288 — a path from "something is late" to "which ones". */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Show:</span>
        {([["all", `All (${all.length})`], ["late", `Overdue (${overdueCount})`], ["unpaid", "Still owed"], ["paid", "Paid"]] as const).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setStatusFilter(k)}
            aria-pressed={statusFilter === k}
            className={cn(
              "rounded-md border px-2.5 py-1 transition-colors",
              statusFilter === k
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {lbl}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(c) => String(c.id)}
        loading={isLoading}
        error={isError ? "Couldn't load broker commissions." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No commissions yet",
          description: "Record broker commissions to track accruals, payments and what's still outstanding.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add commission</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brokers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => String(c.id)} rows={rows} filename="broker-commissions" columns={[
                { header: "Broker", value: (c) => c.brokerNameSnapshot ?? "" },
                { header: "Type", value: (c) => brokerTypeLabel(c) },
                { header: "Commission", value: (c) => num(c.commissionAmount) },
                { header: "Paid", value: (c) => num(c.amountPaid) },
                { header: "Accrued", value: (c) => c.accruedDate ?? "" },
                { header: "Due", value: (c) => c.dueDate ?? "" },
                { header: "Status", value: (c) => statusLabel(c.status) },
              ]} />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(c.brokerNameSnapshot)}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.brokerNameSnapshot || "—"}</div>
                <div className="text-xs text-muted-foreground">{brokerTypeLabel(c)} · {formatPkr(num(c.commissionAmount))}</div>
              </div>
            </div>
            <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
          </div>
        )}
      />

      <CommissionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} commission={editing} businessId={businessId} onSaved={invalidate} />

      <RecordPaymentDialog commission={paying} onOpenChange={(v) => !v && setPaying(null)} onSaved={() => { setPaying(null); invalidate() }} />
      <DisputeCommissionDialog commission={disputing} onOpenChange={(v) => !v && setDisputing(null)} onSaved={() => { setDisputing(null); invalidate() }} />
      <VoidCommissionDialog commission={voiding} onOpenChange={(v) => !v && setVoiding(null)} onSaved={() => { setVoiding(null); invalidate() }} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this commission?</AlertDialogTitle>
            <AlertDialogDescription>The commission for {deleting?.brokerNameSnapshot || "this broker"} will be removed. This can't be undone.</AlertDialogDescription>
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

export default BrokersRedesignedView
