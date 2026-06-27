"use client"

/**
 * Function sheets — redesigned (Track C). Wired to FunctionSheetAPI.list();
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/function-sheets-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  FunctionSheetAPI,
  type FunctionSheet,
  type FunctionSheetState,
} from "@/lib/api/functionSheets"
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
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const STATE_LABELS: Record<FunctionSheetState, string> = {
  draft: "Draft",
  quote_sent: "Quote sent",
  contract_pending: "Contract pending",
  signed: "Signed",
  beo_ready: "BEO ready",
  invoiced: "Invoiced",
  paid: "Paid",
  archived: "Archived",
  cancelled: "Cancelled",
}

const stateTone = (s?: FunctionSheetState | null): StatusTone => {
  switch (s) {
    case "paid":
    case "signed":
      return "success"
    case "quote_sent":
    case "contract_pending":
    case "beo_ready":
    case "invoiced":
      return "warning"
    case "cancelled":
      return "error"
    case "draft":
      return "info"
    case "archived":
    default:
      return "neutral"
  }
}

const stateLabel = (s?: FunctionSheetState | null) => (s ? STATE_LABELS[s] ?? cap(s) : "—")

export function FunctionSheetsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["function-sheets-redesigned"],
    queryFn: () => FunctionSheetAPI.list(),
  })

  const all = data?.functionSheets ?? []
  const sheets = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((f) =>
      [f.title, f.customerName, f.customerPhone].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const totalValue = all.reduce((s, f) => s + num(f.grandTotal), 0)
  const paidCount = all.filter((f) => f.state === "paid").length
  const openCount = all.filter(
    (f) => f.state !== "paid" && f.state !== "archived" && f.state !== "cancelled",
  ).length

  const columns: Column<FunctionSheet>[] = [
    {
      key: "title",
      header: "Sheet",
      render: (f) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{f.title || "Untitled sheet"}</div>
          <div className="text-xs text-muted-foreground">#{f.id}</div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cellClassName: "text-muted-foreground",
      render: (f) => f.customerName || f.customer?.fullName || "—",
    },
    { key: "event", header: "Event date", cellClassName: "text-muted-foreground", render: (f) => fmtDate(f.eventDate) },
    {
      key: "total",
      header: "Grand total",
      align: "right",
      render: (f) => <MoneyCell amount={num(f.grandTotal)} />,
    },
    {
      key: "state",
      header: "Status",
      render: (f) => <StatusPill tone={stateTone(f.state)}>{stateLabel(f.state)}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Function sheets"
        description="Quotes, contracts, BEOs and invoices — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> New function sheet</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total sheets" value={all.length} icon="FileText" />
        <StatCard label="Open" value={openCount} icon="Clock" />
        <StatCard label="Paid" value={paidCount} icon="CheckCircle2" trend="up" />
        <StatCard label="Total value" value={formatPkr(totalValue)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={sheets}
        getRowId={(f) => String(f.id)}
        loading={isLoading}
        error={isError ? "Couldn't load function sheets." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "FileText",
          title: "No function sheets yet",
          description: "Create a quote, contract or BEO to track the deal from first quote to final payment.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> New function sheet</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sheets…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={sheets} filename="function-sheets" columns={[
                { header: "ID", value: (f) => f.id },
                { header: "Title", value: (f) => f.title ?? "" },
                { header: "Customer", value: (f) => f.customerName ?? f.customer?.fullName ?? "" },
                { header: "Phone", value: (f) => f.customerPhone ?? "" },
                { header: "Event date", value: (f) => f.eventDate ?? "" },
                { header: "Grand total", value: (f) => num(f.grandTotal) },
                { header: "Status", value: (f) => stateLabel(f.state) },
              ]} />
            </div>
          </>
        }
        renderCard={(f) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{f.title || "Untitled sheet"}</div>
              <div className="text-xs text-muted-foreground">
                {(f.customerName || f.customer?.fullName || "—")} · {formatPkr(num(f.grandTotal))}
              </div>
            </div>
            <StatusPill tone={stateTone(f.state)}>{stateLabel(f.state)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default FunctionSheetsRedesignedView
