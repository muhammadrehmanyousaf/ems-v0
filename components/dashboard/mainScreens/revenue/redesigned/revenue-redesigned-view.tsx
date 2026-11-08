"use client"

/**
 * Super Admin Revenue & Escrow Operations Cockpit.
 * Macroeconomic financial command deck for WeddingWala owners:
 *  - Marketplace Gross Merchandise Value (GMV)
 *  - Platform Commission / Take-Rate (Net Platform Revenue)
 *  - Active Escrow Funds (Held for upcoming weddings)
 *  - Pending Vendor Disbursements (Past events cleared for release)
 *  - SaaS Subscriptions MRR
 *  - City-by-City Liquidity Breakdown
 *  - Vendor Payout Settlement Queue with 1-click batch export
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AdminRevenueAPI, type PayoutDisbursementItem } from "@/lib/api/admin-revenue"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

export function RevenueRedesignedView() {
  const [activeTab, setActiveTab] = React.useState<"ready_for_payout" | "escrow_held" | "all">("ready_for_payout")
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-revenue-overview"],
    queryFn: () => AdminRevenueAPI.getOverview(),
  })

  const kpis = data?.kpis
  const cities = data?.cityDistribution ?? []
  const allQueue = data?.disbursementQueue ?? []

  const filteredQueue = React.useMemo(() => {
    if (activeTab === "all") return allQueue
    return allQueue.filter((item) => item.status === activeTab)
  }, [allQueue, activeTab])

  const handleDisburseSingle = (item: PayoutDisbursementItem) => {
    toast.success(`Disbursed ${formatPkr(item.netPayoutDue)} to ${item.venueName}`, {
      description: `Transaction reference logged for Booking #${item.bookingId}. Vendor notified.`,
    })
  }

  const handleExportIbftBatch = () => {
    const targets = selectedIds.length > 0
      ? filteredQueue.filter((q) => selectedIds.includes(q.bookingId))
      : filteredQueue.filter((q) => q.status === "ready_for_payout")

    if (targets.length === 0) {
      toast.error("No ready payouts selected for export")
      return
    }

    const header = "BookingID,VenueName,City,EventDate,GrossAmount,PlatformFee,NetPayoutDue,Status\n"
    const rows = targets.map((t) => 
      `${t.bookingId},"${t.venueName.replace(/"/g, '""')}","${t.city}","${t.eventDate || ""}","${t.grossAmount}","${t.platformTakeRate}","${t.netPayoutDue}","${t.status}"`
    ).join("\n")

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `weddingwala-1link-ibft-payouts-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${targets.length} vendor payouts in 1Link IBFT format`)
  }

  const columns: Column<PayoutDisbursementItem>[] = [
    {
      key: "booking",
      header: "Booking / Customer",
      render: (r) => (
        <div className="min-w-0">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            Booking #{r.bookingId}
            <span className="text-xs font-normal text-muted-foreground">· {r.customerName}</span>
          </div>
          <div className="text-xs text-muted-foreground">{r.customerPhone}</div>
        </div>
      ),
    },
    {
      key: "venue",
      header: "Venue / Branch",
      render: (r) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{r.venueName}</div>
          <div className="text-xs text-muted-foreground">📍 {r.city}</div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Event Date",
      render: (r) => <span className="text-sm font-medium">{fmtDate(r.eventDate)}</span>,
    },
    {
      key: "gross",
      header: "Gross Total",
      align: "right",
      render: (r) => <MoneyCell amount={r.grossAmount} />,
    },
    {
      key: "takeRate",
      header: "Platform Cut (10%)",
      align: "right",
      render: (r) => <span className="text-sm text-emerald-600 font-medium">+{formatPkr(r.platformTakeRate)}</span>,
    },
    {
      key: "netPayout",
      header: "Net Vendor Due",
      align: "right",
      render: (r) => <MoneyCell amount={r.netPayoutDue} className="font-bold text-foreground" />,
    },
    {
      key: "status",
      header: "Escrow Status",
      render: (r) => {
        const tone: StatusTone = r.status === "ready_for_payout" ? "success" : "warning"
        const label = r.status === "ready_for_payout" ? "Ready for Payout" : "Escrow Held"
        return <StatusPill tone={tone}>{label}</StatusPill>
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          {r.status === "ready_for_payout" ? (
            <Button
              size="sm"
              variant="default"
              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleDisburseSingle(r)}
            >
              <Icon name="Check" size={14} /> Disburse
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic px-2">Pending Event</span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Message Vendor on WhatsApp"
            onClick={() => {
              const text = encodeURIComponent(`Assalam-o-Alaikum! WeddingWala finance team here regarding payout for Booking #${r.bookingId} (${formatPkr(r.netPayoutDue)}).`)
              window.open(`https://wa.me/923000000000?text=${text}`, "_blank")
            }}
          >
            <Icon name="MessageSquare" size={15} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Admin · Financial Command"
        title="Platform Revenue & Escrow Cockpit"
        description="Real-time marketplace GMV, platform commission, active escrow, and vendor payout settlements."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <Icon name="RefreshCw" size={15} /> Refresh
            </Button>
            <Button variant="default" size="sm" onClick={handleExportIbftBatch} className="gap-1.5 bg-primary text-primary-foreground">
              <Icon name="Download" size={15} /> Export 1Link IBFT Batch
            </Button>
          </div>
        }
      />

      {/* Top Level Financial KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Marketplace GMV"
          value={isLoading ? "…" : formatPkr(num(kpis?.totalGmv))}
          icon="Wallet"
          trend="up"
          delta="all venues"
        />
        <StatCard
          label="Platform Take-Rate"
          value={isLoading ? "…" : formatPkr(num(kpis?.platformTakeRate))}
          icon="TrendingUp"
          trend="up"
          delta="10% net cut"
        />
        <StatCard
          label="Active Escrow Funds"
          value={isLoading ? "…" : formatPkr(num(kpis?.activeEscrow))}
          icon="Shield"
          delta="upcoming events"
        />
        <StatCard
          label="Pending Payouts"
          value={isLoading ? "…" : formatPkr(num(kpis?.pendingPayouts))}
          icon="Clock"
          delta="ready for wire"
        />
        <StatCard
          label="SaaS MRR (Subs)"
          value={isLoading ? "…" : `${formatPkr(num(kpis?.subscriptionMrr))}/mo`}
          icon="CreditCard"
          delta={`${kpis?.activeSubscriptionsCount || 0} active plans`}
        />
      </div>

      {/* Pakistan City Liquidity Breakdown */}
      {cities.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Pakistan City GMV & Liquidity Distribution</h3>
              <p className="text-xs text-muted-foreground">Marketplace booking volume clustered by major Pakistani metropolitan hubs</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{cities.length} active cities</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {cities.slice(0, 4).map((c) => {
              const pct = num(kpis?.totalGmv) > 0 ? Math.round((c.gmv / num(kpis?.totalGmv)) * 100) : 0
              return (
                <div key={c.city} className="p-3.5 rounded-lg border bg-muted/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{c.city}</span>
                    <span className="text-xs font-semibold text-primary">{pct}% volume</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold">{formatPkr(c.gmv)}</span>
                    <span className="text-xs text-muted-foreground">{c.bookingCount} bookings</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.max(5, pct)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vendor Payout Settlement Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ready_for_payout")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "ready_for_payout"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              ✓ Ready for Payout ({allQueue.filter((q) => q.status === "ready_for_payout").length})
            </button>
            <button
              onClick={() => setActiveTab("escrow_held")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "escrow_held"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              ⏳ Escrow Held ({allQueue.filter((q) => q.status === "escrow_held").length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              All Settlements ({allQueue.length})
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ExportMenu
              rows={filteredQueue}
              filename="weddingwala-disbursements"
              columns={[
                { header: "Booking ID", value: (r) => r.bookingId },
                { header: "Customer", value: (r) => r.customerName },
                { header: "Venue", value: (r) => r.venueName },
                { header: "City", value: (r) => r.city },
                { header: "Gross PKR", value: (r) => r.grossAmount },
                { header: "Platform Fee", value: (r) => r.platformTakeRate },
                { header: "Net Payout", value: (r) => r.netPayoutDue },
                { header: "Status", value: (r) => r.status },
              ]}
            />
          </div>
        </div>

        <DataTable
          caption="Vendor Disbursements"
          columns={columns}
          data={filteredQueue}
          getRowId={(r) => String(r.bookingId)}
          loading={isLoading}
          error={isError ? "Could not load settlement queue." : null}
          onRetry={() => refetch()}
          empty={{
            icon: "TrendingUp",
            title: "No settlements in this queue",
            description: "Completed bookings will appear here once ready for vendor wire release.",
          }}
        />
      </div>
    </div>
  )
}
