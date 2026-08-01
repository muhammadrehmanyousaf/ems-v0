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
import { ReceiptsAPI, type PaymentReceipt } from '@/lib/api/paymentReceipts';
import { listMyDisputes, type AdminDisputeRow } from '@/lib/api/disputes';
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
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import WhatsAppQuickSend from '@/components/dashboard/shared/whatsapp-quick-send';
import CustomerTrustCard from './customer-trust-card';
import CommunityTrustPanel from './community-trust-panel';
import CustomerTimeline from './customer-timeline';

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

  // Payments received. There is no customer-scoped receipts endpoint — receipts
  // are keyed by booking or by a registered user id, and a Customer here is
  // identified by email/phone (many are walk-ins with no account at all). So we
  // pull the vendor's own receipts once and match them to this customer's
  // bookings. That is a single request, and a vendor's receipt count is small
  // (68 across all of production today), so this is cheaper than one call per
  // booking and needs no backend change.
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ReceiptsAPI.list();
        if (!cancelled) setReceipts(res.receipts ?? []);
      } catch {
        // Non-fatal: the rest of the profile must still render.
        if (!cancelled) setReceipts([]);
      } finally {
        if (!cancelled) setReceiptsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Disputes on this vendor's own bookings, scoped server-side. Fetched by
  // email where we have one; where we don't (walk-in with a phone only) we pull
  // the vendor's disputes and match on booking below, same as receipts.
  const [disputes, setDisputes] = useState<AdminDisputeRow[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listMyDisputes(
          params.email ? { customerEmail: params.email } : {},
        );
        if (!cancelled) setDisputes(res.rows ?? []);
      } catch {
        // Non-fatal — a customer page must never blank because of a side panel.
        if (!cancelled) setDisputes([]);
      } finally {
        if (!cancelled) setDisputesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.email]);

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

  // Match receipts to this customer: by one of their bookings, or — for a
  // receipt logged without a booking — by the linked account's email. Email is
  // compared case-insensitively because the same person books as Ali@… and
  // ali@… (WW-077 fixed the same thing in the booking authz path).
  const bookingIds = new Set(bookings.map((b) => b.id));
  const profileEmail = (profile.email || '').trim().toLowerCase();
  const customerReceipts = receipts.filter((r) => {
    if (r.bookingId != null && bookingIds.has(r.bookingId)) return true;
    const linked = (r.customer?.email || '').trim().toLowerCase();
    return !!profileEmail && linked === profileEmail;
  });
  const receiptsTotal = customerReceipts.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  );

  // Same matching rule as receipts: this customer's bookings, or the booking's
  // own email case-insensitively. The server already scoped these to the
  // vendor, so this only narrows to the customer being viewed.
  const customerDisputes = disputes.filter((d) => {
    if (d.bookingId != null && bookingIds.has(d.bookingId)) return true;
    const bEmail = (d.booking?.customerEmail || '').trim().toLowerCase();
    return !!profileEmail && bEmail === profileEmail;
  });
  const openDisputes = customerDisputes.filter((d) => d.status === 'open').length;

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
              {profile.phone && (
                <WhatsAppQuickSend
                  phone={profile.phone}
                  customerName={profile.name}
                  buttonClassName="h-7 px-2 text-xs"
                  targetType="customer"
                  targetId={profile.offlineCustomerId || undefined}
                  customerId={profile.offlineCustomerId || undefined}
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

      {/* ─── Trust & risk (offline customers only, §26.4) ───────── */}
      {profile.offlineCustomerId && (
        <CustomerTrustCard
          offlineCustomerId={profile.offlineCustomerId}
          customerName={displayName}
        />
      )}

      {/* ─── Community trust (cross-vendor aggregate) ───────────── */}
      {(profile.phone || profile.email) && (
        <CommunityTrustPanel phone={profile.phone} email={profile.email} />
      )}

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

      {/* ─── Communication timeline ─────────────────────────────── */}
      <CustomerTimeline params={params} />

      {/* ─── Payments received ───────────────────────────────────────
          The customer page showed bookings, sheets and leads but never the
          money that actually arrived — a vendor asking "has this family paid
          me?" had to leave, open Receipts, and search by name. Every row here
          drills to the booking the payment belongs to. */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-bridal-gold" />
              <span className="text-sm font-semibold text-neutral-700">
                Payments received
              </span>
            </div>
            <div className="flex items-center gap-2">
              {customerReceipts.length > 0 && (
                <span className="text-xs font-medium text-neutral-600">
                  {fmtPKR(receiptsTotal)}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {customerReceipts.length}
              </Badge>
            </div>
          </div>
          {receiptsLoading ? (
            <p className="text-xs text-neutral-400">Loading payments…</p>
          ) : customerReceipts.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No payments recorded against this customer&apos;s bookings yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {customerReceipts.map((r) => {
                const row = (
                  <>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">
                        {fmtPKR(r.amount)}
                        <span className="ml-2 text-[11px] font-normal capitalize text-neutral-500">
                          {String(r.method).replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {fmtDate(r.receivedDate)}
                        {r.transactionRef ? ` · ${r.transactionRef}` : ''}
                        {r.bookingId ? ` · Booking #${r.bookingId}` : ''}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] py-0 shrink-0">
                      Receipt #{r.id}
                    </Badge>
                  </>
                );
                // A receipt with no booking has nowhere to drill to — render it
                // as a plain row rather than a link that goes nowhere.
                return (
                  <li key={r.id}>
                    {r.bookingId ? (
                      <Link
                        href={`/dashboard/bookings/${r.bookingId}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2 hover:bg-neutral-50"
                      >
                        {row}
                      </Link>
                    ) : (
                      <div className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2">
                        {row}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ─── Disputes ────────────────────────────────────────────────
          Only rendered when there are any. A permanently-empty "Disputes (0)"
          card on every customer teaches vendors to ignore the section, so the
          one time it matters they will not see it. */}
      {!disputesLoading && customerDisputes.length > 0 && (
        <Card className={cn(openDisputes > 0 && 'border-red-200')}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className={cn(
                    'h-4 w-4',
                    openDisputes > 0 ? 'text-red-600' : 'text-bridal-gold',
                  )}
                />
                <span className="text-sm font-semibold text-neutral-700">
                  Disputes
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  openDisputes > 0 && 'bg-red-50 text-red-700 border-red-200',
                )}
              >
                {openDisputes > 0
                  ? `${openDisputes} open`
                  : `${customerDisputes.length} settled`}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {customerDisputes.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/dashboard/bookings/${d.bookingId}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2 hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-neutral-800 truncate">
                        {d.reason || `Dispute #${d.id}`}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        {fmtDate(d.openedAt)}
                        {d.bookingId ? ` · Booking #${d.bookingId}` : ''}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] py-0 capitalize shrink-0',
                        d.status === 'open'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-neutral-100 text-neutral-600 border-neutral-300',
                      )}
                    >
                      {String(d.status).replace(/_/g, ' ')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
