"use client"

/**
 * Expense Cockpit — a practical spending command-centre for venue owners.
 *
 * Answers the three questions a hall owner actually asks:
 *   1. "What did I spend this DAY / MONTH / YEAR?" — period toggle + prev/next nav.
 *   2. "Where did it go?" — category breakdown incl. hall rent & overheads,
 *      split into fixed OVERHEADS (rent · utilities · salaries — untagged) vs
 *      per-EVENT costs (tagged to a booking/function).
 *   3. "Did each shaadi make money?" — per-function roll-up: revenue vs spend
 *      vs net for every booking that has expenses against it.
 *
 * Flag-free: built entirely on ExpensesAPI.list() (returns every row) + the
 * booking relation, so it works for every vendor, not just GL pilots.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ExpensesAPI,
  type VendorExpense,
  type ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/api/vendorExpenses"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { formatPkr } from "@/components/dashboard/primitives/money-cell"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ExpenseFormDialog } from "@/components/dashboard/mainScreens/expenses/redesigned/expense-form-dialog"

type Gran = "day" | "month" | "year" | "all"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

// Stable accent per category — works on light + dark grounds (used for dots/bars).
const CAT_COLOR: Record<ExpenseCategory, string> = {
  ingredients: "#e8863b", fuel: "#e05b6a", labour: "#d89a2e", salary: "#2fa39a",
  electricity: "#c9a227", rentals: "#8b6fc7", repairs: "#7b8794",
  marketing: "#4a86d6", brokerage: "#d16aa8", tax: "#3fa168", supplies: "#3fb0c4",
  transport: "#6a72c7", other: "#9a8f80",
}
// Fixed-overhead categories: what a venue pays regardless of any single event.
const OVERHEAD_CATS: ExpenseCategory[] = ["rentals", "electricity", "salary", "repairs", "tax", "marketing"]

const pad = (n: number) => String(n).padStart(2, "0")
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Does this expense fall inside the anchored period at the given granularity? */
function inPeriod(dateStr: string, gran: Gran, anchor: Date): boolean {
  if (gran === "all") return true
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return false
  if (gran === "year") return d.getFullYear() === anchor.getFullYear()
  if (gran === "month")
    return d.getFullYear() === anchor.getFullYear() && d.getMonth() === anchor.getMonth()
  return ymd(d) === ymd(anchor) // day
}

function shiftAnchor(anchor: Date, gran: Gran, dir: number): Date {
  const d = new Date(anchor)
  if (gran === "day") d.setDate(d.getDate() + dir)
  else if (gran === "month") d.setMonth(d.getMonth() + dir)
  else if (gran === "year") d.setFullYear(d.getFullYear() + dir)
  return d
}

