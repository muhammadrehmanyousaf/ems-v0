"use client"

/**
 * Revenue — redesigned (Track C, computed). Wired to
 * AnalyticsAPI.getDashboardKpis() + getRevenueTrends(); rendered through the
 * primitives. Read-only; original /dashboard revenue screen untouched.
 * Route /dashboard/revenue-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI, type RevenueTrendItem } from "@/lib/api/analytics"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
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
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

export function RevenueRedesignedView() {
  const kpisQ = useQuery({
    queryKey: ["revenue-kpis-redesigned"],
    queryFn: () => AnalyticsAPI.getDashboardKpis(),
  })
  const trendsQ = useQuery({
    queryKey: ["revenue-trends-redesigned"],
    queryFn: () => AnalyticsAPI.getRevenueTrends(),
  })

  const kpis = kpisQ.data
  const rows = trendsQ.data?.data ?? []

  const bestMonth = React.useMemo(() => {
    if (!rows.length) return "—"
    return rows.reduce((best, r) => (num(r.revenue) > num(best.revenue) ? r : best), rows[0]).month || "—"
  }, [rows])

  const columns: Column<RevenueTrendItem>[] = [
    { key: "month", header: "Month", render: (r) => <span className="font-medium">{r.month || "—"}</span> },
    { key: "revenue", header: "Revenue", align: "right", render: (r) => <MoneyCell amount={num(r.revenue)} /> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Revenue"
        description="Your earnings over time — redesigned, wired to live revenue analytics."
        actions={<Button><Icon name="Download" size={16} className="mr-1.5" /> Export</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total revenue" value={kpisQ.isLoading ? "…" : formatPkr(num(kpis?.totalRevenue?.value))} icon="Wallet" trend="up" delta="collected" />
        <StatCard label="Revenue due" value={kpisQ.isLoading ? "…" : formatPkr(num(kpis?.revenueDue?.value))} icon="Clock" delta="to chase" />
        <StatCard label="Total bookings" value={kpisQ.isLoading ? "…" : num(kpis?.totalBookings?.value)} icon="Calendar" />
        <StatCard label="Best month" value={trendsQ.isLoading ? "…" : bestMonth} icon="Star" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => r.month}
        loading={trendsQ.isLoading}
        error={trendsQ.isError ? "Couldn't load revenue trends." : null}
        onRetry={() => trendsQ.refetch()}
        empty={{
          icon: "TrendingUp",
          title: "No revenue yet",
          description: "Your monthly revenue will appear here as bookings are paid.",
        }}
        toolbar={
          <div className="ml-auto flex items-center gap-2">
            <DensityToggle />
            <ExportMenu rows={rows} filename="revenue-trends" columns={[
              { header: "Month", value: (r) => r.month ?? "" },
              { header: "Revenue", value: (r) => num(r.revenue) },
            ]} />
          </div>
        }
        renderCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.month || "—"}</div>
              <div className="text-xs text-muted-foreground">Monthly revenue</div>
            </div>
            <MoneyCell amount={num(r.revenue)} className="text-sm font-medium" />
          </div>
        )}
      />
    </div>
  )
}

export default RevenueRedesignedView
