import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Vendor, SortOption } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortVendors(vendors: Vendor[], sortOption: SortOption): Vendor[] {
  switch (sortOption) {
    case "price-low":
      return [...vendors].sort((a, b) => a.minimumPrice - b.minimumPrice)
    case "price-high":
      return [...vendors].sort((a, b) => b.minimumPrice - a.minimumPrice)
    case "rating":
      return [...vendors].sort((a, b) => b.minimumPrice - a.minimumPrice)
    case "alphabetical":
      return [...vendors].sort((a, b) => a.name.localeCompare(b.name))
    default:
      return vendors
  }
}

export type Cell = {
    date: Date;
    inCurrentMonth: boolean;
    isToday: boolean;
};

export type CalendarEvent = {
    id: string;
    title: string;
    start: Date; // must be Date objects (convert from ISO in your data layer)
    end: Date;
};

export const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function buildMonth(anchor: Date): { title: string; cells: Cell[] } {
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const first = new Date(year, month, 1);
    first.setHours(0, 0, 0, 0);

    const mondayIndex = toMondayIndex(first.getDay()); // 0..6
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - mondayIndex);

    const cells: Cell[] = [];
    const todayKey = ymd(new Date());

    for (let i = 0; i < 42; i++) {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        d.setHours(0, 0, 0, 0);

        cells.push({
            date: d,
            inCurrentMonth: d.getMonth() === month,
            isToday: ymd(d) === todayKey,
        });
    }

    const title = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(first);
    return { title, cells };
}

function toMondayIndex(jsDay: number) {
    return (jsDay + 6) % 7;
}

// Week range + title (Sun-first here; set startOnMonday=true to change)
export function buildWeekRange(anchor: Date, startOnMonday: boolean) {
    const a = new Date(anchor);
    a.setHours(0, 0, 0, 0);
    const jsDay = a.getDay(); // 0 Sun..6 Sat
    const offset = startOnMonday ? (jsDay + 6) % 7 : jsDay;
    const start = new Date(a);
    start.setDate(a.getDate() - offset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmtMon = new Intl.DateTimeFormat(undefined, { month: 'short' });
    const title =
        `${fmtMon.format(start)} ${start.getDate()} – ` +
        `${start.getMonth() === end.getMonth() ? '' : fmtMon.format(end) + ' '}${end.getDate()}, ${end.getFullYear()}`;

    return { weekStart: start, weekEnd: end, weekTitle: title };
}

export function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
export function endOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}

export function filterEvents(evts: CalendarEvent[], start: Date, end: Date) {
    const s = start.getTime();
    const e = end.getTime();
    return evts.filter((ev) => ev.end.getTime() >= s && ev.start.getTime() <= e);
}

export const tzLabel = (() => {
    const offMin = -new Date().getTimezoneOffset();
    const sign = offMin >= 0 ? '+' : '-';
    const abs = Math.abs(offMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    return `GMT${sign}${hh}`;
})();

export const HOUR_PX = 56; // h-14
export const HOURS_24 = Array.from({ length: 24 }, (_, h) =>
    h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
);

export function getWeekDays(anchor: Date, startOnMonday: boolean) {
    const a = new Date(anchor); a.setHours(0, 0, 0, 0);
    const js = a.getDay(); const off = startOnMonday ? (js + 6) % 7 : js;
    const start = new Date(a); start.setDate(a.getDate() - off);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}
export function formatWeekdayShort(d: Date) { return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d).toUpperCase(); }
export function minutesSinceStart(d: Date) { return d.getHours() * 60 + d.getMinutes(); }
export function diffMinutes(a: Date, b: Date) { return (b.getTime() - a.getTime()) / 60000; }

export const SAMPLE_EVENTS: CalendarEvent[] = [
    {
        id: '1',
        title: 'Client call',
        start: new Date('2025-08-28T09:30:00'),
        end: new Date('2025-08-28T10:30:00'),
    },
    {
        id: '2',
        title: 'Venue tour',
        start: new Date('2025-08-30T14:00:00'),
        end: new Date('2025-08-30T15:00:00'),
    },
    {
        id: '3',
        title: 'Venue tour2',
        start: new Date('2025-08-30T12:00:00'),
        end: new Date('2025-08-30T13:00:00'),
    },
];

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = String(hours).padStart(2, "0");

  return `${day}/${month}/${year}, ${hoursStr}:${minutes} ${ampm}`;
}

// utility function
export function formatColumnId(id: string): string {
  return id
    // convert camelCase / PascalCase to words
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // replace underscores with space
    .replace(/_/g, " ")
    // capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
