"use client"

/**
 * Payments (revenue) — redesigned (Track C, computed). Wired to
 * PaymentsAPI.getVendorRevenue(); rendered through the primitives. Read-only;
 * Route /dashboard/payments.
 */

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { PaymentsAPI } from "@/lib/api/dashboard"
// WWL-114 — the venue the header is scoped to. The request already carries it
// via the axios interceptor; the cache key has to as well.
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import type { VendorPayment } from "@/lib/dashboard-types"
import { ReceiptFormDialog } from "@/components/dashboard/mainScreens/receipts/redesigned/receipt-form-dialog"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const payTone = (s?: string): StatusTone => {
  const v = (s || "").toLowerCase()
  if (v.includes("partial")) return "warning"
  if (v.includes("refund")) return "neutral"
  if (v.includes("paid")) return "success"
  return "error"
}

export function PaymentsRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["payments-redesigned"] })

  /**
   * WWL-114 — offline, the venue switcher lied about scope.
   *
   * Switching to Rehman Grand Marquee updated the switcher label and the
   * persisted store, but the table still showed all 25 rows across 3 venues and
   * the cards still read Rs 37,348,900 — Grand Marquee's real total is
   * Rs 12,873,800. No error, no toast, no offline banner: one venue named,
   * three venues' money.
   *
   * The scope is applied by the axios interceptor from the active-business
   * store, so the REQUEST changed but the cache key did not — TanStack handed
   * back the previous venue's entry, and a failed refetch left it on screen.
   *
   * Keying by the active venue makes each venue its own cache entry, so a
   * switch can only ever show that venue's data or an honest loading state.
   */
  const activeBusinessId = useActiveBusinessId()

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["payments-redesigned", activeBusinessId ?? "all"],
    queryFn: () => PaymentsAPI.getVendorRevenue(),
  })

  const stats = data?.stats
  const all = (data?.payments ?? []) as VendorPayment[]

  /**
   * WWL-118 (S3) — this table had no sorting and no money filters. Fixed order
   * was event-date DESC, so future events sat on top, and search matched neither
   * an amount nor a status. A vendor could not ask the two questions a money
   * screen exists to answer: "who owes me the most" and "who is overdue".
   *
   * WWL-115 (S3) — the stat cards read `stats` while the table read `payments`,
   * so filtering to one venue showed 7 rows under a headline describing all 25.
   * The cards below are now computed from the rows on screen.
   */
  const [dueOnly, setDueOnly] = React.useState(false)
  const [sort, setSort] = React.useState<"date" | "due" | "total">("date")

  const payments = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = all
    if (q) {
      rows = rows.filter((p) =>
        [p.customerName, p.customerPhone, p.businessName, p.paymentStatus].some((v) =>
          (v ?? "").toLowerCase().includes(q),
        ) ||
        // Amounts are what a vendor actually searches for on a money screen.
        [p.totalAmount, p.received, p.due].some((v) => String(Math.round(num(v))).includes(q.replace(/[,\s]/g, ""))),
      )
    }
    if (dueOnly) rows = rows.filter((p) => num(p.due) > 0)
    const sorted = [...rows]
    if (sort === "due") sorted.sort((a, b) => num(b.due) - num(a.due))
    else if (sort === "total") sorted.sort((a, b) => num(b.totalAmount) - num(a.totalAmount))
    return sorted
  }, [all, search, dueOnly, sort])

  // WWL-115 — headline describes exactly the rows beneath it.
  const shownStats = React.useMemo(
    () => ({
      total: payments.reduce((s, p) => s + num(p.totalAmount), 0),
      received: payments.reduce((s, p) => s + num(p.received), 0),
      due: payments.reduce((s, p) => s + num(p.due), 0),
      count: payments.length,
    }),
    [payments],
  )

  // WWL-128 (S3) — the endpoint computes an offline/online split on every
  // response (live: 11 offline / Rs 18,183,350 vs 14 online / Rs 19,165,550) and
  // the UI rendered it nowhere. For a Pakistani venue the cash-vs-digital split
  // is one of the most useful numbers on the screen.
  const offline = stats?.offline
  const online = stats?.online
  const hasSplit = num(offline?.count) > 0 || num(online?.count) > 0

  // Show a Venue column only when the rows actually span more than one venue
  // (the "All venues" view for a multi-hall owner) — otherwise it's redundant.
  const multiVenue = React.useMemo(
    () => new Set(all.map((p) => p.businessName).filter(Boolean)).size > 1,
    [all],
  )

  const columns: Column<VendorPayment>[] = [
    { key: "customer", header: "Customer", sortKey: "customer", sortValue: (p) => p.customerName || "", render: (p) => <span className="font-medium">{p.customerName || "—"}</span> },
    ...(multiVenue
      ? [{ key: "venue", header: "Venue", cellClassName: "text-muted-foreground", render: (p: VendorPayment) => <span className="truncate">{p.businessName || "—"}</span> }]
      : []),
    { key: "date", header: "Event date", cellClassName: "text-muted-foreground", sortKey: "date", sortValue: (p) => p.bookingDate || null, render: (p) => fmtDate(p.bookingDate) },
    { key: "total", header: "Total", align: "right", sortKey: "total", sortValue: (p) => num(p.totalAmount), render: (p) => <MoneyCell amount={num(p.totalAmount)} /> },
    { key: "received", header: "Received", align: "right", sortKey: "received", sortValue: (p) => num(p.received), render: (p) => <MoneyCell amount={num(p.received)} tone="success" /> },
    { key: "due", header: "Due", align: "right", sortKey: "due", sortValue: (p) => num(p.due), render: (p) => <MoneyCell amount={num(p.due)} tone={num(p.due) > 0 ? "warning" : "muted"} /> },
    { key: "status", header: "Payment", render: (p) => <StatusPill tone={payTone(p.paymentStatus)} variant="icon">{p.paymentStatus || "—"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Payments"
        description="Revenue collected and outstanding per booking."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Record a receipt</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total billed" value={isLoading ? "…" : formatPkr(shownStats.total)} icon="Wallet" error={isError} />
        <StatCard label="Received" value={isLoading ? "…" : formatPkr(shownStats.received)} icon="CheckCircle2" trend="up" delta="collected" error={isError} />
        <StatCard label="Due" value={isLoading ? "…" : formatPkr(shownStats.due)} icon="Clock" delta="to chase" error={isError} />
        {/* WWL-121 — with the table correctly showing "Couldn't load payments", the
            headline cards read Rs 0 / Rs 0 / Rs 0 / 0. An error is not a zero. */}
        <StatCard label="Payments" value={isLoading ? "…" : shownStats.count} icon="FileText" error={isError} />
      </div>

      {/* WWL-128 — cash vs digital, which the API has always returned. */}
      {hasSplit && !isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Cash / offline</div>
            <div className="text-xl font-semibold tabular-nums">{formatPkr(num(offline?.total))}</div>
            <div className="text-xs text-muted-foreground">
              {num(offline?.count)} payment{num(offline?.count) === 1 ? "" : "s"} · {formatPkr(num(offline?.received))} received
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Card / online</div>
            <div className="text-xl font-semibold tabular-nums">{formatPkr(num(online?.total))}</div>
            <div className="text-xs text-muted-foreground">
              {num(online?.count)} payment{num(online?.count) === 1 ? "" : "s"} · {formatPkr(num(online?.received))} received
            </div>
          </div>
        </div>
      )}

      {/* WWL-118 — the two questions a money screen exists to answer. */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Show:</span>
        <button
          type="button"
          onClick={() => setDueOnly((v) => !v)}
          aria-pressed={dueOnly}
          className={cn(
            "rounded-md border px-2.5 py-1 transition-colors",
            dueOnly ? "border-amber-400 bg-amber-50 font-medium text-amber-900" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Still owed
        </button>
        <span className="ml-2 text-muted-foreground">Sort:</span>
        {([["date", "Event date"], ["due", "Most owed"], ["total", "Biggest"]] as const).map(([k, lbl]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSort(k)}
            aria-pressed={sort === k}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors",
              sort === k ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {lbl}
          </button>
        ))}
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Payments"
        columns={columns}
        data={payments}
        getRowId={(p) => String(p.bookingId)}
        loading={isLoading}
        error={isError ? "Couldn't load payments." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Wallet",
          title: "No payments yet",
          description: "Payments against your bookings will appear here as they come in.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search payments…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(p) => String(p.bookingId)} rows={payments} filename="payments" columns={[
                { header: "Customer", value: (p) => p.customerName ?? "" },
                { header: "Phone", value: (p) => p.customerPhone ?? "" },
                { header: "Venue", value: (p) => p.businessName ?? "" },
                { header: "Event date", value: (p) => fmtDate(p.bookingDate) },
                { header: "Total", value: (p) => num(p.totalAmount) },
                { header: "Received", value: (p) => num(p.received) },
                { header: "Due", value: (p) => num(p.due) },
                { header: "Status", value: (p) => p.paymentStatus ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(p) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{p.customerName}</div>
              {multiVenue && p.businessName && <div className="truncate text-xs font-medium text-muted-foreground">{p.businessName}</div>}
              <div className="text-xs text-muted-foreground">{fmtDate(p.bookingDate)}</div>
              <div className="mt-1"><StatusPill tone={payTone(p.paymentStatus)} variant="icon">{p.paymentStatus}</StatusPill></div>
            </div>
            <div className="text-right">
              <MoneyCell amount={num(p.received)} tone="success" className="block text-sm font-medium" />
              {num(p.due) > 0 && <MoneyCell amount={num(p.due)} tone="warning" className="block text-xs" />}
            </div>
          </div>
        )}
      />

      <ReceiptFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={invalidate} />
    </div>
  )
}

export default PaymentsRedesignedView
