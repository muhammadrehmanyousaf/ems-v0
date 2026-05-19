'use client';

/**
 * Phase 1 #7.2 — Pipelines view (17hats pattern, Pakistan-adapted).
 *
 * Reframes the existing Bookings list as a kanban board so vendors
 * see WHERE every booking is in their funnel at a glance. Pure FE —
 * no backend changes; we read the existing /api/v1/bookings list,
 * group by status + payment-status, and render columns.
 *
 * Pipeline (left → right):
 *   Pending           — awaiting vendor acceptance ("inquiry")
 *   Awaiting Payment  — vendor accepted, customer hasn't paid yet
 *   Confirmed         — paid (Pakistani-adapted: also captures
 *                       partial-payment with PDC held)
 *   Event Day         — Confirmed bookings within ±1 day of today
 *   Completed         — event-day passed
 *   Cancelled         — terminal (collapsed by default)
 *
 * Click any card → opens the existing booking detail sheet (same
 * component the table view uses). No new write paths; vendor advances
 * a booking through the funnel by accepting / recording payment /
 * marking complete — the actions the table already exposes.
 *
 * 17hats Pipelines but for Pakistan: the "Event Day" column is a
 * Pakistani-wedding-specific bucket because day-of coordination is
 * the moment vendors care most about. WedMeGood-style read receipts
 * and lead tags ship in Phase 1 #7.3 (Inbox + WhatsApp bridge).
 *
 * Live-system safety: pure read; no booking is mutated by this view.
 * The Bookings table view continues to operate at the existing route
 * (/dashboard/bookings). Vendor opts into Pipeline via a view toggle.
 */

import * as React from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  Users,
  CircleDollarSign,
  Phone,
  ChevronRight,
  Loader2,
  Inbox,
  Hourglass,
  CheckCircle2,
  Sparkles,
  PartyPopper,
  Ban,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFetchData } from '@/hooks/use-fetch-data';
import { useUser } from '@/context/UserContext';
import { isAdminLike, getDashboardRole } from '@/lib/dashboard-role';
import type { BookingData } from '@/lib/dashboard-types';

type ColumnKey =
  | 'pending'
  | 'awaiting_payment'
  | 'confirmed'
  | 'event_day'
  | 'completed'
  | 'cancelled';

interface ColumnDef {
  key: ColumnKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  description: string;
}

const COLUMNS: readonly ColumnDef[] = [
  {
    key: 'pending',
    label: 'Inquiry',
    icon: Inbox,
    tone: 'border-amber-300 bg-amber-50/40',
    description: 'Customer booked; awaiting your acceptance.',
  },
  {
    key: 'awaiting_payment',
    label: 'Awaiting payment',
    icon: Hourglass,
    tone: 'border-blue-300 bg-blue-50/40',
    description: 'You accepted; customer hasn’t paid the advance yet.',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    icon: CheckCircle2,
    tone: 'border-emerald-300 bg-emerald-50/40',
    description: 'Advance received. Locked in for the event date.',
  },
  {
    key: 'event_day',
    label: 'Event week',
    icon: Sparkles,
    tone: 'border-bridal-gold/45 bg-bridal-cream/60',
    description: 'Within ±3 days of event date. Day-of coordination time.',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: PartyPopper,
    tone: 'border-purple-300 bg-purple-50/30',
    description: 'Event happened. Awaiting final payment / review.',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: Ban,
    tone: 'border-rose-300 bg-rose-50/30',
    description: 'No longer on. Kept for audit + refund tracking.',
  },
];

