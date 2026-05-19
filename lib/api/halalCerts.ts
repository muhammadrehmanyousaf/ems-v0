/**
 * Vendor Portal Phase 2 #8.6 — Halal cert API.
 *
 * Mirrors backend at /api/v1/halal-certs.
 */

import axiosInstance from "@/lib/axiosConfig";

export type IssuingAuthority =
  | "pha"
  | "shdb_sindh"
  | "kpk_halal"
  | "sfa_pakistan"
  | "sanha"
  | "juh_india"
  | "muis"
  | "esma"
  | "manual_attestation"
  | "other";

export type CertStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "revoked"
  | "pending_renewal";

export interface HalalCert {
  id: number;
  businessId: number;
  createdByUserId: number;
  supplierId: number | null;
  supplierNameSnapshot: string | null;
  certNumber: string;
  issuingAuthority: IssuingAuthority;
  itemDescription: string;
  issuedDate: string;
  expiryDate: string;
  status: CertStatus;
  renewalLeadTimeDays: number;
  certPhotoUrl: string | null;
  notes: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: number;
    name: string;
    category: string;
  } | null;
}

export interface CertSummary {
  byStatus: Partial<Record<CertStatus, number>>;
  byAuthority: Partial<Record<IssuingAuthority, number>>;
}

export interface CreateCertInput {
  businessId: number;
  supplierId?: number;
  supplierNameSnapshot?: string;
  certNumber: string;
  issuingAuthority?: IssuingAuthority;
  itemDescription: string;
  issuedDate: string;
  expiryDate: string;
  renewalLeadTimeDays?: number;
  certPhotoUrl?: string;
  notes?: string;
}

export interface UpdateCertInput {
  certNumber?: string;
  issuingAuthority?: IssuingAuthority;
  itemDescription?: string;
  issuedDate?: string;
  expiryDate?: string;
  renewalLeadTimeDays?: number;
  certPhotoUrl?: string | null;
  supplierNameSnapshot?: string | null;
  notes?: string | null;
}

export interface TransitionCertInput {
  to: CertStatus;
  revokedReason?: string;
  newExpiryDate?: string;
  newCertNumber?: string;
}

export class HalalCertAPI {
  static async list(filters: {
    issuingAuthority?: IssuingAuthority;
    status?: CertStatus;
    supplierId?: number;
    businessId?: number;
    search?: string;
  } = {}): Promise<{ certs: HalalCert[]; summary: CertSummary }> {
    const res = await axiosInstance.get(`/api/v1/halal-certs`, { params: filters });
    return res.data?.data ?? { certs: [], summary: { byStatus: {}, byAuthority: {} } };
  }

  static async get(id: number): Promise<HalalCert | null> {
    const res = await axiosInstance.get(`/api/v1/halal-certs/${id}`);
    return res.data?.data?.cert ?? null;
  }

  static async create(body: CreateCertInput): Promise<HalalCert> {
    const res = await axiosInstance.post(`/api/v1/halal-certs`, body);
    return res.data?.data?.cert;
  }

  static async update(id: number, body: UpdateCertInput): Promise<HalalCert> {
    const res = await axiosInstance.patch(`/api/v1/halal-certs/${id}`, body);
    return res.data?.data?.cert;
  }

  static async transition(id: number, body: TransitionCertInput): Promise<HalalCert> {
    const res = await axiosInstance.post(`/api/v1/halal-certs/${id}/transition`, body);
    return res.data?.data?.cert;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/halal-certs/${id}`);
  }

  static async expiring(filters: { businessId?: number } = {}): Promise<{ certs: HalalCert[] }> {
    const res = await axiosInstance.get(`/api/v1/halal-certs/expiring`, { params: filters });
    return res.data?.data ?? { certs: [] };
  }
}

export const ISSUING_AUTHORITY_LABELS: Record<IssuingAuthority, string> = {
  pha: "PHA (Punjab Halal Authority)",
  shdb_sindh: "Sindh Halal Dept",
  kpk_halal: "KPK Halal Authority",
  sfa_pakistan: "HFA Federal Pakistan",
  sanha: "SANHA (South Africa)",
  juh_india: "JUH (India)",
  muis: "MUIS (Singapore)",
  esma: "ESMA (UAE / GCC)",
  manual_attestation: "Supplier attestation",
  other: "Other",
};

export const CERT_STATUS_LABELS: Record<CertStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  revoked: "Revoked",
  pending_renewal: "Pending renewal",
};

export const CERT_STATUS_TONES: Record<
  CertStatus,
  { bg: string; text: string; border: string }
> = {
  active: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  expiring_soon: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  expired: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
  revoked: {
    bg: "bg-rose-100",
    text: "text-rose-900",
    border: "border-rose-400",
  },
  pending_renewal: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
};
