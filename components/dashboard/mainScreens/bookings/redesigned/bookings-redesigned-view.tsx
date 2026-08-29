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
import { bookingStatusLabel } from "@/lib/booking-status-label"
import { OfflineBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog"
import { BookingRowActions } from "./booking-row-actions"
// import { OwnerLedgerCard } from "@/components/bookings/owner-ledger-card"
import { AssignSpaceDialog } from "@/components/dashboard/shared/assign-space-dialog"

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

/**
 * Exactly the fields `bookingController` will sort on — its `allowedSort`, no
 * more. Asking for anything else is silently ignored by the server and would
 * leave a header that highlights itself and changes nothing.
 *
 * Paid and Balance are deliberately absent: both are computed on the client
 * from totalAmount and downPayment, so the server cannot order by them, and
 * sorting them here would order the 50 rows on this page and misreport every
 * row past it.
 */
const SERVER_SORTABLE = ["createdAt", "bookingDate", "status", "totalAmount", "customerName"]

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
  // Which booking's hall is being set, from the Space column. See that column.
  const [assignFor, setAssignFor] = React.useState<number | null>(null)

  /**
   * Sort — server-side, because the list is paged server-side.
   *
   * The API has accepted sortBy/sortOrder the whole time; this screen sent
   * `createdAt DESC` and nothing else, and none of the eleven headers was a
   * control. A vendor could not order 22 events by date or by amount.
   *
   * In the URL for the same reason the bucket is: a sorted view a reload throws
   * away is a view you cannot come back to or send to anyone.
   */
  const urlSort = searchParams?.get("sort")
  const urlDir = searchParams?.get("dir")
  const [sortBy, setSortBy] = React.useState<string>(
    SERVER_SORTABLE.includes(urlSort ?? "") ? (urlSort as string) : "createdAt",
  )
  const [sortOrder, setSortOrder] = React.useState<"ASC" | "DESC">(urlDir === "ASC" ? "ASC" : "DESC")

  const applySort = React.useCallback((key: string, order: "ASC" | "DESC") => {
    setSortBy(key)
    setSortOrder(order)
    setPage(1)
    const params = new URLSearchParams(searchParams?.toString() ?? "")
    if (key === "createdAt" && order === "DESC") { params.delete("sort"); params.delete("dir") }
    else { params.set("sort", key); params.set("dir", order) }
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  const { data, isLoading, isError, refetch } = useFetchData({
    endpoint: "/api/v1/bookings",
    queryKey: ["bookings-redesigned", bucket, String(page), sortBy, sortOrder],
    Params: { page, limit: PAGE_SIZE, sortBy, sortOrder, search: search || undefined, bucket },
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
    /**
     * The em-dash is now the way to fix the em-dash.
     *
     * 135 of 139 booking lines on the platform carry no space; this vendor has
     * eleven halls and eight of nine bookings reading "—". The column stated a
     * problem and offered nothing, and those same unassigned bookings downgrade
     * every space to PARTIAL in the availability grid.
     *
     * The machinery to fix it was all already built and all already working —
     * GET/PATCH /api/v1/bookings/:id/space, the BookingSpaceAPI client,
     * AssignSpaceDialog, and `isSpaceUnassigned` in booking-space.ts described
     * in its own comment as "the 'Assign hall' prompt". The only route to it was
     * the row's ⋯ menu → Quick view → the sheet, and that ⋯ button sits at
     * x = 1467 on a 1425px viewport. A finished feature behind a control that
     * was off the edge of the screen.
     */
    {
      key: "space",
      header: "Space",
      cellClassName: "text-muted-foreground",
      render: (b) => {
        const name = spaceNameOf(b)
        if (name) return name
        return (
          <button
            type="button"
            // The row is a link now; setting a hall must not also open the booking.
            onClick={(e) => { e.stopPropagation(); setAssignFor(b.id) }}
            className="rounded px-1.5 py-0.5 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Set hall
          </button>
        )
      },
    },
    { key: "customer", header: "Customer", sortKey: "customerName", cellClassName: "text-muted-foreground", render: (b) => b.customerName || "—" },
    { key: "date", header: "Date", sortKey: "bookingDate", cellClassName: "text-muted-foreground whitespace-nowrap", render: (b) => fmtDate(b.bookingDate) },
    { key: "amount", header: "Amount", sortKey: "totalAmount", align: "right", render: (b) => <MoneyCell amount={bookedOn(b)} /> },
    { key: "paid", header: "Paid", align: "right", render: (b) => <MoneyCell amount={receivedOn(b)} tone="muted" /> },
    // WWL-037 — a row showing Rs 1,546,000 booked and Rs 386,500 paid also
    // carried a green "Paid" chip, because the chip printed the stored flag
    // while the two columns beside it printed the amounts. The chip now
    // describes the same arithmetic the row already shows.
    { key: "balance", header: "Balance", align: "right", render: (b) => <MoneyCell amount={outstandingOn(b)} /> },
    { key: "status", header: "Status", render: (b) => <StatusPill tone={statusTone(b.status)}>{bookingStatusLabel(b)}</StatusPill> },
    { key: "payment", header: "Payment", render: (b) => { const d = derivedPaymentStatus(b); return <StatusPill tone={payTone(d)} variant="icon">{d}</StatusPill> } },
    {
      key: "actions", header: "", align: "right",
      render: (b) => <BookingRowActions data={b} onRefresh={() => refetch()} />,
    },
  ]

  return (
    /* `grow` + flex-col, not `space-y-6`: the shell's scroll container is a
       flex column, so the page can claim the height it was given instead of
       stopping at its content. With the Receivables ledger hidden, a filtered
       list of one booking left 484px of bare white below the card (measured,
       1680×950) — the table now ends where the screen ends, which is what the
       card border made you expect in the first place. On a long list `grow`
       does nothing at all: there is no free space to claim. */
    <div className="flex grow flex-col gap-6 p-4 md:p-6">
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
        // Absorbs the slack when the list is shorter than the pane. `className`
        // lands on DataTable's own card, so no other screen using it changes.
        className="grow"
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
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={applySort}
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
              <div className="mt-1"><StatusPill tone={statusTone(b.status)}>{bookingStatusLabel(b)}</StatusPill></div>
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

      {/* The "Receivables" ledger — hidden at the founder's direction
          (2026-08-29): "we will do something else for that but for now remove
          it too". Commented, not deleted; components/bookings/owner-ledger-card
          .tsx and its /booking-order ledger endpoint are untouched.

          Worth knowing when the replacement is designed: this card was already
          the second telling of the same money. The stat strip at the top of
          this page shows Total bookings / Collected / Due; the card repeated
          booked / received / baqaya underneath, then listed 40 rows of balance
          due. It also sat ABOVE the table once, where it pushed the first
          booking row 1,307px down a 900px window — a summary belongs after the
          thing it summarises, and that constraint still applies to whatever
          replaces it. */}
      {/* <OwnerLedgerCard /> */}

      <OfflineBookingDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={() => refetch()} />

      {/* Set a hall straight from the Space column. Refetching on close rather
          than on success because the dialog reports through its own query — a
          list that still says "—" after you set a hall is the reason nobody
          trusts a screen. */}
      <AssignSpaceDialog
        bookingId={assignFor}
        open={assignFor != null}
        onOpenChange={(o) => { if (!o) { setAssignFor(null); void refetch() } }}
      />
    </div>
  )
}

export default BookingsRedesignedView