function periodLabel(gran: Gran, anchor: Date): string {
  if (gran === "all") return "All time"
  if (gran === "year") return String(anchor.getFullYear())
  if (gran === "month")
    return anchor.toLocaleDateString("en-PK", { month: "long", year: "numeric" })
  return anchor.toLocaleDateString("en-PK", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
}

const fmtEventDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—"

export function ExpenseCockpit(): React.ReactElement {
  const [gran, setGran] = React.useState<Gran>("month")
  const [anchor, setAnchor] = React.useState<Date>(() => new Date())
  const [addOpen, setAddOpen] = React.useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["expense-cockpit"],
    queryFn: () => ExpensesAPI.list(),
  })
  const all = data?.expenses ?? []

  const cur = React.useMemo(() => all.filter((e) => inPeriod(e.spentDate, gran, anchor)), [all, gran, anchor])
  const prev = React.useMemo(() => {
    if (gran === "all") return []
    const pa = shiftAnchor(anchor, gran, -1)
    return all.filter((e) => inPeriod(e.spentDate, gran, pa))
  }, [all, gran, anchor])

  const total = cur.reduce((s, e) => s + num(e.amount), 0)
  const prevTotal = prev.reduce((s, e) => s + num(e.amount), 0)
  const deltaPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

  const overheads = cur.filter((e) => e.bookingId == null).reduce((s, e) => s + num(e.amount), 0)
  const eventLinked = total - overheads

  // by-category, sorted desc
  const byCategory = React.useMemo(() => {
    const m = new Map<ExpenseCategory, number>()
    cur.forEach((e) => m.set(e.category, (m.get(e.category) || 0) + num(e.amount)))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [cur])
  const topCat = byCategory[0]

  // per-event (per-function) roll-up
  const byEvent = React.useMemo(() => {
    const m = new Map<number, { booking: VendorExpense["booking"]; spent: number; count: number }>()
    cur.forEach((e) => {
      if (e.bookingId == null) return
      const row = m.get(e.bookingId) || { booking: e.booking, spent: 0, count: 0 }
      row.spent += num(e.amount)
      row.count += 1
      if (!row.booking && e.booking) row.booking = e.booking
      m.set(e.bookingId, row)
    })
    return [...m.entries()]
      .map(([bookingId, v]) => ({ bookingId, ...v }))
      .sort((a, b) => b.spent - a.spent)
  }, [cur])

  const maxCat = byCategory.length ? byCategory[0][1] : 0

  return (
    <div className="space-y-5">
      {/* Header: period controls + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Spending overview</h3>
          <p className="text-sm text-muted-foreground">Where every rupee goes — by day, month or year.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {(["day", "month", "year", "all"] as Gran[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGran(g)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  gran === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {g}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Icon name="Plus" size={15} className="mr-1" /> Add expense
          </Button>
        </div>
      </div>

      {/* Period navigator */}
      {gran !== "all" && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setAnchor((a) => shiftAnchor(a, gran, -1))} aria-label="Previous period">
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <div className="min-w-[200px] text-center text-sm font-semibold tabular-nums">{periodLabel(gran, anchor)}</div>
          <Button variant="outline" size="sm" onClick={() => setAnchor((a) => shiftAnchor(a, gran, 1))} aria-label="Next period">
            <Icon name="ChevronRight" size={16} />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={`Spent · ${gran === "all" ? "all time" : gran}`}
          value={formatPkr(total)}
          icon="Wallet"
          {...(deltaPct != null
            ? { delta: `${deltaPct >= 0 ? "+" : ""}${deltaPct}% vs last ${gran}`, trend: deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat" }
            : {})}
        />
        <StatCard label="Fixed overheads" value={formatPkr(overheads)} icon="Building2" delta="rent · utilities · salary" />
        <StatCard label="Event / function costs" value={formatPkr(eventLinked)} icon="CalendarCheck" delta={`${byEvent.length} event${byEvent.length === 1 ? "" : "s"}`} />
        <StatCard label="Biggest category" value={topCat ? EXPENSE_CATEGORY_LABELS[topCat[0]] : "—"} icon="LayoutGrid" delta={topCat ? formatPkr(topCat[1]) : undefined} />
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">By category</h4>
          <span className="text-xs text-muted-foreground">{formatPkr(total)} total</span>
        </div>
        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : byCategory.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Icon name="Wallet" size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No expenses in this {gran === "all" ? "ledger" : gran} yet.</p>
            <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Add the first one</Button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {byCategory.map(([cat, amt]) => {
              const pctOfTotal = total > 0 ? Math.round((amt / total) * 100) : 0
              const barW = maxCat > 0 ? Math.max(3, Math.round((amt / maxCat) * 100)) : 0
              return (
                <li key={cat} className="flex items-center gap-3">
                  <span className="flex w-40 shrink-0 items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CAT_COLOR[cat] }} />
                    <span className="truncate">{EXPENSE_CATEGORY_LABELS[cat]}</span>
                    {OVERHEAD_CATS.includes(cat) && <span className="rounded bg-muted px-1 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">fixed</span>}
                  </span>
                  <span className="relative h-6 flex-1 overflow-hidden rounded-md bg-muted/60">
                    <span className="absolute inset-y-0 left-0 rounded-md" style={{ width: `${barW}%`, background: CAT_COLOR[cat], opacity: 0.85 }} />
                  </span>
                  <span className="w-28 shrink-0 text-right text-sm font-medium tabular-nums">{formatPkr(amt)}</span>
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{pctOfTotal}%</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Per-function roll-up */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h4 className="text-sm font-semibold">Cost per function</h4>
            <p className="text-xs text-muted-foreground">Expenses tagged to a specific booking — revenue vs spend vs net.</p>
          </div>
          <span className="text-xs text-muted-foreground">{byEvent.length} event{byEvent.length === 1 ? "" : "s"}</span>
        </div>
        {byEvent.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
            <Icon name="CalendarCheck" size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No expenses tagged to a function yet in this {gran === "all" ? "ledger" : gran}.</p>
            <p className="text-xs text-muted-foreground">Tag an expense to a booking when you add it to see per-shaadi profit.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Function / event</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2 text-right font-medium">Spent</th>
                  <th className="px-4 py-2 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {byEvent.map((row) => {
                  const revenue = num(row.booking?.totalAmount)
                  const net = revenue - row.spent
                  return (
                    <tr key={row.bookingId} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{row.booking?.customerName || `Booking #${row.bookingId}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {fmtEventDate(row.booking?.bookingDate)} · {row.count} expense{row.count === 1 ? "" : "s"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{revenue > 0 ? formatPkr(revenue) : "—"}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-rose-600 dark:text-rose-400">{formatPkr(row.spent)}</td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums font-semibold", revenue === 0 ? "text-muted-foreground" : net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                        {revenue > 0 ? formatPkr(net) : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseFormDialog open={addOpen} onOpenChange={setAddOpen} onSaved={() => refetch()} />
    </div>
  )
}

export default ExpenseCockpit
