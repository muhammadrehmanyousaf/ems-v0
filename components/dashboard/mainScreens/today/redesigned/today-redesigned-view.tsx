"use client"

/**
 * Today (day-of timeline) — redesigned (Track C, computed). Wired to
 * BookingTimelineAPI.today(); rendered through the primitives. Read-only;
 * Route /dashboard/today.
 *
 * Note: the live API returns events as { booking: {...}, tasks: [] } — we
 * normalise each into the flat row shape the screen renders against.
 */

import * as React from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BookingTimelineAPI, type TimelineTask } from "@/lib/api/bookingTimeline"
import { AnalyticsAPI } from "@/lib/api/analytics"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { RunSheetDialog } from "@/components/dashboard/mainScreens/today/run-sheet-dialog"
import { TimelineManagerDialog } from "@/components/dashboard/mainScreens/today/timeline-manager-dialog"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { outstandingOn } from "@/lib/utils/booking-money"

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
  downPayment: number | string | null
  orderStage: string | null
  orderGrand: number | null
  orderBalance: number | null
  businessId: number | null
  tasks: TimelineTask[]
}

/** Prefer the vendor's real order total over the legacy sticker when present. */
const amountOf = (e: TodayRow) => (e.orderGrand != null ? e.orderGrand : num(e.totalAmount))

/**
 * WWL-020 — the "due" line was gated on `orderBalance != null`, which only
 * exists once a booking has an order snapshot. A booking without one showed no
 * amount due at all, so on the day-of screen a customer owing Rs 315,000 read
 * as owing nothing — while the vendor was standing in front of them. Falls back
 * to the shared money rule, which is the same arithmetic the snapshot holds.
 */
const balanceOf = (e: TodayRow) =>
  e.orderBalance != null ? e.orderBalance : outstandingOn(e)

export function TodayRedesignedView() {
  const qc = useQueryClient()
  const [runSheet, setRunSheet] = React.useState<TodayRow | null>(null)
  const [manage, setManage] = React.useState<TodayRow | null>(null)
  // WWL-024 — this screen ignored the venue switcher completely: neither query
  // sent a businessId, and neither key contained one, so selecting a venue did
  // not even trigger a refetch. A vendor standing in one marquee was shown
  // every marquee's day.
  const activeBusinessId = useActiveBusinessId()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["today-redesigned", activeBusinessId],
    queryFn: () => BookingTimelineAPI.today(activeBusinessId),
  })
  // Outstanding is a running book-wide A/R balance, not a today figure — source
  // it from the receivables endpoint (same as the Receivables screen).
  const { data: receivables, isError: receivablesError } = useQuery({
    queryKey: ["today-outstanding", activeBusinessId],
    queryFn: () => AnalyticsAPI.getReceivables(activeBusinessId),
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
        downPayment: (e?.booking as { downPayment?: number | string | null })?.downPayment ?? null,
        orderStage: e?.booking?.orderStage ?? null,
        orderGrand: e?.booking?.orderGrand ?? null,
        orderBalance: e?.booking?.orderBalance ?? null,
        businessId: e?.booking?.primaryBusiness?.id ?? null,
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
  const revenueToday = rows.reduce((s, e) => s + amountOf(e), 0)
  const outstandingBalance = num(receivables?.totals?.grandOutstanding)

  const columns: Column<TodayRow>[] = [
    { key: "customer", header: "Customer", render: (e) => <span className="font-medium">{e.customerName || "—"}</span> },
    { key: "time", header: "Time", cellClassName: "text-muted-foreground", render: (e) => e.bookingTime || "—" },
    {
      key: "amount", header: "Amount", align: "right",
      render: (e) => {
        const due = balanceOf(e)
        return (
          <div className="flex flex-col items-end">
            <MoneyCell amount={amountOf(e)} />
            {due > 0 && (
              <span className="text-[11px] text-amber-600 dark:text-amber-500">{formatPkr(due)} due</span>
            )}
          </div>
        )
      },
    },
    { key: "status", header: "Status", render: (e) => <StatusPill tone={bookingTone(e.status)}>{e.status || "—"}</StatusPill> },
    { key: "tasks", header: "Tasks", align: "right", cellClassName: "tabular-nums", render: (e) => num(e.tasks?.length) },
    {
      key: "actions", header: "", align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => setManage(e)} aria-label="Manage timeline">
            <Icon name="ListChecks" size={14} className="mr-1" /> Timeline
          </Button>
          <Button size="sm" variant="ghost" disabled={!e.tasks?.length} onClick={() => setRunSheet(e)} aria-label="Open run sheet">
            <Icon name="Printer" size={14} className="mr-1" /> Run sheet
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Today"
        title={data?.date ? `Today — ${fmtDate(data.date)}` : "Today"}
        description="Everything happening on your calendar today: events, their day-of tasks, and what's still open."
        actions={<Button asChild><Link href="/dashboard/calendar"><Icon name="Calendar" size={16} className="mr-1.5" /> View timeline</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Events today" value={isLoading ? "…" : eventsToday} icon="Calendar" />
        <StatCard label="Total tasks" value={isLoading ? "…" : totalTasks} icon="CheckCircle2" />
        <StatCard label="Open tasks" value={isLoading ? "…" : openTasks} icon="Clock" delta="to complete" trend={openTasks > 0 ? "down" : "flat"} />
        <StatCard label="Revenue today" value={isLoading ? "…" : formatPkr(revenueToday)} icon="Wallet" />
        {/* WWL-021 — this is the whole book's A/R, not today's. It sat in a row
            of four cards that are all "today" figures, under a bare label, so
            it read as money owed on today's events. It now says which it is,
            and a failed load says so instead of quoting Rs 0. */}
        <StatCard
          label="Outstanding (all dates)"
          value={receivablesError ? "—" : formatPkr(outstandingBalance)}
          icon="Clock"
          delta={receivablesError ? "couldn't load" : outstandingBalance > 0 ? "to collect" : undefined}
        />
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
            <div className="flex flex-col items-end shrink-0 gap-1">
              <MoneyCell amount={amountOf(e)} className="text-sm font-medium" />
              {e.orderBalance != null && e.orderBalance > 0 && (
                <span className="text-[11px] text-amber-600 dark:text-amber-500">{formatPkr(e.orderBalance)} due</span>
              )}
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setManage(e)}>
                  <Icon name="ListChecks" size={13} className="mr-1" /> Timeline
                </Button>
                {!!e.tasks?.length && (
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setRunSheet(e)}>
                    <Icon name="Printer" size={13} className="mr-1" /> Run sheet
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      />

      <RunSheetDialog
        open={!!runSheet}
        onOpenChange={(v) => !v && setRunSheet(null)}
        subject={{ customerName: runSheet?.customerName ?? null, bookingDate: runSheet?.bookingDate ?? null, bookingTime: runSheet?.bookingTime ?? null, status: runSheet?.status ?? null }}
        tasks={runSheet?.tasks ?? []}
      />

      {manage && (
        <TimelineManagerDialog
          open={!!manage}
          onOpenChange={(v) => !v && setManage(null)}
          bookingId={manage.id}
          businessId={manage.businessId ?? undefined}
          anchorTime={manage.bookingTime}
          onChanged={() => qc.invalidateQueries({ queryKey: ["today-redesigned"] })}
        />
      )}
    </div>
  )
}

export default TodayRedesignedView
