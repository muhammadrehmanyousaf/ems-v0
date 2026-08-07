"use client"

/**
 * Receivables (A/R) — redesigned (Track C, computed). Wired to
 * AnalyticsAPI.getReceivables(); rendered through the primitives. Read-only;
 * Route /dashboard/receivables.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnalyticsAPI, type ReceivablesData } from "@/lib/api/analytics"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { useActiveBusinessId } from "@/lib/store/active-business-store"

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
const BUCKETS: Record<string, { tone: StatusTone; label: string }> = {
  current: { tone: "success", label: "Current" },
  days_1_30: { tone: "info", label: "1–30 days" },
  days_31_60: { tone: "warning", label: "31–60 days" },
  days_61_90: { tone: "error", label: "61–90 days" },
  days_90_plus: { tone: "error", label: "90+ days" },
}

const bucketTone = (b?: string): StatusTone => BUCKETS[(b || "").toLowerCase()]?.tone ?? "neutral"
const bucketLabel = (b?: string): string => BUCKETS[(b || "").toLowerCase()]?.label ?? "—"

export function ReceivablesRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

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
    if (!q) return all
    return all.filter((c) => [c.customerName, c.customerPhone].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

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
  const filtering = search.trim().length > 0
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
    { key: "customer", header: "Customer", render: (c) => <span className="font-medium">{c.customerName || "—"}</span> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (c) => c.customerPhone || "—" },
    { key: "bookings", header: "Bookings", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.bookingCount) },
    { key: "open", header: "Open installments", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.installmentsOpen) },
    { key: "overdue", header: "Days overdue", align: "right", cellClassName: "tabular-nums", render: (c) => num(c.oldestDaysOverdue) },
    { key: "bucket", header: "Aging", render: (c) => <StatusPill tone={bucketTone(c.bucket)}>{bucketLabel(c.bucket)}</StatusPill> },
    { key: "outstanding", header: "Outstanding", align: "right", render: (c) => <MoneyCell amount={num(c.totalOutstanding)} tone="warning" /> },
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
        <StatCard label={filtering ? "Outstanding (filtered)" : "Outstanding"} value={isLoading ? "…" : formatPkr(shown.outstanding)} icon="Wallet" trend="down" delta={scopeNote ?? "to chase"} error={isError} />
        <StatCard label={filtering ? "Customers owing (filtered)" : "Customers owing"} value={isLoading ? "…" : shown.customerCount} icon="Users" delta={scopeNote} error={isError} />
        <StatCard label={filtering ? "Open installments (filtered)" : "Open installments"} value={isLoading ? "…" : shown.installmentsOpen} icon="Clock" error={isError} />
        <StatCard label={filtering ? "Oldest overdue (filtered)" : "Oldest overdue"} value={isLoading ? "…" : `${shown.oldestDaysOverdue} ${shown.oldestDaysOverdue === 1 ? "day" : "days"}`} icon="AlertTriangle" trend={shown.oldestDaysOverdue > 0 ? "down" : "flat"} error={isError} />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
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
