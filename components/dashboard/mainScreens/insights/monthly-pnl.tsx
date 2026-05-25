"use client";

/**
 * Monthly P&L rollup — mounted on /dashboard/insights below the
 * cash-flow forecast.
 *
 * The system tracked revenue and each cost stream (operating expenses,
 * supplier bills, broker commissions, staff pay) in isolation. This is
 * the first view that stitches them together so the vendor can read
 * profit — not just turnover — month over month.
 *
 * Accrual basis: revenue is recognised at the event date, each cost at
 * its accrual date (spend / invoice / accrual / shift date). It answers
 * "did I actually make money this month?", which turnover alone hides.
 *
 * Visual:
 *   Hero strip:  revenue · costs · gross profit (+margin) · avg/month
 *   Composed:    revenue + cost bars per month, profit line overlay
 *   Table:       per-month revenue / costs / profit / margin
 *   Breakdown:   where the costs went (4 streams, share of total)
 */

import { useEffect, useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis, ReferenceLine,
} from "recharts";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Scale, TrendingUp, TrendingDown, Wallet, PieChart,
} from "lucide-react";
import { AnalyticsAPI, type MonthlyPnlData } from "@/lib/api/analytics";

const fmtPKR = (n: number) => {
  const sign = n < 0 ? "−" : "";
  return `${sign}Rs. ${Math.abs(Math.round(n)).toLocaleString("en-PK")}`;
};
const fmtCompact = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? "−" : "";
  if (a >= 1_000_000) return `${s}${(a / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${s}${(a / 1_000).toFixed(0)}K`;
  return `${s}${a}`;
};

const chartConfig = {
  revenue: { label: "Revenue (Rs.)", color: "var(--chart-1)" },
  totalCosts: { label: "Costs (Rs.)", color: "var(--chart-5)" },
  grossProfit: { label: "Profit (Rs.)", color: "var(--chart-2)" },
} satisfies ChartConfig;

// Each cost stream gets its own muted tone in the breakdown bar.
const COST_TONE: Record<string, string> = {
  expenses: "bg-amber-400",
  supplierInvoices: "bg-orange-400",
  brokerCommissions: "bg-rose-400",
  staffPay: "bg-violet-400",
};

