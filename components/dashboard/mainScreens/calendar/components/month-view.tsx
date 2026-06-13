import { CalendarEvent, Cell, ymd } from '@/lib/utils';
import React, { useEffect, useMemo, useState } from 'react'
import type { BlockedDate } from '@/lib/api/dashboard';
import type { SlotAvailabilityRow } from '@/lib/api/businessAvailability';
import { BanIcon, CheckCircle2, Moon, Repeat, Store } from 'lucide-react';
// Phase 3 #9.2 — Hijri overlay (Pakistani-cultural fit).
import { gregorianToHijri, ramadanWindow } from '@/lib/hijri';

type MonthViewProps = {
  cells: Cell[];
  events: CalendarEvent[];
  blockedDateSet: Set<string>;
  blockedDateMap: Map<string, BlockedDate>;
  // BK-011 — materialised recurring blocks (e.g. "Every Monday closed").
  // Optional: callers that haven't been migrated render the legacy view.
  recurringBlockedDateSet?: Set<string>;
  recurringBlockedMap?: Map<string, { reason: string; businessName: string | null }>;
  // BK-008/15/19/53 — per-day slot availability for the auto-picked
  // primary business. Empty when vendor has no slot-template-aware business.
  slotAvailabilityByDate?: Record<string, SlotAvailabilityRow[]>;
  onOpenCellDialog: (events: CalendarEvent[] | [], date?: Date) => void;
  onDateBlockToggle: (date: Date) => void;
  // §M4 — drag-drop reschedule. When provided, OFFLINE booking chips
  // become draggable and day cells become drop targets. Undefined =
  // feature off (default), drag behaviour fully inert.
  onEventDrop?: (eventId: string, date: Date) => void;
};

