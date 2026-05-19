/**
 * Vendor Portal Phase 2 #8.7 — Drone NOC permit API.
 *
 * Mirrors backend at /api/v1/drone-noc.
 */

import axiosInstance from "@/lib/axiosConfig";

export type PermitType =
  | "single_event"
  | "blanket_annual"
  | "provincial_home_dept"
  | "police_intimation";

export type IssuingAuthority =
  | "pcaa"
  | "home_dept_pb"
  | "home_dept_sindh"
  | "home_dept_kpk"
  | "home_dept_balochistan"
  | "police_station"
  | "other";

export type PermitStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "expiring_soon";

export interface DroneNOC {
  id: number;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  permitType: PermitType;
  issuingAuthority: IssuingAuthority;
  referenceNumber: string;
  droneModel: string | null;
  droneRegNumber: string | null;
  droneWeightKg: number | string | null;
  pilotName: string | null;
  pilotLicense: string | null;
  eventDescription: string | null;
  venueAddress: string | null;
  appliedDate: string | null;
  validFrom: string;
  validUntil: string;
  status: PermitStatus;
  statusReason: string | null;
  renewalLeadTimeDays: number;
  feePaid: number | string | null;
  permitPhotoUrl: string | null;
  notes: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: number;
    bookingDate: string | null;
    status: string | null;
  } | null;
}

export interface PermitSummary {
  byStatus: Partial<Record<PermitStatus, number>>;
  byType: Partial<Record<PermitType, number>>;
}

export interface CreatePermitInput {
  businessId: number;
  bookingId?: number;
  permitType?: PermitType;
  issuingAuthority?: IssuingAuthority;
  referenceNumber: string;
  droneModel?: string;
  droneRegNumber?: string;
  droneWeightKg?: number;
  pilotName?: string;
  pilotLicense?: string;
  eventDescription?: string;
  venueAddress?: string;
  appliedDate?: string;
  validFrom: string;
  validUntil: string;
  renewalLeadTimeDays?: number;
  feePaid?: number;
  permitPhotoUrl?: string;
  notes?: string;
}

export interface UpdatePermitInput extends Partial<CreatePermitInput> {}

export interface TransitionPermitInput {
  to: PermitStatus;
  statusReason?: string;
}

export class DroneNocAPI {
  static async list(filters: {
    permitType?: PermitType;
    issuingAuthority?: IssuingAuthority;
    status?: PermitStatus;
    bookingId?: number;
    businessId?: number;
    search?: string;
  } = {}): Promise<{ permits: DroneNOC[]; summary: PermitSummary }> {
    const res = await axiosInstance.get(`/api/v1/drone-noc`, { params: filters });
    return res.data?.data ?? { permits: [], summary: { byStatus: {}, byType: {} } };
  }

  static async get(id: number): Promise<DroneNOC | null> {
    const res = await axiosInstance.get(`/api/v1/drone-noc/${id}`);
    return res.data?.data?.permit ?? null;
  }

  static async create(body: CreatePermitInput): Promise<DroneNOC> {
    const res = await axiosInstance.post(`/api/v1/drone-noc`, body);
    return res.data?.data?.permit;
  }

  static async update(id: number, body: UpdatePermitInput): Promise<DroneNOC> {
    const res = await axiosInstance.patch(`/api/v1/drone-noc/${id}`, body);
    return res.data?.data?.permit;
  }

  static async transition(id: number, body: TransitionPermitInput): Promise<DroneNOC> {
    const res = await axiosInstance.post(`/api/v1/drone-noc/${id}/transition`, body);
    return res.data?.data?.permit;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/drone-noc/${id}`);
  }

  static async upcoming(filters: { businessId?: number } = {}): Promise<{ permits: DroneNOC[] }> {
    const res = await axiosInstance.get(`/api/v1/drone-noc/upcoming`, { params: filters });
    return res.data?.data ?? { permits: [] };
  }
}

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  single_event: "Single event",
  blanket_annual: "Blanket annual",
  provincial_home_dept: "Provincial Home Dept",
  police_intimation: "Police intimation",
};

export const PERMIT_AUTHORITY_LABELS: Record<IssuingAuthority, string> = {
  pcaa: "PCAA (Federal)",
  home_dept_pb: "Punjab Home Dept",
  home_dept_sindh: "Sindh Home Dept",
  home_dept_kpk: "KPK Home Dept",
  home_dept_balochistan: "Balochistan Home Dept",
  police_station: "Local police station",
  other: "Other",
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
  expiring_soon: "Expiring soon",
};

export const PERMIT_STATUS_TONES: Record<
  PermitStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  rejected: {
    bg: "bg-rose-100",
    text: "text-rose-900",
    border: "border-rose-400",
  },
  cancelled: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
  expired: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
  expiring_soon: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
};
