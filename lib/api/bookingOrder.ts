import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

/**
 * Phase-1 SPINE — order-builder API client.
 *
 * Talks to the flag-gated booking-order endpoints (ORDER_BUILDER_ON). When the
 * feature is dark the backend returns 404, which the card treats as "not
 * enabled" and renders nothing — so this is safe to mount unconditionally
 * behind the NEXT_PUBLIC_ORDER_BUILDER build flag.
 */
const v1 = `${BACKEND_URL}api/v1/bookings`;

export type LineKind =
  | "hall" | "room" | "catering" | "menu-item" | "service" | "charge" | "discount" | "deposit" | "cost";
export type LineBasis = "per_head" | "per_serving" | "per_each" | "flat" | "percent";
export type DiscountType = "percent" | "flat" | "comp" | "waive";
export type OrderStage = "tentative" | "quotation" | "confirmed" | "postponed" | "cancelled";

export interface OrderLine {
  id?: number;
  name: string;
  kind: LineKind;
  source?: string | null;
  moneyFlow?: string | null;
  basis: LineBasis;
  qty: number;
  unit?: string | null;
  rate: number; // a DEFAULT the vendor overrides freely
  discountType?: DiscountType | null;
  discountValue?: number | null;
  taxVisibility?: string;
  guaranteedQty?: number | null;
  servedQty?: number | null;
  costTag?: string | null;
  sortOrder?: number;
  meta?: Record<string, unknown> | null;
  lineTotal?: number;
}

export interface OrderHeader {
  eventType?: string | null;
  sitting?: string | null;
  guaranteedPax?: number | null;
  expectedPax?: number | null;
  orderStage?: OrderStage | null;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  negotiatedAdjustment: number;
  grand: number;
  advance: number;
  balance: number;
  finalOverride: number | null;
}

export interface EventProfit {
  revenue: number;
  cost: number;
  profit: number;
  margin: number; // profit / revenue, as a %
}

export interface BookingOrder {
  bookingId: number;
  header: OrderHeader;
  lines: OrderLine[];
  totals: OrderTotals;
  profit?: EventProfit;
}

export interface SaveOrderPayload extends Partial<OrderHeader> {
  lines: OrderLine[];
  advance?: number;
  finalOverride?: number | null;
}

/** Returns null when the feature is disabled (404) so the card can hide. */
export async function getBookingOrder(bookingId: number): Promise<BookingOrder | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/order`);
    return (data?.data as BookingOrder) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export async function saveBookingOrder(
  bookingId: number,
  payload: SaveOrderPayload,
): Promise<BookingOrder> {
  const { data } = await axiosInstance.put(`${v1}/${bookingId}/order-lines`, payload);
  return data?.data as BookingOrder;
}

// ── Owner ledger (Receivables) ─────────────────────────────────────────────
export interface LedgerSummary {
  booked: number;
  received: number;
  outstanding: number;
  count: number;
  outstandingCount: number;
}

export interface LedgerRow {
  id: number;
  date: string | null;
  time: string | null;
  eventType: string | null;
  stage: string | null;
  status: string | null;
  customerName: string | null;
  customerPhone: string | null;
  source: string | null;
  moneySource: "order" | "legacy";
  cancelled: boolean;
  grand: number;
  advance: number;
  balance: number;
}

export interface BookingLedger {
  summary: LedgerSummary;
  ledger: LedgerRow[];
}

/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getBookingLedger(): Promise<BookingLedger | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/ledger`);
    return (data?.data as BookingLedger) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}
