'use client';

/**
 * Phase 3 #9.2 — Islamic-events suggestion strip on the calendar.
 *
 * Pakistani wedding bookings predictably drop during Ramadan, Ashura
 * (Muharram 1-10), Eid-ul-Fitr, Eid-ul-Azha, Eid Milad-un-Nabi,
 * Shab-e-Baraat, and Laylat-ul-Qadr. Vendors typically pre-block
 * these dates by hand every year — error-prone and they forget.
 *
 * This strip lists the upcoming events for the next 120 days and
 * surfaces a 1-click "Block this date" button per event. Dates
 * already blocked render the green "blocked" pill instead.
 *
 * Pure-FE — all date math is in lib/hijri.ts. No backend.
 */

import * as React from 'react';
import { useMemo } from 'react';
import { Moon, BanIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  upcomingIslamicEvents,
  gregorianToHijri,
  type IslamicEvent,
} from '@/lib/hijri';

function fmt(d: Date): string {
  return d.toLocaleDateString('en-PK', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function IslamicEventsStrip({
  blockedDateSet,
  onBlock,
  daysAhead = 120,
}: {
  blockedDateSet: Set<string>;
  onBlock: (date: Date) => void;
  daysAhead?: number;
}) {
  const events = useMemo(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    return upcomingIslamicEvents(from, daysAhead);
  }, [daysAhead]);

  if (events.length === 0) return null;

  return (
    <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Moon className="h-3.5 w-3.5 text-emerald-700" />
        <span className="text-xs font-semibold text-emerald-900">
          Upcoming Islamic dates
        </span>
        <span className="text-[10px] text-emerald-700/70">
          (next {daysAhead} days · auto-suggested blackouts)
        </span>
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {events.map((ev) => (
          <EventChip
            key={ev.date.toISOString() + ev.kind}
            ev={ev}
            isBlocked={blockedDateSet.has(ymd(ev.date))}
            onBlock={() => onBlock(ev.date)}
          />
        ))}
      </ul>
    </div>
  );
}

function EventChip({
  ev,
  isBlocked,
  onBlock,
}: {
  ev: IslamicEvent;
  isBlocked: boolean;
  onBlock: () => void;
}) {
  const h = gregorianToHijri(ev.date);
  const severityTone =
    ev.severity === 3
      ? 'border-red-300 bg-red-50 text-red-800'
      : ev.severity === 2
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-neutral-300 bg-neutral-50 text-neutral-800';

  // The chip must be able to wrap its OWN contents, not just wrap as a unit.
  //
  // This was a single non-wrapping row whose every span is whitespace-nowrap.
  // Flex items don't shrink below their content (min-width:auto), so a longer
  // chip — "Eid-ul-Fitr · Sat, Mar 21 · (1 Shawwal) · Block" — simply could not
  // fit a 360px phone. Measured live at 360px: the chip ran 72px past the
  // viewport and pushed the Block button 63px off-screen, with no scrollable
  // ancestor to reach it. The one-tap blackout was therefore unusable on
  // exactly the device this mobile calendar exists for.
  //
  // max-w-full + flex-wrap lets it reflow instead of overflowing; the pill
  // radius is kept from sm up, where it still fits on one line.
  return (
    <li
      className={cn(
        'flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border px-2 py-1 text-[11px] sm:rounded-full',
        severityTone,
      )}
    >
      {ev.severity === 3 ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Moon className="h-3 w-3" />
      )}
      <span className="font-semibold whitespace-nowrap">{ev.label}</span>
      <span className="opacity-80 whitespace-nowrap">{fmt(ev.date)}</span>
      <span className="opacity-60 whitespace-nowrap">
        ({h.day} {h.monthName})
      </span>
      {isBlocked ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
          <CheckCircle2 className="h-3 w-3" />
          Blocked
        </span>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 gap-0.5 text-[10px]"
          onClick={onBlock}
        >
          <BanIcon className="h-3 w-3" />
          Block
        </Button>
      )}
    </li>
  );
}
