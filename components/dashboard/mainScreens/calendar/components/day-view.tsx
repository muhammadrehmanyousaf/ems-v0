'use client';
import * as React from 'react';
import { CalendarEvent, cn, diffMinutes, HOUR_PX, HOURS_24, minutesSinceStart, tzLabel } from '@/lib/utils';

type DayViewProps = {
    date: Date;
    events: CalendarEvent[];
      onOpenCellDialog: (events: CalendarEvent[] | []) => void
};

export function DayView({ date, events = [], onOpenCellDialog }: DayViewProps) {
    const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date).toUpperCase();

    return (
        <div className="h-[calc(100dvh-210px)] w-full border rounded-lg overflow-hidden">
            <div className="relative h-full">
                <div className={cn('sticky top-0 z-20 bg-background border-b', 'grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr]')}>
                    <div className="h-14 pl-2 md:pl-3 pr-2 flex items-end pb-2 text-[11px] text-muted-foreground">{tzLabel}</div>
                    <div className="h-14 border-l px-3 flex items-center gap-3">
                        <span className="text-[11px] tracking-wide text-muted-foreground uppercase">{weekday}</span>
                        <span className="text-xl font-semibold">{date.getDate()}</span>
                    </div>
                </div>

                <div className="relative h-[calc(100%-3.5rem)] overflow-y-auto hide-scrollbar">
                    <div className="grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr]">
                        {HOURS_24.map((label, row) => (
                            <React.Fragment key={row}>
                                <div className="h-14 border-b pr-2 pl-3 text-[11px] text-muted-foreground flex items-center pt-1">{label}</div>
                                <div className="relative h-14 border-b border-l"></div>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="pointer-events-none absolute inset-0 grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr]">
                        <div />
                        <div className="relative">
                            {events.map(ev => {
                                const top = minutesSinceStart(ev.start) / 60 * HOUR_PX;
                                const h = Math.max(24, diffMinutes(ev.start, ev.end) / 60 * HOUR_PX);
                                return (
                                    <div
                                        key={ev.id}
                                        className="absolute left-1 right-1 rounded-md bg-emerald-600/15 text-emerald-700 text-xs px-2 py-1 truncate"
                                        style={{ top, height: h }}
                                        title={ev.title}
                                    >
                                        {ev.title}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}