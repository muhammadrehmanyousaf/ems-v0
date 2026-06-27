"use client"

/**
 * Brokers — redesigned (Track C). Wired to BrokerAPI.listCommissions() — the
 * per-event broker commission ledger — rendered through the primitives.
 * Read-only; original screen untouched. Route /dashboard/brokers-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  BrokerAPI,
  type BrokerCommission,
  type CommissionStatus,
  BROKER_TYPE_LABELS,
  COMMISSION_STATUS_LABELS,
} from "@/lib/api/brokers"
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
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["brokers-redesigned"],
    queryFn: () => BrokerAPI.listCommissions(),
  })

  const all = data?.commissions ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) =>
      [c.brokerNameSnapshot, c.description, brokerTypeLabel(c)].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const totalCommission = all.reduce((s, c) => s + num(c.commissionAmount), 0)
  const totalPaid = all.reduce((s, c) => s + num(c.amountPaid), 0)
  const outstanding = Math.max(0, totalCommission - totalPaid)
  const overdueCount = all.filter((c) => c.status === "overdue").length

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
      key: "status",
      header: "Status",
      render: (c) => <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Brokers"
        description="Broker commission ledger — accruals, payments and outstanding, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add commission</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Commissions" value={all.length} icon="Users" />
        <StatCard label="Total commission" value={formatPkr(totalCommission)} icon="Wallet" />
        <StatCard label="Outstanding" value={formatPkr(outstanding)} icon="DollarSign" trend={outstanding > 0 ? "up" : undefined} />
        <StatCard label="Overdue" value={overdueCount} icon="AlertTriangle" />
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
        bulkActions={() => <Button size="sm" variant="outline">Export selected</Button>}
        empty={{
          icon: "Users",
          title: "No commissions yet",
          description: "Record broker commissions to track accruals, payments and what's still outstanding.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add commission</Button>,
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
              <ExportMenu rows={rows} filename="broker-commissions" columns={[
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
    </div>
  )
}

export default BrokersRedesignedView
