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
  /** Booking lifecycle status. WWL-044 — the editor needs to know. */
  status?: string | null;
  /** True when the booking is cancelled: the server refuses order writes. */
  locked?: boolean | null;
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

// ── EPIC 5 — cancellation / refund engine ──────────────────────────────────
export interface PolicyAcceptanceRow {
  id: number; acceptedAt: string; acceptedName: string | null; acceptedPhone: string | null;
  channel: string; policySnapshot: { name?: string; slabs?: RefundTier[] | null; forceMajeureRule?: string } | null;
}
export interface PolicyAcceptanceState { bookingId: number; accepted: boolean; acceptance: PolicyAcceptanceRow | null }

export async function getPolicyAcceptance(bookingId: number): Promise<PolicyAcceptanceState | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/policy-acceptance`);
    return (data?.data as PolicyAcceptanceState) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
}
export async function recordPolicyAcceptance(bookingId: number, body: { acceptedName?: string; acceptedPhone?: string; channel?: string } = {}) {
  const { data } = await axiosInstance.post(`${v1}/${bookingId}/policy-acceptance`, body);
  return data?.data as { bookingId: number; acceptanceId: number; policyName: string };
}

/**
 * WW-SETTLE — APPLIED is not the end.
 *
 * The platform holds none of the customer's money, so "applied" only means the
 * venue has been told what it owes. PAID_BY_VENDOR is the venue's claim;
 * ACKNOWLEDGED is the customer confirming they actually received it, and is the
 * only state that settles a direct-pay refund. DISPUTED is the customer saying
 * it never arrived; WITHDRAWN is them pulling the request before it was decided.
 */
export type RefundState =
  | "RAISED" | "APPROVED" | "APPLIED"
  | "PAID_BY_VENDOR" | "ACKNOWLEDGED"
  | "REJECTED" | "WITHDRAWN" | "DISPUTED";

/** How a venue says it handed the money over. */
export type VendorPaymentMethod = "cash" | "bank_transfer" | "jazzcash" | "easypaisa" | "cheque" | "other";

export interface RefundRequestRow {
  id: number; bookingId: number; reason: string; state: RefundState;
  computed: { refund: number; forfeit: number; carryForward?: number };
  resolvedVia: string | null; note: string | null;
  createdAt?: string | null;
  decidedAt?: string | null;
  /** When the obligation was recorded — not when anyone was actually paid. */
  appliedAt?: string | null;
  /** What the venue still owes BY HAND. Null on requests raised before WW-SETTLE. */
  settlementDue?: number | string | null;
  paidByVendorAt?: string | null;
  vendorPaymentMethod?: VendorPaymentMethod | null;
  vendorPaymentRef?: string | null;
  acknowledgedAt?: string | null;
  disputedAt?: string | null;
  disputeNote?: string | null;
  withdrawnAt?: string | null;
}

/**
 * What a request still owes by hand.
 *
 * Requests raised before WW-SETTLE have no `settlementDue` of their own; reading
 * that as zero would show a family a real, unpaid obligation as already settled,
 * so it falls back to the frozen calculation — the same rule the server uses.
 */
export function outstandingRefund(r: Pick<RefundRequestRow, "settlementDue" | "computed">): number {
  const due = r.settlementDue;
  if (due !== null && due !== undefined && due !== "") return Number(due) || 0;
  return Number(r.computed?.refund) || 0;
}
export async function listRefundRequests(bookingId: number): Promise<{ bookingId: number; requests: RefundRequestRow[] } | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/refund-requests`);
    return (data?.data as { bookingId: number; requests: RefundRequestRow[] }) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
}
export async function raiseRefundRequest(bookingId: number, body: { reason?: string; securityDeposit?: number; damages?: number } = {}) {
  const { data } = await axiosInstance.post(`${v1}/${bookingId}/refund-requests`, body);
  return (data?.data as { request: RefundRequestRow }).request;
}
export async function decideRefundRequest(bookingId: number, reqId: number, approve: boolean, note?: string) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/decide`, { approve, note });
  return (data?.data as { request: RefundRequestRow }).request;
}
export async function applyRefundRequest(bookingId: number, reqId: number) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/apply`, {});
  return (data?.data as { request: RefundRequestRow }).request;
}

