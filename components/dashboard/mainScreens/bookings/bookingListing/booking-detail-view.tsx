'use client';

/**
 * Booking detail view — dedicated working surface for a single booking.
 *
 * The bookings listing has a side-drawer detail (BookingDetailSheet),
 * but a Rs. 1M+ Walima booking needs a real page: customer + event +
 * services + payments + installments + linked function sheets + source
 * lead + change requests + history + no-show, all browsable / linkable.
 *
 * Layout:
 *   - Header: back-link, "Booking #N" + status / payment badges
 *   - Left column (main):
 *       Customer, Event, Services (bookingDetails), Notes, Service-location
 *   - Right column (sidebar):
 *       Payment roll-up, Installments, Linked Function Sheets, Source Lead,
 *       Change requests, Status history, No-show CTA
 *
 * Backend: no new endpoints. We piggyback on
 *   - GET /:id/with-availability  (booking + bookingDetails + business)
 *   - GET /:id/history            (audit timeline)
 *   - FunctionSheet list filtered by bookingId
 *   - Lead list filtered by bookingId (additive query param)
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  User,
  CalendarDays,
  Building,
  CreditCard,
  MapPin,
  FileText,
  Inbox,
  History,
  AlertTriangle,
  Package,
  Phone,
  Mail,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { BookingAPI } from '@/lib/api/bookings';
import { FunctionSheetAPI, type FunctionSheet } from '@/lib/api/functionSheets';
import {
  LeadAPI,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_TONES,
  type Lead,
} from '@/lib/api/leads';
import { InstallmentsCard } from '@/components/bookings/installments-card';
import { VendorChangeRequestsCard } from '@/components/bookings/vendor-change-requests-card';
import { VendorNoShowDialog } from '@/components/bookings/vendor-no-show-dialog';
import type { BookingData } from '@/lib/dashboard-types';

const statusColors: Record<string, string> = {
  'Awaiting Payment': 'bg-orange-50 text-orange-700 border-orange-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const paymentColors: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Partial: 'bg-blue-50 text-blue-700 border-blue-200',
  Paid: 'bg-green-50 text-green-700 border-green-200',
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
function fmtTime(t: string | null | undefined): string {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

interface HistoryEntry {
  id?: number;
  fromStatus?: string | null;
  toStatus?: string | null;
  reason?: string | null;
  changedAt?: string | null;
  createdAt?: string | null;
  changedByRole?: string | null;
}

export default function BookingDetailView({
  bookingId,
}: {
  bookingId: number;
}) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [sheets, setSheets] = useState<FunctionSheet[]>([]);
  const [sourceLead, setSourceLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!Number.isFinite(bookingId)) {
      setError('Invalid booking id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // 1) Booking is the hard dependency — fail loud if missing.
        const main = await BookingAPI.getWithAvailability(bookingId);
        if (cancelled) return;
        if (!main?.booking) {
          setError('Booking not found');
          setLoading(false);
          return;
        }
        setBooking(main.booking);

        // 2) Everything else is best-effort. A missing audit log or
        //    unlinked lead should NOT block the page from rendering.
        const [sheetsRes, leadsRes, historyRes] = await Promise.all([
          FunctionSheetAPI.list({ bookingId }).catch(() => ({
            functionSheets: [] as FunctionSheet[],
          })),
          LeadAPI.list({ bookingId }).catch(() => ({
            leads: [] as Lead[],
            summary: { byStatus: {}, bySource: {} },
            provider: 'noop',
          })),
          BookingAPI.getHistory(bookingId).catch(() => null),
        ]);
        if (cancelled) return;
        setSheets(sheetsRes.functionSheets || []);
        setSourceLead(leadsRes.leads?.[0] ?? null);
        const histRows: HistoryEntry[] =
          (historyRes as any)?.history ||
          (historyRes as any)?.entries ||
          (Array.isArray(historyRes) ? historyRes : []) ||
          [];
        setHistory(histRows);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.message || 'Failed to load booking');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/bookings')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load booking #{bookingId}</p>
              <p className="mt-1 text-red-700">{error || 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const details = booking.bookingDetails || [];
  const vendorTotal = details.reduce(
    (sum, d) => sum + (Number(d.totalAmount) || 0),
    0,
  );
  const vendorDownPayment = details.reduce(
    (sum, d) => sum + (Number(d.downPayment) || 0),
    0,
  );
  const amount =
    vendorTotal > 0 ? vendorTotal : Number(booking.totalAmount) || 0;
  const dp =
    vendorDownPayment > 0 ? vendorDownPayment : Number(booking.downPayment) || 0;
  const isPaid = booking.paymentStatus === 'Paid';
  const isPartial = booking.paymentStatus === 'Partial';
  const remaining = isPaid ? 0 : isPartial ? Math.max(0, amount - dp) : amount;

  // BK-100.4 — same gates as the side-drawer (status + within 14d post-event).
  const noShowCandidate = (() => {
    if (!['Confirmed', 'Completed'].includes(booking.status || '')) return false;
    const bd = booking.bookingDate;
    if (!bd) return false;
    const evt = new Date(bd);
    if (Number.isNaN(evt.getTime())) return false;
    const now = new Date();
    const daysSince = (now.getTime() - evt.getTime()) / 86400000;
    return daysSince >= 0 && daysSince <= 14;
  })();

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/bookings')}
            className="gap-1.5 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Bookings
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Booking #{booking.id}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {booking.customerName} · {fmtDate(booking.bookingDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-xs', statusColors[booking.status])}
          >
            {booking.status}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              paymentColors[booking.paymentStatus || 'Pending'],
            )}
          >
            {booking.paymentStatus || 'Pending'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── Main column ─────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Customer
                </span>
              </div>
              <div className="space-y-1.5 ml-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Name</span>
                  <span className="font-medium text-neutral-800">
                    {booking.customerName}
                  </span>
                </div>
                {booking.customerEmail && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </span>
                    <a
                      href={`mailto:${booking.customerEmail}`}
                      className="font-medium text-neutral-800 hover:text-bridal-gold-dark"
                    >
                      {booking.customerEmail}
                    </a>
                  </div>
                )}
                {booking.customerPhone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </span>
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="font-medium text-neutral-800 hover:text-bridal-gold-dark"
                    >
                      {booking.customerPhone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Event */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Event
                </span>
              </div>
              <div className="space-y-1.5 ml-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Date</span>
                  <span className="font-medium text-neutral-800">
                    {fmtDate(booking.bookingDate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Time</span>
                  <span className="font-medium text-neutral-800">
                    {fmtTime(booking.bookingTime)}
                  </span>
                </div>
                {booking.guestCount != null && booking.guestCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Guests</span>
                    <span className="font-medium text-neutral-800">
                      {booking.guestCount.toLocaleString()}
                    </span>
                  </div>
                )}
                {booking.bookingSource && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Source</span>
                    <span className="font-medium text-neutral-800 capitalize">
                      {booking.bookingSource}
                    </span>
                  </div>
                )}
              </div>

              {/* BK-100.53 — off-vendor service location */}
              {booking.serviceLocationMode &&
                booking.serviceLocationMode !== 'at_vendor' && (
                  <>
                    <Separator />
                    <div className="space-y-1.5 ml-6">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600">
                        <MapPin className="h-3.5 w-3.5 text-bridal-gold" />
                        Service location
                      </div>
                      <p className="text-sm font-medium text-neutral-800">
                        {(() => {
                          switch (booking.serviceLocationMode) {
                            case 'at_customer_home':
                              return "At customer's home";
                            case 'at_customer_plot':
                              return "At customer's plot / lawn";
                            case 'at_third_party':
                              return 'Third-party venue';
                            default:
                              return 'Vendor address';
                          }
                        })()}
                      </p>
                      {booking.serviceLocationAddress && (
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {booking.serviceLocationAddress}
                        </p>
                      )}
                      {booking.serviceLocationNotes && (
                        <p className="text-xs text-neutral-500 italic">
                          {booking.serviceLocationNotes}
                        </p>
                      )}
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Services (vendor's portion from BookingDetails) */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Your services
                </span>
              </div>
              {details.length > 0 ? (
                <div className="space-y-3">
                  {details.map((detail) => (
                    <div
                      key={detail.id}
                      className="rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-800">
                          {detail.business?.name || 'Business'}
                        </p>
                        <p className="text-sm font-bold text-bridal-gold-dark">
                          {fmtPKR(detail.totalAmount)}
                        </p>
                      </div>
                      {detail.package && (
                        <div className="flex items-center gap-2 text-xs">
                          <Package className="h-3.5 w-3.5 text-bridal-gold/70" />
                          <span className="text-neutral-600">
                            {detail.package.name}
                          </span>
                          <span className="text-bridal-gold font-medium ml-auto">
                            {fmtPKR(detail.package.price)}
                          </span>
                        </div>
                      )}
                      {detail.menu && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-neutral-500">
                            Menu: {detail.menu.title}
                          </span>
                          <span className="text-bridal-gold font-medium ml-auto">
                            {fmtPKR(detail.menu.price)}
                          </span>
                        </div>
                      )}
                      {detail.specialRequests && (
                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                          {detail.specialRequests}
                        </p>
                      )}
                      <div className="flex justify-between text-xs text-neutral-400 pt-1">
                        <span>Down Payment</span>
                        <span>{fmtPKR(detail.downPayment)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No service details available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(booking.specialRequests || booking.additionalRequests) && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Notes
                  </span>
                </div>
                <p className="text-sm text-neutral-600 whitespace-pre-line leading-relaxed">
                  {booking.specialRequests || booking.additionalRequests}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Change requests (BK-054/55/56) */}
          <VendorChangeRequestsCard bookingId={booking.id} />

          {/* History (BK-081) */}
          {history.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Status history
                  </span>
                </div>
                <ol className="space-y-2">
                  {history.map((h, idx) => (
                    <li
                      key={h.id ?? idx}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="text-neutral-400 text-xs w-32 shrink-0">
                        {fmtDate(h.changedAt || h.createdAt)}
                      </span>
                      <span className="text-neutral-700">
                        {h.fromStatus ? (
                          <>
                            <span className="text-neutral-400">{h.fromStatus}</span>
                            <span className="text-neutral-400"> → </span>
                          </>
                        ) : null}
                        <span className="font-medium">{h.toStatus}</span>
                      </span>
                      {h.changedByRole && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 capitalize"
                        >
                          {h.changedByRole}
                        </Badge>
                      )}
                      {h.reason && (
                        <span className="text-xs text-neutral-500 italic truncate">
                          {h.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─── Sidebar ─────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Payment roll-up */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Payment
                </span>
              </div>
              <div className="rounded-lg bg-bridal-cream border border-bridal-beige p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Your total</span>
                  <span className="font-bold text-bridal-gold-dark">
                    {fmtPKR(amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Down payment</span>
                  <span className="font-medium text-neutral-700">
                    {fmtPKR(dp)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Remaining</span>
                  <span className="font-medium text-neutral-700">
                    {fmtPKR(remaining)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installments (BK-042) */}
          <InstallmentsCard bookingId={booking.id} />

          {/* Linked Function Sheets — jump to the working surface */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-bridal-gold" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Function sheets
                  </span>
                </div>
                {sheets.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {sheets.length}
                  </Badge>
                )}
              </div>
              {sheets.length === 0 ? (
                <p className="text-xs text-neutral-400">
                  No function sheets linked yet. Create one from{' '}
                  <Link
                    href="/dashboard/function-sheets"
                    className="text-bridal-gold-dark underline-offset-2 hover:underline"
                  >
                    Function Sheets
                  </Link>
                  .
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {sheets.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/dashboard/function-sheets/${s.id}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-neutral-100 px-2.5 py-2 text-xs hover:bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-800 truncate">
                            {s.title || `Sheet #${s.id}`}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {s.state} · {fmtPKR(s.grandTotal)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Source lead (reverse of Lead → Booking linkage) */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-bridal-gold" />
                <span className="text-sm font-semibold text-neutral-700">
                  Source lead
                </span>
              </div>
              {!sourceLead ? (
                <p className="text-xs text-neutral-400">
                  No lead linked. Walk-ins and direct bookings won&apos;t have a
                  source.
                </p>
              ) : (
                <Link
                  href="/dashboard/leads"
                  className="block rounded-md border border-neutral-100 px-3 py-2 text-xs hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-neutral-800 truncate">
                      {sourceLead.contactName ||
                        sourceLead.contactPhone ||
                        `Lead #${sourceLead.id}`}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] py-0',
                        LEAD_STATUS_TONES[sourceLead.status]?.bg,
                        LEAD_STATUS_TONES[sourceLead.status]?.text,
                        LEAD_STATUS_TONES[sourceLead.status]?.border,
                      )}
                    >
                      {LEAD_STATUS_LABELS[sourceLead.status]}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {LEAD_SOURCE_LABELS[sourceLead.source]} ·{' '}
                    {fmtDate(sourceLead.createdAt)}
                  </div>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* No-show (BK-100.4) */}
          {noShowCandidate && (
            <Card className="border-red-100 bg-red-50/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Customer didn&apos;t show up?
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Available for 7 days after the event. Filing pauses payouts
                  and triggers an admin review.
                </p>
                <VendorNoShowDialog bookingId={booking.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
