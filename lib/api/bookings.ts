import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";
import type { BookingData } from "../dashboard-types";

const v1 = `${BACKEND_URL}api/v1/bookings`;

// Returned by GET /:id/with-availability. The `booking` payload mirrors
// BookingData (the same shape the listing uses), so the detail page can
// reuse all the existing dashboard typings + dialogs.
export interface BookingAvailabilityContextRow {
  businessId: number;
  date: string;
  isAvailable: boolean;
  remainingSlots?: number;
  message?: string;
}

export interface BookingWithAvailabilityResponse {
  booking: BookingData;
  availabilityContext: BookingAvailabilityContextRow[];
}

// BK-042 / WW-QIST-SCHEDULE — the booking's payment schedule.
//
// ONE request returns the booking's money, its qists, the payments that explain
// them and what is due now. Every figure is parsed to a number on the server
// (the API's money columns elsewhere are strings, and a string is truthy - that
// is how a "Pay Rs. 0" button happened), so nothing here is recomputed in the
// browser. Vocabulary: Qist = a scheduled instalment, Mil chuka = received,
// Baqaya = the OUTSTANDING TOTAL only.

/** The honest status of one qist, derived on the server from amounts + the PKT date. */
export type QistState =
  | "upcoming"
  | "due_today"
  | "overdue"
  | "part_paid"
  | "paid"
  | "waived"
  | "cancelled";

export interface QistActions {
  record: boolean;
  edit: boolean;
  split: boolean;
  waive: boolean;
  remove: boolean;
  remind: boolean;
}

export interface BookingInstallment {
  /** null only for a qist the server has computed but not yet stored (a customer read of a legacy booking). */
  id: number | null;
  sequence: number;
  /** 1-based position among the live qists; null for a waived one. */
  order?: number | null;
  label: string; // 'down_payment' | 'remaining' | 'full_payment' | 'extra' | custom
  /** The label as it should be read (audience-specific vocabulary). */
  title?: string;
  amount: number;
  amountPaid: number;
  /** amount - amountPaid, never negative; 0 when paid or waived. */
  remaining?: number;
  dueAt: string; // ISO
  /** The due DAY in Pakistan time, YYYY-MM-DD - the one date every screen shows. */
  dueDate?: string;
  state?: QistState;
  daysOverdue?: number;
  daysUntilDue?: number | null;
  /** The legacy DB status, kept for older readers. */
  status: "pending" | "paid" | "partial" | "waived" | "overdue";
  paidAt: string | null;
  paymentTransactionId?: number | null;
  source?: "auto" | "vendor" | "customer_plan" | "import";
  allocations?: { receiptId: number; amount: number }[];
  warnings?: ("due_after_event" | "due_before_booking")[];
  waived?: boolean;
  // vendor view only
  waivedReason?: string | null;
  waivedAt?: string | null;
  lastRemindedAt?: string | null;
  reminderCount?: number;
  actions?: QistActions;
}

export interface SchedulePayment {
  id: number;
  kind: "payment" | "refund";
  amount: number; // negative for a refund
  method: string;
  receivedDate: string;
  transactionRef: string | null;
  notes?: string | null;
  installmentId?: number | null;
  allocations: { installmentId: number | null; title: string | null; amount: number; overpayment: boolean }[];
}

export interface PlanPreset {
  key: "full" | "advance_balance" | "three_qists" | "custom";
  available: boolean;
  reason: string | null;
  rows: { label: string; title: string; amount: number; dueDate: string }[];
}

