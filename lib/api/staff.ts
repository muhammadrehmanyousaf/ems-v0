/**
 * Vendor Portal Phase 2 #8.2 — Staff rota + payroll API.
 *
 * Mirrors backend at /api/v1/staff. Members are the vendor's roster
 * (who CAN be hired); Shifts are the append-only payroll ledger.
 * Pay math is computed server-side via computeShiftPay so the gross
 * + net snapshot is authoritative. Payment transitions go through
 * /shifts/:id/transition for lifecycle enforcement.
 */

import axiosInstance from "@/lib/axiosConfig";

export type StaffRole =
  | "waiter"
  | "cook_helper"
  | "lead_cook"
  | "cleaner"
  | "parking_valet"
  | "dhol_player"
  | "qari"
  | "imam"
  | "decorator"
  | "florist"
  | "lighting_tech"
  | "security"
  | "driver"
  | "photographer"
  | "videographer"
  | "manager"
  | "bagpiper"
  | "stage_host"
  | "dj"
  | "sound_tech"
  | "other";

export type EmploymentType = "permanent_monthly" | "casual_dihari" | "contract";

export type PaymentStatus = "pending" | "paid" | "disputed" | "void";

export type PaymentMethod =
  | "cash"
  | "jazzcash"
  | "easypaisa"
  | "raast"
  | "ibft"
  | "bank_transfer"
  | "sadapay"
  | "nayapay"
  | "other";

export interface StaffBusinessInfo {
  id: number;
  name: string | null;
}

export interface StaffMember {
  id: number;
  businessId: number;
  createdByUserId: number;
  fullName: string;
  role: StaffRole;
  employmentType: EmploymentType;
  nicNumber: string | null;
  nicDisplay: string | null;
  nicPhotoUrl: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  cnicAddress: string | null;
  defaultDihariRate: number | string | null;
  monthlySalary: number | string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  jazzcashNumber: string | null;
  easypaisaNumber: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  photoUrl: string | null;
  joinedDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  business?: StaffBusinessInfo | null;
  shifts?: StaffShift[];
}

export interface StaffShift {
  id: number;
  staffMemberId: number | null;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  staffNameSnapshot: string;
  roleSnapshot: StaffRole;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  dihariRate: number | string;
  overtimeHours: number | string;
  overtimeRate: number | string;
  bonusAmount: number | string;
  deductionAmount: number | string;
  deductionReason: string | null;
  grossPayable: number | string;
  netPayable: number | string;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  paidAmount: number | string | null;
  paidVia: PaymentMethod | null;
  paymentRef: string | null;
  receiptPhotoUrl: string | null;
  thumbprintCaptured: boolean;
  notes: string | null;
  disputeNotes: string | null;
  createdAt: string;
  updatedAt: string;
  staffMember?: {
    id: number;
    fullName: string;
    role: StaffRole;
    phoneNumber: string | null;
    nicDisplay?: string | null;
    photoUrl?: string | null;
  } | null;
  booking?: {
    id: number;
    bookingDate: string | null;
    status: string | null;
    customerName?: string | null;
  } | null;
}

export interface MemberSummary {
  byRole: Partial<Record<StaffRole, number>>;
  activeCount: number;
  inactiveCount: number;
}

export interface PayrollSummary {
  totalShifts: number;
  byStatus: Partial<Record<PaymentStatus, number>>;
  byMethod: Partial<Record<PaymentMethod, number>>;
  pendingTotal: number;
  paidTotal: number;
  disputedTotal: number;
}

export interface CreateMemberInput {
  businessId: number;
  fullName: string;
  role?: StaffRole;
  employmentType?: EmploymentType;
  nicNumber?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  cnicAddress?: string;
  defaultDihariRate?: number;
  monthlySalary?: number;
  bankName?: string;
  bankAccountNumber?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photoUrl?: string;
  nicPhotoUrl?: string;
  joinedDate?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateMemberInput extends Partial<CreateMemberInput> {
  isActive?: boolean;
}

export interface CreateShiftInput {
  businessId: number;
  staffMemberId?: number;
  bookingId?: number;
  staffNameSnapshot?: string;
  roleSnapshot?: StaffRole;
  shiftDate: string;
  startTime?: string;
  endTime?: string;
  dihariRate: number;
  overtimeHours?: number;
  overtimeRate?: number;
  bonusAmount?: number;
  deductionAmount?: number;
  deductionReason?: string;
  notes?: string;
}

export interface UpdateShiftInput {
  shiftDate?: string;
  startTime?: string | null;
  endTime?: string | null;
  bookingId?: number | null;
  dihariRate?: number;
  overtimeHours?: number;
  overtimeRate?: number;
  bonusAmount?: number;
  deductionAmount?: number;
  deductionReason?: string | null;
  notes?: string | null;
  disputeNotes?: string | null;
  receiptPhotoUrl?: string | null;
}

export interface TransitionShiftInput {
  to: PaymentStatus;
  paidAmount?: number;
  paidVia?: PaymentMethod;
  paymentRef?: string;
  receiptPhotoUrl?: string;
  thumbprintCaptured?: boolean;
  disputeNotes?: string;
  reason?: string; // for void
}

export class StaffAPI {
  // Members
  static async listMembers(filters: {
    role?: StaffRole;
    isActive?: boolean;
    businessId?: number;
    search?: string;
  } = {}): Promise<{ members: StaffMember[]; summary: MemberSummary }> {
    const params: Record<string, any> = { ...filters };
    if (typeof filters.isActive === "boolean") {
      params.isActive = filters.isActive ? "true" : "false";
    }
    const res = await axiosInstance.get(`/api/v1/staff/members`, { params });
    return (
      res.data?.data ?? {
        members: [],
        summary: { byRole: {}, activeCount: 0, inactiveCount: 0 },
      }
    );
  }

