"use client"

/**
 * Tax & P&L — redesigned (Track C, computed). Wired to
 * TaxReportAPI.getAnnualReport(); rendered through the primitives. Read-only;
 * original screen untouched. Route /dashboard/tax-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { TaxReportAPI, type AnnualTaxReport } from "@/lib/api/tax"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

type TaxMonthRow = NonNullable<AnnualTaxReport["months"]>[number]

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

export function TaxRedesignedView() {
  const year = new Date().getFullYear()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tax-annual-report-redesigned", year],
    queryFn: () => TaxReportAPI.getAnnualReport(year),
  })

  const report = data
  const netPnl = num(report?.summary?.netPnl)
  const months = (report?.months ?? []) as TaxMonthRow[]

  const columns: Column<TaxMonthRow>[] = [
    { key: "month", header: "Month", render: (r) => <span className="font-medium">{r.monthLabel || "—"}</span> },
    { key: "bookings", header: "Bookings", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.bookingCount) },
    { key: "revenue", header: "Revenue", align: "right", render: (r) => <MoneyCell amount={num(r.revenue)} /> },
    { key: "expenses", header: "Expenses", align: "right", render: (r) => <MoneyCell amount={num(r.expenses)} tone="error" /> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Tax & P&L"
        description="Your annual revenue, expenses and net position — redesigned, wired to live data."
        actions={<Button><Icon name="Download" size={16} className="mr-1.5" /> Export PDF</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross revenue" value={isLoading ? "…" : formatPkr(num(report?.summary?.bookingRevenue))} icon="Wallet" trend="up" />
        <StatCard label="Expenses" value={isLoading ? "…" : formatPkr(num(report?.summary?.totalExpenses))} icon="Clock" />
        <StatCard label="Net P&L" value={isLoading ? "…" : formatPkr(netPnl)} icon="TrendingUp" trend={netPnl >= 0 ? "up" : "down"} />
        <StatCard label="FBR submitted" value={isLoading ? "…" : formatPkr(num(report?.summary?.fbrSubmittedValue))} icon="ShieldCheck" />
      </div>

      <DataTable
        columns={columns}
        data={months}
        getRowId={(r) => r.monthLabel}
        loading={isLoading}
        error={isError ? "Couldn't load the annual tax report." : null}
        onRetry={() => refetch()}
        empty={{
          icon: "FileText",
          title: "No data for this period",
          description: "Once you have bookings and expenses, your monthly P&L breakdown will appear here.",
        }}
        renderCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.monthLabel}</div>
              <div className="text-xs text-muted-foreground">{num(r.bookingCount)} bookings</div>
            </div>
            <div className="text-right">
              <MoneyCell amount={num(r.revenue)} className="text-sm font-medium" />
              <MoneyCell amount={num(r.expenses)} tone="error" className="text-xs" />
            </div>
          </div>
        )}
      />
    </div>
  )
}

export default TaxRedesignedView
