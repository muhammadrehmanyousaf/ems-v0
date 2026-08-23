/**
 * WW-SETTLEMENT — the final bill for a booking.
 *
 * The night of the event is where a Pakistani venue actually makes or loses
 * money, and where nearly every dispute happens. Until now it was settled on
 * WhatsApp at the gate: `settlementPolicy.js` could compute the bill and was
 * called from nowhere.
 *
 * The preview is readable by BOTH parties on purpose — a customer who can see
 * the guarantee, the tolerance band and the walk-in rate before the night has
 * not been ambushed by them at the door.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface SettlementLine {
  label: string;
  heads: number;
  rate: number;
  amount: number;
  /** Why this line is what it is. Not decoration — it is what prevents the argument. */
  why: string;
}

export interface HeadBreakdown {
  billableHeads: number;
  adults: number;
  kidsUnder5: number;
  kids5to12: number;
  staff: number;
  notes: string[];
}

export interface SettlementBill {
  guaranteed: number;
  actual: number;
  billedHeads: number;
  atNormalRate: number;
  atWalkInRate: number;
  normalRate: number;
  walkInRate: number;
  toleranceMaxPax: number;
  food: number;
  lines: SettlementLine[];
}

export interface SettlementPreview {
  settleable: boolean;
  /** Present when `settleable` is false — e.g. a flat-priced booking. */
  reason?: string;
  bookingId: number;
  locked: boolean;
  lockedAt?: string | null;
  settled: boolean;
  settledAt?: string | null;
  rate?: number;
  rateLabel?: string | null;
  guaranteed: number;
  statedTotal?: number;
  heads?: HeadBreakdown;
  bill?: SettlementBill;
  staffMeals?: { count: number; rate: number; amount: number } | null;
  foodTotal?: number;
  terms?: string[];
  totalAmount?: number;
}

export interface FinalCounts {
  total: number;
  kidsUnder5?: number;
  kids5to12?: number;
  staff?: number;
}

const unwrap = (res: any): SettlementPreview => res?.data?.data;

export class SettlementAPI {
  /** What the bill is, or would be. Either party may read it. */
  static async preview(bookingId: number, counts?: Partial<FinalCounts>): Promise<SettlementPreview> {
    const q = counts?.total != null
      ? `?total=${counts.total}&kidsUnder5=${counts.kidsUnder5 ?? 0}&kids5to12=${counts.kids5to12 ?? 0}&staff=${counts.staff ?? 0}`
      : "";
    return unwrap(await axiosInstance.get(`/api/v1/bookings/${bookingId}/settlement${q}`));
  }

  /** Vendor freezes the guarantee. After this the kitchen order is safe. */
  static async lock(bookingId: number, guaranteed?: number): Promise<SettlementPreview> {
    return unwrap(await axiosInstance.post(`/api/v1/bookings/${bookingId}/headcount-lock`, { guaranteed }));
  }

  /** Vendor records the count from the night and freezes the bill. */
  static async settle(bookingId: number, counts: FinalCounts, note?: string): Promise<SettlementPreview> {
    return unwrap(await axiosInstance.post(`/api/v1/bookings/${bookingId}/settle`, { ...counts, note }));
  }
}

export function formatPkr(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rs ${Math.round(n).toLocaleString("en-PK")}`;
}
