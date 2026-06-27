"use client"

/**
 * Insights (Grow) — redesigned (Track C, computed). Wired to
 * InsightsAPI.getAdvanced(); rendered through the primitives. Read-only;
 * original screen untouched. Route /dashboard/insights-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { InsightsAPI, type InsightsAdvanced, type FunnelRow } from "@/lib/api/insights"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

/** Percent helper: accepts a 0–1 ratio or an already-scaled 0–100 value. */
const pct = (v: number | string | null | undefined) => {
  const n = num(v)
  return (n <= 1 ? n * 100 : n).toFixed(0) + "%"
}

export function InsightsRedesignedView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insights-advanced-redesigned"],
    queryFn: () => InsightsAPI.getAdvanced(),
  })

  const d = data as InsightsAdvanced | null | undefined
  const rows = (d?.funnel ?? []) as FunnelRow[]

  const columns: Column<FunnelRow>[] = [
    { key: "source", header: "Source", render: (r) => <span className="font-medium">{cap(r.source)}</span> },
    { key: "total", header: "Leads", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.total) },
    { key: "contacted", header: "Contacted", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.contacted) },
    { key: "quoted", header: "Quoted", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.quoted) },
    { key: "booked", header: "Booked", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.booked) },
    { key: "bookingRate", header: "Booking rate", align: "right", cellClassName: "tabular-nums", render: (r) => pct(r.bookingRate) },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Insights"
        description="Where your bookings come from, and how leads convert — redesigned, wired to live analytics."
        actions={<Button><Icon name="Download" size={16} className="mr-1.5" /> Export report</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Unique customers" value={isLoading ? "…" : num(d?.customers?.unique)} icon="Users" />
        <StatCard label="Repeat rate" value={isLoading ? "…" : pct(d?.customers?.repeatRate)} icon="Star" />
        <StatCard label="Quote acceptance" value={isLoading ? "…" : pct(d?.quotes?.quoteAcceptanceRate)} icon="CheckCircle2" />
        <StatCard label="Mean LTV" value={isLoading ? "…" : formatPkr(num(d?.customers?.meanLtv))} icon="Wallet" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lead source funnel</h2>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(r) => r.source}
          loading={isLoading}
          error={isError ? "Couldn't load insights." : null}
          onRetry={() => refetch()}
          empty={{
            icon: "TrendingUp",
            title: "No funnel data yet",
            description: "As leads come in and convert, your source-by-source funnel will appear here.",
          }}
          renderCard={(r) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{cap(r.source)}</div>
                <div className="text-xs text-muted-foreground">
                  {num(r.total)} leads · {num(r.booked)} booked
                </div>
              </div>
              <div className="text-sm font-medium tabular-nums">{pct(r.bookingRate)}</div>
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default InsightsRedesignedView
