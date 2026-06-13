/**
 * Vendor Portal Phase 1 #7.4 — Post-Dated Cheque (PDC) ledger API.
 *
 * Mirrors the backend at /api/v1/pdcs. Vendor-scoped reads/writes;
 * super-admin bypass handled server-side. Every status write routes
 * through the dedicated /transition endpoint so the lifecycle stays
 * enforced server-side (held → deposited → cleared / bounced; any
 * non-terminal → cancelled).
 */

import axiosInstance from "@/lib/axiosConfig";

export type PdcStatus =
  | "held"
  | "deposited"
  | "cleared"
  | "bounced"
  | "cancelled";

export interface PdcCustomerInfo {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export interface PdcBookingInfo {
  id: number;
  bookingDate: string | null;
  customerName: string | null;
  totalAmount: number | string | null;
}

export interface PostDatedCheque {
  id: number;
  chequeNumber: string;
  bankName: string;
  branchCode: string | null;
  /** Postgres DECIMAL — Sequelize returns it as string sometimes. */
  amount: number | string;
  chequeDate: string; // YYYY-MM-DD
  depositDate: string | null;
  status: PdcStatus;
  bounceReason: string | null;
  customerUserId: number;
  bookingId: number | null;
  createdByUserId: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: PdcCustomerInfo | null;
  booking?: PdcBookingInfo | null;
}

export interface PdcSummary {
  total: number;
  byStatus: Partial<Record<PdcStatus, number>>;
}

export interface PdcListResponse {
  pdcs: PostDatedCheque[];
  summary: PdcSummary;
}

export interface CreatePdcInput {
  chequeNumber: string;
  bankName: string;
  branchCode?: string;
  amount: number;
  chequeDate: string;
  // Issue #41 — derived from booking on the BE when omitted.
  customerUserId?: number;
  bookingId?: number | null;
  notes?: string;
}

export interface UpdatePdcInput {
  chequeNumber?: string;
  bankName?: string;
  branchCode?: string | null;
  amount?: number;
  chequeDate?: string;
  bookingId?: number | null;
  notes?: string | null;
}

export interface TransitionPdcInput {
  to: PdcStatus;
  /** Required when to === 'deposited'. */
  depositDate?: string;
  /** Required when to === 'bounced'. */
  bounceReason?: string;
}

export interface PdcListFilters {
  customerUserId?: number;
  bookingId?: number;
  status?: PdcStatus;
  /** Cheque-date window (inclusive). */
  dueFrom?: string;
  dueTo?: string;
}

export class PdcAPI {
  /** GET /api/v1/pdcs */
  static async list(filters: PdcListFilters = {}): Promise<PdcListResponse> {
    const res = await axiosInstance.get(`/api/v1/pdcs`, { params: filters });
    return (
      res.data?.data ??
      ({ pdcs: [], summary: { total: 0, byStatus: {} } } as PdcListResponse)
    );
  }

  /** GET /api/v1/pdcs/:id */
  static async get(id: number): Promise<PostDatedCheque | null> {
    const res = await axiosInstance.get(`/api/v1/pdcs/${id}`);
    return res.data?.data?.pdc ?? null;
  }

  /** POST /api/v1/pdcs */
  static async create(body: CreatePdcInput): Promise<PostDatedCheque> {
    const res = await axiosInstance.post(`/api/v1/pdcs`, body);
    return res.data?.data?.pdc;
  }

  /** PATCH /api/v1/pdcs/:id — content edits only (not status). */
  static async update(id: number, body: UpdatePdcInput): Promise<PostDatedCheque> {
    const res = await axiosInstance.patch(`/api/v1/pdcs/${id}`, body);
    return res.data?.data?.pdc;
  }

  /** POST /api/v1/pdcs/:id/transition — status writes go here. */
  static async transition(id: number, body: TransitionPdcInput): Promise<PostDatedCheque> {
    const res = await axiosInstance.post(`/api/v1/pdcs/${id}/transition`, body);
    return res.data?.data?.pdc;
  }

  /** DELETE /api/v1/pdcs/:id — soft delete. */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/pdcs/${id}`);
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const PDC_STATUS_LABELS: Record<PdcStatus, string> = {
  held: "Held",
  deposited: "Deposited (awaiting clearance)",
  cleared: "Cleared",
  bounced: "Bounced",
  cancelled: "Cancelled",
};

export const PDC_STATUS_TONES: Record<PdcStatus, { bg: string; text: string; border: string }> = {
  held: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  deposited: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  cleared: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  bounced: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
  cancelled: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
};
