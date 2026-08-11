"use client"

/**
 * Receivables (A/R) — redesigned (Track C, computed). Wired to
 * AnalyticsAPI.getReceivables(); rendered through the primitives. Read-only;
 * Route /dashboard/receivables.
 */

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI, type ReceivablesData, type ReceivablesBucketKey } from "@/lib/api/analytics"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { karachiTimeLabel } from "@/lib/utils/pk-date"

type ReceivablesCustomer = ReceivablesData["customers"][number]

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")

// PK phone normaliser → wa.me link (parity with original receivables screen)
const waLink = (phone: string | null | undefined, name: string | null | undefined, outstanding: number) => {
  if (!phone) return null
  let p = phone.replace(/[^\d+]/g, "")
  if (p.startsWith("+")) p = p.slice(1)
  if (p.startsWith("0")) p = "92" + p.slice(1)
  if (p.startsWith("3") && p.length === 10) p = "92" + p
  const greeting = name ? `Assalam-o-Alaikum ${name} sahab,` : "Assalam-o-Alaikum,"
  const text = encodeURIComponent(
    `${greeting}\n\nYeh aap k booking k against Rs ${Math.round(outstanding).toLocaleString("en-PK")} ka outstanding balance hai. Kindly clear karwa dein. Shukriya.`,
  )
  return `https://wa.me/${p}?text=${text}`
}

/**
 * WWL-131 — the whole aging column rendered green, including customers 99 days
 * overdue. The old test was `v.includes("current") || v.includes("0")`, and it
 * ran first: every bucket the API emits — `days_1_30`, `days_31_60`,
 * `days_61_90`, `days_90_plus` — contains a "0", so every row matched the
 * success branch and nothing ever reached the error branch below it. On a
 * screen whose entire job is showing who is late, nobody was ever late.
 *
 * Keyed off the exact values the API sends (analyticsController `bucketKey`)
 * rather than substring guesses.
 */
// WWL-139 — the labels were rendered through `cap()`, which upper-cases and
// swaps underscores for spaces, so the column read "Days 1 30" / "Days 31 60" /
// "Days 90 plus". Enum formatting applied to something a human has to read as a
// range. Written out here instead.
const BUCKETS: Record<string, { tone: StatusTone; label: string }> = {
  current: { tone: "success", label: "Current" },
  days_1_30: { tone: "info", label: "1–30 days" },
  days_31_60: { tone: "warning", label: "31–60 days" },
  days_61_90: { tone: "error", label: "61–90 days" },
  days_90_plus: { tone: "error", label: "90+ days" },
}

const bucketTone = (b?: string): StatusTone => BUCKETS[(b || "").toLowerCase()]?.tone ?? "neutral"
const bucketLabel = (b?: string): string => BUCKETS[(b || "").toLowerCase()]?.label ?? "—"

/** Oldest-first — the order a vendor chases in, and the order the API buckets in. */
const BUCKET_ORDER: ReceivablesBucketKey[] = ["days_90_plus", "days_61_90", "days_31_60", "days_1_30", "current"]

const BUCKET_BAR: Record<string, string> = {
  current: "bg-emerald-500",
  days_1_30: "bg-sky-500",
  days_31_60: "bg-amber-500",
  days_61_90: "bg-orange-600",
  days_90_plus: "bg-red-600",
}