const MonthView = ({
  cells,
  events,
  blockedDateSet,
  blockedDateMap,
  recurringBlockedDateSet,
  recurringBlockedMap,
  slotAvailabilityByDate,
  onOpenCellDialog,
  onDateBlockToggle,
  onEventDrop,
}: MonthViewProps) => {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const byDate = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ymd(ev.start);
      (m.get(key) ?? m.set(key, []).get(key)!).push(ev);
    }
    return m;
  }, [events]);

  // Phase 3 #9.2 — pre-compute the Ramadan suppression window for the
  // visible cells. The set spans ~400 days forward from the first cell;
  // covers the whole grid + the next year cleanly.
  const ramadanDates = useMemo(() => {
    if (!cells || cells.length === 0) return new Set<string>();
    const first = cells[0]?.date || new Date();
    return ramadanWindow(first, 400);
  }, [cells]);

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
      <div className="flex items-center gap-4 px-3 py-1.5 border-b bg-muted/30 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-emerald-600/20 border border-emerald-600/30 inline-block" />
          Online Booking
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
          Blocked / Unavailable
        </span>
        {recurringBlockedDateSet && recurringBlockedDateSet.size > 0 ? (
          <span className="flex items-center gap-1.5">
            <Repeat className="h-3 w-3 text-amber-600" />
            Recurring rule
          </span>
        ) : null}
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
          // BK-011 — recurring rule materialised against this cell. Visually
          // distinct from per-date blocks: amber tint + Repeat icon.
          const isRecurringBlocked = recurringBlockedDateSet?.has(key) ?? false;
          const recurringInfo = recurringBlockedMap?.get(key);
          const cellTitle = isBlocked
            ? `Blocked: ${blockInfo?.reason || 'Vendor not available this day'}`
            : isRecurringBlocked
            ? `Recurring block${recurringInfo?.businessName ? ` (${recurringInfo.businessName})` : ''}: ${recurringInfo?.reason}`
            : 'Right-click to block this date';

          return (
            <div
              key={i}
              onClick={() => onOpenCellDialog(list, c.date)}
              onContextMenu={(e) => {
                e.preventDefault();
                onDateBlockToggle(c.date);
              }}
              {...(onEventDrop && c.inCurrentMonth && !isBlocked
                ? {
                    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragOverKey(key); },
                    onDragLeave: () => setDragOverKey((k) => (k === key ? null : k)),
                    onDrop: (e: React.DragEvent) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain");
                      setDragOverKey(null);
                      if (id) onEventDrop(id, c.date);
                    },
                  }
                : {})}
              title={cellTitle}
              className={[
                'border p-2 relative cursor-pointer select-none group',
                dragOverKey === key ? 'ring-2 ring-inset ring-bridal-gold-dark bg-bridal-gold-dark/5' : '',
                !c.inCurrentMonth
                  ? 'bg-accent dark:bg-accent/30 text-muted-foreground'
                  // Issue #36 — vendor-blocked dates are now GREEN
                  // (intentional "vendor took this off the table"
                  // signal) rather than red. Recurring blocks stay
                  // amber to distinguish a one-off block from a
                  // weekly/template-driven one.
                  : isBlocked
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-inset ring-emerald-300'
                  : isRecurringBlocked
                  ? 'bg-amber-50/70 dark:bg-amber-950/20'
                  : 'hover:bg-accent/50',
              ].join(' ')}
            >
              {/* Date number + Hijri subscript */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className={[
                    'text-sm select-none',
                    c.isToday ? 'h-6 w-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs' : '',
                    // Issue #36 — keep the date readable on a blocked
                    // cell (no line-through). The green background +
                    // checkmark icon below carry the "blocked" signal.
                    isBlocked && !c.isToday ? 'text-emerald-700 font-medium' : '',
                    !isBlocked && isRecurringBlocked && !c.isToday ? 'text-amber-700 line-through' : '',
                  ].join(' ')}>
                    {c.date.getDate()}
                  </span>
                  {/* Issue #36 — explicit "blocked" affordance: small
                      green checkmark next to the date number so a
                      vendor scanning the month immediately spots
                      which days they've taken off. */}
                  {isBlocked && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-label="Blocked" />
                  )}
                  {/* Phase 3 #9.2 — Hijri day-of-month subscript. Tiny,
                      muted, never overlaps the Gregorian number. Inside
                      Ramadan window the chip tints emerald so vendor
                      can scan the month and see Ramadan at a glance. */}
                  {c.inCurrentMonth && (() => {
                    const h = gregorianToHijri(c.date);
                    const inRamadan = ramadanDates.has(key);
                    return (
                      <span
                        className={[
                          'text-[9px] leading-none tabular-nums px-1 py-0.5 rounded select-none',
                          inRamadan
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'text-muted-foreground/50',
                        ].join(' ')}
                        title={`${h.day} ${h.monthName} ${h.year}`}
                      >
                        {inRamadan ? <Moon className="inline h-2 w-2 mr-0.5" /> : null}
                        {h.day}
                      </span>
                    );
                  })()}
                </div>

                {/* Block indicator badge */}
                {isBlocked && c.inCurrentMonth && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-red-500 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded-full leading-none">
                    <BanIcon className="h-2.5 w-2.5" />
                    Blocked
                  </span>
                )}
                {/* BK-011 — recurring-rule indicator. Hidden when also per-date blocked. */}
                {!isBlocked && isRecurringBlocked && c.inCurrentMonth && (
                  <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-full leading-none">
                    <Repeat className="h-2.5 w-2.5" />
                    Recurring
                  </span>
                )}
              </div>

              {/* Reason tooltip on hover */}
              {isBlocked && c.inCurrentMonth && (
                <p className="mt-0.5 text-[10px] text-red-400 truncate leading-tight">
                  {blockInfo?.reason || 'Not available'}
                </p>
              )}
              {!isBlocked && isRecurringBlocked && c.inCurrentMonth && (
                <p className="mt-0.5 text-[10px] text-amber-700 truncate leading-tight">
                  {recurringInfo?.reason || 'Recurring block'}
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
              {/* Recurring overlay (lighter, amber). Hidden when per-date already striped. */}
              {!isBlocked && isRecurringBlocked && c.inCurrentMonth && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)',
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

              {/* BK-008/15/19/53 — slot capacity chips ("L 2/3 · D 1/3"). Hidden
                  when the day has no template availability (legacy free-string
                  vendor, unblocked-but-no-templates, or off-grid month). */}
              {(() => {
                const slots = slotAvailabilityByDate?.[key];
                if (!Array.isArray(slots) || slots.length === 0) return null;
                if (!c.inCurrentMonth) return null;
                if (isBlocked) return null;
                // Only render templates that run on this weekday and aren't slot-blocked.
                const visibleSlots = slots.filter(s => s.runsThisWeekday && !s.blocked);
                if (visibleSlots.length === 0) return null;
                return (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {visibleSlots.slice(0, 3).map(s => {
                      const initial = (s.label || '?').slice(0, 1).toUpperCase();
                      const soldOut = s.capacity > 0 && s.free === 0;
                      const lastSpot = !!s.lastSpot;
                      return (
                        <span
                          key={s.slotTemplateId}
                          title={`${s.label} · ${s.startTime?.slice(0, 5) || ''}-${s.endTime?.slice(0, 5) || ''} · ${s.free}/${s.capacity} free`}
                          className={[
                            'inline-flex items-center gap-0.5 rounded px-1 py-0 text-[9.5px] tabular-nums leading-tight border',
                            soldOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : lastSpot
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          ].join(' ')}
                        >
                          <span className="font-semibold">{initial}</span>
                          <span>{s.free}/{s.capacity}</span>
                        </span>
                      );
                    })}
                    {visibleSlots.length > 3 ? (
                      <span className="text-[9px] text-muted-foreground self-center">+{visibleSlots.length - 3}</span>
                    ) : null}
                  </div>
                );
              })()}

              {/* Events */}
              <div className="mt-1 xlarge:mt-2 space-y-1">
                {visible.map(ev => {
                  const canDrag = !!onEventDrop && ev.bookingSource === 'offline';
                  return (
                  <div
                    key={ev.id}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("text/plain", String(ev.id));
                      e.dataTransfer.effectAllowed = "move";
                    } : undefined}
                    title={`${ev.title}${ev.bookingSource === 'offline' ? ' · Offline' : ''}${canDrag ? ' · drag to reschedule' : ''}`}
                    className={[
                      "w-full truncate rounded-md bg-emerald-600/10 text-emerald-700 px-2 py-0.5 text-[10px] md:text-[11px] flex items-center gap-1",
                      canDrag ? "cursor-grab active:cursor-grabbing" : "",
                    ].join(" ")}
                  >
                    {ev.bookingSource === 'offline' && (
                      <Store className="h-2.5 w-2.5 shrink-0 text-orange-500" />
                    )}
                    <span className="truncate">{ev.title}</span>
                  </div>
                  );
                })}
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
