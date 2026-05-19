'use client';

/**
 * Phase 2 #8.9 — Mobile-first Floor command home.
 *
 * Design constraints:
 *   - One-handed phone use. Tap targets >= 44px.
 *   - Loads fast on bad event-tent wifi (single endpoint round-trip
 *     via the existing operations-summary API).
 *   - Always-visible "quick actions" row: Record payment · Block date
 *     · WhatsApp lead nudge · Open today.
 *   - Push install + offline support are handled at the root layout
 *     (PwaRegister + PwaInstallPrompt).
 *
 * Vendor staff on the floor of an event open this on their phone
 * once, leave it open in standalone PWA mode all day, tap actions
 * as the wedding progresses.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosConfig';
import { useUser } from '@/context/UserContext';
import {
  Sparkles,
  Calendar,
  CalendarCheck2,
  Inbox,
  CreditCard,
  Ban,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PushToggle } from '@/components/pwa/push-toggle';

// Mirrors the actual /api/v1/dashboard/operations-summary payload —
// values are arrays; FE derives counts. Optional everywhere so the
// component degrades cleanly when a slice is missing.
interface OpsSummary {
  generatedAt: string;
  today?: string;
  todaysFloor?: {
    todaysBookings?: any[];
    timelineTasksPending?: any[];
    lowFuelGenerators?: any[];
  };
  moneyIn?: {
    heldPdcs?: any[];
    pdcsDueWithin7Days?: any[];
    invoicedUnpaidSheets?: any[];
    receiptsThisMonth?: any[];
  };
  moneyOut?: {
    unpaidSupplierInvoices?: any[];
    unpaidBrokerCommissions?: any[];
    pendingStaffShifts?: any[];
  };
  compliance?: {
    expiringHalalCerts?: any[];
    expiredHalalCerts?: any[];
    expiringDroneNocs?: any[];
    expiredDroneNocs?: any[];
    lowStockItems?: any[];
    pendingFbrSubmissions?: any[];
  };
  functionSheetPipeline?: Record<string, number>;
}

function len(x: any[] | undefined): number {
  return Array.isArray(x) ? x.length : 0;
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Assalam-o-Alaikum';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Working late?';
}

export default function FloorHome() {
  const { user } = useUser();
  const [data, setData] = useState<OpsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    axiosInstance
      .get('/api/v1/dashboard/operations-summary')
      .then((r) => setData(r.data?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="px-4 py-4 max-w-md mx-auto space-y-4 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-bridal-gold-dark/70">
            {timeOfDayGreeting()}
          </p>
          <h1 className="text-xl font-semibold text-neutral-900">
            {user?.fullName || 'Floor'}
          </h1>
        </div>
        <button
          type="button"
          onClick={load}
          className="h-10 w-10 rounded-full border bg-white flex items-center justify-center text-neutral-600 hover:text-bridal-gold-dark active:scale-95 transition"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </header>

      {/* Today strip */}
      <section className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-bridal-gold" />
          <span className="text-sm font-semibold text-neutral-700">Today</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <Tile
              label="Events"
              value={len(data?.todaysFloor?.todaysBookings)}
              tone="gold"
            />
            <Tile
              label="Tasks"
              value={len(data?.todaysFloor?.timelineTasksPending)}
              tone="blue"
            />
            <Tile
              label="PDCs 7d"
              value={len(data?.moneyIn?.pdcsDueWithin7Days)}
              tone="emerald"
            />
            <Tile
              label="Unpaid"
              value={len(data?.moneyIn?.invoicedUnpaidSheets)}
              tone="violet"
            />
          </div>
        )}
      </section>

      {/* Quick actions — big tap targets */}
      <section className="grid grid-cols-2 gap-2.5">
        <ActionTile
          href="/dashboard/today"
          icon={<CalendarCheck2 className="h-5 w-5" />}
          label="Today timeline"
          sub="Run the day-of checklist"
        />
        <ActionTile
          href="/dashboard/leads"
          icon={<Inbox className="h-5 w-5" />}
          label="Lead inbox"
          sub="Reply to new enquiries"
        />
        <ActionTile
          href="/dashboard/receipts"
          icon={<CreditCard className="h-5 w-5" />}
          label="Record payment"
          sub="Cash · JazzCash · IBFT"
        />
        <ActionTile
          href="/dashboard/calendar"
          icon={<Ban className="h-5 w-5" />}
          label="Block date"
          sub="Long-press on calendar"
        />
      </section>

      {/* Alerts — derived from the same payload */}
      {!loading && data && (() => {
        const alerts: Array<{
          severity: 'high' | 'medium' | 'low';
          title: string;
          description?: string;
        }> = [];
        const expiredHalal = len(data.compliance?.expiredHalalCerts);
        const expiredDrone = len(data.compliance?.expiredDroneNocs);
        const lowFuel = len(data.todaysFloor?.lowFuelGenerators);
        const lowStock = len(data.compliance?.lowStockItems);
        const fbrPending = len(data.compliance?.pendingFbrSubmissions);
        const expiringHalal = len(data.compliance?.expiringHalalCerts);
        const expiringDrone = len(data.compliance?.expiringDroneNocs);
        if (expiredHalal > 0) {
          alerts.push({
            severity: 'high',
            title: `${expiredHalal} halal cert${expiredHalal > 1 ? 's' : ''} expired`,
            description: 'Customers may refuse service until renewed.',
          });
        }
        if (expiredDrone > 0) {
          alerts.push({
            severity: 'high',
            title: `${expiredDrone} drone NOC${expiredDrone > 1 ? 's' : ''} expired`,
            description: 'Flying without a valid PCAA NOC is a fine + licence risk.',
          });
        }
        if (lowFuel > 0) {
          alerts.push({
            severity: 'medium',
            title: `${lowFuel} generator${lowFuel > 1 ? 's' : ''} low on fuel`,
            description: 'Refuel before the event starts to avoid mid-walima blackout.',
          });
        }
        if (fbrPending > 0) {
          alerts.push({
            severity: 'medium',
            title: `${fbrPending} sheet${fbrPending > 1 ? 's' : ''} pending FBR submit`,
            description: 'Tier-1 vendors must e-invoice within 24h of issue.',
          });
        }
        if (expiringHalal > 0) {
          alerts.push({
            severity: 'low',
            title: `${expiringHalal} halal cert${expiringHalal > 1 ? 's' : ''} expiring soon`,
          });
        }
        if (expiringDrone > 0) {
          alerts.push({
            severity: 'low',
            title: `${expiringDrone} drone NOC${expiringDrone > 1 ? 's' : ''} expiring soon`,
          });
        }
        if (lowStock > 0) {
          alerts.push({
            severity: 'low',
            title: `${lowStock} inventory item${lowStock > 1 ? 's' : ''} low stock`,
          });
        }
        if (alerts.length === 0) return null;
        return (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-neutral-700">
                Needs attention
              </span>
            </div>
            <ul className="space-y-1.5">
              {alerts.slice(0, 6).map((a, i) => (
                <li
                  key={i}
                  className={cn(
                    'rounded-xl border p-3',
                    a.severity === 'high'
                      ? 'bg-rose-50 border-rose-200'
                      : a.severity === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-neutral-50 border-neutral-200',
                  )}
                >
                  <div className="text-sm font-medium text-neutral-900">
                    {a.title}
                  </div>
                  {a.description && (
                    <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                      {a.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {/* Money in / out summary */}
      {!loading && data && (
        <section className="bg-gradient-to-br from-bridal-gold/15 to-bridal-cream border border-bridal-beige rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-bridal-gold-dark">
              Money flow snapshot
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Held PDCs
              </div>
              <div className="text-lg font-bold tabular-nums text-neutral-900">
                {len(data.moneyIn?.heldPdcs)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Unpaid suppliers
              </div>
              <div className="text-lg font-bold tabular-nums text-neutral-900">
                {len(data.moneyOut?.unpaidSupplierInvoices)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-600">
                Broker payouts
              </div>
              <div className="text-lg font-bold tabular-nums text-neutral-900">
                {len(data.moneyOut?.unpaidBrokerCommissions)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Push toggle — renders only when supported + configured */}
      <PushToggle />

      {/* Footer — full dashboard escape hatch */}
      <Link
        href="/dashboard"
        className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 active:scale-[0.99] transition"
      >
        <div>
          <p className="text-sm font-semibold text-neutral-800">
            Open the full dashboard
          </p>
          <p className="text-xs text-neutral-500">
            Bookings · finances · settings
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-400" />
      </Link>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gold' | 'blue' | 'emerald' | 'violet';
}) {
  const toneClass =
    tone === 'gold'
      ? 'bg-bridal-gold/10 text-bridal-gold-dark'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-800'
        : tone === 'emerald'
          ? 'bg-emerald-50 text-emerald-800'
          : 'bg-violet-50 text-violet-800';
  return (
    <div className={cn('rounded-xl p-2 text-center', toneClass)}>
      <div className="text-xl font-bold tabular-nums leading-tight">
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wide font-medium mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ActionTile({
  href,
  icon,
  label,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-white border border-neutral-200 p-4 active:scale-[0.97] transition flex flex-col gap-1 min-h-[88px]"
    >
      <div className="h-9 w-9 rounded-full bg-bridal-gold/10 text-bridal-gold-dark flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-auto">
        <p className="text-sm font-semibold text-neutral-900 leading-tight">
          {label}
        </p>
        <p className="text-[11px] text-neutral-500 leading-snug mt-0.5">
          {sub}
        </p>
      </div>
    </Link>
  );
}
