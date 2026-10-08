/**
 * The Overview's Revenue chart: what it plots, what it adds up, and where every
 * mark sits. Pure — numbers in, numbers and path strings out — so the rules can
 * be checked under plain node (scripts/overview-check.mts) instead of by eye.
 *
 * ── Why it is its own file ────────────────────────────────────────────────
 *
 * The chart drew whatever months the server happened to send (only months that
 * had money, including ones that had not started), spaced them evenly, printed
 * "September 2026" under every point so neighbours collided, ticked the axis at
 * 0 / 17.9 / 35.7 / 54.1, joined the points with a spline that rounded off real
 * peaks, and divided "Kul is saal" by a month count that included the future.
 * Each of those is a few lines of arithmetic in a template string, which is
 * exactly where nobody checks it. Here each is a function with a test.
 *
 * ── The rules ─────────────────────────────────────────────────────────────
 *
 * 1. The series is always the 12 months ending THIS month, oldest first, zero
 *    filled (the server guarantees it). 3M / 6M / 1Y are the last 3 / 6 / 12 of
 *    them — exactly that many months ending now, never padded, never future.
 * 2. "Kul" is the sum of the months shown. "Ausat / mahina" is that sum divided
 *    by the number of months shown. Same period, same denominator, both labelled.
 * 3. Segments are straight. A straight segment cannot invent a value the data
 *    does not contain; a spline can.
 * 4. The axis starts at 0 and ticks on 1 / 2 / 5 × 10ⁿ lakh.
 * 5. Month labels are short ("Oct 26"), thinned from the right so the current
 *    month is always named and no two labels overlap at any width.
 */

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
] as const;

/** One month of money, `value` in rupees. */
export interface MonthPoint {
  key: string; // "2026-10"
  value: number;
}

const monthIndex = (key: string) => Math.max(0, Math.min(11, Number(key.slice(5, 7)) - 1));

/** "2026-10" → "Oct 26". Deterministic: no locale, so "Sept" can never appear. */
export function monthShort(key: string): string {
  return `${MONTHS_SHORT[monthIndex(key)]} ${key.slice(2, 4)}`;
}

/** "2026-10" → "October 2026". */
export function monthLong(key: string): string {
  return `${MONTHS_LONG[monthIndex(key)]} ${key.slice(0, 4)}`;
}

/**
 * The last `n` months of a series. Never pads: a series shorter than `n` comes
 * back whole, and asking for 12 of 12 returns all 12 — the 1Y button means the
 * last twelve months, not "everything the server sent".
 */
export function lastMonths<T>(series: readonly T[], n: number): T[] {
  const count = Math.max(0, Math.floor(n));
  return count >= series.length ? series.slice() : series.slice(series.length - count);
}

export interface RangeSummary {
  /** How many months the range spans — the one denominator. */
  months: number;
  firstKey: string;
  lastKey: string;
  total: number;
  /** total / months, or null when nothing was received (no "Rs 0 average"). */
  average: number | null;
  /** The strongest month, or null when there is none to name. */
  best: { key: string; value: number } | null;
  hasData: boolean;
}

export function summariseRange(points: readonly MonthPoint[]): RangeSummary {
  const months = points.length;
  const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
  let best: RangeSummary["best"] = null;
  for (const p of points) {
    if (p.value > 0 && (!best || p.value >= best.value)) best = { key: p.key, value: p.value };
  }
  return {
    months,
    firstKey: points[0]?.key ?? "",
    lastKey: points[months - 1]?.key ?? "",
    total,
    average: total > 0 && months > 0 ? total / months : null,
    best,
    hasData: total > 0,
  };
}

/** "Nov 25 – Oct 26", or a single month when the range is one month. */
export function periodLabel(s: Pick<RangeSummary, "firstKey" | "lastKey">): string {
  if (!s.firstKey) return "";
  return s.firstKey === s.lastKey ? monthShort(s.firstKey) : `${monthShort(s.firstKey)} – ${monthShort(s.lastKey)}`;
}

export interface NiceScale {
  max: number;
  step: number;
  ticks: number[];
}

