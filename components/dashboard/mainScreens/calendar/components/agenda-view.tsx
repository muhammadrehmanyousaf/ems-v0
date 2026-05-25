'use client';

/**
 * Agenda (list) view — the fourth calendar mode beside month / week /
 * day. Where the grid views answer "what's the shape of my month",
 * the agenda answers "what's next, in order" — a chronological list of
 * upcoming events from the cursor date forward, grouped by day.
 *
 * Each day also carries a "team on duty" row from the staff rota
 * (team-calendar overlay), so the vendor sees WHO is scheduled next to
 * each booking — not just that a booking exists.
 *
 * Read-only surface; clicking a day opens the same cell dialog the grid
 * views use.
 */

import React, { useMemo } from 'react';
import { CalendarEvent, ymd } from '@/lib/utils';
import type { BookingDetail } from './add-booking-dialog';
import type { TeamCalendarShift, AttendanceStatus } from '@/lib/api/staff';
import { STAFF_ROLE_LABELS } from '@/lib/api/staff';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Users, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  cursor: Date;
  events: CalendarEvent[];
  bookingDetails: Record<string, BookingDetail>;
  teamByDate: Record<string, TeamCalendarShift[]>;
  onOpenEvent: (evts: CalendarEvent[], date?: Date) => void;
  /** How many days forward to list (default 60). */
  horizonDays?: number;
};

const STATUS_TONE: Record<string, string> = {
  Confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  New: 'bg-blue-50 text-blue-800 border-blue-200',
  Completed: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

function fmtTime(d: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

// Small attendance dot beside each on-duty chip.
const ATT_DOT: Partial<Record<AttendanceStatus, string>> = {
  checked_in: 'bg-blue-500',
  completed: 'bg-emerald-500',
  absent: 'bg-rose-500',
  excused: 'bg-amber-500',
  replaced: 'bg-violet-500',
};

export default function AgendaView({
  cursor,
  events,
  bookingDetails,
  teamByDate,
  onOpenEvent,
  horizonDays = 60,
}: Props) {
  // Group events by YYYY-MM-DD, from the cursor day forward through the
  // horizon. Sorted ascending by start time within each day.
  const { groups, dayKeys } = useMemo(() => {
    const start = new Date(cursor);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + horizonDays);

    const g: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (ev.start < start || ev.start > end) continue;
      const key = ymd(ev.start);
      (g[key] ||= []).push(ev);
    }
    // Also surface days that have ONLY staff shifts (no booking) so the
    // vendor still sees the team is rostered.
    for (const key of Object.keys(teamByDate)) {
      if (key < ymd(start) || key > ymd(end)) continue;
      if (!g[key]) g[key] = [];
    }
    for (const key of Object.keys(g)) {
      g[key].sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    const keys = Object.keys(g).sort();
    return { groups: g, dayKeys: keys };
  }, [events, teamByDate, cursor, horizonDays]);

  const todayKey = ymd(new Date());

  if (dayKeys.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-10 text-center">
        <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium text-neutral-700">
          Nothing scheduled in the next {horizonDays} days
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Bookings and rostered staff from {ymd(cursor)} onward will appear
          here in order.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dayKeys.map((key) => {
        const evts = groups[key];
        const team = teamByDate[key] || [];
        const dateObj = new Date(`${key}T12:00:00`);
        const isToday = key === todayKey;
        const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(dateObj);
        const dayNum = dateObj.getDate();
        const monthLbl = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(dateObj);

        return (
          <div
            key={key}
            className={cn(
              'flex gap-3 rounded-lg border p-3',
              isToday ? 'border-bridal-gold-dark/40 bg-bridal-gold-dark/5' : 'bg-card',
            )}
          >
            {/* Date rail */}
            <div className="flex w-12 shrink-0 flex-col items-center justify-start pt-0.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {weekday}
              </span>
              <span className={cn('text-xl font-bold leading-none', isToday && 'text-bridal-gold-dark')}>
                {dayNum}
              </span>
              <span className="text-[10px] text-muted-foreground">{monthLbl}</span>
            </div>

            {/* Day content */}
            <div className="min-w-0 flex-1 space-y-2">
              {isToday && (
                <Badge variant="outline" className="h-4 px-1 text-[9px] text-bridal-gold-dark border-bridal-gold-dark/40">
                  Today
                </Badge>
              )}

              {evts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No bookings — team rostered below.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {evts.map((ev) => {
                    const detail = bookingDetails[ev.id];
                    const status = detail?.type || '';
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onOpenEvent([ev], ev.start)}
                        className="flex w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-left transition hover:border-bridal-gold-dark/40 hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {fmtTime(ev.start)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {detail?.user?.name || ev.title}
                        </span>
                        {detail?.businessName && (
                          <span className="hidden truncate text-[11px] text-muted-foreground sm:inline max-w-[120px]">
                            {detail.businessName}
                          </span>
                        )}
                        {detail?.user?.phone && (
                          <span className="hidden items-center gap-0.5 text-[10px] text-muted-foreground md:flex">
                            <Phone className="h-2.5 w-2.5" />
                            {detail.user.phone}
                          </span>
                        )}
                        {status && (
                          <Badge
                            variant="outline"
                            className={cn('h-4 px-1.5 text-[9px] shrink-0', STATUS_TONE[status] || '')}
                          >
                            {status}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Team on duty */}
              {team.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <Users className="h-3 w-3" /> On duty
                  </span>
                  {team.map((s) => {
                    const dot = s.attendanceStatus ? ATT_DOT[s.attendanceStatus] : undefined;
                    return (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2 py-0.5 text-[10px]"
                        title={`${s.staffName} — ${STAFF_ROLE_LABELS[s.role] || s.role}${s.attendanceStatus ? ` · ${s.attendanceStatus}` : ''}`}
                      >
                        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
                        <span className="font-medium">{s.staffName}</span>
                        <span className="text-muted-foreground">
                          {STAFF_ROLE_LABELS[s.role] || s.role}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
