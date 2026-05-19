'use client';

/**
 * Phase 3 #9.5 — Automation status surface.
 *
 * Read-only v1 — shows the 5 rule definitions + their enabled state.
 * Per-vendor toggles via a settings JSON column are a follow-up; for
 * now ops manage them via env (AUTOMATION_T14_DISABLED=1 etc.).
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Bell,
  Clock,
  Inbox,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Rule {
  kind: string;
  label: string;
  description: string;
  enabled: boolean;
  envFlag: string;
  delegated: boolean;
}

interface AutomationStatus {
  engine: { enabled: boolean; intervalMs: number };
  rules: Rule[];
}

const RULE_ICON: Record<string, React.ReactNode> = {
  t_minus_14: <Bell className="h-4 w-4 text-blue-600" />,
  t_minus_3: <Clock className="h-4 w-4 text-amber-600" />,
  t_minus_1: <CalendarCheck2 className="h-4 w-4 text-violet-600" />,
  t_plus_1_review: <Sparkles className="h-4 w-4 text-emerald-600" />,
  lead_48h_stale: <Inbox className="h-4 w-4 text-rose-600" />,
};

export default function AutomationStatusView() {
  const [data, setData] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get('/api/v1/automation/status')
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Automation status unavailable.
        </CardContent>
      </Card>
    );
  }

  const intervalMin = Math.round(data.engine.intervalMs / 60000);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Engine</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Runs every {intervalMin} minute{intervalMin === 1 ? '' : 's'};
                sends are deduped by outbox + notification idempotency keys.
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                data.engine.enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200',
              )}
            >
              {data.engine.enabled ? 'Running' : 'Disabled'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {data.rules.map((r) => (
          <Card key={r.kind}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {RULE_ICON[r.kind] || (
                    <Bell className="h-4 w-4 text-neutral-400" />
                  )}
                  <span className="text-sm font-semibold truncate">
                    {r.label}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] shrink-0',
                    r.enabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-100 text-neutral-600 border-neutral-300',
                  )}
                >
                  {r.enabled ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {r.enabled ? 'On' : 'Off'}
                </Badge>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {r.description}
              </p>
              {r.delegated && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                >
                  Delegated to dedicated cron
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        Per-vendor toggles ship in a follow-up. For now the platform owners
        flip rules on/off via environment variables (e.g.{' '}
        <code className="text-[10px]">AUTOMATION_T14_DISABLED=1</code>).
      </p>
    </div>
  );
}
