"use client"

/**
 * Today (day-of timeline) — redesigned (Track C, computed). Wired to
 * BookingTimelineAPI.today(); rendered through the primitives. Read-only;
 * original screen untouched. Route /dashboard/today-new.
 *
 * Note: the live API returns events as { booking: {...}, tasks: [] } — we
 * normalise each into the flat row shape the screen renders against.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { BookingTimelineAPI, type TimelineTask } from "@/lib/api/bookingTimeline"
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
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const bookingTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("confirm")) return "success"
  if (v.includes("complete")) return "info"
  if (v.includes("cancel")) return "error"
  return "warning"
}

/** Flat row shape the screen renders against (per spec). */
interface TodayRow {
  id: number
  customerName: string | null
  customerPhone: string | null
  bookingDate: string | null
  bookingTime: string | null
  status: string
  totalAmount: number | string | null
  tasks: TimelineTask[]
}

export function TodayRedesignedView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["today-redesigned"],
    queryFn: () => BookingTimelineAPI.today(),
  })

  // Normalise the live { booking, tasks } events into flat rows.
  const rows: TodayRow[] = React.useMemo(
    () =>
      (data?.events ?? []).map((e) => ({
        id: e?.booking?.id,
        customerName: e?.booking?.customerName ?? null,
        customerPhone: e?.booking?.customerPhone ?? null,
        bookingDate: e?.booking?.bookingDate ?? null,
        bookingTime: e?.booking?.bookingTime ?? null,
        status: e?.booking?.status ?? "",
        totalAmount: e?.booking?.totalAmount ?? null,
        tasks: e?.tasks ?? [],
      })),
    [data],
  )

  const eventsToday = rows.length
  const totalTasks = rows.reduce((s, e) => s + (e.tasks?.length || 0), 0)
  const openTasks = rows.reduce(
    (s, e) => s + (e.tasks?.filter((t) => t?.status !== "done").length || 0),
    0,
  )
  const revenueToday = rows.reduce((s, e) => s + num(e.totalAmount), 0)

  const columns: Column<TodayRow>[] = [
    { key: "customer", header: "Customer", render: (e) => <span className="font-medium">{e.customerName || "—"}</span> },
    { key: "time", header: "Time", cellClassName: "text-muted-foreground", render: (e) => e.bookingTime || "—" },
    { key: "amount", header: "Amount", align: "right", render: (e) => <MoneyCell amount={num(e.totalAmount)} /> },
    { key: "status", header: "Status", render: (e) => <StatusPill tone={bookingTone(e.status)}>{e.status || "—"}</StatusPill> },
    { key: "tasks", header: "Tasks", align: "right", cellClassName: "tabular-nums", render: (e) => num(e.tasks?.length) },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Today"
        title={data?.date ? `Today — ${fmtDate(data.date)}` : "Today"}
        description="Everything happening on your calendar today: events, their day-of tasks, and what's still open."
        actions={<Button><Icon name="Calendar" size={16} className="mr-1.5" /> View timeline</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Events today" value={isLoading ? "…" : eventsToday} icon="Calendar" />
        <StatCard label="Total tasks" value={isLoading ? "…" : totalTasks} icon="CheckCircle2" />
        <StatCard label="Open tasks" value={isLoading ? "…" : openTasks} icon="Clock" delta="to complete" trend={openTasks > 0 ? "down" : "flat"} />
        <StatCard label="Revenue today" value={isLoading ? "…" : formatPkr(revenueToday)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(e) => String(e.id)}
        loading={isLoading}
        error={isError ? "Couldn't load today's schedule." : null}
        onRetry={() => refetch()}
        empty={{
          icon: "Calendar",
          title: "Nothing scheduled today",
          description: "Bookings and their day-of timelines for today will appear here.",
        }}
        renderCard={(e) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{e.customerName || "—"}</div>
              <div className="text-xs text-muted-foreground">
                {(e.bookingTime || "—")} · {num(e.tasks?.length)} tasks
              </div>
              <div className="mt-1"><StatusPill tone={bookingTone(e.status)}>{e.status || "—"}</StatusPill></div>
            </div>
            <MoneyCell amount={num(e.totalAmount)} className="text-sm font-medium" />
          </div>
        )}
      />
    </div>
  )
}

export default TodayRedesignedView
