'use client';

/**
 * Phase 4 #10.5 — Multi-business overview.
 *
 * Single page that rolls up every business the vendor owns side by
 * side: bookings + revenue, function sheets + paid revenue, leads +
 * conversion, reliability score + tier. A grand-total strip at the
 * top sums across all businesses so multi-business vendors see their
 * full empire at a glance.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  TrendingUp,
  CalendarDays,
  FileText,
  Inbox,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { TIER_LABELS, TIER_TONES } from '@/lib/api/reliability';

interface BizRow {
  businessId: number;
  name: string;
  vendorType: string | null;
  city: string | null;
  bookings: number;
  bookingRevenue: number;
  sheets: number;
  paidSheets: number;
  sheetRevenue: number;
  leads: number;
  openLeads: number;
  convertedLeads: number;
  conversionRate: number;
  reliability: {
    score: number;
    tier: keyof typeof TIER_LABELS;
    badges: string[];
  };
}

interface OverviewResponse {
  businesses: BizRow[];
  grandTotal: {
    bookings: number;
    bookingRevenue: number;
    sheets: number;
    sheetRevenue: number;
    leads: number;
    convertedLeads: number;
  };
}

function fmtPKR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

export default function BusinessesOverviewView() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/businesses/my-overview')
      .then((r) => setData(r.data?.data ?? null))
      .catch((e) =>
        toast.error(e?.response?.data?.message || 'Failed to load overview'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.businesses.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          You don&apos;t own any businesses yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grand total */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
            Across all {data.businesses.length} business{data.businesses.length === 1 ? '' : 'es'}
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Total
              icon={<CalendarDays className="h-4 w-4 text-bridal-gold" />}
              label="Total bookings"
              value={String(data.grandTotal.bookings)}
              sub={fmtPKR(data.grandTotal.bookingRevenue)}
            />
            <Total
              icon={<FileText className="h-4 w-4 text-violet-600" />}
              label="Function sheets"
              value={String(data.grandTotal.sheets)}
              sub={fmtPKR(data.grandTotal.sheetRevenue) + ' paid'}
            />
            <Total
              icon={<Inbox className="h-4 w-4 text-blue-600" />}
              label="Leads"
              value={String(data.grandTotal.leads)}
              sub={`${data.grandTotal.convertedLeads} converted`}
            />
            <Total
              icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
              label="Grand revenue"
              value={fmtPKR(
                data.grandTotal.bookingRevenue + data.grandTotal.sheetRevenue,
              )}
              sub="bookings + sheets"
            />
          </div>
        </CardContent>
      </Card>

      {/* Per-business cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.businesses.map((b) => (
          <BusinessCard key={b.businessId} biz={b} />
        ))}
      </div>
    </div>
  );
}

function Total({
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
    <div className="rounded-md border bg-neutral-50/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-neutral-500">
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-neutral-900 mt-1 tabular-nums">
        {value}
      </div>
      <div className="text-[11px] text-neutral-500 mt-0.5 truncate" title={sub}>
        {sub}
      </div>
    </div>
  );
}

function BusinessCard({ biz }: { biz: BizRow }) {
  const tone = TIER_TONES[biz.reliability.tier] || TIER_TONES.newcomer;
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-semibold truncate">{biz.name}</h2>
            <div className="text-[11px] text-neutral-500 mt-0.5 flex gap-2 flex-wrap">
              {biz.vendorType && <span>{biz.vendorType}</span>}
              {biz.city && <span>· {biz.city}</span>}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs shrink-0 gap-1', tone.bg, tone.text, tone.border)}
          >
            <ShieldCheck className="h-3 w-3" />
            {biz.reliability.score} · {TIER_LABELS[biz.reliability.tier]}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <Metric label="Bookings" value={biz.bookings} sub={fmtPKR(biz.bookingRevenue)} />
          <Metric
            label="Function sheets"
            value={biz.sheets}
            sub={`${biz.paidSheets} paid · ${fmtPKR(biz.sheetRevenue)}`}
          />
          <Metric
            label="Leads"
            value={biz.leads}
            sub={`${biz.openLeads} open · ${biz.conversionRate}% conv.`}
          />
          <Metric
            label="Reliability"
            value={`${biz.reliability.score}`}
            sub={`${biz.reliability.badges.length} badge${biz.reliability.badges.length === 1 ? '' : 's'}`}
          />
        </div>

        <div className="flex items-center justify-end">
          <Link
            href={`/dashboard/reliability`}
            className="inline-flex items-center gap-1 text-[11px] text-bridal-gold-dark hover:underline"
          >
            Improve reliability
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-md border bg-neutral-50/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums mt-0.5">{value}</div>
      {sub && (
        <div className="text-[10px] text-neutral-500 mt-0.5 truncate" title={sub}>
          {sub}
        </div>
      )}
    </div>
  );
}
