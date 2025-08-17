import { CalendarEvent, Cell, ymd } from '@/lib/utils';
import React from 'react'

type MonthViewProps = {
  cells: Cell[];
  events: CalendarEvent[];
  onOpenCellDialog: (events: CalendarEvent[] | []) => void
};

const MonthView = ({ cells, events, onOpenCellDialog }: MonthViewProps) => {
  const byDate = React.useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const key = ymd(ev.start); // same ymd helper you have
      (m.get(key) ?? m.set(key, []).get(key)!).push(ev);
    }
    return m;
  }, [events]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="h-[calc(100dvh-202px)] w-full border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((lbl) => (
          <div key={lbl} className="h-12 border grid place-items-center text-sm text-muted-foreground">{lbl}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(6rem,_1fr)] h-[calc(100dvh-250px)] lg:h-full overflow-y-auto lg:overflow-hidden hide-scrollbar">
        {cells.map((c, i) => {
          const list = byDate.get(ymd(c.date)) ?? [];
          const visible = list.slice(0, 3);
          const more = list.length - visible.length;

          return (
            <div key={i} onClick={() => onOpenCellDialog(list)} className={['border p-2 relative', !c.inCurrentMonth ? 'bg-accent dark:bg-accent/30 text-muted-foreground' : 'hover:bg-accent/50'].join(' ')}>
              <span className={['text-sm select-none', c.isToday ? 'h-6 w-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs' : ''].join(' ')}>
                {c.date.getDate()}
              </span>

              <div className="mt-1 space-y-1">
                {visible.map(ev => (
                  <div key={ev.id} title={`${ev.title}`} className="w-full truncate rounded-md bg-emerald-600/10 text-emerald-700 px-2 py-1 text-[10px] md:text-xs">
                    {ev.title}
                  </div>
                ))}
                {more > 0 && (
                  <div className="text-[11px] text-muted-foreground">+{more} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default MonthView
