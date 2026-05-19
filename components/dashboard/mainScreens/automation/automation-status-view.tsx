'use client';

/**
 * Phase 3 #9.5 — Automation status surface.
 *
 * Shows the 5 rule definitions + per-vendor toggles. Two layers:
 *   - vendorEnabled  per-vendor opt-out (persisted to User.automationPrefs)
 *   - envDisabled    global ops kill-switch (env var, takes precedence)
 *
 * Toggles only flip the vendor preference; when env disables the rule
 * we surface a separate "Disabled by ops" pill so the vendor knows
 * their preference isn't the blocker.
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosConfig';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Rule {
  kind: string;
  label: string;
  description: string;
  enabled: boolean;
  envFlag: string;
  envDisabled: boolean;
  vendorEnabled: boolean;
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
  const [busyKind, setBusyKind] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/api/v1/automation/status')
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (kind: string, next: boolean) => {
    setBusyKind(kind);
    try {
      await axiosInstance.patch('/api/v1/automation/prefs', {
        kind,
        enabled: next,
      });
      toast.success(next ? 'Rule enabled' : 'Rule paused');
      // Optimistic local update — avoids the full reload bounce.
      setData((d) => {
        if (!d) return d;
        return {
          ...d,
          rules: d.rules.map((r) =>
            r.kind === kind
              ? {
                  ...r,
                  vendorEnabled: next,
                  enabled: next && !r.envDisabled,
                }
              : r,
          ),
        };
      });
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || 'Could not save preference',
      );
    } finally {
      setBusyKind(null);
    }
  };

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
                {busyKind === r.kind ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400 shrink-0" />
                ) : (
                  <Switch
                    checked={r.vendorEnabled}
                    onCheckedChange={(v) => toggle(r.kind, v)}
                    disabled={r.envDisabled || r.delegated}
                    aria-label={`Toggle ${r.label}`}
                  />
                )}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {r.description}
              </p>
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
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
                  {r.enabled ? 'Active' : 'Inactive'}
                </Badge>
                {r.envDisabled && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                  >
                    Disabled by ops
                  </Badge>
                )}
                {r.delegated && (
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Delegated cron
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        Toggles save instantly to your account. Rules marked &ldquo;Disabled
        by ops&rdquo; are paused platform-wide via env var and can&apos;t
        be re-enabled here — please contact support.
      </p>
    </div>
  );
}
