"use client";

/**
 * Lead → Booking conversion tile (audit gap G3).
 * Reuses the existing insights-advanced endpoint (no new endpoint
 * needed — funnel rows already include total/contacted/quoted/booked
 * per source, we aggregate them here).
 *
 * Three KPI cells across:
 *   • Total leads (current period)
 *   • Booked  (conversion → green)
 *   • Conversion rate %  (color-coded: gold ≥30, blue ≥15, neutral else)
 *
 * Quick link to /dashboard/insights for the full per-source funnel.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Inbox, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import { InsightsAPI, type InsightsAdvanced } from "@/lib/api/insights";

export default function LeadConversionTile() {
  const [data, setData] = useState<InsightsAdvanced | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    InsightsAPI.getAdvanced()
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    if (!data) return null;
    const t = data.funnel.reduce(
      (a, r) => {
        a.total += r.total;
        a.contacted += r.contacted;
        a.quoted += r.quoted;
        a.booked += r.booked;
        a.lost += r.lost;
        return a;
      },
      { total: 0, contacted: 0, quoted: 0, booked: 0, lost: 0 },
    );
    const conversionRate = t.total > 0
      ? Math.round((t.booked / t.total) * 1000) / 10
      : 0;
    const quoteRate = t.contacted > 0
      ? Math.round((t.quoted / t.contacted) * 1000) / 10
      : 0;
    const closeRate = t.quoted > 0
      ? Math.round((t.booked / t.quoted) * 1000) / 10
      : 0;
    return { ...t, conversionRate, quoteRate, closeRate };
  }, [data]);

  if (loading) return <Skeleton className="h-28 w-full" />;
  if (!totals || totals.total === 0) return null;

  const convTone =
    totals.conversionRate >= 30 ? "text-bridal-gold-dark" :
    totals.conversionRate >= 15 ? "text-blue-700" :
    "text-foreground";
  const convBg =
    totals.conversionRate >= 30 ? "bg-bridal-gold-dark/5 border-bridal-gold-dark/20" :
    totals.conversionRate >= 15 ? "bg-blue-50 border-blue-200" :
    "bg-muted/30";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Total leads */}
          <div className="flex items-center gap-2.5 min-w-[150px]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
              <Inbox className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Total leads
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {totals.total}
              </p>
            </div>
          </div>

          {/* Booked */}
          <div className="flex items-center gap-2.5 min-w-[150px]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Booked
              </p>
              <p className="text-lg font-bold tabular-nums text-emerald-700 leading-tight">
                {totals.booked}
              </p>
            </div>
          </div>

          {/* Conversion rate (the headline) */}
          <div className={`flex items-center gap-2.5 rounded-md border px-3 py-2 min-w-[180px] ${convBg}`}>
            <TrendingUp className={`h-4 w-4 ${convTone}`} />
            <div>
              <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground font-medium">
                Lead → booking
              </p>
              <p className={`text-xl font-bold tabular-nums leading-tight ${convTone}`}>
                {totals.conversionRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Funnel steps as quick chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] ml-auto">
            {totals.contacted > 0 && (
              <Badge variant="outline" className="font-normal">
                Contact rate <span className="ml-1 font-bold tabular-nums">
                  {Math.round((totals.contacted / totals.total) * 100)}%
                </span>
              </Badge>
            )}
            {totals.quoted > 0 && (
              <Badge variant="outline" className="font-normal">
                Quote rate <span className="ml-1 font-bold tabular-nums">{totals.quoteRate.toFixed(1)}%</span>
              </Badge>
            )}
            {totals.booked > 0 && (
              <Badge variant="outline" className="font-normal">
                Close rate <span className="ml-1 font-bold tabular-nums">{totals.closeRate.toFixed(1)}%</span>
              </Badge>
            )}
            <Link
              href="/dashboard/insights"
              className="inline-flex items-center gap-1 text-bridal-gold-dark text-[11px] font-medium hover:underline ml-1"
            >
              Funnel by source <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
