"use client"

/**
 * Bookings — redesigned (Track C flagship). Wired to the REAL /api/v1/bookings
 * endpoint via the existing useFetchData hook, rendered entirely through the new
 * token-based primitives (PageHeader, StatCard, DataTable, StatusPill, MoneyCell,
 * ExportMenu). Behavior-frozen: read-only presentation over live data; the
 * original Bookings screen is untouched. Fully themes with the active palette.
 */

import * as React from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useFetchData } from "@/hooks/use-fetch-data"
import type { BookingData, BookingStatus } from "@/lib/dashboard-types"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { bookedOn, receivedOn, outstandingOn, derivedPaymentStatus } from "@/lib/utils/booking-money"
import { spaceNameOf } from "@/lib/utils/booking-space"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { OfflineBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog"
import { BookingRowActions } from "./booking-row-actions"
import { OwnerLedgerCard } from "@/components/bookings/owner-ledger-card"

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

const PAGE_SIZE = 50

const BUCKETS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Archive" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
] as const

type BucketValue = (typeof BUCKETS)[number]["value"]

const isBucket = (v: string | null | undefined): v is BucketValue =>
  !!v && BUCKETS.some((b) => b.value === v)

export function BookingsRedesignedView() {
  const [search, setSearch] = React.useState("")
  // Seed the bucket from the URL so the sidebar panel can link straight to a
  // view — /dashboard/bookings?bucket=completed — and so that view survives a
  // refresh and can be pasted to a colleague. The in-page toggle still owns it
  // afterwards; this only decides where you land.
  const searchParams = useSearchParams()
  const urlBucket = searchParams?.get("bucket")
  const [bucket, setBucket] = React.useState<BucketValue>(
    isBucket(urlBucket) ? urlBucket : "active",
  )
  const [page, setPage] = React.useState(1)
  const router = useRouter()
  // `usePathname` is typed `string | null`; falling back to this screen's own
  // route keeps the filter shareable even in the null case rather than throwing.
  const pathname = usePathname() ?? "/dashboard/bookings"

  /**
   * ...and write it back, which the toggle never did.
   *
   * The URL only SEEDED the bucket — "the in-page toggle still owns it
   * afterwards" — so switching to Cancelled changed 9 rows to 3 and left the
   * address bar reading /dashboard/bookings. Reload and you are silently back on
   * Active looking at a different set of bookings; copy the link to a colleague
   * and they get Active too. The three cancelled bookings this filter exists to
   * surface were reachable but not RE-reachable.
   *
   * `replace`, not `push`: a filter is not a destination, and four taps through
   * the group should not cost four presses of Back to leave the page. `active`
   * drops the parameter entirely rather than writing the default into the URL.
   */
  const applyBucket = React.useCallback((next: BucketValue) => {
    setBucket(next)
    setPage(1)
    const params = new URLSearchParams(searchParams?.toString() ?? "")
    if (next === "active") params.delete("bucket")
    else params.set("bucket", next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [createOpen, setCreateOpen] = React.useState(false)

  const { data, isLoading, isError, refetch } = useFetchData({
    endpoint: "/api/v1/bookings",
    queryKey: ["bookings-redesigned", bucket, String(page)],
    Params: { page, limit: PAGE_SIZE, sortBy: "createdAt", sortOrder: "DESC", search: search || undefined, bucket },
  })

  const bookings: BookingData[] = data?.data?.data ?? []
  const filters = data?.data?.filters
  const total: number = filters?.total ?? bookings.length
  // WWL-043 — the server caps a page at 100 rows and this screen had no
  // pagination control of any kind, so a venue past that line lost rows with
  // no message while "Collected (shown)" and "Due (shown)" quietly understated
  // the money. The tiles were honestly labelled, but nothing told the vendor
  // that "shown" had been capped by the server rather than by their filter.
  const totalPages: number = filters?.totalPages ?? 1
  const isTruncated = total > bookings.length

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
    // WWL-050 — this rendered "—" on all 22 rows and exported an empty column
    // in every CSV. It read `resource.label`, which only ever resolves for
    // venues that built BusinessResource rows in the older capacity screen; the
    // halls a vendor actually builds live in the SubVenue tree, and that is what
    // a booking now records. `resource` stays as the fallback for the venues
    // that did use it.
    {
      key: "space",
      header: "Space",
      cellClassName: "text-muted-foreground",
      render: (b) => spaceNameOf(b) || <span title="No hall recorded for this booking">—</span>,
    },
    { key: "customer", header: "Customer", cellClassName: "text-muted-foreground", render: (b) => b.customerName || "—" },
    { key: "date", header: "Date", cellClassName: "text-muted-foreground whitespace-nowrap", render: (b) => fmtDate(b.bookingDate) },
    { key: "amount", header: "Amount", align: "right", render: (b) => <MoneyCell amount={bookedOn(b)} /> },
    { key: "paid", header: "Paid", align: "right", render: (b) => <MoneyCell amount={receivedOn(b)} tone="muted" /> },
    // WWL-037 — a row showing Rs 1,546,000 booked and Rs 386,500 paid also
    // carried a green "Paid" chip, because the chip printed the stored flag
    // while the two columns beside it printed the amounts. The chip now
    // describes the same arithmetic the row already shows.
    { key: "balance", header: "Balance", align: "right", render: (b) => <MoneyCell amount={outstandingOn(b)} /> },
    { key: "status", header: "Status", render: (b) => <StatusPill tone={statusTone(b.status)}>{b.status}</StatusPill> },
    { key: "payment", header: "Payment", render: (b) => { const d = derivedPaymentStatus(b); return <StatusPill tone={payTone(d)} variant="icon">{d}</StatusPill> } },
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
        description="Every event with its payment status."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Icon name="Plus" size={16} className="mr-1.5" /> Add booking
          </Button>
        }
      />

      {/* WWL-052 — on a failed load the money tiles printed Rs 0 with a green
          upward arrow beside the word "received", which is indistinguishable
          from a vendor who has collected nothing. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total bookings" value={isError ? "—" : total} icon="Calendar" />
        <StatCard
          label={isTruncated ? `Collected (this page)` : "Collected"}
          value={isError ? "—" : formatPkr(collected)}
          icon="Wallet"
          trend={isError ? undefined : "up"}
          delta={isError ? "couldn't load" : "received"}
        />
        <StatCard
          label={isTruncated ? `Due (this page)` : "Due"}
          value={isError ? "—" : formatPkr(due)}
          icon="Clock"
          delta={isError ? "couldn't load" : "to chase"}
        />
        <StatCard label="This month" value={isError ? "—" : thisMonth} icon="TrendingUp" />
      </div>

      {isTruncated && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
          Showing {bookings.length} of {total} bookings. The two money figures above
          cover this page only — page through to see the rest.
        </p>
      )}

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Bookings"
        columns={columns}
        data={bookings}
        getRowId={(b) => String(b.id)}
        /**
         * Clicking a booking did nothing. Measured on production: the row has no
         * link, no handler and `cursor: auto`, so the only way into a booking
         * was the two icon buttons at the far right of an eleven-column row that
         * scrolls sideways at laptop width — and the "balance due" panel lower
         * down the page, which only lists bookings that still owe money. A
         * fully-PAID booking had no route to its own detail page from this
         * screen at all, while /dashboard/bookings/173 has existed and rendered
         * in full the whole time.
         */
        rowHref={(b) => `/dashboard/bookings/${b.id}`}
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
            {/* WWL-036 — there were only two tabs, and Cancelled bookings are
                hidden from "active" and absent from "completed". Three real
                cancelled bookings were therefore unreachable from anywhere in
                the entire Bookings module. */}
            <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Filter bookings">
              {BUCKETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  aria-pressed={bucket === b.value}
                  onClick={() => applyBucket(b.value)}
                  className={cn(
                    "h-8 rounded px-3 text-sm transition-colors",
                    bucket === b.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {b.label}
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
                  // WWL-048/WWL-050 — exported blank in every row because the
                  // payload carried no space at all.
                  { header: "Space", value: (b) => spaceNameOf(b) || "" },
                  { header: "Customer", value: (b) => b.customerName },
                  { header: "Phone", value: (b) => b.customerPhone },
                  { header: "Date", value: (b) => fmtDate(b.bookingDate) },
                  // WWL-047 — the export carried the stored flag, so the wrong
                  // "Paid" travelled out of the product and into whatever the
                  // vendor's accountant opened the file with. Balance is now a
                  // column in its own right and Payment states the arithmetic.
                  { header: "Amount", value: (b) => bookedOn(b) },
                  { header: "Paid", value: (b) => receivedOn(b) },
                  { header: "Balance", value: (b) => outstandingOn(b) },
                  { header: "Status", value: (b) => b.status },
                  { header: "Payment", value: (b) => derivedPaymentStatus(b) },
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
              <MoneyCell amount={bookedOn(b)} className="block text-sm font-medium" />
              {outstandingOn(b) > 0 && (
                <span className="block text-xs text-muted-foreground">
                  Rs {outstandingOn(b).toLocaleString()} due
                </span>
              )}
              <StatusPill tone={payTone(derivedPaymentStatus(b))} className="mt-1">{derivedPaymentStatus(b)}</StatusPill>
            </div>
          </div>
        )}
      />

      {/* WWL-043 — the only way past row 100 of the ledger. */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Bookings pages">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {total} bookings
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <Icon name="ChevronLeft" size={14} className="mr-1" /> Previous
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next <Icon name="ChevronRight" size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}

      {/* Phase-1 SPINE — owner money ledger. Moved BELOW the table: it repeats
          the money the stat strip already shows (booked / received / baqaya),
          and sitting above the table it pushed the first booking row 1,307px
          down a 900px window. A summary belongs after the thing it summarises. */}
      <OwnerLedgerCard />

      <OfflineBookingDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => refetch()} />
    </div>
  )
}

export default BookingsRedesignedView
