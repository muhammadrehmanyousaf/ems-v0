'use client';

/**
 * Phase 5 — Platform pulse view for super-admins.
 *
 * Polls /api/v1/admin/platform-pulse on mount + a manual refresh
 * button. Six sections rolled up from the BE controller:
 *   Vendors · Bookings · Money in · Function sheets · Compliance
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  CalendarCheck2,
  TrendingUp,
  FileText,
  ShieldAlert,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Pulse {
  generatedAt: string;
  vendors: {
    total: number;
    active: number;
    suspended: number;
    pendingReview: number;
  };
  bookings: {
    last24h: number;
    last7d: number;
    cancelled7d: number;
    openDisputes: number;
  };
  moneyIn: { last24h: number; last7d: number };
  functionSheets: Record<string, number>;
  compliance: {
    expiredHalalCerts: number;
    expiredDroneNocs: number;
    pendingFbrSubmissions: number;
  };
}

function fmtPKR(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}

export default function PlatformPulseView() {
  const [data, setData] = useState<Pulse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/api/v1/admin/platform-pulse')
      .then((r) => setData(r.data?.data ?? null))
      .catch((e) =>
        toast.error(
          e?.response?.data?.message || 'Failed to load platform pulse',
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Could not load platform pulse.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Snapshot taken {new Date(data.generatedAt).toLocaleString('en-PK')}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={load}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Section
          icon={<Users className="h-4 w-4 text-bridal-gold" />}
          title="Vendors"
        >
          <Row k="Total" v={data.vendors.total} />
          <Row k="Active" v={data.vendors.active} tone="good" />
          <Row k="Suspended" v={data.vendors.suspended} tone="bad" />
          <Row k="Pending review" v={data.vendors.pendingReview} tone="warn" />
        </Section>

        <Section
          icon={<CalendarCheck2 className="h-4 w-4 text-blue-600" />}
          title="Bookings"
        >
          <Row k="Last 24h" v={data.bookings.last24h} tone="good" />
          <Row k="Last 7d" v={data.bookings.last7d} />
          <Row
            k="Cancelled 7d"
            v={data.bookings.cancelled7d}
            tone={data.bookings.cancelled7d > 0 ? 'warn' : undefined}
          />
          <Row
            k="Open disputes"
            v={data.bookings.openDisputes}
            tone={data.bookings.openDisputes > 0 ? 'bad' : 'good'}
          />
        </Section>

        <Section
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          title="Money in"
        >
          <Row k="Last 24h" v={fmtPKR(data.moneyIn.last24h)} tone="good" />
          <Row k="Last 7d" v={fmtPKR(data.moneyIn.last7d)} />
        </Section>

        <Section
          icon={<FileText className="h-4 w-4 text-violet-600" />}
          title="Function sheets"
        >
          {Object.keys(data.functionSheets).length === 0 ? (
            <Row k="No sheets yet" v="—" />
          ) : (
            Object.entries(data.functionSheets).map(([state, count]) => (
              <Row
                key={state}
                k={state.replace(/_/g, ' ')}
                v={count}
                tone={
                  state === 'paid'
                    ? 'good'
                    : state === 'cancelled'
                      ? 'bad'
                      : undefined
                }
              />
            ))
          )}
        </Section>

        <Section
          icon={<ShieldAlert className="h-4 w-4 text-rose-600" />}
          title="Compliance gaps"
        >
          <Row
            k="Expired halal certs"
            v={data.compliance.expiredHalalCerts}
            tone={data.compliance.expiredHalalCerts > 0 ? 'bad' : 'good'}
          />
          <Row
            k="Expired drone NOCs"
            v={data.compliance.expiredDroneNocs}
            tone={data.compliance.expiredDroneNocs > 0 ? 'bad' : 'good'}
          />
          <Row
            k="Pending FBR submits"
            v={data.compliance.pendingFbrSubmissions}
            tone={
              data.compliance.pendingFbrSubmissions > 0 ? 'warn' : 'good'
            }
          />
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
        </div>
        <ul className="space-y-1.5">{children}</ul>
      </CardContent>
    </Card>
  );
}

function Row({
  k,
  v,
  tone,
}: {
  k: string;
  v: number | string;
  tone?: 'good' | 'bad' | 'warn';
}) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span className="text-neutral-600 capitalize">{k}</span>
      <Badge
        variant="outline"
        className={cn(
          'text-xs font-semibold tabular-nums',
          tone === 'good' &&
            'bg-emerald-50 text-emerald-700 border-emerald-200',
          tone === 'bad' && 'bg-rose-50 text-rose-700 border-rose-200',
          tone === 'warn' && 'bg-amber-50 text-amber-800 border-amber-200',
          !tone && 'bg-neutral-50 text-neutral-700 border-neutral-200',
        )}
      >
        {v}
      </Badge>
    </li>
  );
}
