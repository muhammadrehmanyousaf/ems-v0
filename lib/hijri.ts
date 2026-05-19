/**
 * Vendor Portal Phase 3 #9.2 — Hijri calendar overlay.
 *
 * Pure-math Gregorian ↔ Hijri converter using the Umm al-Qura
 * tabular algorithm (Kuwaiti variant). Accuracy: ±1 day vs the
 * official Saudi sighting-based calendar — sufficient for "is
 * tomorrow Ramadan?" UX prompts; vendors confirm manually.
 *
 * No external dep needed (would otherwise pull in moment-hijri,
 * ~80kb gzipped). Self-contained ~80 lines.
 *
 * Reference: Khalid Shaukat / Fatimi conversion tables; also
 * matches the algorithm shipped in `moment-hijri` v2.x.
 */

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
];

const HIJRI_MONTHS_UR = [
  'محرم',
  'صفر',
  'ربیع الاول',
  'ربیع الثانی',
  'جمادی الاول',
  'جمادی الثانی',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذوالقعدہ',
  'ذوالحجہ',
];

export interface HijriDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-30
  monthName: string;
  monthNameUr: string;
}

/** Convert a Date (Gregorian) to a Hijri date using the Kuwaiti algorithm. */
export function gregorianToHijri(date: Date): HijriDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Julian day number (Gregorian → JDN).
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mn = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * mn + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045;

  // JDN → Islamic (Kuwaiti algorithm).
  const islamicEpoch = 1948440; // 1 Muharram 1 AH
  const l1 = jdn - islamicEpoch;
  const n = Math.floor((30 * l1 + 10646) / 10631);
  const l2 = l1 - Math.floor((10631 * n - 10646) / 30);
  const mh = Math.min(Math.floor((11 * l2 + 330) / 325), 12);
  const dh = l2 - Math.floor((325 * mh - 320) / 11) + 1;

  return {
    year: n,
    month: mh,
    day: dh,
    monthName: HIJRI_MONTHS[mh - 1],
    monthNameUr: HIJRI_MONTHS_UR[mh - 1],
  };
}

/** Human-friendly compact label: "12 Ramadan 1447" */
export function formatHijriShort(h: HijriDate): string {
  return `${h.day} ${h.monthName} ${h.year}`;
}

export function formatHijriShortUr(h: HijriDate): string {
  return `${h.day} ${h.monthNameUr} ${h.year}`;
}

/**
 * Islamic events the Pakistani wedding industry treats as
 * blackout candidates. Vendor accepts/rejects per-date.
 */
export type IslamicEventKind =
  | 'ramadan'
  | 'ashura'
  | 'eid_milad'
  | 'eid_fitr'
  | 'eid_azha'
  | 'shab_e_barat'
  | 'shab_e_qadr'
  | 'arafah';

export interface IslamicEvent {
  date: Date;
  hijri: HijriDate;
  kind: IslamicEventKind;
  label: string;
  /** Higher = stronger blackout signal. 3 = nearly-everyone-blacks-out. */
  severity: 1 | 2 | 3;
}

const EVENT_LABELS: Record<IslamicEventKind, string> = {
  ramadan: 'Ramadan',
  ashura: 'Muharram (Ashura)',
  eid_milad: 'Eid Milad-un-Nabi',
  eid_fitr: 'Eid-ul-Fitr',
  eid_azha: 'Eid-ul-Azha',
  shab_e_barat: "Shab-e-Bara'at",
  shab_e_qadr: 'Laylat-ul-Qadr (estimated)',
  arafah: 'Day of Arafah',
};

const EVENT_SEVERITY: Record<IslamicEventKind, 1 | 2 | 3> = {
  ramadan: 3,
  eid_fitr: 3,
  eid_azha: 3,
  ashura: 3,
  shab_e_barat: 2,
  eid_milad: 2,
  shab_e_qadr: 2,
  arafah: 2,
};

/**
 * Walk forward `daysAhead` days from `from` and emit any Islamic
 * events that fall in the window. Pakistani-wedding scope only —
 * we don't emit every Islamic anniversary, just the ones that
 * predictably suppress wedding bookings.
 */
export function upcomingIslamicEvents(
  from: Date,
  daysAhead = 365,
): IslamicEvent[] {
  const events: IslamicEvent[] = [];
  const seenKeys = new Set<string>();

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const h = gregorianToHijri(d);

    // Match table — month/day combinations we treat as events.
    let kind: IslamicEventKind | null = null;

    if (h.month === 9 && h.day === 1) kind = 'ramadan';
    else if (h.month === 1 && h.day === 10) kind = 'ashura';
    else if (h.month === 3 && h.day === 12) kind = 'eid_milad';
    else if (h.month === 10 && h.day === 1) kind = 'eid_fitr';
    else if (h.month === 12 && h.day === 10) kind = 'eid_azha';
    else if (h.month === 12 && h.day === 9) kind = 'arafah';
    else if (h.month === 8 && h.day === 15) kind = 'shab_e_barat';
    else if (h.month === 9 && h.day === 27) kind = 'shab_e_qadr';

    if (kind) {
      const key = `${h.year}-${kind}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      events.push({
        date: new Date(d),
        hijri: h,
        kind,
        label: EVENT_LABELS[kind],
        severity: EVENT_SEVERITY[kind],
      });
    }
  }

  return events;
}

/**
 * Ramadan + Eid-ul-Fitr together form a 30+3 day suppression
 * window. Build a Set<YYYY-MM-DD> of those dates so the calendar
 * can dim them visually without spamming per-day events.
 */
export function ramadanWindow(from: Date, daysAhead = 400): Set<string> {
  const days = new Set<string>();
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const h = gregorianToHijri(d);
    // Whole Ramadan + first 3 days of Shawwal (Eid-ul-Fitr).
    if (h.month === 9) {
      days.add(_ymd(d));
    } else if (h.month === 10 && h.day <= 3) {
      days.add(_ymd(d));
    }
  }
  return days;
}

function _ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(d.getDate()).padStart(2, '0')}`;
}
