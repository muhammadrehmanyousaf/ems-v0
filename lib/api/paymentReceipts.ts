/**
 * Vendor Portal Phase 1 #7.5 — Payment Receipt API client.
 *
 * Mirrors the backend at /api/v1/receipts. Same vendor-scoped authz
 * as the PDC ledger — vendor sees only receipts they created;
 * super-admin sees everything. Pakistani method coverage: cash +
 * JazzCash + Easypaisa + Raast + IBFT + bank_transfer + other.
 */

import axiosInstance from "@/lib/axiosConfig";
import { idempotencyConfig, type IdempotencyOptions } from "@/lib/utils/idempotency";

export type ReceiptMethod =
  | "cash"
  | "jazzcash"
  | "easypaisa"
  | "raast"
  | "ibft"
  | "bank_transfer"
  | "other";

export interface ReceiptCustomerInfo {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface ReceiptBookingInfo {
  id: number;
  bookingDate: string | null;
  customerName: string | null;
  totalAmount: number | string | null;
}

export interface PaymentReceipt {
  id: number;
  method: ReceiptMethod;
  amount: number | string;
  receivedDate: string; // YYYY-MM-DD
  transactionRef: string | null;
  photoUrl: string | null;
  notes: string | null;
  // WW-CUID — null for a walk-in (offline) booking, which has no registered
  // User behind it. Fall back to `booking.customerName` for display.
  customerUserId: number | null;
  bookingId: number | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  customer?: ReceiptCustomerInfo | null;
  booking?: ReceiptBookingInfo | null;
}

export interface ReceiptSummary {
  /** Net money in over the whole filtered ledger (cash in minus refunds). */
  total: number;
  byMethod: Partial<Record<ReceiptMethod, number>>;
  /** Rows matching the filter (whole ledger, not the page). */
  count?: number;
  /**
   * WP08 / Q15 — stated by the server, so no screen has to sum rows (a page would
   * silently truncate that sum). Cash in = positive rows, refunds = negative rows
   * by sign (never by note text), net = grossIn - refunds (= total). Absent on a
   * server that predates WP08; callers fall back to their own row arithmetic.
   */
  grossIn?: number;
  refunds?: number;
  net?: number;
  inCount?: number;
  refundCount?: number;
}

export interface ReceiptListResponse {
  /** This page. Equals the whole ledger when no `limit` was requested. */
  receipts: PaymentReceipt[];
  /** WWL-157 — computed in SQL over the WHOLE filtered set, never over the page. */
  summary: ReceiptSummary;
  /** Rows matching the filter across the whole ledger. */
  total?: number;
  limit?: number | null;
  offset?: number;
}

export interface CreateReceiptInput {
  method: ReceiptMethod;
  amount: number;
  receivedDate: string;
  transactionRef?: string;
  photoUrl?: string;
  notes?: string;
  // Issue #41 — optional on the FE. When bookingId is supplied the BE
  // derives customerUserId from the booking. At least one of the two
  // must be present (BE enforces; FE schema enforces).
  customerUserId?: number;
  bookingId?: number | null;
  // WW-QIST-SCHEDULE — pay a specific qist of the booking. Omit = oldest owing qist first.
  installmentId?: number | null;
  /**
   * PAY-UI_VENDOR-003 — the outstanding amount the vendor was SHOWN when the
   * drawer opened. A server that checks it (WP02) refuses a second device whose
   * drawer is stale with 409 instead of booking an overpayment; a server that
   * does not know the field ignores it (the receipt validator picks the fields
   * it reads and drops the rest).
   */
  expectedOutstanding?: number;
}

export type UpdateReceiptInput = Partial<
  Omit<CreateReceiptInput, "customerUserId">
>;

export interface ReceiptListFilters {
  customerUserId?: number;
  bookingId?: number;
  /** Per-venue scope — the backend attributes receipts to a business via their
   * booking's BookingDetails (receipts have no businessId column of their own). */
  businessId?: number;
  method?: ReceiptMethod;
  from?: string;
  to?: string;
  /**
   * WWL-157 — opt-in paging. Omit it and the whole ledger comes back, which is
   * what callers that match receipts to bookings client-side rely on. Capped
   * server-side at 500.
   */
  limit?: number;
  offset?: number;
}

export class ReceiptsAPI {
  static async list(filters: ReceiptListFilters = {}): Promise<ReceiptListResponse> {
    const res = await axiosInstance.get(`/api/v1/receipts`, { params: filters });
    return (
      res.data?.data ?? ({ receipts: [], summary: { total: 0, byMethod: {} } } as ReceiptListResponse)
    );
  }

  static async get(id: number): Promise<PaymentReceipt | null> {
    const res = await axiosInstance.get(`/api/v1/receipts/${id}`);
    return res.data?.data?.receipt ?? null;
  }

  /**
   * `opts.idempotencyKey` is sent as the Idempotency-Key header: one per drawer
   * open, reused when the same submit is retried (PAY-UI_VENDOR-002).
   */
  static async create(body: CreateReceiptInput, opts?: IdempotencyOptions): Promise<PaymentReceipt> {
    const res = await axiosInstance.post(`/api/v1/receipts`, body, idempotencyConfig(opts?.idempotencyKey));
    return res.data?.data?.receipt;
  }

  static async update(id: number, body: UpdateReceiptInput, opts?: IdempotencyOptions): Promise<PaymentReceipt> {
    const res = await axiosInstance.patch(`/api/v1/receipts/${id}`, body, idempotencyConfig(opts?.idempotencyKey));
    return res.data?.data?.receipt;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/receipts/${id}`);
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const RECEIPT_METHOD_LABELS: Record<ReceiptMethod, string> = {
  cash: "Cash",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "Bank IBFT",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export const RECEIPT_METHOD_TONES: Record<ReceiptMethod, { bg: string; text: string; border: string }> = {
  cash: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  jazzcash: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  easypaisa: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  raast: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
  ibft: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  bank_transfer: { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-300" },
  other: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300" },
};

/** Methods that need a transactionRef on the form. */
export const RECEIPT_METHODS_NEEDING_REF: ReceiptMethod[] = [
  "jazzcash",
  "easypaisa",
  "raast",
  "ibft",
  "bank_transfer",
];