/**
 * Axis for values in lakh: starts at 0, steps of 1 / 2 / 5 × 10ⁿ, tops out at
 * the first step at or above the data. 54 lakh → 0, 20, 40, 60.
 */
export function niceScale(maxLakh: number, intervals = 4): NiceScale {
  if (!(maxLakh > 0) || !Number.isFinite(maxLakh)) return { max: 1, step: 1, ticks: [0, 1] };
  const raw = maxLakh / intervals;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  const count = Math.max(1, Math.ceil(maxLakh / step - 1e-9));
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) ticks.push(Math.round(i * step * 1e6) / 1e6);
  return { max: ticks[ticks.length - 1], step, ticks };
}

/** An axis label for a tick, with only as many decimals as the step needs. */
export function formatTick(value: number, step: number): string {
  const decimals = step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step) - 1e-9));
  return value.toFixed(decimals);
}

/**
 * Which of `count` evenly spaced points get a label. Counts back from the LAST
 * point (the current month, always named) in strides wide enough that two
 * labels can never touch: stride × spacing ≥ label width + gap.
 */
export function labelIndices(count: number, spacingPx: number, labelPx: number, gapPx = 10): number[] {
  if (count <= 0) return [];
  const stride = Math.max(1, Math.ceil((labelPx + gapPx) / Math.max(1, spacingPx)));
  const out: number[] = [];
  for (let i = count - 1; i >= 0; i -= stride) out.push(i);
  return out.reverse();
}

/**
 * Width, in px, a short month label ("May 26") takes at the chart's 10.5px font,
 * rounded up (measured: 33–34 px in the console font). labelIndices adds a gap on
 * top, so two labels are never closer than LABEL_PX + 10.
 */
export const LABEL_PX = 36;

export interface ChartLayout {
  width: number;
  height: number;
  padL: number;
  padR: number;
  padT: number;
  padB: number;
  baseY: number;
  hasData: boolean;
  /** Pixel position of each point, in series order. */
  xs: number[];
  ys: number[];
  scale: NiceScale;
  ticks: { value: number; label: string; y: number }[];
  /** Indices of the points that carry an x-axis label. */
  labelAt: number[];
  linePath: string;
  areaPath: string;
}

/**
 * Where everything goes for a chart `widthPx` wide. The height is fixed; the
 * width is the real container width, so label thinning is decided in real
 * pixels and a 1,280 px window and a phone each get a layout that fits.
 */
export function layoutChart(points: readonly MonthPoint[], widthPx: number, heightPx = 210): ChartLayout {
  const width = Math.max(260, Math.round(widthPx) || 680);
  const height = heightPx;
  const padL = 38, padR = 26, padT = 18, padB = 28;
  const iw = width - padL - padR;
  const ih = height - padT - padB;
  const n = points.length;
  const lakh = points.map((p) => (Number.isFinite(p.value) ? p.value : 0) / 100000);
  const maxLakh = lakh.reduce((m, v) => Math.max(m, v), 0);
  const hasData = n > 0 && maxLakh > 0;
  const scale = niceScale(hasData ? maxLakh : 0);

  const xs = lakh.map((_, i) => (n <= 1 ? padL + iw / 2 : padL + (i / (n - 1)) * iw));
  const yOf = (v: number) => padT + (1 - v / scale.max) * ih;
  const ys = lakh.map(yOf);
  const baseY = padT + ih;

  const ticks = scale.ticks.map((value) => ({ value, label: formatTick(value, scale.step), y: yOf(value) }));
  const spacing = n > 1 ? iw / (n - 1) : iw;
  const labelAt = labelIndices(n, spacing, LABEL_PX);

  const f = (v: number) => Math.round(v * 100) / 100;
  let linePath = "";
  xs.forEach((x, i) => { linePath += `${i ? " L" : "M"} ${f(x)} ${f(ys[i])}`; });
  const areaPath = n ? `${linePath} L ${f(xs[n - 1])} ${f(baseY)} L ${f(xs[0])} ${f(baseY)} Z` : "";

  return { width, height, padL, padR, padT, padB, baseY, hasData, xs, ys, scale, ticks, labelAt, linePath, areaPath };
}
