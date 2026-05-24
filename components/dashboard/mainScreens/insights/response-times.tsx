"use client";

/**
 * Response-time analytics (audit gap G8 — the FINAL gap).
 * Mounted on /dashboard/insights below the seasonal-demand heatmap.
 *
 * The "quick responder" effect is real and measurable: vendors who
 * answer leads within 1 hour book 3-5× more often than those who
 * answer in 24+ hours. This view tells the vendor where THEY sit on
 * that curve.
 *
 * Visual:
 *   1. Hero strip — median + count + (unresponded badge if any)
 *   2. Distribution bar (5 segmented chips: <1h emerald → 3+d rose)
 *      with count + % per bucket
 *   3. Quartile chips — p25 / p75 / mean / max
 *   4. Per-source table — median by source (Walk-in, Insta, WhatsApp,
 *      Referral…) ranked by lead volume
 *   5. Empty state — friendly nudge when there's no data
 */

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Zap, AlertTriangle, TrendingUp, Inbox } from "lucide-react";
import {
  AnalyticsAPI,
  type ResponseTimesData,
  type ResponseBucket,
} from "@/lib/api/analytics";
import { LEAD_SOURCE_LABELS, type LeadSource } from "@/lib/api/leads";

const BUCKET_BG: Record<ResponseBucket["tone"], string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  rose: "bg-rose-500",
};
const BUCKET_TEXT: Record<ResponseBucket["tone"], string> = {
  emerald: "text-emerald-700",
  blue: "text-blue-700",
  amber: "text-amber-700",
  orange: "text-orange-700",
  rose: "text-rose-700",
};

// "0.4h" → "24m" · "2.3h" → "2.3h" · "48h" → "2d"
function fmtHours(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 24) return `${h.toFixed(h < 10 ? 1 : 0)}h`;
  return `${(h / 24).toFixed(h / 24 < 10 ? 1 : 0)}d`;
}

function sourceLabel(s: string): string {
  return (LEAD_SOURCE_LABELS as Record<string, string>)[s] || s;
}

export default function ResponseTimes() {
  const [data, setData] = useState<ResponseTimesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getResponseTimes("this_year")
      .then((r) => setData(r))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-80 w-full" />;

  if (!data || !data.hasData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-bridal-gold-dark" />
            Response time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border-dashed border bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            <p>No responded leads in this period yet.</p>
            <p className="mt-1">
              Move a lead off &quot;new&quot; (Contact, Quote, etc.) and your
              response-time curve will start filling in here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats, distribution, bySource, totalLeadsResponded, totalLeadsUnresponded } = data;
  const medianTone =
    stats!.median < 1 ? "text-emerald-700" :
    stats!.median < 4 ? "text-blue-700" :
    stats!.median < 24 ? "text-amber-700" :
    "text-rose-700";
  const medianBg =
    stats!.median < 1 ? "bg-emerald-50 border-emerald-200" :
    stats!.median < 4 ? "bg-blue-50 border-blue-200" :
    stats!.median < 24 ? "bg-amber-50 border-amber-200" :
    "bg-rose-50 border-rose-200";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4 text-bridal-gold-dark" />
          Response time · how fast you answer leads
        </CardTitle>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Vendors who answer within an hour book 3-5× more often than those who
          take a day. Tracks Lead.createdAt → first move off &quot;new&quot;.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero */}
        <div className="grid gap-2 md:grid-cols-3">
          <div className={`rounded-md border-2 p-3 ${medianBg}`}>
            <p className={`text-[10px] uppercase tracking-wide font-semibold ${medianTone}`}>
              <Zap className="inline h-3 w-3 mr-0.5" /> Median response
            </p>
            <p className={`text-2xl font-bold tabular-nums leading-tight ${medianTone}`}>
              {fmtHours(stats!.median)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {stats!.median < 1
                ? "Elite. Quick-responder badge territory."
                : stats!.median < 4
                  ? "Good. Most hot leads still close."
                  : stats!.median < 24
                    ? "Average. Faster responses convert better."
                    : "Slow. Customers ghost when they wait."}
            </p>
          </div>
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
              <Inbox className="inline h-3 w-3 mr-0.5" /> Leads responded
            </p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {totalLeadsResponded}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              in this period
            </p>
          </div>
          {totalLeadsUnresponded > 0 ? (
            <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
              <p className="text-[10px] uppercase tracking-wide text-rose-700 font-semibold">
                <AlertTriangle className="inline h-3 w-3 mr-0.5" /> Sitting in &quot;new&quot;
              </p>
              <p className="text-2xl font-bold tabular-nums leading-tight text-rose-700">
                {totalLeadsUnresponded}
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Leads older than 24h still untouched.
              </p>
            </div>
          ) : (
            <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">
                Inbox zero
              </p>
              <p className="text-2xl font-bold tabular-nums leading-tight text-emerald-700">
                0
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                No leads sitting untouched &gt; 24h.
              </p>
            </div>
          )}
        </div>

        {/* Distribution bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Distribution
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>p25 <span className="font-semibold tabular-nums text-foreground">{fmtHours(stats!.p25)}</span></span>
              <span>p75 <span className="font-semibold tabular-nums text-foreground">{fmtHours(stats!.p75)}</span></span>
              <span>avg <span className="font-semibold tabular-nums text-foreground">{fmtHours(stats!.mean)}</span></span>
              <span>max <span className="font-semibold tabular-nums text-foreground">{fmtHours(stats!.max)}</span></span>
            </div>
          </div>

          {/* Segmented stacked bar */}
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
            {distribution.map((b) => (
              <div
                key={b.key}
                className={`${BUCKET_BG[b.tone]} transition-all`}
                style={{ width: `${b.pct}%` }}
                title={`${b.label}: ${b.count} (${b.pct.toFixed(1)}%)`}
              />
            ))}
          </div>

          {/* Per-bucket counts */}
          <div className="grid grid-cols-5 gap-1.5">
            {distribution.map((b) => (
              <div key={b.key} className="text-center">
                <div className={`text-sm font-bold tabular-nums ${BUCKET_TEXT[b.tone]}`}>
                  {b.count}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {b.label}
                </div>
                <div className="text-[10px] font-medium tabular-nums text-muted-foreground">
                  {b.pct.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-source table */}
        {bySource.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> By lead source
            </p>
            <div className="rounded-md border overflow-hidden">
              <div className="grid grid-cols-5 px-3 py-1.5 bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                <div className="col-span-2">Source</div>
                <div className="text-right">Leads</div>
                <div className="text-right">Median</div>
                <div className="text-right">Fastest / Slowest</div>
              </div>
              {bySource.map((s) => {
                const tone =
                  s.median < 1 ? "text-emerald-700" :
                  s.median < 4 ? "text-blue-700" :
                  s.median < 24 ? "text-amber-700" :
                  "text-rose-700";
                return (
                  <div key={s.source} className="grid grid-cols-5 px-3 py-2 text-xs border-t items-center">
                    <div className="col-span-2 font-medium">
                      {sourceLabel(s.source)}
                    </div>
                    <div className="text-right tabular-nums text-muted-foreground">
                      {s.count}
                    </div>
                    <div className={`text-right tabular-nums font-semibold ${tone}`}>
                      {fmtHours(s.median)}
                    </div>
                    <div className="text-right tabular-nums text-muted-foreground">
                      <span className="text-emerald-700">{fmtHours(s.fastest)}</span>
                      <span className="opacity-50 mx-1">/</span>
                      <span className="text-rose-700">{fmtHours(s.slowest)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
