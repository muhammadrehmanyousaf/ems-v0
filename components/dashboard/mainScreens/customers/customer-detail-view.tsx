'use client';

/**
 * Customer 360 — dedicated CRM page that aggregates every interaction
 * the vendor has had with this customer:
 *   - All bookings (active + cancelled), with payment status
 *   - All function sheets (quote → contract → invoice → paid lifecycle)
 *   - All leads (inbox conversion source)
 *   - Lifetime stats (revenue, ticket size, repeat status)
 *
 * This is the natural complement to the Function Sheet detail page and
 * the Booking detail page — those let you drill into ONE event; this
 * lets you see the customer's full history with you.
 *
 * Pakistani-wedding context: ~30% of vendor business is repeat
 * customers (sibling weddings, second marriages, family network
 * referrals). A view that surfaces "you've booked this family 3 times
 * for Rs. 4.2M total" prompts loyalty pricing and warm follow-up.
 */

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  Repeat,
  CalendarDays,
  FileText,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import WhatsAppQuickSend from '@/components/dashboard/shared/whatsapp-quick-send';

import {
  CustomersAPI,
  type CustomerProfileResponse,
} from '@/lib/api/dashboard';
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_TONES,
  type LeadStatus,
  type LeadSource,
} from '@/lib/api/leads';

