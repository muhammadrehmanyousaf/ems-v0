"use client"

/**
 * Tax & P&L — redesigned (Track C, computed). Wired to
 * TaxReportAPI.getAnnualReport(); rendered through the primitives. Read-only;
 * Route /dashboard/tax.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { TaxReportAPI, type AnnualTaxReport } from "@/lib/api/tax"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { cn } from "@/lib/utils"

type TaxMonthRow = NonNullable<AnnualTaxReport["months"]>[number]

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

export function TaxRedesignedView() {
  /**
   * WWL-191 — this was `const year = new Date().getFullYear()` with no picker
   * anywhere on the page, so on 6 Aug 2026 the screen showed Fiscal 2026-27,
   * which had begun five weeks earlier. The fiscal year a Pakistani vendor is
   * actually filing at that moment is 2025-26, and the API returns it
   * correctly on request — it was simply unreachable:
   *
   *   Fiscal 2026-27 (shown)        net Rs  9,480,000
   *   Fiscal 2025-26 (unreachable)  net Rs  2,562,200
   *   Calendar 2026  (unreachable)  net Rs 12,042,200
   *
   * Nearly a factor of four between the figure on screen and the figure being
   * filed. The API has always accepted `basis=calendar` too, which the UI
   * never offered — Pakistani vendors need both: fiscal for FBR, calendar for
   * their own books.
   *
   * Defaults to the fiscal year being FILED (the one that has closed) rather
   * than the one just started, because that is what the page is for.
   */
  const now = new Date()
  const currentFiscalStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  const [basis, setBasis] = React.useState<"fiscal" | "calendar">("fiscal")
  const [year, setYear] = React.useState(
    basis === "fiscal" ? currentFiscalStart : now.getFullYear(),
  )
  const yearOptions = React.useMemo(() => {
    const top = basis === "fiscal" ? currentFiscalStart + 1 : now.getFullYear()
    return Array.from({ length: 6 }, (_, i) => top - i)
  }, [basis, currentFiscalStart, now])

  const yearLabel = (y: number) => (basis === "fiscal" ? `${y}–${String(y + 1).slice(2)}` : String(y))

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tax-annual-report-redesigned", String(year), basis],
    queryFn: () => TaxReportAPI.getAnnualReport(year, basis),
  })

  const report = data
  const netPnl = num(report?.summary?.netPnl)
  const months = (report?.months ?? []) as TaxMonthRow[]

  const columns: Column<TaxMonthRow>[] = [
    { key: "month", header: "Month", render: (r) => <span className="font-medium">{r.monthLabel || "—"}</span> },
    { key: "bookings", header: "Bookings", align: "right", cellClassName: "tabular-nums", render: (r) => num(r.bookingCount) },
    { key: "revenue", header: "Revenue", align: "right", render: (r) => <MoneyCell amount={num(r.revenue)} /> },
    { key: "expenses", header: "Expenses", align: "right", render: (r) => <MoneyCell amount={num(r.expenses)} tone="error" /> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Tax & P&L"
        description={
          basis === "fiscal"
            ? `Fiscal year ${yearLabel(year)} (July–June) — revenue, expenses and net position.`
            : `Calendar year ${year} — revenue, expenses and net position.`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* WWL-191 — the year and the basis are the two things this page is
                about, and neither could be chosen. */}
            <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Reporting basis">
              {(["fiscal", "calendar"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={basis === b}
                  onClick={() => {
                    setBasis(b)
                    setYear(b === "fiscal" ? currentFiscalStart : now.getFullYear())
                  }}
                  className={cn(
                    "h-8 rounded px-3 text-sm capitalize transition-colors",
                    basis === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {b === "fiscal" ? "Fiscal (FBR)" : "Calendar"}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="tax-year">Year</label>
            <select
              id="tax-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{yearLabel(y)}</option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Gross revenue" value={isLoading ? "…" : formatPkr(num(report?.summary?.bookingRevenue))} icon="Wallet" trend="up" error={isError} />
        <StatCard label="Expenses" value={isLoading ? "…" : formatPkr(num(report?.summary?.totalExpenses))} icon="Clock" error={isError} />
        <StatCard label="Net P&L" value={isLoading ? "…" : formatPkr(netPnl)} icon="TrendingUp" trend={netPnl >= 0 ? "up" : "down"} error={isError} />
        <StatCard label="FBR submitted" value={isLoading ? "…" : formatPkr(num(report?.summary?.fbrSubmittedValue))} icon="ShieldCheck" error={isError} />
      </div>

      <DataTable
        caption="Tax report"
        columns={columns}
        data={months}
        getRowId={(r) => r.monthLabel}
        loading={isLoading}
        error={isError ? "Couldn't load the annual tax report." : null}
        onRetry={() => refetch()}
        empty={{
          icon: "FileText",
          title: "No data for this period",
          description: "Once you have bookings and expenses, your monthly P&L breakdown will appear here.",
        }}
        toolbar={
          /* WWL-189 — `Export PDF` was a dead button and it was the only way
             out of this screen. This is the export a vendor actually needs:
             the monthly breakdown their accountant can open, with the period
             and basis in the filename so two downloads don't get confused. */
          <div className="ml-auto">
            <ExportMenu
              rows={months}
              filename={`tax-${basis}-${yearLabel(year).replace("–", "-")}`}
              columns={[
                { header: "Month", value: (r) => r.monthLabel },
                { header: "Bookings", value: (r) => num(r.bookingCount) },
                { header: "Revenue", value: (r) => num(r.revenue) },
                { header: "Expenses", value: (r) => num(r.expenses) },
                { header: "Net", value: (r) => num(r.revenue) - num(r.expenses) },
              ]}
            />
          </div>
        }
        renderCard={(r) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.monthLabel}</div>
              <div className="text-xs text-muted-foreground">{num(r.bookingCount)} bookings</div>
            </div>
            <div className="text-right">
              <MoneyCell amount={num(r.revenue)} className="text-sm font-medium" />
              <MoneyCell amount={num(r.expenses)} tone="error" className="text-xs" />
            </div>
          </div>
        )}
      />
    </div>
  )
}

export default TaxRedesignedView
