'use client';

/**
 * Operations Summary widget — morning-coffee landing-page surface.
 *
 * Aggregates everything I shipped across Phase 1 / 2 / 3 into four
 * intuitive buckets:
 *
 *   1. Today's floor    — events today, pending tasks, low-fuel gensets
 *   2. Money in (A/R)   — held PDCs, due-this-week cheques, invoiced
 *                          unpaid sheets, receipts this month
 *   3. Money out (A/P)  — unpaid supplier invoices (+ overdue count),
 *                          unpaid broker commissions, pending staff payroll
 *   4. Compliance       — expiring + expired halal certs, drone NOCs,
 *                          low-stock inventory, pending FBR submissions
 *
 * Each widget surfaces a count + total (when monetary) + sample row
 * preview + click-through to the relevant feature page.
 *
 * Reads /api/v1/dashboard/operations-summary in a single round-trip.
 * Polls every 5 minutes when the tab is visible so the floor banner
 * stays fresh during a wedding day.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosConfig';
// Issue #55 — vendor-type-aware compliance gating.
import { useUser } from '@/context/UserContext';
import {
  Loader2,
  Calendar,
  Fuel,
  HandCoins,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ClipboardCheck,
  Receipt,
  Handshake,
  HardHat,
  Plane,
  Boxes,
  FileText,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Sample {
  id?: number;
  [k: string]: any;
}
interface Bucket {
  count: number;
  total?: number;
  sample?: Sample[];
  overdueCount?: number;
}

interface OperationsSummary {
  generatedAt: string;
  today: string;
  todaysFloor: {
    todaysBookings: { count: number };
    timelineTasksPending: Bucket;
    lowFuelGenerators: Bucket;
  };
  moneyIn: {
    heldPdcs: { count: number; total: number };
    pdcsDueWithin7Days: Bucket;
    invoicedUnpaidSheets: Bucket;
    receiptsThisMonth: { count: number; total: number };
  };
  moneyOut: {
    unpaidSupplierInvoices: Bucket;
    unpaidBrokerCommissions: Bucket;
    pendingStaffShifts: Bucket;
  };
  compliance: {
    expiringHalalCerts: Bucket;
    expiredHalalCerts: { count: number };
    expiringDroneNocs: Bucket;
    expiredDroneNocs: { count: number };
    lowStockItems: Bucket;
    pendingFbrSubmissions: Bucket;
  };
  functionSheetPipeline: Record<string, number>;
}

function fmtPKR(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `Rs. ${Math.round(n).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// Issue #55 — which vendor types actually consume each compliance
// surface. Halal certs are caterers + venues (kitchen guarantee for
// guests); Drone NOCs are photographers + videographers (CAA drone
// permit before filming). FBR stays universal — every vendor with PKR
// revenue can submit invoices.
const HALAL_VENDOR_TYPES = new Set<string>([
  'Catering',
  'Wedding venue',
  'Live cooking stall',
  'Mithai and sweets',
  'Wedding cakes',
]);
const DRONE_VENDOR_TYPES = new Set<string>([
  'Photographer',
  'Live streaming',
]);

export default function OperationsSummarySection() {
  const [data, setData] = useState<OperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Issue #55 — vendorType drives which compliance cards render.
  // Super-admin (no vendorType) keeps seeing everything for oversight.
  const { user } = useUser();
  const vendorType = (user as any)?.vendorType as string | undefined;
  const showHalal = !vendorType || HALAL_VENDOR_TYPES.has(vendorType);
  const showDrone = !vendorType || DRONE_VENDOR_TYPES.has(vendorType);

  const load = async () => {
    try {
      const res = await axiosInstance.get(
        '/api/v1/dashboard/operations-summary',
      );
      setData(res.data?.data || null);
      setError(null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'Could not load operations summary',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll every 5 minutes when tab is visible.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    const interval = setInterval(load, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (loading && !data) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Operations summary</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Operations summary</h2>
        <Card>
          <CardContent className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            {error || 'Summary unavailable'}
          </CardContent>
        </Card>
      </section>
    );
  }

  const { todaysFloor, moneyIn, moneyOut, compliance } = data;

  const moneyInTotal =
    moneyIn.heldPdcs.total +
    (moneyIn.invoicedUnpaidSheets.total || 0);
  const moneyOutTotal =
    (moneyOut.unpaidSupplierInvoices.total || 0) +
    (moneyOut.unpaidBrokerCommissions.total || 0) +
    (moneyOut.pendingStaffShifts.total || 0);
  const complianceFlags =
    (compliance.expiringHalalCerts.count || 0) +
    (compliance.expiredHalalCerts.count || 0) +
    (compliance.expiringDroneNocs.count || 0) +
    (compliance.expiredDroneNocs.count || 0) +
    (compliance.lowStockItems.count || 0) +
    (compliance.pendingFbrSubmissions.count || 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Operations summary</h2>
          <p className="text-xs text-muted-foreground">
            Across every surface in one place. Refreshes every 5 minutes.
          </p>
        </div>
        {(moneyOut.unpaidSupplierInvoices.overdueCount || 0) +
          (compliance.expiredHalalCerts.count || 0) +
          (compliance.expiredDroneNocs.count || 0) >
          0 && (
          <Badge
            variant="outline"
            className="border-rose-300 bg-rose-50 text-rose-800"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            Action needed
          </Badge>
        )}
      </div>

      {/* Today's floor */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today's floor
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <WidgetCard
            href="/dashboard/today"
            icon={Calendar}
            tone="sky"
            label="Today's events"
            big={todaysFloor.todaysBookings.count}
          />
          <WidgetCard
            href="/dashboard/today"
            icon={ClipboardCheck}
            tone={todaysFloor.timelineTasksPending.count > 0 ? 'amber' : 'neutral'}
            label="Open timeline tasks"
            big={todaysFloor.timelineTasksPending.count}
            sample={todaysFloor.timelineTasksPending.sample?.map((s) => ({
              primary: s.label,
              secondary: s.scheduledTime || '',
            }))}
          />
          <WidgetCard
            href="/dashboard/generator-fuel"
            icon={Fuel}
            tone={todaysFloor.lowFuelGenerators.count > 0 ? 'amber' : 'neutral'}
            label="Low-fuel generators"
            big={todaysFloor.lowFuelGenerators.count}
            sample={todaysFloor.lowFuelGenerators.sample?.map((s) => ({
              primary: s.identifier,
              secondary: `${s.currentLitres}L`,
            }))}
          />
        </div>
      </div>

      {/* Money in / out */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Money in (A/R) — {fmtPKR(moneyInTotal)}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <WidgetCard
              href="/dashboard/pdcs"
              icon={HandCoins}
              tone="amber"
              label="Held cheques"
              big={moneyIn.heldPdcs.count}
              subtitle={fmtPKR(moneyIn.heldPdcs.total)}
            />
            <WidgetCard
              href="/dashboard/pdcs"
              icon={HandCoins}
              tone="rose"
              label="Cheques due 7d"
              big={moneyIn.pdcsDueWithin7Days.count}
              subtitle={fmtPKR(moneyIn.pdcsDueWithin7Days.total)}
              sample={moneyIn.pdcsDueWithin7Days.sample?.map((s) => ({
                primary: s.chequeNumber,
                secondary: `${fmtDate(s.chequeDate)} · ${fmtPKR(s.amount)}`,
              }))}
            />
            <WidgetCard
              href="/dashboard/function-sheets?state=invoiced"
              icon={FileText}
              tone="amber"
              label="Invoiced unpaid"
              big={moneyIn.invoicedUnpaidSheets.count}
              subtitle={fmtPKR(moneyIn.invoicedUnpaidSheets.total)}
              sample={moneyIn.invoicedUnpaidSheets.sample?.map((s) => ({
                primary: s.title,
                secondary: `${s.customerName || '—'} · ${fmtPKR(s.grandTotal)}`,
                href: `/dashboard/function-sheets/${s.id}`,
              }))}
            />
            <WidgetCard
              href="/dashboard/receipts"
              icon={Receipt}
              tone="emerald"
              label="Receipts (MTD)"
              big={moneyIn.receiptsThisMonth.count}
              subtitle={fmtPKR(moneyIn.receiptsThisMonth.total)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Money out (A/P) — {fmtPKR(moneyOutTotal)}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <WidgetCard
              href="/dashboard/suppliers"
              icon={CreditCard}
              tone={
                (moneyOut.unpaidSupplierInvoices.overdueCount || 0) > 0
                  ? 'rose'
                  : 'amber'
              }
              label="Supplier invoices"
              big={moneyOut.unpaidSupplierInvoices.count}
              subtitle={fmtPKR(moneyOut.unpaidSupplierInvoices.total)}
              badgeText={
                (moneyOut.unpaidSupplierInvoices.overdueCount || 0) > 0
                  ? `${moneyOut.unpaidSupplierInvoices.overdueCount} overdue`
                  : undefined
              }
              sample={moneyOut.unpaidSupplierInvoices.sample?.map((s) => ({
                primary: s.supplierName,
                secondary: `${fmtPKR(s.outstanding)} · due ${fmtDate(s.dueDate)}`,
              }))}
            />
            <WidgetCard
              href="/dashboard/brokers"
              icon={Handshake}
              tone="amber"
              label="Broker commissions"
              big={moneyOut.unpaidBrokerCommissions.count}
              subtitle={fmtPKR(moneyOut.unpaidBrokerCommissions.total)}
              sample={moneyOut.unpaidBrokerCommissions.sample?.map((s) => ({
                primary: s.brokerName,
                secondary: fmtPKR(s.outstanding),
              }))}
            />
            <WidgetCard
              href="/dashboard/staff"
              icon={HardHat}
              tone="amber"
              label="Staff payroll pending"
              big={moneyOut.pendingStaffShifts.count}
              subtitle={fmtPKR(moneyOut.pendingStaffShifts.total)}
              sample={moneyOut.pendingStaffShifts.sample?.map((s) => ({
                primary: s.staffName,
                secondary: `${fmtDate(s.shiftDate)} · ${fmtPKR(s.netPayable)}`,
              }))}
            />
          </div>
        </div>
      </div>

      {/* Compliance. Issue #55 — gate Halal + Drone cards by vendor
          type so a photographer doesn't see "0 halal certs" sitting
          irrelevant on their dashboard. FBR + Low stock stay universal
          because every vendor produces invoices + has inventory. */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Compliance ({complianceFlags} flag{complianceFlags === 1 ? '' : 's'})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {showHalal && (
          <WidgetCard
            href="/dashboard/halal-certs"
            icon={ShieldCheck}
            tone={
              compliance.expiredHalalCerts.count > 0
                ? 'rose'
                : compliance.expiringHalalCerts.count > 0
                  ? 'amber'
                  : 'emerald'
            }
            label="Halal certs"
            big={
              compliance.expiringHalalCerts.count +
              compliance.expiredHalalCerts.count
            }
            badgeText={
              compliance.expiredHalalCerts.count > 0
                ? `${compliance.expiredHalalCerts.count} expired`
                : compliance.expiringHalalCerts.count > 0
                  ? 'expiring < 30d'
                  : undefined
            }
            sample={compliance.expiringHalalCerts.sample?.map((s) => ({
              primary: s.certNumber,
              secondary: `${s.supplierName || '—'} · expires ${fmtDate(s.expiryDate)}`,
            }))}
          />
          )}
          {showDrone && (
          <WidgetCard
            href="/dashboard/drone-noc"
            icon={Plane}
            tone={
              compliance.expiredDroneNocs.count > 0
                ? 'rose'
                : compliance.expiringDroneNocs.count > 0
                  ? 'amber'
                  : 'emerald'
            }
            label="Drone NOCs"
            big={
              compliance.expiringDroneNocs.count +
              compliance.expiredDroneNocs.count
            }
            badgeText={
              compliance.expiredDroneNocs.count > 0
                ? `${compliance.expiredDroneNocs.count} expired`
                : compliance.expiringDroneNocs.count > 0
                  ? 'expiring < 30d'
                  : undefined
            }
            sample={compliance.expiringDroneNocs.sample?.map((s) => ({
              primary: s.referenceNumber,
              secondary: `${s.droneModel || '—'} · valid until ${fmtDate(s.validUntil)}`,
            }))}
          />
          )}
          <WidgetCard
            href="/dashboard/inventory?lowStockOnly=true"
            icon={Boxes}
            tone={compliance.lowStockItems.count > 0 ? 'amber' : 'emerald'}
            label="Low-stock items"
            big={compliance.lowStockItems.count}
            sample={compliance.lowStockItems.sample?.map((s) => ({
              primary: s.name,
              secondary: `${s.currentStock} ${s.unit} (threshold ${s.threshold})`,
            }))}
          />
          <WidgetCard
            href="/dashboard/function-sheets?state=invoiced"
            icon={FileText}
            tone={
              compliance.pendingFbrSubmissions.count > 0 ? 'amber' : 'emerald'
            }
            label="FBR submissions pending"
            big={compliance.pendingFbrSubmissions.count}
            sample={compliance.pendingFbrSubmissions.sample?.map((s) => ({
              primary: s.title,
              secondary: `${fmtPKR(s.grandTotal)} · ${s.fbrSubmissionStatus || 'not submitted'}`,
              href: `/dashboard/function-sheets/${s.id}`,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

// ─── WidgetCard ───────────────────────────────────────────────────

const TONE_CLASSES: Record<
  'neutral' | 'sky' | 'emerald' | 'amber' | 'rose',
  { border: string; bg: string; iconColor: string }
> = {
  neutral: {
    border: 'border-neutral-200',
    bg: 'bg-white',
    iconColor: 'text-neutral-500',
  },
  sky: {
    border: 'border-sky-200',
    bg: 'bg-sky-50/40',
    iconColor: 'text-sky-700',
  },
  emerald: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/40',
    iconColor: 'text-emerald-700',
  },
  amber: {
    border: 'border-amber-300',
    bg: 'bg-amber-50/40',
    iconColor: 'text-amber-700',
  },
  rose: {
    border: 'border-rose-300',
    bg: 'bg-rose-50/40',
    iconColor: 'text-rose-700',
  },
};

function WidgetCard({
  href,
  icon: Icon,
  tone = 'neutral',
  label,
  big,
  subtitle,
  badgeText,
  sample,
}: {
  href: string;
  icon: React.ElementType;
  tone?: keyof typeof TONE_CLASSES;
  label: string;
  big: number;
  subtitle?: string;
  badgeText?: string;
  sample?: Array<{ primary: string; secondary?: string; href?: string }>;
}) {
  const toneCls = TONE_CLASSES[tone];
  return (
    <Card className={`${toneCls.border} ${toneCls.bg} transition hover:shadow-sm`}>
      <CardContent className="space-y-2 p-3">
        <Link href={href} className="block group">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                <Icon className={`h-3.5 w-3.5 ${toneCls.iconColor}`} />
                {label}
              </div>
              <div className="text-2xl font-bold">{big.toLocaleString('en-PK')}</div>
              {subtitle && (
                <div className="text-xs text-muted-foreground">{subtitle}</div>
              )}
            </div>
            <ArrowRight className="h-3 w-3 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-neutral-900" />
          </div>
          {badgeText && (
            <Badge
              variant="outline"
              className={`mt-1 text-[10px] ${toneCls.border} ${toneCls.iconColor}`}
            >
              {badgeText}
            </Badge>
          )}
        </Link>
        {sample && sample.length > 0 && (
          <ul className="space-y-0.5 border-t border-neutral-200 pt-2 text-[11px]">
            {sample.map((s, idx) => {
              const content = (
                <>
                  <span className="truncate font-medium">{s.primary}</span>
                  {s.secondary && (
                    <span className="ml-1 text-muted-foreground">{s.secondary}</span>
                  )}
                </>
              );
              return (
                <li key={idx} className="flex items-baseline gap-1 truncate">
                  {s.href ? (
                    <Link href={s.href} className="truncate hover:underline">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