export function ReceivablesRedesignedView() {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  // WWL-140 — the aging bands were computed on every response and were the one
  // thing the board could not be sliced by. Clicking a band narrows the list.
  const [bucketFilter, setBucketFilter] = React.useState<string | null>(null)

  // WWL-129 — the venue in the header scopes the chase list, and is part of
  // the key so switching venue refetches instead of showing the last one's book.
  const activeBusinessId = useActiveBusinessId()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["receivables-redesigned", activeBusinessId],
    queryFn: () => AnalyticsAPI.getReceivables(activeBusinessId),
  })

  const t = data?.totals
  const all = data?.customers ?? []
  const customers = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let rows = all
    if (bucketFilter) rows = rows.filter((c) => (c.bucket || "").toLowerCase() === bucketFilter)
    if (!q) return rows
    return rows.filter((c) => [c.customerName, c.customerPhone].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search, bucketFilter])

  /**
   * WWL-134 — filtering 34 rows down to 1, or to 0, left the headline at
   * Rs 23,961,479 / 34 customers in every case: the cards read the server's
   * `totals` while the table rendered the filtered rows. Second money module
   * with the WWL-115 pattern.
   *
   * With a filter on, the cards describe the rows on screen and say so. With
   * no filter they keep using the server totals, which are authoritative for
   * the whole ledger (and unaffected by the page cap).
   */
  const filtering = search.trim().length > 0 || bucketFilter !== null
  const shown = {
    outstanding: filtering ? customers.reduce((s, c) => s + num(c.totalOutstanding), 0) : num(t?.grandOutstanding),
    customerCount: filtering ? customers.length : num(t?.customerCount),
    installmentsOpen: filtering ? customers.reduce((s, c) => s + num(c.installmentsOpen), 0) : num(t?.installmentsOpen),
    oldestDaysOverdue: filtering
      ? customers.reduce((m, c) => Math.max(m, num(c.oldestDaysOverdue)), 0)
      : num(t?.oldestDaysOverdue),
  }
  const scopeNote = filtering ? `of ${all.length} total` : undefined

  const columns: Column<ReceivablesCustomer>[] = [
    { key: "customer", header: "Customer", sortKey: "customer", sortValue: (c) => c.customerName || "", render: (c) => <span className="font-medium">{c.customerName || "—"}</span> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (c) => c.customerPhone || "—" },
    /**
     * WWL-138 — a debtor row was a dead end: not clickable, no link to the
     * customer, the booking or its installments, and no way to record the
     * payment that is the obvious next step once the money arrives. The only
     * affordance was a WhatsApp reminder, and 32% of those are broken
     * (WWL-132).
     *
     * `bookings[]` has been on the payload all along, with the id of each. A
     * customer with one open booking gets a direct link; one with several gets
     * all of them, because collapsing them to a count is what made this a dead
     * end in the first place.
     */
    {
      key: "bookings", header: "Bookings", align: "right",
      render: (c) => {
        const list = c.bookings ?? []
        if (list.length === 0) return <span className="tabular-nums">{num(c.bookingCount)}</span>
        return (
          <span className="flex flex-wrap justify-end gap-1">
            {list.slice(0, 3).map((b) => (
              <Link
                key={b.bookingId}
                href={`/dashboard/bookings/${b.bookingId}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded border border-border px-1.5 text-xs tabular-nums text-primary hover:bg-muted"
                title={`Open booking #${b.bookingId} — ${formatPkr(num(b.totalOutstanding))} outstanding`}
              >
                #{b.bookingId}
              </Link>
            ))}
            {list.length > 3 && (
              <span className="text-xs text-muted-foreground">+{list.length - 3}</span>
            )}
          </span>
        )
      },
    },
    { key: "open", header: "Open installments", align: "right", cellClassName: "tabular-nums", sortKey: "open", sortValue: (c) => num(c.installmentsOpen), render: (c) => num(c.installmentsOpen) },
    { key: "overdue", header: "Days overdue", align: "right", cellClassName: "tabular-nums", sortKey: "overdue", sortValue: (c) => num(c.oldestDaysOverdue), render: (c) => num(c.oldestDaysOverdue) },
    { key: "bucket", header: "Aging", render: (c) => <StatusPill tone={bucketTone(c.bucket)}>{bucketLabel(c.bucket)}</StatusPill> },
    { key: "outstanding", header: "Outstanding", align: "right", sortKey: "outstanding", sortValue: (c) => num(c.totalOutstanding), render: (c) => <MoneyCell amount={num(c.totalOutstanding)} tone="warning" /> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => {
        const wa = waLink(c.customerPhone, c.customerName, num(c.totalOutstanding))
        if (!wa) return <span className="text-muted-foreground">—</span>
        return (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            aria-label="WhatsApp reminder"
            title="Send WhatsApp reminder"
          >
            <Icon name="MessageCircle" size={16} />
          </a>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Receivables"
        description="Who owes you, and how overdue."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* WWL-141 — this card carried an unconditional `trend="down"`, so it
            drew a falling arrow whether the vendor's debt had risen, fallen or
            never moved. There is no prior period on this payload to compare
            against, so the honest render is no arrow at all. */}
        <StatCard label={filtering ? "Outstanding (filtered)" : "Outstanding"} value={isLoading ? "…" : formatPkr(shown.outstanding)} icon="Wallet" delta={scopeNote ?? "to chase"} error={isError} />
        <StatCard label={filtering ? "Customers owing (filtered)" : "Customers owing"} value={isLoading ? "…" : shown.customerCount} icon="Users" delta={scopeNote} error={isError} />
        <StatCard label={filtering ? "Open installments (filtered)" : "Open installments"} value={isLoading ? "…" : shown.installmentsOpen} icon="Clock" error={isError} />
        <StatCard label={filtering ? "Oldest overdue (filtered)" : "Oldest overdue"} value={isLoading ? "…" : `${shown.oldestDaysOverdue} ${shown.oldestDaysOverdue === 1 ? "day" : "days"}`} icon="AlertTriangle" trend={shown.oldestDaysOverdue > 0 ? "down" : "flat"} error={isError} />
      </div>

      {/**
        * WWL-140 — the five aging bands and `generatedAt` were computed on
        * every single response and rendered nowhere. Aging *is* the product of
        * this screen; without the bands a vendor can see that Rs 23.9m is owed
        * but not whether it is last week's or last year's, which is the whole
        * difference between a reminder and a write-off.
        *
        * Both counts are shown because they answer different questions: how
        * many people to ring, and how many broken promises sit behind them.
        */}
      {!isLoading && !isError && data?.buckets && (
        <section aria-label="Aging bands" className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Aging</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {bucketFilter && (
                <button type="button" onClick={() => setBucketFilter(null)} className="rounded-md px-2 py-0.5 underline underline-offset-2 hover:text-foreground">
                  Show all bands
                </button>
              )}
              {data.generatedAt && <span>As of {karachiTimeLabel(data.generatedAt)} PKT</span>}
              <button type="button" onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:text-foreground" aria-label="Recalculate receivables">
                <Icon name="RefreshCw" size={12} /> Refresh
              </button>
            </div>
          </div>

          {/* Proportional band — where the money actually sits, by age. */}
          <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-muted" role="presentation">
            {BUCKET_ORDER.map((k) => {
              const b = data.buckets[k]
              const pct = num(t?.grandOutstanding) > 0 ? (num(b?.total) / num(t?.grandOutstanding)) * 100 : 0
              if (pct <= 0) return null
              return <div key={k} className={BUCKET_BAR[k]} style={{ width: `${pct}%` }} title={`${bucketLabel(k)} — ${formatPkr(num(b?.total))}`} />
            })}
          </div>

          {/* One row of chips, not five stacked cards.
              
              Measured on production: this section was 165px tall on a 732px
              window, sitting between the KPI cards and the ledger — so the
              first row of "who owes me", the daily question this screen exists
              for, began at y=696 and showed a 36px sliver.

              The bands are NOT decoration: each one filters the table, so this
              is the screen's main segmentation control and hiding it would cost
              more than it saves. Compressed instead. The colour dot, the label
              and the amount are what a vendor reads; the customer/installment
              split moves to the title attribute and to the row itself, which is
              where they are going next anyway. ~165px -> ~44px. */}
          <div className="flex flex-wrap gap-1.5">
            {BUCKET_ORDER.map((k) => {
              const b = data.buckets[k]
              // `installments` / `customers` are the explicit keys; `count` is
              // the legacy alias and always held installments.
              const people = num(b?.customers)
              const inst = num(b?.installments ?? b?.count)
              const active = bucketFilter === k
              return (
                <button
                  key={k}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBucketFilter(active ? null : k)}
                  title={`${bucketLabel(k)} — ${people} ${people === 1 ? "customer" : "customers"}, ${inst} ${inst === 1 ? "installment" : "installments"}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${active ? "border-foreground/40 bg-muted font-medium" : "hover:bg-muted/60"} ${people === 0 ? "opacity-60" : ""}`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${BUCKET_BAR[k]}`} />
                  <span>{bucketLabel(k)}</span>
                  <span className="tabular-nums font-semibold">{formatPkr(num(b?.total))}</span>
                  <span className="text-muted-foreground">· {people}</span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <DataTable
        /* One open booking → the whole row is a way in. Several → the row stays
           inert and the per-booking links above do the work, because guessing
           which of four bookings the vendor meant would be worse than nothing. */
        onRowClick={(c) => {
          const list = c.bookings ?? []
          if (list.length === 1) router.push(`/dashboard/bookings/${list[0].bookingId}`)
        }}
        filterQuery={search || (bucketFilter ? bucketLabel(bucketFilter) : "")}
        onClearFilter={() => { setSearch(""); setBucketFilter(null) }}
        caption="Receivables"
        columns={columns}
        data={customers}
        getRowId={(c) => c.customerPhone || c.customerEmail || c.customerName || JSON.stringify(c)}
        loading={isLoading}
        error={isError ? "Couldn't load receivables." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "CheckCircle2",
          title: "Nothing outstanding",
          description: "When customers have pending payments, their aging will show here.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => c.customerPhone || c.customerEmail || c.customerName || JSON.stringify(c)} rows={customers} filename="receivables" columns={[
                { header: "Customer", value: (c) => c.customerName ?? "" },
                { header: "Phone", value: (c) => c.customerPhone ?? "" },
                { header: "Bookings", value: (c) => num(c.bookingCount) },
                { header: "Open installments", value: (c) => num(c.installmentsOpen) },
                // WWL-136/155/172/188 — the export dropped a column that is on
                // screen, so the file the vendor hands their accountant is not the
                // table they were reading. Booking id is what actually ties a row
                // back to an event in a spreadsheet.
                { header: "Days overdue", value: (c) => num(c.oldestDaysOverdue) },
                { header: "Aging", value: (c) => bucketLabel(c.bucket) },
                { header: "Outstanding", value: (c) => num(c.totalOutstanding) },
              ]} />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{c.customerName}</div>
              <div className="text-xs text-muted-foreground">{c.customerPhone} · {num(c.oldestDaysOverdue)}d overdue</div>
              <div className="mt-1"><StatusPill tone={bucketTone(c.bucket)}>{bucketLabel(c.bucket)}</StatusPill></div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <MoneyCell amount={num(c.totalOutstanding)} tone="warning" className="text-sm font-medium" />
              {(() => {
                const wa = waLink(c.customerPhone, c.customerName, num(c.totalOutstanding))
                if (!wa) return null
                return (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                    aria-label="WhatsApp reminder"
                    title="Send WhatsApp reminder"
                  >
                    <Icon name="MessageCircle" size={16} />
                  </a>
                )
              })()}
            </div>
          </div>
        )}
      />
    </div>
  )
}

export default ReceivablesRedesignedView