export default function MonthlyPnl() {
  const [data, setData] = useState<MonthlyPnlData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getMonthlyPnl(12)
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No P&amp;L data available.
        </CardContent>
      </Card>
    );
  }

  const { months, totals, costBreakdown, best, worst, averageMonthlyProfit } = data;
  const allZero = totals.revenue === 0 && totals.totalCosts === 0;
  const profitable = totals.grossProfit >= 0;

  // Build chart rows; profit drawn as a signed line so losses dip below 0.
  const chartData = months.map((m) => ({
    label: m.label,
    revenue: m.revenue,
    totalCosts: m.costs.total,
    grossProfit: m.grossProfit,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-bridal-gold-dark" />
          Monthly P&amp;L · last {totals.monthsCovered} months
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Profit, not just turnover. Revenue from events minus your four
          cost ledgers — operating expenses, supplier bills, broker
          commissions and staff pay — recognised by the month they fall in.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero strip */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Revenue
            </p>
            <p className="text-lg font-bold tabular-nums">{fmtPKR(totals.revenue)}</p>
            <p className="text-[10px] text-muted-foreground">accrued, non-cancelled</p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Wallet className="h-3 w-3" /> Total costs
            </p>
            <p className="text-lg font-bold tabular-nums">{fmtPKR(totals.totalCosts)}</p>
            <p className="text-[10px] text-muted-foreground">across 4 ledgers</p>
          </div>
          <div className={`rounded-md p-3 border ${
            profitable ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
          }`}>
            <p className={`text-[10px] uppercase tracking-wide flex items-center gap-1 ${
              profitable ? "text-emerald-700" : "text-rose-700"
            }`}>
              {profitable ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              Gross profit
            </p>
            <p className={`text-lg font-bold tabular-nums ${
              profitable ? "text-emerald-900" : "text-rose-900"
            }`}>
              {fmtPKR(totals.grossProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totals.margin != null ? `${totals.margin}% margin` : "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Avg / active month
            </p>
            <p className="text-lg font-bold tabular-nums text-bridal-gold-dark">
              {fmtPKR(averageMonthlyProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground">profit per month</p>
          </div>
        </div>

        {/* Best / worst month chips */}
        {(best || worst) && !allZero && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {best && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800">
                <TrendingUp className="h-3 w-3" />
                Best: {best.label} · {fmtPKR(best.grossProfit)}
              </span>
            )}
            {worst && worst.key !== best?.key && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-rose-800">
                <TrendingDown className="h-3 w-3" />
                Tightest: {worst.label} · {fmtPKR(worst.grossProfit)}
              </span>
            )}
          </div>
        )}

        {/* Chart */}
        {allZero ? (
          <div className="rounded-md border-dashed border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            <p>No revenue or costs recorded yet.</p>
            <p className="mt-1">
              Your P&amp;L builds itself as you log bookings, expenses, supplier
              bills, broker commissions and staff shifts.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ChartContainer config={chartConfig}>
              <ComposedChart
                accessibilityLayer
                data={chartData}
                margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) => value.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={52}
                  tickFormatter={fmtCompact}
                />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    formatter={(value, name) => [
                      fmtPKR(Number(value)),
                      name === "revenue" ? "Revenue"
                        : name === "totalCosts" ? "Costs" : "Profit",
                    ]}
                  />}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="totalCosts" fill="var(--color-totalCosts)" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Line
                  type="monotone"
                  dataKey="grossProfit"
                  stroke="var(--color-grossProfit)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        )}

        {/* Per-month table */}
        {!allZero && (
          <div className="rounded-md border overflow-hidden">
            <div className="grid grid-cols-5 px-3 py-1.5 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              <div>Month</div>
              <div className="text-right">Revenue</div>
              <div className="text-right">Costs</div>
              <div className="text-right">Profit</div>
              <div className="text-right">Margin</div>
            </div>
            {months.map((m) => (
              <div
                key={m.key}
                className={`grid grid-cols-5 px-3 py-2 text-xs items-center border-t ${
                  m.isCurrentMonth ? "bg-bridal-gold-dark/5 font-medium" : ""
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {m.label}
                  {m.isCurrentMonth && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  {m.revenue > 0 ? fmtPKR(m.revenue) : "—"}
                </div>
                <div className="text-right tabular-nums text-muted-foreground">
                  {m.costs.total > 0 ? fmtPKR(m.costs.total) : "—"}
                </div>
                <div className={`text-right tabular-nums font-semibold ${
                  m.grossProfit < 0 ? "text-rose-700" : m.grossProfit > 0 ? "text-emerald-700" : ""
                }`}>
                  {m.revenue === 0 && m.costs.total === 0 ? "—" : fmtPKR(m.grossProfit)}
                </div>
                <div className="text-right tabular-nums text-muted-foreground">
                  {m.margin != null ? `${m.margin}%` : "—"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cost breakdown — where the money went */}
        {totals.totalCosts > 0 && (
          <div className="rounded-md border p-3 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700">
              <PieChart className="h-3.5 w-3.5 text-bridal-gold-dark" />
              Where your costs went
            </div>
            {/* Stacked share bar */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {costBreakdown.filter((c) => c.amount > 0).map((c) => (
                <div
                  key={c.key}
                  className={COST_TONE[c.key] || "bg-neutral-400"}
                  style={{ width: `${c.pct}%` }}
                  title={`${c.label}: ${fmtPKR(c.amount)} (${c.pct}%)`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
              {costBreakdown.map((c) => (
                <div key={c.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className={`h-2 w-2 shrink-0 rounded-sm ${COST_TONE[c.key] || "bg-neutral-400"}`} />
                  <span className="text-muted-foreground truncate">{c.label}</span>
                  <span className="ml-auto tabular-nums font-medium">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground italic">
          Accrual basis — revenue recognised at the event date, not when
          cash arrives. Broker fees logged both as an expense and in the
          broker ledger will show in both lines.
        </p>
      </CardContent>
    </Card>
  );
}