// ── WW-SETTLE — the two-sided settlement ───────────────────────────────────
// Each call belongs to one party. The venue may claim it paid; only the
// customer can confirm they received it. Nothing here confirms on their behalf.

/** VENDOR: "I have paid this." A claim — the refund still waits on the customer. */
export async function markRefundPaid(
  bookingId: number, reqId: number,
  body: { method?: VendorPaymentMethod; reference?: string; note?: string } = {},
) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/mark-paid`, body);
  return (data?.data as { request: RefundRequestRow; outstanding: number });
}

/** CUSTOMER: "I received it." The only path to ACKNOWLEDGED. */
export async function acknowledgeRefund(bookingId: number, reqId: number, note?: string) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/acknowledge`, { note });
  return (data?.data as { request: RefundRequestRow }).request;
}

/** CUSTOMER: "It has not reached me." Hands the request back to the venue, still open. */
export async function disputeRefundSettlement(bookingId: number, reqId: number, note?: string) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/dispute`, { note });
  return (data?.data as { request: RefundRequestRow }).request;
}

/** CUSTOMER: pull a request back before the venue has decided it. */
export async function withdrawRefundRequest(bookingId: number, reqId: number, note?: string) {
  const { data } = await axiosInstance.patch(`${v1}/${bookingId}/refund-requests/${reqId}/withdraw`, { note });
  return (data?.data as { request: RefundRequestRow }).request;
}

export interface RefundObligation extends RefundRequestRow { outstanding: number }
export interface RefundObligations {
  businessId: number | null; count: number; totalOutstanding: number; obligations: RefundObligation[];
}

/** VENDOR worklist: refunds this venue owes and has not been confirmed as paying. */
export async function listRefundObligations(businessId?: number): Promise<RefundObligations | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/refund-obligations`, {
      params: businessId ? { businessId } : undefined,
    });
    return (data?.data as RefundObligations) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
}

// Cancellation-policy management (5.4)
export interface PolicySlab { daysToEvent: number; pctForfeit: number }
export interface PolicyTemplate {
  key: string; name: string; labelEn: string; forceMajeureRule: string; slabs: PolicySlab[];
  /** The engine's non-refundable deposit for this template, for display (WWL-501). */
  depositPct?: number;
  /** Suggested notice period for this template. A starting point, not a rule. */
  minNoticeHours?: number | null;
}
export interface ActivePolicy {
  id: number; name: string; slabs: PolicySlab[]; forceMajeureRule: string;
  partialRefundPct: number | null; isDefault: boolean; effectiveFrom: string;
  /** WW-CANCELWINDOW — hours before the event inside which a customer may not self-cancel. */
  minNoticeHours?: number | null;
  /** Display-only prose shown beside the schedule; no engine reads it. */
  refundPolicyNote?: string | null;
}
export interface CancellationPolicyState {
  businessId: number | null;
  /** The business's OWN policy. Null when they have never chosen one. */
  active: ActivePolicy | null;
  /**
   * WWL-502 — the policy that will actually govern a refund, including the
   * platform default a vendor inherits without ever having seen it.
   */
  effective?: ActivePolicy | null;
  effectiveSource?: "business" | "platform_default" | "none";
  templates: PolicyTemplate[];
}

/**
 * WWL-505 — this sent no `businessId`, so the server resolved one with
 * `resolveOwnedBusinessId` and always answered for the vendor's FIRST venue.
 * A three-venue vendor could therefore give a cancellation policy to 3358 and
 * to nothing else: 3359 and 3360 had `active: null` and no route to change it,
 * on the one setting that decides who keeps the money when a wedding is called
 * off. Both endpoints have accepted the parameter all along.
 */
