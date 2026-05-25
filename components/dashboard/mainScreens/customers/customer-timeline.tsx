'use client';

/**
 * Customer communication timeline — every touchpoint with one customer
 * (enquiry, booking, status changes, WhatsApp sends, smart files,
 * reviews + your replies) merged into one reverse-chronological feed.
 *
 * The data already existed but was scattered across the bookings card,
 * the leads card, the WhatsApp log and the reviews screen. This stitches
 * it into a single "what's the story with this customer" narrative.
 *
 * Self-contained: fetches its own data from the same identity params the
 * profile uses. Degrades silently if the endpoint isn't reachable.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  CalendarPlus,
  Inbox,
  Reply,
  ArrowRightLeft,
  MessageCircle,
  FileText,
  Star,
  CornerDownRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CustomersAPI,
  type CustomerTimelineResponse,
  type CustomerTimelineEvent,
  type CustomerTimelineEventType,
} from '@/lib/api/dashboard';

const ICON: Record<CustomerTimelineEventType, React.ReactNode> = {
  booking_created: <CalendarPlus className="h-3.5 w-3.5" />,
  lead_created: <Inbox className="h-3.5 w-3.5" />,
  lead_responded: <Reply className="h-3.5 w-3.5" />,
  status_change: <ArrowRightLeft className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  sheet_created: <FileText className="h-3.5 w-3.5" />,
  review: <Star className="h-3.5 w-3.5" />,
  vendor_reply: <CornerDownRight className="h-3.5 w-3.5" />,
};

const TONE: Record<CustomerTimelineEventType, string> = {
  booking_created: 'bg-bridal-gold/15 text-bridal-gold-dark',
  lead_created: 'bg-blue-50 text-blue-700',
  lead_responded: 'bg-sky-50 text-sky-700',
  status_change: 'bg-violet-50 text-violet-700',
  whatsapp: 'bg-emerald-50 text-emerald-700',
  sheet_created: 'bg-orange-50 text-orange-700',
  review: 'bg-amber-50 text-amber-700',
  vendor_reply: 'bg-neutral-100 text-neutral-600',
};

function fmtWhen(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diffMs = now - d.getTime();
    const day = 86400000;
    const date = d.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (diffMs >= 0 && diffMs < day && d.getDate() === new Date().getDate()) {
      return `Today, ${time}`;
    }
    if (diffMs >= 0 && diffMs < 2 * day) {
      const y = new Date(now - day);
      if (d.getDate() === y.getDate()) return `Yesterday, ${time}`;
    }
    return `${date}, ${time}`;
  } catch {
    return iso;
  }
}

export default function CustomerTimeline({
  params,
}: {
  params: { email?: string; phone?: string; offlineId?: number };
}) {
  const [data, setData] = useState<CustomerTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    CustomersAPI.getTimeline(params)
      .then((r) => { if (!cancelled) setData(r); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!data || data.events.length === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <History className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">Timeline</span>
          </div>
          <p className="text-xs text-neutral-400">
            No recorded touchpoints yet. Enquiries, bookings, status changes,
            WhatsApp messages and reviews will appear here in order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-bridal-gold" />
            <span className="text-sm font-semibold text-neutral-700">Timeline</span>
          </div>
          <span className="text-[11px] text-neutral-500">
            {data.totalEvents} touchpoint{data.totalEvents === 1 ? '' : 's'}
          </span>
        </div>

        <ol className="relative space-y-3 pl-1">
          {/* vertical rail */}
          <span className="absolute left-[14px] top-1 bottom-1 w-px bg-neutral-200" aria-hidden />
          {data.events.map((e, i) => (
            <TimelineRow key={`${e.type}-${e.at}-${i}`} e={e} />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function TimelineRow({ e }: { e: CustomerTimelineEvent }) {
  const linkHref = e.bookingId
    ? `/dashboard/bookings/${e.bookingId}`
    : e.sheetId
      ? `/dashboard/function-sheets/${e.sheetId}`
      : null;

  const body = (
    <div className="min-w-0 flex-1 rounded-md px-2 py-1 -my-1 group-hover:bg-neutral-50">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-neutral-800 truncate">{e.title}</span>
        <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">
          {fmtWhen(e.at)}
        </span>
      </div>
      {e.detail && (
        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{e.detail}</p>
      )}
    </div>
  );

  return (
    <li className="relative flex items-start gap-3 group">
      <span
        className={cn(
          'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-card',
          TONE[e.type],
        )}
      >
        {ICON[e.type]}
      </span>
      {linkHref ? (
        <Link href={linkHref} className="min-w-0 flex-1">{body}</Link>
      ) : (
        body
      )}
    </li>
  );
}
