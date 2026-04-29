'use client';
import * as React from 'react';
import { CalendarEvent, cn, diffMinutes, formatWeekdayShort, getWeekDays, HOUR_PX, HOURS_24, minutesSinceStart, startOfDay, tzLabel } from '@/lib/utils';
import { Store } from 'lucide-react';

type WeekCalendarProps = {
    current: Date;
    startOnMonday?: boolean;
    events?: CalendarEvent[];
      onOpenCellDialog: (events: CalendarEvent[] | []) => void
};

export default function WeekCalendar({ current, startOnMonday = false, events = [], onOpenCellDialog }: WeekCalendarProps) {
    const weekDays = React.useMemo(() => getWeekDays(current, startOnMonday), [current, startOnMonday]);

    const buckets = React.useMemo(() => {
        const arr: CalendarEvent[][] = Array.from({ length: 7 }, () => []);
        const start = startOfDay(weekDays[0]);
        for (const ev of events) {
            const idx = Math.floor((startOfDay(ev.start).getTime() - start.getTime()) / 86400000);
            if (idx >= 0 && idx < 7) arr[idx].push(ev);
        }
        return arr;
    }, [events, weekDays]);

    return (
        <div className="h-[calc(100dvh-210px)] w-full border rounded-lg overflow-hidden">
            <div className="relative h-full">
                <div className={cn('sticky top-0 z-20 bg-background border-b', 'grid grid-cols-[60px_repeat(7,minmax(0,1fr))] md:grid-cols-[70px_repeat(7,minmax(0,1fr))]')}>
                    <div className="h-14 pl-2 md:pl-3 pr-2 flex items-end pb-2 text-[11px] text-muted-foreground">{tzLabel}</div>
                    {weekDays.map((d, i) => (
                        <div key={i} className="h-14 border-l px-3 flex flex-col items-center justify-center gap-1">
                            <span className="text-[9px] md:text-[11px] tracking-wide text-muted-foreground uppercase leading-none">{formatWeekdayShort(d)}</span>
                            <span className="text-lg md:text-xl font-semibold leading-none">{d.getDate()}</span>
                        </div>
                    ))}
                </div>

                <div className="relative h-[calc(100%-3.5rem)] overflow-y-auto hide-scrollbar">
                    <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] md:grid-cols-[70px_repeat(7,minmax(0,1fr))]">
                        {HOURS_24.map((label, row) => (
                            <React.Fragment key={row}>
                                <div className="h-14 border-b pr-2 pl-3 text-[11px] text-muted-foreground flex items-center pt-1">{label}</div>
                                {weekDays.map((_, col) => (
                                    <div key={`${row}-${col}`} className="h-14 border-b border-l"></div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0 grid grid-cols-[60px_repeat(7,minmax(0,1fr))] md:grid-cols-[70px_repeat(7,minmax(0,1fr))]">
                        <div />
                        {buckets.map((dayEvents, idx) => (
                            <div key={idx} className="relative">
                                {dayEvents.map(ev => {
                                    const top = minutesSinceStart(ev.start) / 60 * HOUR_PX;
                                    const h = Math.max(24, (diffMinutes(ev.start, ev.end) / 60) * HOUR_PX); // min 24px
                                    return (
                                        <div
                                            key={ev.id}
                                            className="absolute left-1 right-1 top-0 rounded-md bg-emerald-600/15 text-emerald-700 text-xs px-2 py-1 flex items-start gap-1 overflow-hidden"
                                            style={{ top, height: h }}
                                            title={`${ev.title}${ev.bookingSource === 'offline' ? ' · Offline' : ''}`}
                                        >
                                            {ev.bookingSource === 'offline' && (
                                                <Store className="h-3 w-3 shrink-0 mt-px text-orange-500" />
                                            )}
                                            <span className="truncate">{ev.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