export async function getCancellationPolicy(businessId?: number | null): Promise<CancellationPolicyState | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/policy`, {
      params: businessId != null ? { businessId } : undefined,
    });
    return (data?.data as CancellationPolicyState) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
}
export async function saveCancellationPolicy(body: {
  name?: string;
  slabs: PolicySlab[];
  forceMajeureRule?: string;
  partialRefundPct?: number;
  businessId?: number | null;
  /** Hours. Null or 0 clears the cutoff, which is the platform default. */
  minNoticeHours?: number | null;
  refundPolicyNote?: string | null;
}) {
  const { data } = await axiosInstance.post(`${v1}/policy`, body);
  return data?.data as { id: number; name: string; slabs: PolicySlab[]; forceMajeureRule: string; minNoticeHours: number | null };
}

/**
 * WW-CANCELWINDOW — the route out of a closed cancellation window.
 *
 * Past the venue's notice period the customer cannot cancel themselves. They
 * can ask, and the venue answers in the product rather than over the phone.
 */
export interface CancellationRequest {
  id: number;
  bookingId: number;
  status: "pending" | "approved" | "declined" | "cancelled" | "expired";
  reason: string | null;
  decisionNotes: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export async function requestCancellation(bookingId: number, reason?: string) {
  const { data } = await axiosInstance.post(`${v1}/${bookingId}/cancellation-request`, { reason });
  return data?.data as { request: CancellationRequest; alreadyOpen?: boolean };
}

export async function decideCancellationRequest(
  bookingId: number,
  reqId: number,
  approve: boolean,
  note?: string,
) {
  const { data } = await axiosInstance.patch(
    `${v1}/${bookingId}/cancellation-request/${reqId}`,
    { approve, note },
  );
  return data?.data as { request: CancellationRequest };
}

export interface DisputeEvidence {
  generatedFor: number;
  booking: { customerName: string | null; eventDate: string | null; grand: number; receiptsTotal: number; balance: number };
  policyAcceptance: { acceptedAt: string; acceptedName: string | null; channel: string; snapshot: { name?: string } } | null;
  refundRequests: { id: number; reason: string; state: RefundState; refund: number; forfeit: number; carryForward: number; resolvedVia: string | null }[];
  auditChain: { verified: boolean; checked: number; events: { seq: number; action: string; entityType: string; at: string }[] };
  exposure: {
    policyAccepted: boolean;
    auditVerified: boolean;
    hasAppliedForfeit: boolean;
    /**
     * WWL-511 — money the vendor cannot evidence. The pack listed Rs 1,223,278
     * collected across two receipts with `hasProof: false` on BOTH and still
     * flagged OK, because exposure weighed only acceptance and the audit chain.
     * A forfeit is computed FROM what was received.
     */
    receiptsWithoutProof?: number;
    receiptsTotalCount?: number;
    unproofedAmount?: number;
    unproofedShare?: number;
    moneyUnevidenced?: boolean;
    flag: "OK" | "REVIEW";
  };
}
export async function getDisputeEvidence(bookingId: number): Promise<DisputeEvidence | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/${bookingId}/dispute-evidence`);
    return (data?.data as DisputeEvidence) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
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
  /**
   * WW-CANCELWINDOW — the vendor's notice period, in hours, and how long is
   * actually left. `null` means this venue has not set one, which is the
   * platform default and means the customer may cancel at any time.
   *
   * `hoursUntilEvent` goes negative once the event has started.
   */
  minNoticeHours?: number | null;
  hoursUntilEvent?: number | null;
  /** Display-only prose the vendor wrote beside their schedule. */
  refundPolicyNote?: string | null;
  /** The name of the policy actually governing this booking. */
  policyName?: string | null;
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
