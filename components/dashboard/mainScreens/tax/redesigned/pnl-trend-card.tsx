"use client"

/**
 * QA #20 — Profit (P&L) trend, monthly or weekly. Wires the previously-unused
 * AnalyticsAPI.getMonthlyPnl / getWeeklyPnl (accrual: revenue minus operating
 * expenses + supplier bills + broker commissions + staff pay). Read-only,
 * vendor-scoped, self-contained — added below the annual tax table.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { cn } from "@/lib/utils"

type Granularity = "month" | "week"

interface Row {
  key: string
  label: string
  revenue: number
  costs: { total: number }
  grossProfit: number
  margin: number | null
  isCurrent?: boolean
}

export function PnlTrendCard() {
  const [gran, setGran] = React.useState<Granularity>("month")

  const monthly = useQuery({
    queryKey: ["pnl-monthly"],
    queryFn: () => AnalyticsAPI.getMonthlyPnl(12),
    enabled: gran === "month",
  })
  const weekly = useQuery({
    queryKey: ["pnl-weekly"],
    queryFn: () => AnalyticsAPI.getWeeklyPnl(12),
    enabled: gran === "week",
  })

  const isLoading = gran === "month" ? monthly.isLoading : weekly.isLoading
  const isError = gran === "month" ? monthly.isError : weekly.isError
  const refetch = gran === "month" ? monthly.refetch : weekly.refetch

  const rows: Row[] = React.useMemo(() => {
    if (gran === "month") {
      return (monthly.data?.months ?? []).map((m) => ({
        key: m.key, label: m.label, revenue: m.revenue, costs: { total: m.costs.total },
        grossProfit: m.grossProfit, margin: m.margin, isCurrent: m.isCurrentMonth,
      }))
    }
    return (weekly.data?.weeks ?? []).map((w) => ({
      key: w.key, label: w.label, revenue: w.revenue, costs: { total: w.costs.total },
      grossProfit: w.grossProfit, margin: w.margin, isCurrent: w.isCurrentWeek,
    }))
  }, [gran, monthly.data, weekly.data])

  const totals = gran === "month" ? monthly.data?.totals : weekly.data?.totals
  const best = gran === "month" ? monthly.data?.best : weekly.data?.best
  const avg = gran === "month" ? monthly.data?.averageMonthlyProfit : weekly.data?.averageWeeklyProfit

  const columns: Column<Row>[] = [
    {
      key: "period", header: gran === "month" ? "Month" : "Week",
      render: (r) => (
        <span className={cn("font-medium", r.isCurrent && "text-primary")}>
          {r.label}{r.isCurrent ? " · now" : ""}
        </span>
      ),
    },
    { key: "revenue", header: "Revenue", align: "right", render: (r) => <MoneyCell amount={r.revenue} /> },
    { key: "costs", header: "Costs", align: "right", render: (r) => <MoneyCell amount={r.costs.total} tone="error" /> },
    { key: "profit", header: "Profit", align: "right", render: (r) => <MoneyCell amount={r.grossProfit} tone={r.grossProfit < 0 ? "error" : "success"} /> },
    { key: "margin", header: "Margin", align: "right", cellClassName: "tabular-nums", render: (r) => (r.margin == null ? "—" : `${r.margin}%`) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Profit trend</h3>
          <p className="text-xs text-muted-foreground">
            Revenue minus all costs (expenses, supplier bills, broker commissions, staff pay). Accrual basis.
          </p>
        </div>
        <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Granularity">
          {(["month", "week"] as const).map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={gran === g}
              onClick={() => setGran(g)}
              className={cn(
                "h-8 rounded px-3 text-sm capitalize transition-colors",
                gran === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
              )}
            >
              {g === "month" ? "Monthly" : "Weekly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={isLoading ? "…" : formatPkr(totals?.revenue ?? 0)} icon="Wallet" trend="up" error={isError} />
        <StatCard label="Total costs" value={isLoading ? "…" : formatPkr(totals?.totalCosts ?? 0)} icon="Clock" error={isError} />
        <StatCard label="Gross profit" value={isLoading ? "…" : formatPkr(totals?.grossProfit ?? 0)} icon="TrendingUp" trend={(totals?.grossProfit ?? 0) >= 0 ? "up" : "down"} error={isError} />
        <StatCard
          label={gran === "month" ? "Avg / month" : "Avg / week"}
          value={isLoading ? "…" : formatPkr(avg ?? 0)}
          icon="BarChart3"
          delta={best ? `best: ${best.label}` : undefined}
          error={isError}
        />
      </div>

      <DataTable
        caption="Profit trend"
        columns={columns}
        data={rows}
        getRowId={(r) => r.key}
        loading={isLoading}
        error={isError ? "Couldn't load the profit trend." : null}
        onRetry={() => refetch()}
        empty={{
          icon: "TrendingUp",
          title: "No profit data yet",
          description: "Once you have bookings and expenses, your monthly and weekly profit will appear here.",
        }}
      />
    </div>
  )
}

export default PnlTrendCard