  static async getMember(id: number): Promise<StaffMember | null> {
    const res = await axiosInstance.get(`/api/v1/staff/members/${id}`);
    return res.data?.data?.member ?? null;
  }

  static async createMember(body: CreateMemberInput): Promise<StaffMember> {
    const res = await axiosInstance.post(`/api/v1/staff/members`, body);
    return res.data?.data?.member;
  }

  static async updateMember(
    id: number,
    body: UpdateMemberInput,
  ): Promise<StaffMember> {
    const res = await axiosInstance.patch(`/api/v1/staff/members/${id}`, body);
    return res.data?.data?.member;
  }

  static async removeMember(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/staff/members/${id}`);
  }

  // Shifts
  static async listShifts(filters: {
    staffMemberId?: number;
    bookingId?: number;
    businessId?: number;
    paymentStatus?: PaymentStatus;
    from?: string;
    to?: string;
  } = {}): Promise<{ shifts: StaffShift[] }> {
    const res = await axiosInstance.get(`/api/v1/staff/shifts`, {
      params: filters,
    });
    return res.data?.data ?? { shifts: [] };
  }

  static async getShift(id: number): Promise<StaffShift | null> {
    const res = await axiosInstance.get(`/api/v1/staff/shifts/${id}`);
    return res.data?.data?.shift ?? null;
  }

  // §M5 — open the payslip PDF for a shift in a new tab (auth via axios,
  // blob → object URL).
  static async openPayslipPdf(id: number): Promise<void> {
    const res = await axiosInstance.get(`/api/v1/staff/shifts/${id}/payslip-pdf`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    window.open(url, "_blank");
    // Revoke a little later so the new tab has time to load it.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  static async createShift(
    body: CreateShiftInput,
  ): Promise<{ shift: StaffShift; pay: PayBreakdown }> {
    const res = await axiosInstance.post(`/api/v1/staff/shifts`, body);
    return res.data?.data;
  }

  static async updateShift(
    id: number,
    body: UpdateShiftInput,
  ): Promise<{ shift: StaffShift; pay: PayBreakdown }> {
    const res = await axiosInstance.patch(
      `/api/v1/staff/shifts/${id}`,
      body,
    );
    return res.data?.data;
  }

  static async transitionShift(
    id: number,
    body: TransitionShiftInput,
  ): Promise<StaffShift> {
    const res = await axiosInstance.post(
      `/api/v1/staff/shifts/${id}/transition`,
      body,
    );
    return res.data?.data?.shift;
  }

  static async removeShift(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/staff/shifts/${id}`);
  }

  /**
   * Calendar overlay — non-void shifts in a date window grouped by date,
   * with minimal fields. Powers the agenda view's "team on duty" row.
   */
  static async teamCalendar(filters: {
    from?: string;
    to?: string;
    businessId?: number;
  } = {}): Promise<TeamCalendarData> {
    try {
      const res = await axiosInstance.get(`/api/v1/staff/team-calendar`, {
        params: filters,
      });
      return res.data?.data ?? { days: {}, range: { from: "", to: "" }, totalShifts: 0 };
    } catch {
      return { days: {}, range: { from: "", to: "" }, totalShifts: 0 };
    }
  }

  static async payrollSummary(filters: {
    from?: string;
    to?: string;
    businessId?: number;
    staffMemberId?: number;
  } = {}): Promise<PayrollSummary> {
    const res = await axiosInstance.get(
      `/api/v1/staff/shifts/payroll-summary`,
      { params: filters },
    );
    return (
      res.data?.data?.summary ?? {
        totalShifts: 0,
        byStatus: {},
        byMethod: {},
        pendingTotal: 0,
        paidTotal: 0,
        disputedTotal: 0,
      }
    );
  }
}

export interface PayBreakdown {
  grossPayable: number;
  netPayable: number;
  overtimePay: number;
  payBreakdown: {
    base: number;
    overtime: number;
    bonus: number;
    deduction: number;
  };
}

// ─── Team calendar overlay ──────────────────────────────────────────
export interface TeamCalendarShift {
  id: number;
  staffName: string;
  role: StaffRole;
  paymentStatus: PaymentStatus;
  bookingId: number | null;
  businessId: number;
  startTime: string | null;
  endTime: string | null;
}
export interface TeamCalendarData {
  days: Record<string, TeamCalendarShift[]>; // keyed by YYYY-MM-DD
  range: { from: string; to: string };
  totalShifts: number;
}

// ─── Display helpers ────────────────────────────────────────────────

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  waiter: "Waiter",
  cook_helper: "Cook helper",
  lead_cook: "Lead cook / Chef",
  cleaner: "Cleaner",
  parking_valet: "Parking valet",
  dhol_player: "Dhol player",
  qari: "Qari (Tilawat)",
  imam: "Imam (Nikah)",
  decorator: "Decorator",
  florist: "Florist",
  lighting_tech: "Lighting tech",
  security: "Security",
  driver: "Driver",
  photographer: "Photographer",
  videographer: "Videographer",
  manager: "Manager",
  bagpiper: "Bagpiper",
  stage_host: "Stage host",
  dj: "DJ",
  sound_tech: "Sound tech",
  other: "Other",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  permanent_monthly: "Permanent (monthly)",
  casual_dihari: "Casual (per-event dihari)",
  contract: "Contract",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  disputed: "Disputed",
  void: "Voided",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "IBFT",
  bank_transfer: "Bank transfer",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
  other: "Other",
};

export const PAYMENT_STATUS_TONES: Record<
  PaymentStatus,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
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
};
