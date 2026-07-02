"use client"

/**
 * Dashboard home (Overview) — redesigned (Track C, flagship landing surface).
 * Wired to AnalyticsAPI.getDashboardKpis() + getRecentBookings(); rendered
 * through the primitives. Read-only; original /dashboard home untouched.
 * Route /dashboard/overview-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { useUser } from "@/context/UserContext"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
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

const bookingTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("confirm")) return "success"
  if (v.includes("complete")) return "info"
  if (v.includes("cancel")) return "error"
  return "warning"
}
const payTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("partial")) return "warning"
  if (v.includes("refund")) return "neutral"
  if (v.includes("paid")) return "success"
  return "error"
}

interface RecentRow {
  id: number
  customerName: string
  eventType?: string
  bookingDate: string
  totalAmount: number | string
  status: string
  paymentStatus: string
}

export function OverviewRedesignedView() {
  const { user } = useUser()
  const firstName = (user?.fullName || "there").split(/\s+/)[0]
  const today = new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })
  // Per-venue scope: null = All venues (combined). Included in the query key so
  // switching venue refetches, and forwarded to the API as ?businessId=.
  const activeBusinessId = useActiveBusinessId()

  const kpisQ = useQuery({
    queryKey: ["overview-kpis-redesigned", activeBusinessId],
    queryFn: () => AnalyticsAPI.getDashboardKpis("this_year", undefined, undefined, activeBusinessId),
  })
  const recentQ = useQuery({
    queryKey: ["overview-recent-redesigned", activeBusinessId],
    queryFn: () => AnalyticsAPI.getRecentBookings(8, undefined, undefined, undefined, activeBusinessId),
  })
  // Owner cockpit: which hall earns the most? Always across ALL the owner's
  // venues (independent of the switcher) so a multi-hall owner can compare.
  const breakdownsQ = useQuery({
    queryKey: ["overview-hall-league"],
    queryFn: () => AnalyticsAPI.getRevenueBreakdowns("this_year"),
  })

  const k = kpisQ.data
  const recent = (recentQ.data?.bookings ?? []) as RecentRow[]

  const halls = React.useMemo(
    () => [...(breakdownsQ.data?.byBusiness ?? [])].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0)),
    [breakdownsQ.data],
  )
  const maxHallRev = halls.reduce((m, h) => Math.max(m, h.totalRevenue || 0), 0)
  const showHallLeague = halls.length > 1

  const columns: Column<RecentRow>[] = [
    { key: "customer", header: "Customer", render: (b) => <span className="font-medium">{b.customerName || "—"}</span> },
    { key: "event", header: "Event", cellClassName: "text-muted-foreground", render: (b) => cap(b.eventType) },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground", render: (b) => fmtDate(b.bookingDate) },
    { key: "amount", header: "Amount", align: "right", render: (b) => <MoneyCell amount={num(b.totalAmount)} /> },
    { key: "status", header: "Status", render: (b) => <StatusPill tone={bookingTone(b.status)}>{b.status}</StatusPill> },
    { key: "payment", header: "Payment", render: (b) => <StatusPill tone={payTone(b.paymentStatus)} variant="icon">{b.paymentStatus || "—"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Vendor console · Overview"
        title={`Welcome back, ${firstName}`}
        description={`${today} — at-a-glance signal for your business: bookings, revenue and what needs you.`}
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add booking</Button>}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total bookings" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.totalBookings?.value)} icon="Calendar" />
        <StatCard label="Revenue collected" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.totalRevenue?.value))} icon="Wallet" trend="up" delta="received" />
        <StatCard label="Revenue due" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :formatPkr(num(k?.revenueDue?.value))} icon="Clock" delta="to chase" />
        <StatCard label="Today's events" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.todaysEvents?.value)} icon="Star" />
        <StatCard label="Upcoming (7d)" value={kpisQ.isLoading ? "…" : kpisQ.isError ? "—" :num(k?.upcomingBookings?.value)} icon="TrendingUp" />
      </div>

      {/* Per-hall performance — the owner's "which hall wins?" league table.
          Only shown for multi-venue owners; single-hall vendors don't need it. */}
      {showHallLeague && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Per-hall performance <span className="font-normal normal-case tracking-normal text-xs">· revenue this year</span>
            </h2>
            <span className="text-xs text-muted-foreground">{halls.length} venues</span>
          </div>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {halls.map((h, i) => {
              const pct = maxHallRev > 0 ? Math.round(((h.totalRevenue || 0) / maxHallRev) * 100) : 0
              return (
                <div key={h.businessId} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${i === 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{h.businessName}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted">
                      <div className={`h-full rounded-full ${i === 0 ? "bg-primary" : "bg-primary/50"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{formatPkr(h.totalRevenue || 0)}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{h.bookingCount} booking{h.bookingCount === 1 ? "" : "s"}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent bookings</h2>
          <a href="/dashboard/bookings" className="text-sm font-medium text-primary hover:underline">
            View all →
          </a>
        </div>
        <DataTable
          columns={columns}
          data={recent}
          getRowId={(b) => String(b.id)}
          loading={recentQ.isLoading}
          error={recentQ.isError ? "Couldn't load recent bookings." : null}
          onRetry={() => recentQ.refetch()}
          empty={{
            icon: "Calendar",
            title: "No bookings yet",
            description: "Your most recent bookings will appear here as they come in.",
            action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add booking</Button>,
          }}
          renderCard={(b) => (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{b.customerName}</div>
                <div className="text-xs text-muted-foreground">{cap(b.eventType)} · {fmtDate(b.bookingDate)}</div>
                <div className="mt-1"><StatusPill tone={bookingTone(b.status)}>{b.status}</StatusPill></div>
              </div>
              <MoneyCell amount={num(b.totalAmount)} className="text-sm font-medium" />
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default OverviewRedesignedView
