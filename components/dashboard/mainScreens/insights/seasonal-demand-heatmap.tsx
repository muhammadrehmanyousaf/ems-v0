"use client";

/**
 * Seasonal demand heatmap (audit gap G2) — mounted on /dashboard/insights
 * below the cash-flow forecast.
 *
 * The PK wedding industry conventional wisdom is "Dec/Feb/May peaks +
 * monsoon/Ramazan dips" but every vendor has a different rhythm.
 * This view shows the vendor THEIR own 24-month booking pattern so
 * they can plan staffing, inventory, and marketing pushes around
 * their actual peaks (not the industry average).
 *
 * Visual:
 *   1. KPI strip:  peak month (by count + by revenue) + totals
 *   2. Heatmap:    rows = years, cols = Jan..Dec, intensity = booking
 *                  count (toggle to revenue). Current month outlined.
 *                  Hover: full breakdown.
 *   3. YoY chips:  same-month-this-year vs same-month-last-year deltas
 *                  for every month-of-year where both exist.
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, Minus, CalendarHeart, Crown, BarChart3,
} from "lucide-react";
import {
  AnalyticsAPI,
  type SeasonalityData,
  type SeasonalityMonth,
  type SeasonalityYoY,
} from "@/lib/api/analytics";

type Metric = "count" | "revenue";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const fmtPKR = (n: number) =>
  `Rs ${Math.round(n).toLocaleString("en-PK")}`;
const fmtPKRCompact = (n: number) => {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(0)}K`;
  return `Rs ${n}`;
};

// Intensity 0..1 → tailwind bg + text. Uses bridal-gold-dark base.
function intensityClasses(intensity: number) {
  if (intensity === 0) return "bg-muted/30 text-muted-foreground/60";
  if (intensity < 0.2) return "bg-bridal-gold-dark/10 text-foreground";
  if (intensity < 0.4) return "bg-bridal-gold-dark/25 text-foreground";
  if (intensity < 0.6) return "bg-bridal-gold-dark/45 text-foreground";
  if (intensity < 0.8) return "bg-bridal-gold-dark/70 text-white";
  return "bg-bridal-gold-dark text-white";
}

function YoYChip({ row, metric }: { row: SeasonalityYoY; metric: Metric }) {
  const isCount = metric === "count";
  const delta = isCount ? row.deltaCount : row.deltaRevenue;
  const pct = isCount ? row.pctCount : row.pctRevenue;
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone =
    delta > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" :
    delta < 0 ? "border-rose-200 bg-rose-50 text-rose-800" :
                "border-neutral-200 bg-neutral-50 text-neutral-700";
  const valueThis = isCount
    ? `${row.thisYear.bookingCount}`
    : fmtPKRCompact(row.thisYear.revenue);
  const valueLast = isCount
    ? `${row.lastYear.bookingCount}`
    : fmtPKRCompact(row.lastYear.revenue);
  return (
    <div className={`rounded-md border p-2 ${tone}`}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-semibold">{row.monthLabel}</span>
        <Icon className="h-3 w-3" />
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px]">
        <span className="font-semibold tabular-nums">{valueThis}</span>
        <span className="opacity-60 tabular-nums">vs {valueLast}</span>
      </div>
      {pct !== null && (
        <p className="text-[10px] font-bold tabular-nums mt-0.5">
          {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

export default function SeasonalDemandHeatmap() {
  const [data, setData] = useState<SeasonalityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("count");

  useEffect(() => {
    AnalyticsAPI.getSeasonality(24)
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  // Build a { year → [Jan..Dec cells] } map so the grid is calendar-
  // aligned across years (missing months → null cells).
  const grid = useMemo(() => {
    if (!data) return [] as Array<{ year: number; cells: (SeasonalityMonth | null)[] }>;
    const byYear = new Map<number, (SeasonalityMonth | null)[]>();
    for (const m of data.months) {
      if (!byYear.has(m.year)) byYear.set(m.year, Array(12).fill(null));
      byYear.get(m.year)![m.monthOfYear - 1] = m;
    }
    return Array.from(byYear.entries())
      .map(([year, cells]) => ({ year, cells }))
      .sort((a, b) => b.year - a.year); // newest year on top
  }, [data]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  if (!data || data.totals.totalBookings === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarHeart className="h-4 w-4 text-bridal-gold-dark" />
            Seasonal demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-dashed border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            <p>Your seasonality heatmap will fill in as you book more weddings.</p>
            <p className="mt-1">Once you have 6+ months of bookings, you&apos;ll see your own peaks here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { peaks, yoy, totals } = data;
  const maxValue = metric === "count" ? totals.maxCount : totals.maxRevenue;

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <CalendarHeart className="h-4 w-4 text-bridal-gold-dark" />
            Seasonal demand · last {totals.monthsCovered} months
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Your own rhythm. Plan staffing, inventory, and marketing pushes
            around your peaks — not the industry average.
          </p>
        </div>
        <div className="flex rounded-md border p-0.5 bg-background shrink-0">
          <Button
            type="button" variant={metric === "count" ? "default" : "ghost"} size="sm"
            className="h-7 text-xs"
            onClick={() => setMetric("count")}
          >
            <BarChart3 className="mr-1 h-3 w-3" /> Count
          </Button>
          <Button
            type="button" variant={metric === "revenue" ? "default" : "ghost"} size="sm"
            className="h-7 text-xs"
            onClick={() => setMetric("revenue")}
          >
            <Crown className="mr-1 h-3 w-3" /> Revenue
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Peak callouts */}
        <div className="grid gap-2 md:grid-cols-3">
          <div className="rounded-md bg-bridal-gold-dark/5 border border-bridal-gold-dark/20 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-bridal-gold-dark font-semibold flex items-center gap-1">
              <Crown className="h-3 w-3" /> Peak by bookings
            </p>
            <p className="text-lg font-bold tabular-nums">
              {peaks.byCount ? peaks.byCount.value : 0}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {peaks.byCount?.label || "—"}
            </p>
          </div>
          <div className="rounded-md bg-bridal-gold-dark/5 border border-bridal-gold-dark/20 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-bridal-gold-dark font-semibold flex items-center gap-1">
              <Crown className="h-3 w-3" /> Peak by revenue
            </p>
            <p className="text-lg font-bold tabular-nums">
              {peaks.byRevenue ? fmtPKRCompact(peaks.byRevenue.value) : "Rs 0"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {peaks.byRevenue?.label || "—"}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {totals.monthsCovered}-month totals
            </p>
            <p className="text-lg font-bold tabular-nums">
              {totals.totalBookings}
              <span className="text-muted-foreground text-xs font-normal"> bookings · </span>
              {fmtPKRCompact(totals.totalRevenue)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {totals.totalCompleted} completed · {totals.totalCancelled} cancelled
            </p>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-2">
          {/* Header row — month labels */}
          <div className="grid gap-1" style={{ gridTemplateColumns: "48px repeat(12, minmax(0, 1fr))" }}>
            <div />
            {MONTH_SHORT.map((m) => (
              <div key={m} className="text-[10px] uppercase tracking-wide text-muted-foreground text-center font-semibold">
                {m}
              </div>
            ))}
          </div>

          {/* Year rows */}
          {grid.map(({ year, cells }) => (
            <div
              key={year}
              className="grid gap-1"
              style={{ gridTemplateColumns: "48px repeat(12, minmax(0, 1fr))" }}
            >
              <div className="text-xs font-bold text-muted-foreground self-center">
                {year}
              </div>
              {cells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={idx}
                      className="aspect-square rounded-md bg-transparent border border-dashed border-muted-foreground/10"
                    />
                  );
                }
                const value = metric === "count" ? cell.bookingCount : cell.revenue;
                const intensity = maxValue > 0 ? value / maxValue : 0;
                const valueLabel = metric === "count"
                  ? `${cell.bookingCount} booking${cell.bookingCount === 1 ? "" : "s"}`
                  : fmtPKR(cell.revenue);
                const isCurrent = cell.isCurrentMonth;
                return (
                  <div
                    key={cell.key}
                    className={`group aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums transition-all hover:scale-105 hover:z-10 relative cursor-default ${intensityClasses(intensity)} ${
                      isCurrent ? "ring-2 ring-offset-1 ring-bridal-gold-dark" : ""
                    }`}
                    title={`${cell.label} · ${valueLabel}${
                      cell.cancelledCount > 0 ? ` · ${cell.cancelledCount} cancelled` : ""
                    }`}
                  >
                    {metric === "count"
                      ? (value > 0 ? value : "")
                      : (value > 0 ? fmtPKRCompact(value).replace("Rs ", "") : "")}
                    {/* Hover detail */}
                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-1 text-[10px] font-medium text-background shadow-lg pointer-events-none">
                      <div className="font-semibold">{cell.label}</div>
                      <div>{cell.bookingCount} bookings · {fmtPKR(cell.revenue)}</div>
                      {cell.cancelledCount > 0 && (
                        <div className="text-rose-300">{cell.cancelledCount} cancelled</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
            <span>Less</span>
            <div className="flex gap-0.5">
              {[0, 0.15, 0.3, 0.5, 0.7, 0.9].map((i) => (
                <div key={i} className={`h-3 w-3 rounded ${intensityClasses(i)}`} />
              ))}
            </div>
            <span>More</span>
            <span className="ml-3">
              {metric === "count"
                ? `Max: ${totals.maxCount} bookings`
                : `Max: ${fmtPKRCompact(totals.maxRevenue)}`}
            </span>
          </div>
        </div>

        {/* YoY compare */}
        {yoy.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Year-over-year · same month
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-1.5">
              {yoy.map((row) => (
                <YoYChip key={row.monthOfYear} row={row} metric={metric} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
