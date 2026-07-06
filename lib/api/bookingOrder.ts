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

// ── Ghar action summary (EPIC 5) ───────────────────────────────────────────
export interface ActionEvent {
  id: number; time: string | null; customerName: string | null;
  eventType: string | null; status: string | null; grand: number; balance: number;
}
export interface ActionSummary {
  today: string;
  todaysEvents: { count: number; items: ActionEvent[] };
  duesToChase: { total: number; count: number };
  newEnquiries: number;
  calendarStrip: { date: string; freeSlots: number; bookedSlots: number }[];
  unreadWhatsApp: number;
}

// ── Report cards (Phase-2 EPIC 4) ──────────────────────────────────────────
export interface ReportCard {
  key: string; labelUr: string; labelEn: string; value: number;
  format: "money" | "count" | "pct"; tone: "good" | "warn" | "neutral";
  sub: string | null; delta: number | null;
}
export interface ReportCards {
  period: "month" | "year"; today: string;
  cards: ReportCard[];
  seasonality: { month: string; n: number }[];
}
export async function getReportCards(period: "month" | "year" = "month"): Promise<ReportCards | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/report-cards`, { params: { period } });
    return (data?.data as ReportCards) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ── BEO event sheet (Phase-2 EPIC 1) ───────────────────────────────────────
export interface BeoCustomerLine {
  name: string; kind: string; basis: string; qty: number; unit: string | null;
  rate: number; lineTotal: number | null; isDiscount: boolean;
}
export interface BeoKitchenItem {
  name: string; kind: string; pax: number; unit: string | null;
  spice: string | null; allergen: string | null; notes: string | null;
  printFields: Record<string, unknown> | null;
}
export interface BeoSheets {
  customerSheet: {
    event: { customerName: string | null; customerPhone: string | null; date: string | null; time: string | null; eventType: string | null; sitting: string | null; guaranteedPax: number | null; expectedPax: number | null; stage: string | null };
    lines: BeoCustomerLine[];
    totals: { subtotal: number; discount: number; grand: number; advance: number; balance: number };
  };
  kitchenSheet: {
    event: { customerName: string | null; date: string | null; time: string | null; eventType: string | null; sitting: string | null; pax: number | null };
    items: BeoKitchenItem[];
    crew: { name: string; qty: number; unit: string | null }[];
  };
}

/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getBeo(bookingId: number): Promise<BeoSheets | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/beo`);
    return (data?.data as BeoSheets) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ── Paisa reconciliation (Phase-2 EPIC 9) ──────────────────────────────────
export interface PaisaReceipt {
  id: number; amount: number; method: string; receivedDate: string | null;
  transactionRef: string | null; hasProof: boolean;
}
export interface PaisaReconcile {
  bookingId: number;
  grand: number; displayedAdvance: number; receiptsTotal: number; receiptCount: number;
  refundsTotal: number; lastReceiptDate: string | null;
  trueBalance: number; displayedBalance: number; delta: number; overpaid: number;
  reconciled: boolean;
  receipts: PaisaReceipt[];
}
/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getPaisaReconcile(bookingId: number): Promise<PaisaReconcile | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/paisa-reconcile`);
    return (data?.data as PaisaReconcile) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ── Recovery reminders (Phase-2 EPIC 8) ────────────────────────────────────
export interface DueReminder {
  bookingId: number;
  customerName: string | null;
  customerPhone: string | null;
  eventType: string | null;
  eventDate: string | null;
  daysUntil: number | null;
  trigger: "baqaya_due" | "event_upcoming" | "pdc_due" | "promise_to_pay";
  balance: number;
  grand: number;
  message: string;
  waHref: string;
  lastRemindedAt: string | null;
}
export interface DueReminders {
  today: string;
  count: number;
  reminders: DueReminder[];
}
/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getDueReminders(): Promise<DueReminders | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/reminders/due`);
    return (data?.data as DueReminders) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}
/** Persist that a wa.me reminder was raised (so "reminded on" survives refresh). */
export async function logReminder(
  bookingId: number,
  payload: { trigger?: string; channel?: string; body?: string },
): Promise<{ id: number; reminderType: string; sentAt: string } | null> {
  try {
    const { data } = await axiosInstance.post(`${v1}/${bookingId}/reminders/log`, payload);
    return (data?.data as { id: number; reminderType: string; sentAt: string }) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

// ── Refund preview (Phase-2 EPIC 5) ────────────────────────────────────────
export interface RefundTier { minDaysBefore: number; refundPct: number }
export interface RefundPolicy {
  key: string; labelUr: string; labelEn: string; depositPct: number; tiers: RefundTier[];
}
export interface RefundBreakdown {
  overpayment: number; deposit: number; advance: number;
  advanceRefund: number; advanceForfeit: number; securityRefund: number; damages: number;
}
export interface RefundPreview {
  bookingId: number; eventDate: string | null; daysBefore: number;
  grand: number; totalPaid: number;
  policy: RefundPolicy;
  preview: { refund: number; forfeit: number; breakdown: RefundBreakdown; tier: RefundTier; trace: unknown[] };
  comparison: { key: string; labelUr: string; labelEn: string; refund: number; forfeit: number; refundPct: number }[];
  presets: RefundPolicy[];
}
/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getRefundPreview(
  bookingId: number,
  opts?: { policy?: string; days?: number },
): Promise<RefundPreview | null> {
  try {
    const params: Record<string, string | number> = {};
    if (opts?.policy) params.policy = opts.policy;
    if (opts?.days != null) params.days = opts.days;
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/refund-preview`, { params });
    return (data?.data as RefundPreview) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

/** Returns null when the feature is disabled (404) so the surface can hide. */
export async function getActionSummary(businessId?: number): Promise<ActionSummary | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/action-summary`, {
      params: businessId ? { businessId } : {},
    });
    return (data?.data as ActionSummary) ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}
