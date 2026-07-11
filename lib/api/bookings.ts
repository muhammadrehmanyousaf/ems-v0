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

// BK-042 — installments schedule. Backend returns `{ installments, totals }`.
export interface BookingInstallment {
  id: number;
  sequence: number;
  label: string; // 'down_payment' | 'remaining' | custom
  amount: number;
  amountPaid: number;
  dueAt: string; // ISO
  status: "pending" | "paid" | "partial" | "waived" | "overdue";
  paidAt: string | null;
  paymentTransactionId: number | null;
}

export interface InstallmentsResponse {
  installments: BookingInstallment[];
  totals: { scheduled: number; paid: number; outstanding: number };
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
  | "custom";

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
  static async getDispute(
    bookingId: number,
  ): Promise<{ dispute: BookingDispute | null }> {
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
