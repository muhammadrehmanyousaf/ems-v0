/**
 * Vendor Portal Phase 2 #8.8 — Broker commission ledger API.
 *
 * Mirrors backend at /api/v1/brokers. Brokers = the directory;
 * BrokerCommissions = the per-event ledger with embedded payment
 * tracking via amountPaid + auto-transition to 'paid' on full
 * settlement.
 */

import axiosInstance from "@/lib/axiosConfig";

export type BrokerType =
  | "rishta"
  | "hall_broker"
  | "wedding_planner"
  | "hotel_concierge"
  | "decor_referral"
  | "photographer_referral"
  | "caterer_referral"
  | "transport_referral"
  | "social_influencer"
  | "other";

export type CommissionType = "percentage" | "flat";

export type CommissionStatus =
  | "pending"
  | "partially_paid"
  | "paid"
  | "disputed"
  | "void"
  | "overdue";

export type CommissionPaymentMethod =
  | "cash"
  | "jazzcash"
  | "easypaisa"
  | "raast"
  | "ibft"
  | "bank_transfer"
  | "sadapay"
  | "nayapay"
  | "cheque"
  | "other";

export interface BrokerBusinessInfo {
  id: number;
  name: string | null;
}

export interface Broker {
  id: number;
  businessId: number;
  createdByUserId: number;
  name: string;
  brokerType: BrokerType;
  agencyName: string | null;
  contactPerson: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  ntn: string | null;
  cnic: string | null;
  defaultCommissionPct: number | string | null;
  defaultCommissionFlat: number | string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  jazzcashNumber: string | null;
  easypaisaNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  business?: BrokerBusinessInfo | null;
  commissions?: BrokerCommission[];
}

export interface BrokerCommission {
  id: number;
  brokerId: number | null;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  brokerNameSnapshot: string;
  brokerTypeSnapshot: BrokerType | null;
  bookingAmountSnapshot: number | string | null;
  commissionType: CommissionType;
  commissionPct: number | string | null;
  commissionFlat: number | string | null;
  commissionAmount: number | string;
  amountPaid: number | string;
  description: string | null;
  status: CommissionStatus;
  statusReason: string | null;
  accruedDate: string;
  dueDate: string | null;
  lastPaymentAt: string | null;
  lastPaymentVia: CommissionPaymentMethod | null;
  lastPaymentRef: string | null;
  fullyPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  broker?: {
    id: number;
    name: string;
    brokerType: BrokerType;
    phoneNumber?: string | null;
    isActive?: boolean;
  } | null;
  booking?: {
    id: number;
    bookingDate: string | null;
    status: string | null;
    totalAmount?: number | string | null;
  } | null;
}

export interface BrokerSummary {
  byType: Partial<Record<BrokerType, number>>;
  activeCount: number;
  inactiveCount: number;
}

export interface CommissionSummary {
  byStatus: Partial<Record<CommissionStatus, number>>;
  totalCommission: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface OutstandingBrokerRow {
  brokerId: number | null;
  brokerName: string;
  brokerType: BrokerType | null;
  outstanding: number;
  commissionCount: number;
  overdueCount: number;
}

export interface OutstandingSummary {
  perBroker: OutstandingBrokerRow[];
  grandTotal: number;
}

export interface CreateBrokerInput {
  businessId: number;
  name: string;
  brokerType?: BrokerType;
  agencyName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  address?: string;
  ntn?: string;
  cnic?: string;
  defaultCommissionPct?: number;
  defaultCommissionFlat?: number;
  bankName?: string;
  bankAccountNumber?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateBrokerInput extends Partial<CreateBrokerInput> {}

export interface CreateCommissionInput {
  businessId: number;
  brokerId?: number;
  bookingId?: number;
  brokerNameSnapshot?: string;
  brokerTypeSnapshot?: BrokerType;
  accruedDate: string;
  dueDate?: string;
  commissionType: CommissionType;
  commissionPct?: number;
  commissionFlat?: number;
  bookingAmountSnapshot?: number;
  description?: string;
}

export interface UpdateCommissionInput {
  accruedDate?: string;
  dueDate?: string | null;
  commissionType?: CommissionType;
  commissionPct?: number;
  commissionFlat?: number;
  bookingAmountSnapshot?: number;
  description?: string | null;
}

export interface RecordCommissionPaymentInput {
  amount: number;
  method: CommissionPaymentMethod;
  ref?: string;
  paymentDate?: string;
}

export interface TransitionCommissionInput {
  to: CommissionStatus;
  statusReason?: string;
}

export class BrokerAPI {
  static async list(filters: {
    brokerType?: BrokerType;
    isActive?: boolean;
    businessId?: number;
    search?: string;
  } = {}): Promise<{ brokers: Broker[]; summary: BrokerSummary }> {
    const params: Record<string, any> = { ...filters };
    if (typeof filters.isActive === "boolean") {
      params.isActive = filters.isActive ? "true" : "false";
    }
    const res = await axiosInstance.get(`/api/v1/brokers`, { params });
    return (
      res.data?.data ?? {
        brokers: [],
        summary: { byType: {}, activeCount: 0, inactiveCount: 0 },
      }
    );
  }