function fmtPKR(n: number | string | null | undefined): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return '—';
  return `Rs. ${Math.round(x).toLocaleString('en-PK')}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fmtShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

/**
 * Bucketing logic — pure function so it's easy to reason about and
 * trivial to test if we ever want unit assertions. Edge cases handled:
 *   - Confirmed bookings within ±3 days of today → "Event week" instead
 *     of generic "Confirmed" (most actionable bucket)
 *   - Cancellations are terminal — they ALWAYS go to Cancelled
 *     regardless of date
 *   - Completed wins over Event Week (a completed event yesterday is
 *     completed, not "event week")
 */
function bucketFor(b: BookingData): ColumnKey {
  const status = String(b.status || '').toLowerCase();
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  if (status === 'pending') return 'pending';

  // Status is Confirmed or Awaiting Payment — date-aware bucket.
  const eventDate = b.bookingDate ? new Date(b.bookingDate) : null;
  if (eventDate && !Number.isNaN(eventDate.getTime())) {
    const now = new Date();
    const diffMs = eventDate.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (status === 'confirmed' && diffDays >= -1 && diffDays <= 3) {
      return 'event_day';
    }
  }

  if (status === 'confirmed') return 'confirmed';
  if (status === 'awaiting payment') return 'awaiting_payment';
  return 'pending';
}

// ─── Card ──────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: BookingData }) {
  const eventDateLabel = fmtShortDate(booking.bookingDate);
  const vendorNames = (booking.bookingDetails || [])
    .map((d) => d.business?.name)
    .filter(Boolean) as string[];
  const primaryVendor = vendorNames[0];

  const balanceOwed =
    (Number(booking.totalAmount) || 0) - (Number(booking.downPayment) || 0);

  return (
    <Link href={`/dashboard/bookings?view=${booking.id}`} className="block">
      <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <CardContent className="p-3 space-y-1.5">
          {/* Header: customer + amount */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {booking.customerName || 'Unknown customer'}
              </p>
              {booking.customerPhone && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  {booking.customerPhone}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              #{booking.id}
            </Badge>
          </div>

          {/* Event details */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {eventDateLabel}
            </span>
            {booking.bookingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {String(booking.bookingTime).slice(0, 5)}
              </span>
            )}
            {booking.guestCount ? (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {booking.guestCount}
              </span>
            ) : null}
          </div>

          {primaryVendor && (
            <p className="text-[11px] text-muted-foreground truncate">
              {primaryVendor}
              {vendorNames.length > 1 && ` +${vendorNames.length - 1}`}
            </p>
          )}

          {/* Money row */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CircleDollarSign className="h-3 w-3" />
              {fmtPKR(booking.totalAmount)}
            </span>
            {balanceOwed > 0 ? (
              <Badge variant="outline" className="text-[10px]">
                {fmtPKR(balanceOwed)} due
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-300 text-emerald-700"
              >
                Paid
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Column ────────────────────────────────────────────────────────

function PipelineColumn({
  col,
  bookings,
}: {
  col: ColumnDef;
  bookings: BookingData[];
}) {
  const [collapsed, setCollapsed] = useState(col.key === 'cancelled');
  const Icon = col.icon;
  const total = bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className={`rounded-lg border ${col.tone} flex flex-col min-w-[280px] max-w-[320px] flex-1`}>
      <div
        className="px-3 py-2.5 border-b border-border/50 flex items-start justify-between gap-2 cursor-pointer"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <p className="text-xs font-semibold">{col.label}</p>
            <Badge variant="secondary" className="text-[10px] ml-auto">
              {bookings.length}
            </Badge>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight">
            {col.description}
          </p>
          {bookings.length > 0 && (
            <p className="text-[10.5px] text-muted-foreground mt-1 tabular-nums">
              {fmtPKR(total)} total
            </p>
          )}
        </div>
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 mt-0.5 ${
            collapsed ? '' : 'rotate-90'
          }`}
        />
      </div>
      {!collapsed && (
        <div className="p-2 space-y-1.5 overflow-y-auto max-h-[60vh]">
          {bookings.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-4 italic">
              Empty
            </p>
          ) : (
            bookings.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main view ─────────────────────────────────────────────────────

const PipelineView = () => {
  const { user } = useUser();
  const isAdmin = isAdminLike(getDashboardRole(user));
  const endpoint = isAdmin ? `/api/v1/bookings/admin/bookings` : `/api/v1/bookings`;

  // We fetch a generous page size so most columns are populated in one
  // request. For vendors with > 100 active bookings we may need to
  // paginate per-column later; that's a Phase-1 polish, not a blocker.
  const { data, isLoading } = useFetchData({
    endpoint,
    queryKey: ['pipeline-bookings', isAdmin ? 'admin' : 'vendor'],
    Params: {
      page: 1,
      limit: 100,
      sortBy: 'bookingDate',
      sortOrder: 'ASC',
    },
  });

  const bookings: BookingData[] = data?.data?.data ?? [];

  const buckets = useMemo(() => {
    const out: Record<ColumnKey, BookingData[]> = {
      pending: [],
      awaiting_payment: [],
      confirmed: [],
      event_day: [],
      completed: [],
      cancelled: [],
    };
    for (const b of bookings) {
      const key = bucketFor(b);
      out[key].push(b);
    }
    return out;
  }, [bookings]);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-4">
        {COLUMNS.map((c) => (
          <div key={c.key} className="min-w-[280px] flex-1 space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold">No bookings yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          When customers book your services, they appear here grouped by where
          they are in your pipeline. New inquiries land on the left; completed
          events sit on the right.
        </p>
        <Link
          href="/dashboard/bookings"
          className="mt-4 text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          <Loader2 className="h-3 w-3" />
          Switch to table view
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 -mx-1 px-1">
      {COLUMNS.map((c) => (
        <PipelineColumn key={c.key} col={c} bookings={buckets[c.key]} />
      ))}
    </div>
  );
};

export default PipelineView;
