import { CalendarEvent, Cell, ymd } from '@/lib/utils';
import React, { useEffect, useState } from 'react'
import type { BlockedDate } from '@/lib/api/dashboard';
import { BanIcon, Store } from 'lucide-react';

type MonthViewProps = {
  cells: Cell[];
  events: CalendarEvent[];
  blockedDateSet: Set<string>;
  blockedDateMap: Map<string, BlockedDate>;
  onOpenCellDialog: (events: CalendarEvent[] | [], date?: Date) => void;
  onDateBlockToggle: (date: Date) => void;
};

const MonthView = ({ cells, events, blockedDateSet, blockedDateMap, onOpenCellDialog, onDateBlockToggle }: MonthViewProps) => {
  const byDate = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ymd(ev.start);
      (m.get(key) ?? m.set(key, []).get(key)!).push(ev);
    }
    return m;
  }, [events]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const [sliceValue, setSetSliceValue] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight > 750) {
        setSetSliceValue(2);
      } else {
        setSetSliceValue(1);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); };
  }, []);

  return (
    <div className="h-[calc(100dvh-210px)] w-full border rounded-lg overflow-hidden">
      {/* Legend */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-600/20 border border-emerald-600/30 inline-block" />
          Online Booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
          Blocked / Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <Store className="h-3 w-3 text-orange-500" />
          Offline Booking
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/70">Right-click any date to block/unblock</span>
      </div>

      <div className="grid grid-cols-7">
        {days.map((lbl) => (
          <div key={lbl} className="h-10 border grid place-items-center text-sm text-muted-foreground">{lbl}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(5rem,_1fr)] h-[calc(100dvh-280px)] overflow-y-auto lg:overflow-hidden hide-scrollbar">
        {cells.map((c, i) => {
          const key = ymd(c.date);
          const list = byDate.get(key) ?? [];
          const visible = list.slice(0, sliceValue);
          const more = list.length - visible.length;
          const isBlocked = blockedDateSet.has(key);
          const blockInfo = blockedDateMap.get(key);

          return (
            <div
              key={i}
              onClick={() => onOpenCellDialog(list, c.date)}
              onContextMenu={(e) => {
                e.preventDefault();
                onDateBlockToggle(c.date);
              }}
              title={isBlocked ? `Blocked: ${blockInfo?.reason || 'Vendor not available this day'}` : 'Right-click to block this date'}
              className={[
                'border p-2 relative cursor-pointer select-none group',
                !c.inCurrentMonth
                  ? 'bg-accent dark:bg-accent/30 text-muted-foreground'
                  : isBlocked
                  ? 'bg-red-50/80 dark:bg-red-950/30'
                  : 'hover:bg-accent/50',
              ].join(' ')}
            >
              {/* Date number */}
              <div className="flex items-center justify-between">
                <span className={[
                  'text-sm select-none',
                  c.isToday ? 'h-6 w-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs' : '',
                  isBlocked && !c.isToday ? 'text-red-400 line-through' : '',
                ].join(' ')}>
                  {c.date.getDate()}
                </span>

                {/* Block indicator badge */}
                {isBlocked && c.inCurrentMonth && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-red-500 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full leading-none">
                    <BanIcon className="h-2.5 w-2.5" />
                    Blocked
                  </span>
                )}
              </div>

              {/* Reason tooltip on hover */}
              {isBlocked && c.inCurrentMonth && (
                <p className="mt-0.5 text-[10px] text-red-400 truncate leading-tight">
                  {blockInfo?.reason || 'Not available'}
                </p>
              )}

              {/* Striped overlay for blocked */}
              {isBlocked && c.inCurrentMonth && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 1px, transparent 0, transparent 50%)',
                    backgroundSize: '8px 8px',
                  }}
                />
              )}

              {/* Block toggle button on hover (for non-blocked dates) */}
              {!isBlocked && c.inCurrentMonth && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDateBlockToggle(c.date); }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 flex items-center justify-center rounded bg-red-100 hover:bg-red-200 text-red-500"
                  title="Block this date"
                >
                  <BanIcon className="h-2.5 w-2.5" />
                </button>
              )}

              {/* Events */}
              <div className="mt-1 xlarge:mt-2 space-y-1">
                {visible.map(ev => (
                  <div
                    key={ev.id}
                    title={`${ev.title}${ev.bookingSource === 'offline' ? ' · Offline' : ''}`}
                    className="w-full truncate rounded-md bg-emerald-600/10 text-emerald-700 px-2 py-0.5 text-[10px] md:text-[11px] flex items-center gap-1"
                  >
                    {ev.bookingSource === 'offline' && (
                      <Store className="h-2.5 w-2.5 shrink-0 text-orange-500" />
                    )}
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {more > 0 && (
                  <div className="text-[11px] text-muted-foreground">+{more} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MonthView
