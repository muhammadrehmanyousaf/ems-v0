"use client"

/**
 * Receivables (A/R) — redesigned (Track C, computed). Wired to
 * AnalyticsAPI.getReceivables(); rendered through the primitives. Read-only;
 * original screen untouched. Route /dashboard/receivables-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI, type ReceivablesData } from "@/lib/api/analytics"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

type ReceivablesCustomer = ReceivablesData["customers"][number]

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

const bucketTone = (b?: string): StatusTone => {
  const v = (b || "").toLowerCase()
  if (v.includes("current") || v.includes("0")) return "success"
  if (v.includes("90") || v.includes("over")) return "error"
  if (v.includes("60")) return "warning"
  if (v.includes("30")) return "info"
  return "neutral"
}

export function ReceivablesRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["receivables-redesigned"],
    queryFn: () => AnalyticsAPI.getReceivables(),
  })

  const t = data?.totals
  const all = data?.customers ?? []
  const customers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) => [c.customerName, c.customerPhone].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const columns: Column<ReceivablesCustomer>[] = [
    { key: "customer", header: "Customer", render: (c) => <span className="font-medium">{c.customerName || "—"}</span> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (c) => c.customerPhone || "—" },
    { key: "bookings", header: "Bookings", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.bookingCount) },
    { key: "open", header: "Open installments", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.installmentsOpen) },
    { key: "overdue", header: "Days overdue", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.oldestDaysOverdue) },
    { key: "bucket", header: "Aging", render: (c) => <StatusPill tone={bucketTone(c.bucket)}>{cap(c.bucket) || "—"}</StatusPill> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (c) => <MoneyCell amount={num(c.totalOutstanding)} tone="warning" /> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Receivables"
        description="Who owes you, and how overdue — redesigned, wired to live data."
        actions={<Button><Icon name="Send" size={16} className="mr-1.5" /> Send reminders</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Outstanding" value={isLoading ? "…" : formatPkr(num(t?.grandOutstanding))} icon="Wallet" trend="down" delta="to chase" />
        <StatCard label="Customers owing" value={isLoading ? "…" : num(t?.customerCount)} icon="Users" />
        <StatCard label="Open installments" value={isLoading ? "…" : num(t?.installmentsOpen)} icon="Clock" />
        <StatCard label="Oldest overdue" value={isLoading ? "…" : `${num(t?.oldestDaysOverdue)} days`} icon="AlertTriangle" trend={num(t?.oldestDaysOverdue) > 0 ? "down" : "flat"} />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        getRowId={(c) => c.customerPhone || c.customerEmail || c.customerName || JSON.stringify(c)}
        loading={isLoading}
        error={isError ? "Couldn't load receivables." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "CheckCircle2",
          title: "Nothing outstanding",
          description: "When customers have pending payments, their aging will show here.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => c.customerPhone || c.customerEmail || c.customerName || JSON.stringify(c)} rows={customers} filename="receivables" columns={[
                { header: "Customer", value: (c) => c.customerName ?? "" },
                { header: "Phone", value: (c) => c.customerPhone ?? "" },
                { header: "Bookings", value: (c) => num(c.bookingCount) },
                { header: "Open installments", value: (c) => num(c.installmentsOpen) },
                { header: "Days overdue", value: (c) => num(c.oldestDaysOverdue) },
                { header: "Outstanding", value: (c) => num(c.totalOutstanding) },
              ]} />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{c.customerName}</div>
              <div className="text-xs text-muted-foreground">{c.customerPhone} · {num(c.oldestDaysOverdue)}d overdue</div>
              <div className="mt-1"><StatusPill tone={bucketTone(c.bucket)}>{cap(c.bucket)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(c.totalOutstanding)} tone="warning" className="text-sm font-medium" />
          </div>
        )}
      />
    </div>
  )
}

export default ReceivablesRedesignedView