const bookingStatusColors: Record<string, string> = {
  'Awaiting Payment': 'bg-orange-50 text-orange-700 border-orange-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const sheetStateColors: Record<string, string> = {
  draft: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  quote_sent: 'bg-blue-50 text-blue-700 border-blue-200',
  contract_pending: 'bg-amber-50 text-amber-800 border-amber-200',
  signed: 'bg-violet-50 text-violet-700 border-violet-200',
  beo_ready: 'bg-sky-50 text-sky-700 border-sky-200',
  invoiced: 'bg-orange-50 text-orange-700 border-orange-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-neutral-100 text-neutral-600 border-neutral-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Parse the route identifier into a backend query param.
 *
 * The customers listing uses these conventions:
 *   - Email-having customers: _id = the email address
 *   - Offline-only customers: _id = `offline_<id>`
 * Phone-only customers don't currently surface in the listing's _id,
 * but if the FE ever wants to deep-link via phone we'll accept
 * `phone_<digits>` here too.
 */
function parseIdentifier(raw: string): {
  email?: string;
  phone?: string;
  offlineId?: number;
} {
  const trimmed = (raw || '').trim();
  if (!trimmed) return {};
  const offMatch = trimmed.match(/^offline[_-](\d+)$/i);
  if (offMatch) return { offlineId: Number(offMatch[1]) };
  const phMatch = trimmed.match(/^phone[_-]([\d+\-\s]+)$/i);
  if (phMatch) return { phone: phMatch[1].trim() };
  if (trimmed.includes('@')) return { email: trimmed };
  // Fall back: treat anything else as a phone string.
  return { phone: trimmed };
}

export default function CustomerDetailView({
  identifier,
}: {
  identifier: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<CustomerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const params = useMemo(() => parseIdentifier(identifier), [identifier]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        if (
          !params.email &&
          !params.phone &&
          params.offlineId == null
        ) {
          setError('Invalid customer identifier');
          setLoading(false);
          return;
        }
        const res = await CustomersAPI.getProfile(params);
        if (cancelled) return;
        if (!res) {
          setError('Customer not found');
        } else {
          setData(res);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(
          e?.response?.data?.message ||
            'Failed to load customer profile',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/customers')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to customers
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load customer</p>
              <p className="mt-1 text-red-700">{error || 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { profile, stats, bookings, functionSheets, leads } = data;
  const displayName = profile.name || profile.email || profile.phone || 'Customer';

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/customers')}
          className="gap-1.5 -ml-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Customers
        </Button>
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-bridal-gold/15 text-bridal-gold-dark text-lg font-semibold">
              {(displayName.charAt(0) || 'C').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {displayName}
              </h1>
              {stats.repeatCustomer && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                >
                  <Repeat className="h-3 w-3" />
                  Repeat customer
                </Badge>
              )}
              {profile.offlineCustomerId && (
                <Badge
                  variant="outline"
                  className="bg-neutral-100 text-neutral-700 border-neutral-300"
                >
                  Offline
                </Badge>
              )}
            </div>
            <div className="mt-1 text-sm text-neutral-500 flex items-center gap-3 flex-wrap">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 hover:text-bridal-gold-dark"
                >
                  <Mail className="h-3.5 w-3.5" /> {profile.email}
                </a>
              )}
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-1.5 hover:text-bridal-gold-dark"
                >
                  <Phone className="h-3.5 w-3.5" /> {profile.phone}
                </a>
              )}
              {profile.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.address}
                </span>
              )}
              {process.env.NEXT_PUBLIC_WA_TEMPLATES === '1' && profile.phone && (
                <WhatsAppQuickSend
                  phone={profile.phone}
                  customerName={profile.name}
                  buttonClassName="h-7 px-2 text-xs"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats strip ────────────────────────────────────────── */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          label="Lifetime revenue"
          value={fmtPKR(stats.lifetimeRevenue)}
          sub={
            stats.cancelledRevenue > 0
              ? `${fmtPKR(stats.cancelledRevenue)} cancelled`
              : null
          }
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4 text-bridal-gold" />}
          label="Bookings"
          value={`${stats.totalBookings - stats.cancelledBookings} active`}
          sub={
            stats.upcomingBookings > 0
              ? `${stats.upcomingBookings} upcoming`
              : stats.daysSinceLastBooking != null
                ? `Last: ${stats.daysSinceLastBooking}d ago`
                : null
          }
        />
        <StatCard
          icon={<FileText className="h-4 w-4 text-violet-600" />}
          label="Function sheets"
          value={String(stats.totalFunctionSheets)}
          sub={
            stats.paidSheets > 0
              ? `${stats.paidSheets} paid`
              : stats.invoicedSheets > 0
                ? `${stats.invoicedSheets} invoiced`
                : null
          }
        />
        <StatCard
          icon={<Sparkles className="h-4 w-4 text-blue-600" />}
          label="Avg ticket size"
          value={fmtPKR(stats.avgTicketSize)}
          sub={
            stats.totalLeads > 0
              ? `${stats.totalLeads} leads · ${stats.convertedLeads} converted`
              : null
          }
        />
      </div>

      {/* ─── Bookings ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">
                Bookings
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {bookings.length}
            </Badge>
          </div>
          {bookings.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No bookings yet. This customer has only enquired so far.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {bookings.map((b) => (
                <li key={b.id} className="py-2.5">
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="flex items-start justify-between gap-3 hover:bg-neutral-50 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-neutral-800">
                          #{b.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] py-0',
                            bookingStatusColors[b.status],
                          )}
                        >
                          {b.status}
                        </Badge>
                        {b.paymentStatus && b.status !== 'Cancelled' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0"
                          >
                            {b.paymentStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {fmtDate(b.bookingDate)}
                        {b.guestCount ? ` · ${b.guestCount} guests` : ''}
                        {b.bookingSource ? ` · ${b.bookingSource}` : ''}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-bridal-gold-dark">
                        {fmtPKR(b.totalAmount)}
                      </div>
                      {Number(b.downPayment) > 0 && (
                        <div className="text-[11px] text-neutral-500">
                          DP {fmtPKR(b.downPayment)}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ─── Two-column: Function sheets + Leads ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Function sheets */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Function sheets
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {functionSheets.length}
              </Badge>
            </div>
            {functionSheets.length === 0 ? (
              <p className="text-xs text-neutral-400">
                No function sheets for this customer yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {functionSheets.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/function-sheets/${s.id}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2 hover:bg-neutral-50"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-800 truncate">
                          {s.title || `Sheet #${s.id}`}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {fmtDate(s.eventDate || s.createdAt)} ·{' '}
                          {fmtPKR(s.grandTotal)}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] py-0 capitalize shrink-0',
                          sheetStateColors[s.state],
                        )}
                      >
                        {s.state.replace(/_/g, ' ')}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Leads
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {leads.length}
              </Badge>
            </div>
            {leads.length === 0 ? (
              <p className="text-xs text-neutral-400">
                No leads from this customer.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {leads.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">
                        {LEAD_SOURCE_LABELS[l.source as LeadSource] || l.source}
                        {l.eventType ? ` · ${l.eventType}` : ''}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {fmtDate(l.createdAt)}
                        {l.bookingId ? (
                          <>
                            {' '}
                            ·{' '}
                            <Link
                              href={`/dashboard/bookings/${l.bookingId}`}
                              className="text-emerald-700 hover:underline"
                            >
                              Converted to Booking #{l.bookingId}
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] py-0 shrink-0',
                        LEAD_STATUS_TONES[l.status as LeadStatus]?.bg,
                        LEAD_STATUS_TONES[l.status as LeadStatus]?.text,
                        LEAD_STATUS_TONES[l.status as LeadStatus]?.border,
                      )}
                    >
                      {LEAD_STATUS_LABELS[l.status as LeadStatus] || l.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-neutral-500">
          {icon}
          {label}
        </div>
        <div className="text-lg font-bold text-neutral-900">{value}</div>
        {sub && <div className="text-xs text-neutral-500">{sub}</div>}
      </CardContent>
    </Card>
  );
}
