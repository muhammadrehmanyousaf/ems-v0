"use client"

/**
 * Bookings — redesigned (Track C flagship). Wired to the REAL /api/v1/bookings
 * endpoint via the existing useFetchData hook, rendered entirely through the new
 * token-based primitives (PageHeader, StatCard, DataTable, StatusPill, MoneyCell,
 * ExportMenu). Behavior-frozen: read-only presentation over live data; the
 * original Bookings screen is untouched. Fully themes with the active palette.
 */

import * as React from "react"
import { useFetchData } from "@/hooks/use-fetch-data"
import type { BookingData, BookingStatus } from "@/lib/dashboard-types"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { OfflineBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog"
import { BookingRowActions } from "./booking-row-actions"

const statusTone = (s: BookingStatus): StatusTone =>
  s === "Confirmed" ? "success"
    : s === "Completed" ? "info"
    : s === "Cancelled" ? "error"
    : "warning"

const payTone = (p: string): StatusTone => {
  const v = (p || "").toLowerCase()
  if (v.includes("partial")) return "warning"
  if (v.includes("refund")) return "neutral"
  if (v.includes("paid")) return "success"
  return "error"
}

const serviceLabel = (b: BookingData) =>
  b.bookingDetails?.[0]?.package?.name ||
  b.bookingDetails?.[0]?.business?.name ||
  "Booking"

const fmtDate = (s?: string) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

export function BookingsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [bucket, setBucket] = React.useState<"active" | "completed">("active")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = React.useState(false)

  const { data, isLoading, isError, refetch } = useFetchData({
    endpoint: "/api/v1/bookings",
    queryKey: ["bookings-redesigned", bucket],
    Params: { page: 1, limit: 50, sortBy: "createdAt", sortOrder: "DESC", search: search || undefined, bucket },
  })

  const bookings: BookingData[] = data?.data?.data ?? []
  const total: number = data?.data?.filters?.total ?? bookings.length

  // Stats computed from the loaded page (labelled honestly).
  const collected = bookings.reduce((s, b) => s + (Number(b.downPayment) || 0), 0)
  const due = bookings.reduce((s, b) => s + Math.max(0, (Number(b.totalAmount) || 0) - (Number(b.downPayment) || 0)), 0)
  const thisMonth = bookings.filter((b) => {
    const d = new Date(b.bookingDate)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const columns: Column<BookingData>[] = [
    { key: "service", header: "Booking", render: (b) => <span className="font-medium">{serviceLabel(b)}</span> },
    { key: "customer", header: "Customer", cellClassName: "text-muted-foreground", render: (b) => b.customerName || "—" },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground", render: (b) => fmtDate(b.bookingDate) },
    { key: "amount", header: "Amount", align: "right", render: (b) => <MoneyCell amount={Number(b.totalAmount) || 0} /> },
    { key: "paid", header: "Paid", align: "right", render: (b) => <MoneyCell amount={Number(b.downPayment) || 0} tone="muted" /> },
    { key: "status", header: "Status", render: (b) => <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill> },
    { key: "payment", header: "Payment", render: (b) => <StatusPill tone={payTone(b.paymentStatus)} variant="icon">{b.paymentStatus || "—"}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (b) => <BookingRowActions data={b} onRefresh={() => refetch()} />,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Bookings"
        description="Every event with its payment status — redesigned, wired to live data."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" size={16} className="mr-1.5" /> Add booking
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total bookings" value={total} icon="Calendar" />
        <StatCard label="Collected (shown)" value={formatPkr(collected)} icon="Wallet" trend="up" delta="received" />
        <StatCard label="Due (shown)" value={formatPkr(due)} icon="Clock" delta="to chase" />
        <StatCard label="This month" value={thisMonth} icon="TrendingUp" />
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        getRowId={(b) => String(b.id)}
        loading={isLoading}
        error={isError ? "Couldn't load bookings." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Calendar",
          title: "No bookings yet",
          description: "When you log a booking it'll appear here with its payment status and timeline.",
          action: <Button size="sm" onClick={() => setCreateOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Add booking</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="flex rounded-md border border-input p-0.5">
              {(["active", "completed"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBucket(b)}
                  className={cn(
                    "h-8 rounded px-3 text-sm capitalize transition-colors",
                    bucket === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {b === "active" ? "Active" : "Archive"}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(b) => String(b.id)}
                rows={bookings}
                filename="bookings"
                columns={[
                  { header: "Booking", value: serviceLabel },
                  { header: "Customer", value: (b) => b.customerName },
                  { header: "Phone", value: (b) => b.customerPhone },
                  { header: "Date", value: (b) => fmtDate(b.bookingDate) },
                  { header: "Amount", value: (b) => Number(b.totalAmount) || 0 },
                  { header: "Paid", value: (b) => Number(b.downPayment) || 0 },
                  { header: "Status", value: (b) => b.status },
                  { header: "Payment", value: (b) => b.paymentStatus },
                ]}
              />
            </div>
          </>
        }
        renderCard={(b) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{serviceLabel(b)}</div>
              <div className="text-xs text-muted-foreground">{b.customerName} · {fmtDate(b.bookingDate)}</div>
              <div className="mt-1"><StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill></div>
            </div>
            <div className="text-right">
              <MoneyCell amount={Number(b.totalAmount) || 0} className="block text-sm font-medium" />
              <StatusPill tone={payTone(b.paymentStatus)} className="mt-1">{b.paymentStatus}</StatusPill>
            </div>
          </div>
        )}
      />

      <OfflineBookingDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => refetch()} />
    </div>
  )
}

export default BookingsRedesignedView