export interface InstallmentsResponse {
  bookingId?: number;
  asOf?: string;
  /** Today in Pakistan, YYYY-MM-DD. */
  today?: string;
  installments: BookingInstallment[];
  /** Σ live qists, Σ paid on them, what is left on them. */
  totals: { scheduled: number; paid: number; outstanding: number };
  money?: {
    total: number;
    received: number;
    /** total - received; 0 for a cancelled booking. THE Baqaya. */
    outstanding: number;
    overpaid: number;
    /** Money on the booking with no receipt behind it (a legacy advance). */
    unledgered: number;
    percentPaid: number;
    paymentStatus: string;
    bookingStatus: string;
    cancelled: boolean;
    payable: boolean;
    advanceDue: number;
    waived: number;
    refunded: number;
    eventDate: string | null;
    createdDate: string | null;
  };
  nextDue?: { installmentId: number | null; title: string; remaining: number; dueDate: string; state: QistState; daysOverdue: number } | null;
  /** What to collect now: everything due or overdue, else the next qist. */
  amountDue?: { amount: number; basis: "due_now" | "next_qist" | "nothing_due"; installmentIds: (number | null)[]; nextInstallmentId: number | null; nextDueDate: string | null; overdueAmount: number };
  payments?: SchedulePayment[];
  /** Vendor view only. */
  plan?: { editable: boolean; maxQists: number; remainingToSchedule: number; balanceDaysBefore: number; presets: PlanPreset[] };
  invariants?: { scheduleSumsToTotal: boolean; paidMatchesReceipts: boolean; nothingOverfilled: boolean; noZeroLiveRows: boolean };
  drift?: boolean;
  warnings?: { code: string; index: number; dueDay: string }[];
}

/** The schedule, as the vendor and the customer both read it. */
export type BookingSchedule = InstallmentsResponse;

/** A plan row as the API accepts it. `id` keeps an existing qist (and its history). */
export interface PlanRowInput {
  id?: number | null;
  label?: string;
  amount: number;
  dueDate: string;
}
export interface ScheduleConfirm {
  pastDue?: boolean;
  afterEvent?: boolean;
}

// WW-SETTLEMENT — the final bill (GET /:id/settlement, read-only preview).
// Two shapes on `settleable`: a per-head booking returns the full quote; a flat
// booking returns `{ settleable:false, reason }`. See bookingSettlementService.
export interface SettlementLine {
  label: string;
  heads: number;
  rate: number;
  amount: number;
  why?: string;
}

export interface SettlementBalance {
  quotedTotal: number;
  baselineFood: number;
  settledFood: number;
  variance: number;
  settledTotal: number;
  alreadyPaid: number;
  outstanding: number;
  source: "installments" | "transactions" | "none" | "unavailable";
}

export interface SettlementPreview {
  settleable: boolean;
  reason?: string;
  bookingId: number;
  locked?: boolean;
  lockedAt?: string | null;
  settled?: boolean;
  settledAt?: string | null;
  rate?: number;
  rateLabel?: string | null;
  mode?: "per_head" | "excess_only" | "none";
  guaranteed?: number;
  statedTotal?: number;
  totalAmount?: number;
  heads?: { billableHeads: number; staff?: number; [k: string]: unknown };
  bill?: {
    guaranteed: number;
    actual: number;
    billedHeads?: number;
    normalRate?: number;
    walkInRate?: number;
    food: number;
    lines?: SettlementLine[];
  };
  staffMeals?: { count: number; rate: number; amount: number } | null;
  crewMeals?: { count: number; rate: number; amount: number } | null;
  foodTotal?: number;
  balance?: SettlementBalance;
  cashSettlement?: {
    totalPkr: number;
    handovers: { at: string; amountPkr: number; reference?: string | null }[];
  };
  amended?: boolean;
  amendments?: { supersededAt: string; billedFood?: number; statedTotal?: number }[];
  terms?: string | null;
}

// WW-DEPOSIT A17/A18 — security deposit + damage claims against it.
// GET /:id/deposit (both parties); vendor-only writes. Arithmetic lives in
// backend utils/depositLedger.js — the client only renders the position.
export type DamageClaimStatus = "open" | "accepted" | "disputed" | "settled" | "withdrawn";
export interface DamageClaimLine {
  id: number;
  description: string;
  amountPkr: number;
  status: DamageClaimStatus;
  deductedFromDepositPkr: number | null;
  photos: number;
}
export interface DepositPosition {
  bookingId: number;
  deposit: number;                 // securityDepositPkr held
  status: string | null;           // pending / held / returned / partially_returned…
  claimed: number;                 // asked across live claims
  settledClaimTotal: number;
  deducted: number;                // actually taken from the deposit
  returnable: number;              // deposit − deducted
  shortfall: number;               // settled claims beyond the deposit (a real debt)
  openClaims: number;
  disputedClaims: number;
  lines: DamageClaimLine[];
  viewerIsVendor: boolean;
  viewerIsCustomer: boolean;
  returnedAt?: string | null;
}

