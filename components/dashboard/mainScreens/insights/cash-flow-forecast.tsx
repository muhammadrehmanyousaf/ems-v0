"use client";

/**
 * Cash-flow forecast (audit gap G4) — mounted on /dashboard/insights
 * below the revenue-breakdowns section.
 *
 * Different from the 90-day revenue projection in the same view
 * (which is statistical: rolling-30 × 3 blended with YoY same-window).
 * This one is just the math on what's already BOOKED: every NOT-fully-
 * paid installment on the vendor's active bookings, bucketed by dueAt
 * into the next 6 months.
 *
 * Visual:
 *   Hero strip:  next-6 total · biggest month · overdue chip
 *   Composed:    bars per month (expectedIn) + line overlay (cumulative)
 *   Below:       per-month table with installment count
 *   Beyond:      footer hint for installments dueing after horizon
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis,
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
  TrendingUp, AlertTriangle, CalendarRange, Wallet,
} from "lucide-react";
import {
  AnalyticsAPI,
  type CashFlowForecastData,
} from "@/lib/api/analytics";

const fmtPKR = (n: number) =>
  `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
const fmtCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

const chartConfig = {
  expectedIn: { label: "Expected (Rs.)", color: "var(--chart-3)" },
  cumulative: { label: "Cumulative (Rs.)", color: "var(--chart-1)" },
} satisfies ChartConfig;

export default function CashFlowForecast() {
  const [data, setData] = useState<CashFlowForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getCashFlowForecast(6)
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No cash-flow data available.
        </CardContent>
      </Card>
    );
  }

  const { months, overdue, beyondHorizon, totals, biggestMonth } = data;
  const allZero = totals.horizonTotal === 0 && overdue.total === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Wallet className="h-4 w-4 text-bridal-gold-dark" />
          Cash-flow forecast · next {totals.monthsCovered} months
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          What you&apos;re owed, by the month it&apos;s due. Math on existing
          installments — no statistics, no smoothing.
          {" "}
          <Link href="/dashboard/receivables" className="underline hover:text-bridal-gold-dark">
            Chase overdue on /receivables.
          </Link>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero strip */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Next {totals.monthsCovered} months
            </p>
            <p className="text-lg font-bold tabular-nums">{fmtPKR(totals.horizonTotal)}</p>
            <p className="text-[10px] text-muted-foreground">
              {totals.installmentsCovered} installments
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <CalendarRange className="h-3 w-3" /> Biggest month
            </p>
            <p className="text-lg font-bold tabular-nums">
              {biggestMonth && biggestMonth.amount > 0
                ? fmtPKR(biggestMonth.amount)
                : "Rs. 0"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {biggestMonth && biggestMonth.amount > 0 ? biggestMonth.label : "—"}
            </p>
          </div>
          <div className={`rounded-md p-3 ${
            overdue.total > 0 ? "bg-rose-50 border border-rose-200" : "bg-muted/40"
          }`}>
            <p className={`text-[10px] uppercase tracking-wide flex items-center gap-1 ${
              overdue.total > 0 ? "text-rose-700" : "text-muted-foreground"
            }`}>
              <AlertTriangle className="h-3 w-3" /> Already overdue
            </p>
            <p className={`text-lg font-bold tabular-nums ${
              overdue.total > 0 ? "text-rose-700" : ""
            }`}>
              {fmtPKR(overdue.total)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {overdue.count} installment{overdue.count === 1 ? "" : "s"}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Grand total
            </p>
            <p className="text-lg font-bold tabular-nums text-bridal-gold-dark">
              {fmtPKR(totals.grandTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Overdue + {totals.monthsCovered}mo + beyond
            </p>
          </div>
        </div>

        {/* Chart */}
        {allZero ? (
          <div className="rounded-md border-dashed border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            <p>No active installments yet.</p>
            <p className="mt-1">
              Cash-flow projections will appear here once you have bookings
              with payment schedules.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ChartContainer config={chartConfig}>
              <ComposedChart
                accessibilityLayer
                data={months}
                margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cashflowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-expectedIn)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-expectedIn)" stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) => value.slice(0, 3)}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={52}
                  tickFormatter={fmtCompact}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => [
                      `Rs. ${Number(value).toLocaleString("en-PK")}`,
                      name === "expectedIn" ? "Expected" : "Cumulative",
                    ]}
                  />}
                />
                <Bar
                  yAxisId="left"
                  dataKey="expectedIn"
                  fill="url(#cashflowGradient)"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--color-cumulative)"
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
            <div className="grid grid-cols-4 px-3 py-1.5 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              <div>Month</div>
              <div className="text-right">Expected</div>
              <div className="text-right">Installments</div>
              <div className="text-right">Cumulative</div>
            </div>
            {months.map((m) => (
              <div
                key={m.key}
                className={`grid grid-cols-4 px-3 py-2 text-xs items-center border-t ${
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
                  {m.expectedIn > 0 ? fmtPKR(m.expectedIn) : "—"}
                </div>
                <div className="text-right tabular-nums text-muted-foreground">
                  {m.installmentCount}
                </div>
                <div className="text-right tabular-nums font-semibold">
                  {fmtPKR(m.cumulative)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Beyond-horizon hint */}
        {beyondHorizon.total > 0 && (
          <div className="rounded-md bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {fmtPKR(beyondHorizon.total)}
            </span>
            {" "}is due beyond the {totals.monthsCovered}-month horizon
            ({beyondHorizon.count} installment{beyondHorizon.count === 1 ? "" : "s"}).
            Locked in but not in the chart above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
