'use client';

/**
 * Phase 4 #10.4 — Advanced insights view.
 *
 *   Funnel per lead source
 *   Quote acceptance rate
 *   Monthly avg ticket-size trend (12 months)
 *   Customer LTV (mean / median / p90 / repeat rate)
 *   90-day revenue forecast (rolling + YoY blend)
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  Users,
  Filter,
  FileCheck,
  CalendarRange,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { InsightsAPI, type InsightsAdvanced } from '@/lib/api/insights';
import { LEAD_SOURCE_LABELS, type LeadSource } from '@/lib/api/leads';
import RevenueBreakdowns from './revenue-breakdowns';
import MonthlyPnl from './monthly-pnl';
import CashFlowForecast from './cash-flow-forecast';
import SeasonalDemandHeatmap from './seasonal-demand-heatmap';
import ResponseTimes from './response-times';
import WhatsAppTemplatePerformance from './whatsapp-template-performance';
import UpgradeNudge from '@/components/dashboard/shared/upgrade-nudge';

function fmtPKR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

export default function InsightsView() {
  const [data, setData] = useState<InsightsAdvanced | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    InsightsAPI.getAdvanced()
      .then((r) => setData(r))
      .catch((e) =>
        toast.error(e?.response?.data?.message || 'Failed to load insights'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No insights data yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Soft upgrade nudge — advanced insights are a Business-plan
          feature (§17.1). Non-blocking; renders only when billing is on
          and the vendor is on a lower tier. */}
      <UpgradeNudge feature="analytics" message="Advanced insights are a Business-plan feature — you're previewing them." />

      {/* Quote acceptance + LTV summary */}
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard
          icon={<FileCheck className="h-4 w-4 text-emerald-600" />}
          label="Quote acceptance"
          value={
            data.quotes.quoteAcceptanceRate != null
              ? `${data.quotes.quoteAcceptanceRate}%`
              : '—'
          }
          sub={`${data.quotes.quotesAccepted} of ${data.quotes.quotesSent} sheets`}
        />
        <KpiCard
          icon={<Users className="h-4 w-4 text-violet-600" />}
          label="Repeat customers"
          value={`${data.customers.repeatRate}%`}
          sub={`${data.customers.repeatCustomers} of ${data.customers.unique}`}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          label="Median LTV"
          value={fmtPKR(data.customers.medianLtv)}
          sub={`p90 ${fmtPKR(data.customers.p90Ltv)}`}
        />
        <KpiCard
          icon={<Sparkles className="h-4 w-4 text-amber-600" />}
          label="90-day forecast"
          value={fmtPKR(data.forecast.projection90Blend)}
          sub={data.forecast.methodology}
        />
      </div>

      {/* Funnel per source */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">
              Funnel by lead source
            </span>
          </div>
          {data.funnel.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No leads logged yet.
            </p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-neutral-500 text-left">
                    <th className="py-1 font-medium">Source</th>
                    <th className="py-1 font-medium text-right">Leads</th>
                    <th className="py-1 font-medium text-right">Contacted</th>
                    <th className="py-1 font-medium text-right">Quoted</th>
                    <th className="py-1 font-medium text-right">Booked</th>
                    <th className="py-1 font-medium text-right">Lost</th>
                    <th className="py-1 font-medium text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.funnel.map((f) => (
                    <tr key={f.source} className="border-t border-neutral-100">
                      <td className="py-1.5">
                        {LEAD_SOURCE_LABELS[f.source as LeadSource] || f.source}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {f.total}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {f.contacted}
                      </td>
                      <td className="py-1.5 text-right tabular-nums">
                        {f.quoted}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-emerald-700 font-medium">
                        {f.booked}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-rose-700">
                        {f.lost}
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-medium">
                        {f.bookingRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly trend */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">
              Avg ticket size — last 12 months
            </span>
          </div>
          <div className="space-y-1.5">
            {(() => {
              const maxAvg = Math.max(
                ...data.monthly.map((m) => m.avgTicket),
                1,
              );
              return data.monthly.map((m) => {
                const pct = Math.round((m.avgTicket / maxAvg) * 100);
                return (
                  <div key={m.monthStart} className="flex items-center gap-2">
                    <div className="w-16 text-[11px] text-neutral-500 shrink-0">
                      {m.monthLabel}
                    </div>
                    <div className="flex-1 relative h-5 rounded bg-neutral-100 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-bridal-gold/70"
                        style={{ width: `${pct}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-[10px] text-neutral-800 font-medium tabular-nums">
                        {fmtPKR(m.avgTicket)}
                      </span>
                    </div>
                    <div className="w-16 text-[10px] text-neutral-500 text-right shrink-0 tabular-nums">
                      {m.bookings} bk
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Forecast explanation */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">
              90-day revenue forecast
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-md border bg-neutral-50/40 p-3">
              <div className="text-neutral-500 mb-0.5">Last 30 days</div>
              <div className="text-base font-bold tabular-nums">
                {fmtPKR(data.forecast.rolling30)}
              </div>
            </div>
            <div className="rounded-md border bg-neutral-50/40 p-3">
              <div className="text-neutral-500 mb-0.5">
                Prior-year same 90d window
              </div>
              <div className="text-base font-bold tabular-nums">
                {data.forecast.yoy90Revenue > 0
                  ? fmtPKR(data.forecast.yoy90Revenue)
                  : '—'}
              </div>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-emerald-700 mb-0.5">
                Projection (next 90d)
              </div>
              <div className="text-base font-bold tabular-nums text-emerald-900">
                {fmtPKR(data.forecast.projection90Blend)}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            Methodology: {data.forecast.methodology}. Treat as a rough
            heuristic — real forecasts need 18+ months of data and
            seasonality modelling.
          </p>
        </CardContent>
      </Card>

      {/* Revenue breakdowns (audit gaps G1+G6+G7) — payment-method
          mix, top customers by revenue, by-business slice. Self-
          contained component, fetches its own data on mount. */}
      <RevenueBreakdowns />

      {/* Monthly P&L — accrual profit per month, revenue against the four
          cost ledgers. The "did I actually make money?" view. */}
      <MonthlyPnl />

      {/* Cash-flow forecast (audit gap G4) — month-by-month expected
          inflows from BOOKED installments. Pairs with /receivables. */}
      <CashFlowForecast />

      {/* Seasonal demand heatmap (audit gap G2) — 24-month grid of the
          vendor's own bookings + revenue rhythm with YoY compare. */}
      <SeasonalDemandHeatmap />

      {/* Response-time analytics (audit gap G8 — FINAL gap) — median
          hours from lead arrival to first response + distribution +
          per-source breakdown. */}
      <ResponseTimes />

      {/* WhatsApp template performance — per-template sends correlated
          with Lead → booked / Booking → paid outcomes. */}
      <WhatsAppTemplatePerformance />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-neutral-500">
          {icon}
          {label}
        </div>
        <div className="text-lg font-bold text-neutral-900">{value}</div>
        <div className="text-xs text-neutral-500 truncate" title={sub}>
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}