// BK-054 + BK-055 + BK-056 — mid-booking change requests.
export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "declined"
  | "cancelled"
  | "expired";

export type ChangeRequestType =
  | "guest_count"
  | "slot_swap"
  | "package_change"
  | "add_extras"
  | "custom"
  /**
   * WW-QIST — the couple proposes a payment schedule for what is still
   * outstanding, and the vendor answers it in the same queue as every other
   * request. `diff.to.installments` carries `{ label, amount, dueAt }` rows;
   * `diff.to.override` is the vendor-agreed escape from the "nothing due inside
   * 7 days of the event" rule. At most three, and they must add up to the
   * outstanding amount exactly.
   */
  | "installment_plan"
  /**
   * WW-CANCELWINDOW — a customer asking to cancel from inside the venue's
   * notice period, where they cannot cancel themselves.
   *
   * It rides on the change-request table so it lands in the vendor's existing
   * queue, but it is decided through its own endpoints: every other type
   * reprices the booking's lines, this one ends the booking, and approving it
   * runs the vendor-cancellation path so the money comes back in full.
   */
  | "cancel_request";

export interface BookingChangeRequest {
  id: number;
  bookingId: number;
  changeType: ChangeRequestType;
  proposedByRole: "customer" | "vendor" | "admin";
  proposedByUserId: number | null;
  diffJson: Record<string, unknown>;
  priceImpactJson: {
    oldTotal?: number;
    newTotal?: number;
    diff?: number;
    requiresTopUp?: boolean;
    refundAmountIfApproved?: number;
  } | null;
  status: ChangeRequestStatus;
  reason: string | null;
  decisionNotes: string | null;
  decidedByUserId: number | null;
  decidedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  // BK-054-TOPUP — Stripe PI for customer top-up + the moment funds cleared.
  // Both null until the customer hits "Pay top-up" (#155).
  topUpPaymentIntentId?: string | null;
  topUpPaidAt?: string | null;
}