  static async get(
    id: number,
  ): Promise<{ broker: Broker; outstanding: number } | null> {
    const res = await axiosInstance.get(`/api/v1/brokers/${id}`);
    return res.data?.data ?? null;
  }

  static async create(body: CreateBrokerInput): Promise<Broker> {
    const res = await axiosInstance.post(`/api/v1/brokers`, body);
    return res.data?.data?.broker;
  }

  static async update(id: number, body: UpdateBrokerInput): Promise<Broker> {
    const res = await axiosInstance.patch(`/api/v1/brokers/${id}`, body);
    return res.data?.data?.broker;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/brokers/${id}`);
  }

  static async listCommissions(filters: {
    brokerId?: number;
    bookingId?: number;
    businessId?: number;
    status?: CommissionStatus;
    from?: string;
    to?: string;
  } = {}): Promise<{
    commissions: BrokerCommission[];
    summary: CommissionSummary;
  }> {
    const res = await axiosInstance.get(`/api/v1/brokers/commissions`, {
      params: filters,
    });
    return (
      res.data?.data ?? {
        commissions: [],
        summary: {
          byStatus: {},
          totalCommission: 0,
          totalPaid: 0,
          totalOutstanding: 0,
        },
      }
    );
  }

  static async getCommission(id: number): Promise<BrokerCommission | null> {
    const res = await axiosInstance.get(`/api/v1/brokers/commissions/${id}`);
    return res.data?.data?.commission ?? null;
  }

  static async createCommission(
    body: CreateCommissionInput,
  ): Promise<BrokerCommission> {
    const res = await axiosInstance.post(`/api/v1/brokers/commissions`, body);
    return res.data?.data?.commission;
  }

  static async updateCommission(
    id: number,
    body: UpdateCommissionInput,
  ): Promise<BrokerCommission> {
    const res = await axiosInstance.patch(
      `/api/v1/brokers/commissions/${id}`,
      body,
    );
    return res.data?.data?.commission;
  }

  static async recordPayment(
    id: number,
    body: RecordCommissionPaymentInput,
  ): Promise<{
    commission: BrokerCommission;
    payment: { amount: number; method: string; ref: string | null };
    result: {
      newAmountPaid: number;
      newAmountOutstanding: number;
      newStatus: CommissionStatus;
      autoTransitioned: boolean;
    };
  }> {
    const res = await axiosInstance.post(
      `/api/v1/brokers/commissions/${id}/payment`,
      body,
    );
    return res.data?.data;
  }

  static async transitionCommission(
    id: number,
    body: TransitionCommissionInput,
  ): Promise<BrokerCommission> {
    const res = await axiosInstance.post(
      `/api/v1/brokers/commissions/${id}/transition`,
      body,
    );
    return res.data?.data?.commission;
  }

  static async removeCommission(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/brokers/commissions/${id}`);
  }

  static async outstandingSummary(filters: {
    businessId?: number;
  } = {}): Promise<OutstandingSummary> {
    const res = await axiosInstance.get(
      `/api/v1/brokers/commissions/outstanding-summary`,
      { params: filters },
    );
    return res.data?.data ?? { perBroker: [], grandTotal: 0 };
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const BROKER_TYPE_LABELS: Record<BrokerType, string> = {
  rishta: "Rishta broker / matchmaker",
  hall_broker: "Hall / banquet broker",
  wedding_planner: "Wedding planner",
  hotel_concierge: "Hotel concierge",
  decor_referral: "Decor referral",
  photographer_referral: "Photographer referral",
  caterer_referral: "Caterer referral",
  transport_referral: "Transport referral",
  social_influencer: "Social influencer",
  other: "Other",
};

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  disputed: "Disputed",
  void: "Voided",
  overdue: "Overdue",
};

export const COMMISSION_PAYMENT_METHOD_LABELS: Record<
  CommissionPaymentMethod,
  string
> = {
  cash: "Cash",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "IBFT",
  bank_transfer: "Bank transfer",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
  cheque: "Cheque",
  other: "Other",
};

export const COMMISSION_STATUS_TONES: Record<
  CommissionStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  partially_paid: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  disputed: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
  void: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
  overdue: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
};