// BK-067 — booking dispute (post-completion refund flow).
export interface BookingDispute {
  id: number;
  bookingId: number;
  openedByUserId: number | null;
  openedByRole: "customer" | "vendor" | "admin";
  reason: string;
  evidenceJson: unknown;
  status:
    | "open"
    | "resolved_refund"
    | "resolved_release"
    | "resolved_dismissed"
    | "resolved_forfeit";
  resolutionNotes: string | null;
  resolvedByUserId: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

// BK-038 — reschedule result (backend `rescheduleService.reschedule`).
export interface RescheduleResult {
  ok: true;
  before: {
    bookingDate?: string;
    bookingTime?: string;
    totalAmount?: number | string;
    guestCount?: number;
  };
  after: {
    bookingDate: string;
    bookingTime: string;
    totalAmount: number | string;
    downPayment: number | string;
    guestCount: number;
  };
  diff: number;
  totalRefunded: number;
  refundResults?: unknown[];
}

// EPIC 5 · §3 — refund request (persisted by refundRequestService).
export type RefundReason =
  | "customer_cancel"
  | "vendor_cancel"
  | "force_majeure"
  | "dispute_resolution";

export interface RefundRequest {
  id: number;
  bookingId: number;
  businessId: number | null;
  reason: RefundReason | string;
  status: "pending" | "approved" | "declined" | "applied" | string;
  refundAmount?: number | string | null;
  createdAt?: string;
  [key: string]: unknown;
}

export class BookingAPI {
  // BK-042 — read down_payment + remaining installment schedule
  static async getInstallments(
    bookingId: number,
  ): Promise<InstallmentsResponse> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/installments`);
    return res.data?.data;
  }

  // WW-QIST-SCHEDULE — the same call, named for what it now returns: money + qists
  // + payments + presets in ONE round trip.
  static async getSchedule(bookingId: number): Promise<BookingSchedule> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/installments`);
    return res.data?.data;
  }

  // Vendor replaces the owing part of the plan. `confirm` answers the server's
  // 422 "needs confirmation" for a past / after-event due date.
  static async putPlan(bookingId: number, rows: PlanRowInput[], confirm?: ScheduleConfirm): Promise<BookingSchedule> {
    const res = await axiosInstance.put(`${v1}/${bookingId}/installments/plan`, { rows, confirm });
    return res.data?.data;
  }

  static async editQist(
    bookingId: number,
    installmentId: number,
    body: { label?: string; dueDate?: string; amount?: number; balanceInto?: number; confirm?: ScheduleConfirm },
  ): Promise<BookingSchedule> {
    const res = await axiosInstance.patch(`${v1}/${bookingId}/installments/${installmentId}`, body);
    return res.data?.data;
  }

  static async splitQist(
    bookingId: number,
    installmentId: number,
    body: { amount: number; dueDate: string; label?: string; confirm?: ScheduleConfirm },
  ): Promise<BookingSchedule> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/installments/${installmentId}/split`, body);
    return res.data?.data;
  }

  static async removeQist(bookingId: number, installmentId: number, balanceInto?: number): Promise<BookingSchedule> {
    const res = await axiosInstance.delete(`${v1}/${bookingId}/installments/${installmentId}`, { data: { balanceInto } });
    return res.data?.data;
  }

  static async waiveQist(bookingId: number, installmentId: number, reason: string): Promise<BookingSchedule> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/installments/${installmentId}/waive`, { reason });
    return res.data?.data;
  }

  // WhatsApp returns the text + wa.me link for the vendor to send; in_app notifies the customer.
  static async remindQist(
    bookingId: number,
    installmentId: number,
    channel: "whatsapp" | "in_app",
  ): Promise<{ channel: string; text: string; lastRemindedAt: string; whatsapp: { phone: string; url: string } | null }> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/installments/${installmentId}/remind`, { channel });
    return res.data?.data;
  }

  // WW-SETTLEMENT — read the final bill (or the "not settled on headcount"
  // reason). Read-only; safe to show at any time. Optional `counts` lets the
  // vendor model "what if N turn up?" before committing (server query params).
  static async getSettlement(
    bookingId: number,
    counts?: { total?: number; kidsUnder5?: number; kids5to12?: number; staff?: number; crew?: number },
  ): Promise<SettlementPreview> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/settlement`, {
      params: counts && counts.total != null ? counts : undefined,
    });
    return res.data?.data;
  }

  // WW-DEPOSIT — the security-deposit position (held / deducted / returnable +
  // damage claims). Readable by both parties.
  static async getDeposit(bookingId: number): Promise<DepositPosition> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/deposit`);
    return res.data?.data;
  }

  // Hand the returnable balance back to the customer. Refuses if claims are open.
  static async returnDeposit(bookingId: number, note?: string): Promise<DepositPosition> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/deposit/return`, { note });
    return res.data?.data;
  }

  // Vendor raises a damage claim against the deposit (event must have happened).
  static async raiseDamageClaim(
    bookingId: number,
    body: { description: string; amountPkr: number; photos?: string[] },
  ): Promise<unknown> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/damage-claims`, body);
    return res.data?.data;
  }

  // Settle a claim — the only move that takes money from the deposit. `deductPkr`
  // omitted = take the full claim amount (capped at the returnable balance).
  static async settleDamageClaim(
    bookingId: number,
    claimId: number,
    body: { deductPkr?: number; note?: string } = {},
  ): Promise<unknown> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/damage-claims/${claimId}/settle`, body);
    return res.data?.data;
  }

  static async withdrawDamageClaim(bookingId: number, claimId: number): Promise<unknown> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/damage-claims/${claimId}/withdraw`, {});
    return res.data?.data;
  }

  // WW-SETTLEMENT — record the count from the night and FREEZE the final bill.
  // Vendor-only; server re-prices on the per-head rate the booking was sold on.
  // Re-settling overwrites the snapshot but keeps an amendment trail (both parties
  // can see the number moved). Returns the struck preview.
  static async settle(
    bookingId: number,
    body: { total: number; kidsUnder5?: number; kids5to12?: number; staff?: number; crew?: number; note?: string },
  ): Promise<SettlementPreview> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/settle`, body);
    return res.data?.data;
  }

  // WW-SETTLEMENT — freeze the guarantee before the night (optional). Returns the
  // updated preview.
  static async lockHeadcount(
    bookingId: number,
    body: { guaranteed?: number } = {},
  ): Promise<SettlementPreview> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/headcount-lock`, body);
    return res.data?.data;
  }

  // WW-SETTLEMENT — the balance handed over in cash on the night, against the
  // struck bill. Omit `amountPkr` to settle the whole outstanding balance.
  static async confirmCashSettlement(
    bookingId: number,
    body: { amountPkr?: number; reference?: string; note?: string } = {},
  ): Promise<SettlementPreview> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/settlement/confirm-cash`, body);
    return res.data?.data;
  }

  // Phase-2 EPIC 8 · 8.2 — log a manual wa.me reminder against a booking.
  // Flag-gated (WHATSAPP_TIER1_ENABLED): a 404 here means the engine is off for
  // this vendor — callers treat it as best-effort and do not surface an error.
  static async logReminder(
    bookingId: number,
    body: { trigger?: string; channel?: string; body?: string },
  ): Promise<unknown> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/reminders/log`, body);
    return res.data?.data;
  }

  // BK-054 — list change requests for this booking
  static async getChangeRequests(
    bookingId: number,
  ): Promise<{ requests: BookingChangeRequest[] }> {
    const res = await axiosInstance.get(
      `${v1}/${bookingId}/change-requests`,
    );
    return res.data?.data;
  }

  // BK-054 — propose a change. `diff` shape varies by changeType.
  static async createChangeRequest(
    bookingId: number,
    body: {
      changeType: ChangeRequestType;
      diff: Record<string, unknown>;
      reason?: string;
    },
  ): Promise<{ request: BookingChangeRequest; priceImpact: unknown }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/change-requests`,
      body,
    );
    return res.data?.data;
  }

  static async approveChangeRequest(
    bookingId: number,
    requestId: number,
    decisionNotes?: string,
  ) {
    const res = await axiosInstance.patch(
      `${v1}/${bookingId}/change-requests/${requestId}/approve`,
      { decisionNotes },
    );
    return res.data?.data;
  }

  static async declineChangeRequest(
    bookingId: number,
    requestId: number,
    decisionNotes?: string,
  ) {
    const res = await axiosInstance.patch(
      `${v1}/${bookingId}/change-requests/${requestId}/decline`,
      { decisionNotes },
    );
    return res.data?.data;
  }

  /**
   * WW-CANCELWINDOW — answer a customer's cancellation request.
   *
   * Separate from approve/decline above because approving CANCELS the booking:
   * it runs the same vendor-cancellation service the venue's own cancel button
   * uses, returning the customer's money in full and recording the obligation.
   * The generic approve endpoint refuses this type outright.
   */
  static async decideCancellationRequest(
    bookingId: number,
    requestId: number,
    approve: boolean,
    note?: string,
  ) {
    const res = await axiosInstance.patch(
      `${v1}/${bookingId}/cancellation-request/${requestId}`,
      { approve, note },
    );
    return res.data?.data;
  }

  static async cancelChangeRequest(bookingId: number, requestId: number) {
    const res = await axiosInstance.delete(
      `${v1}/${bookingId}/change-requests/${requestId}`,
    );
    return res.data?.data;
  }

  // BK-054 top-up — Customer kicks a Stripe PaymentIntent to pay the
  // positive diff on a pending change request. Webhook auto-applies the
  // change on `payment_intent.succeeded`.
  static async initiateTopUp(
    bookingId: number,
    requestId: number,
  ): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    reused?: boolean;
  }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/change-requests/${requestId}/initiate-topup`,
    );
    return res.data?.data;
  }

  // BK-067 — open + read dispute
  /**
   * `noShowWindowDays` rides along on BOTH the 200 and the 404 — "no dispute
   * on this booking" is the normal pre-filing state, and it is exactly when a
   * vendor needs to know how long they have to report a no-show. Read it off
   * the error payload in that case (`err.response.data.data`).
   */
  static async getDispute(
    bookingId: number,
  ): Promise<{ dispute: BookingDispute | null; noShowWindowDays?: number }> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/dispute`);
    return res.data?.data;
  }

  static async openDispute(
    bookingId: number,
    body: { reason: string; evidence?: unknown },
  ): Promise<{ dispute: BookingDispute; frozenPayoutCount: number }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/dispute`,
      body,
    );
    return res.data?.data;
  }

  // BK-100.9 — Postpone-without-cancel. Pakistani Islamic mourning
  // custom: after death in immediate family, weddings are postponed
  // 3-40 days. This is a third primitive distinct from cancel
  // (applies refund policy, forfeits deposit) and reschedule (needs
  // immediate new date). Sets postponedAt + postponedUntilAt + reason;
  // deposit stays alive; vendor is notified.
  //
  // Backend gates:
  //   - reason ≥ 15 chars
  //   - mourningWindowDays clamped to [3, 90]; default 40
  //   - booking.status ∈ {Pending, Awaiting Payment, Confirmed}
  //   - bookingDate must still be in the future (Asia/Karachi)
  //   - cannot re-postpone an already-postponed booking
  //   - customer-by-email/phone/userId OR admin only
  static async postpone(
    bookingId: number,
    body: { reason: string; mourningWindowDays?: number },
  ): Promise<{
    booking: {
      id: number;
      postponedAt: string;
      postponedUntilAt: string;
      postponeReason: string;
      status: string;
    };
    mourningWindowDays: number;
  }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/postpone`,
      body,
    );
    return res.data?.data;
  }

  // BK-100.4 / BK-039 — vendor reports a customer no-show after the
  // event date. Re-uses BookingDispute storage but openedByRole='vendor'.
  // Backend enforces:
  //   - caller must be in booking.vendorIds (403 otherwise)
  //   - booking.status in {Confirmed, Completed}
  //   - event date must already have passed
  //   - no-show reporting window not expired (default 7d post-event)
  //   - reason >= ~15 chars
  //   - max one no-show per booking
  static async openNoShowReport(
    bookingId: number,
    body: { reason: string; evidence?: unknown },
  ): Promise<{ dispute: BookingDispute }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/no-show`,
      body,
    );
    return res.data?.data;
  }

  // BK-081 — booking status transition history
  static async getHistory(bookingId: number) {
    const res = await axiosInstance.get(`${v1}/${bookingId}/history`);
    return res.data?.data;
  }


  // Single-booking fetch reused on the dedicated detail page. The
  // backend already exposes /:id/with-availability for the public flow;
  // we piggyback on it here to avoid adding a new endpoint.
  static async getWithAvailability(
    bookingId: number,
  ): Promise<BookingWithAvailabilityResponse | null> {
    const res = await axiosInstance.get(
      `${v1}/${bookingId}/with-availability`,
    );
    return res.data?.data ?? null;
  }

  // BK-038 — Customer-initiated reschedule (set a new event date/time).
  // Authz: customer-by-email or admin (no feature flag). Money paths:
  //   new total == old  → just moves the date
  //   new total <  old  → partial Stripe refund of the diff
  //   new total >  old  → 422 `requires_top_up` (rejected; needs a top-up)
  // Slot clashes → 409 `slot_unavailable` / `SLOT_CONFLICT`. The dialog maps
  // each structured code to friendly copy.
  static async reschedule(
    bookingId: number,
    body: { newBookingDate: string; newBookingTime?: string },
  ): Promise<RescheduleResult> {
    const res = await axiosInstance.post(`${v1}/${bookingId}/reschedule`, body);
    return res.data?.data;
  }

  // EPIC 5 · §3 — raise a refund request against a booking.
  // POST /:id/refund-requests. NOTE: this endpoint is currently
  // vendor/admin-scoped (loadOwnedBooking requires the caller in
  // booking.vendorIds; the cancellation policy resolves from the vendor's
  // business), so a customer caller gets 403/404 today. The customer UI is
  // flag-gated OFF (see lib/customer-refund-request-flag.ts) and degrades
  // gracefully until the backend authz is extended.
  static async raiseRefundRequest(
    bookingId: number,
    body?: {
      reason?: RefundReason;
      securityDeposit?: number;
      damages?: number;
    },
  ): Promise<{ request: RefundRequest }> {
    const res = await axiosInstance.post(
      `${v1}/${bookingId}/refund-requests`,
      body ?? {},
    );
    return res.data?.data;
  }

  // EPIC 5 · §3 — list this booking's refund requests (same vendor/admin gate).
  static async listRefundRequests(
    bookingId: number,
  ): Promise<{ bookingId: number; requests: RefundRequest[] }> {
    const res = await axiosInstance.get(`${v1}/${bookingId}/refund-requests`);
    return res.data?.data;
  }
}
