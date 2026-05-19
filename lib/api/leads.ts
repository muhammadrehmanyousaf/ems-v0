/**
 * Vendor Portal Phase 1 #7.3 — Lead Inbox API.
 *
 * Mirrors the backend at /api/v1/leads. Vendor-scoped reads/writes
 * (createdByUserId OR Business.userId); super-admin bypass handled
 * server-side. Status writes route through /transition so the
 * lifecycle stays enforced server-side.
 *
 * WhatsApp send is best-effort — provider may be unconfigured
 * (response.result.ok === false, reason === 'no_provider'); the
 * lead is still stamped with the attempted activity.
 */

import axiosInstance from "@/lib/axiosConfig";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quoted"
  | "booked"
  | "lost"
  | "archived";

export type LeadSource =
  | "in_app_chat"
  | "whatsapp"
  | "form_inquiry"
  | "manual_phone"
  | "manual_walkin"
  | "other";

export type LeadEventType =
  | "mehndi"
  | "nikah"
  | "baraat"
  | "walima"
  | "engagement"
  | "dholki"
  | "other";

export interface LeadBusinessInfo {
  id: number;
  name: string | null;
}

export interface LeadUserInfo {
  id: number;
  fullName: string | null;
  email: string | null;
  phoneNumber?: string | null;
}

export interface LeadBookingInfo {
  id: number;
  bookingDate: string | null;
  status: string | null;
  customerName?: string | null;
}

export interface Lead {
  id: number;
  businessId: number;
  createdByUserId: number;
  assignedToUserId: number | null;

  source: LeadSource;
  sourceRef: string | null;
  conversationId: number | null;

  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactCustomerUserId: number | null;

  inquiry: string | null;
  eventType: LeadEventType | null;
  eventDate: string | null;
  estimatedBudget: number | string | null;
  estimatedGuests: number | null;

  status: LeadStatus;
  statusReason: string | null;
  nextFollowUpAt: string | null;

  bookingId: number | null;
  functionSheetId: number | null;

  notes: string | null;
  lastActivityAt: string | null;
  respondedAt: string | null;

  createdAt: string;
  updatedAt: string;

  business?: LeadBusinessInfo | null;
  createdBy?: LeadUserInfo | null;
  assignedTo?: LeadUserInfo | null;
  contactCustomer?: LeadUserInfo | null;
  booking?: LeadBookingInfo | null;
}

export interface LeadSummary {
  byStatus: Partial<Record<LeadStatus, number>>;
  bySource: Partial<Record<LeadSource, number>>;
}

export interface LeadListResponse {
  leads: Lead[];
  summary: LeadSummary;
  /** Active WhatsApp provider — "noop" when none configured. */
  provider: string;
}

export interface CreateLeadInput {
  businessId: number;
  source?: LeadSource;
  sourceRef?: string;
  conversationId?: number | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactCustomerUserId?: number | null;
  inquiry?: string;
  eventType?: LeadEventType;
  eventDate?: string | null;
  estimatedBudget?: number | null;
  estimatedGuests?: number | null;
  status?: LeadStatus;
  nextFollowUpAt?: string | null;
  notes?: string;
  assignedToUserId?: number | null;
}

export interface UpdateLeadInput {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactWhatsapp?: string | null;
  contactCustomerUserId?: number | null;
  inquiry?: string | null;
  eventType?: LeadEventType | null;
  eventDate?: string | null;
  estimatedBudget?: number | null;
  estimatedGuests?: number | null;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  assignedToUserId?: number | null;
  bookingId?: number | null;
  functionSheetId?: number | null;
}

export interface TransitionLeadInput {
  to: LeadStatus;
  statusReason?: string;
}

export interface LeadListFilters {
  status?: LeadStatus;
  source?: LeadSource;
  businessId?: number;
  assignedToUserId?: number;
  search?: string;
  /** Reverse-lookup: which lead converted to this booking? */
  bookingId?: number;
}

export interface WhatsappSendResult {
  provider: string;
  result: {
    ok: boolean;
    reason?: string;
    providerMessageId?: string;
  };
}

export interface LeadSourceAnalytics {
  source: LeadSource;
  total: number;
  byStatus: Partial<Record<LeadStatus, number>>;
  booked: number;
  lost: number;
  conversionRate: number; // 0-100
  revenue: number;
  avgTicketSize: number;
  avgDaysToBooking: number | null;
}

export interface ConversionAnalytics {
  totalLeads: number;
  totalBooked: number;
  totalLost: number;
  totalRevenue: number;
  overallConversionRate: number;
  avgTicketSize: number;
  perSource: LeadSourceAnalytics[];
  generatedAt: string;
}

export class LeadAPI {
  /** GET /api/v1/leads */
  static async list(filters: LeadListFilters = {}): Promise<LeadListResponse> {
    const res = await axiosInstance.get(`/api/v1/leads`, { params: filters });
    return (
      res.data?.data ??
      ({
        leads: [],
        summary: { byStatus: {}, bySource: {} },
        provider: "noop",
      } as LeadListResponse)
    );
  }

  /** GET /api/v1/leads/:id */
  static async get(id: number): Promise<Lead | null> {
    const res = await axiosInstance.get(`/api/v1/leads/${id}`);
    return res.data?.data?.lead ?? null;
  }

  /** POST /api/v1/leads */
  static async create(body: CreateLeadInput): Promise<Lead> {
    const res = await axiosInstance.post(`/api/v1/leads`, body);
    return res.data?.data?.lead;
  }

  /** PATCH /api/v1/leads/:id — content edits only (status uses /transition). */
  static async update(id: number, body: UpdateLeadInput): Promise<Lead> {
    const res = await axiosInstance.patch(`/api/v1/leads/${id}`, body);
    return res.data?.data?.lead;
  }

  /** POST /api/v1/leads/:id/transition */
  static async transition(id: number, body: TransitionLeadInput): Promise<Lead> {
    const res = await axiosInstance.post(`/api/v1/leads/${id}/transition`, body);
    return res.data?.data?.lead;
  }

  /**
   * POST /api/v1/leads/bulk-transition
   * Bulk move up to 200 leads in one request. Per-id results returned.
   */
  static async bulkTransition(body: {
    ids: number[];
    to: LeadStatus;
    statusReason?: string;
  }): Promise<{
    applied: number;
    skipped: number;
    failed: number;
    results: Array<{ id: number; ok: boolean; reason?: string; noop?: boolean }>;
  }> {
    const res = await axiosInstance.post(`/api/v1/leads/bulk-transition`, body);
    return res.data?.data;
  }

  /** DELETE /api/v1/leads/bulk — soft delete sweep. */
  static async bulkDelete(ids: number[]): Promise<{
    deleted: number;
    failed: number;
    results: Array<{ id: number; ok: boolean; reason?: string }>;
  }> {
    const res = await axiosInstance.delete(`/api/v1/leads/bulk`, {
      data: { ids },
    });
    return res.data?.data;
  }

  /** POST /api/v1/leads/:id/whatsapp — best-effort send. */
  static async sendWhatsapp(
    id: number,
    body: { body: string },
  ): Promise<WhatsappSendResult> {
    const res = await axiosInstance.post(`/api/v1/leads/${id}/whatsapp`, body);
    return res.data?.data;
  }

  /** DELETE /api/v1/leads/:id — soft delete. */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/leads/${id}`);
  }

  /**
   * GET /api/v1/leads/conversion-analytics
   * Per-source funnel + revenue. Optional date-window filter.
   */
  static async conversionAnalytics(
    filters: { from?: string; to?: string; businessId?: number } = {},
  ): Promise<ConversionAnalytics> {
    const res = await axiosInstance.get(
      `/api/v1/leads/conversion-analytics`,
      { params: filters },
    );
    return (
      res.data?.data ?? {
        totalLeads: 0,
        totalBooked: 0,
        totalLost: 0,
        totalRevenue: 0,
        overallConversionRate: 0,
        avgTicketSize: 0,
        perSource: [],
        generatedAt: new Date().toISOString(),
      }
    );
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  quoted: "Quoted",
  booked: "Booked",
  lost: "Lost",
  archived: "Archived",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  in_app_chat: "In-app chat",
  whatsapp: "WhatsApp",
  form_inquiry: "Website form",
  manual_phone: "Phone call",
  manual_walkin: "Walk-in",
  other: "Other",
};

export const LEAD_EVENT_TYPE_LABELS: Record<LeadEventType, string> = {
  mehndi: "Mehndi",
  nikah: "Nikah",
  baraat: "Baraat",
  walima: "Walima",
  engagement: "Engagement",
  dholki: "Dholki",
  other: "Other",
};

export const LEAD_STATUS_TONES: Record<
  LeadStatus,
  { bg: string; text: string; border: string }
> = {
  new: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  contacted: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  qualified: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-300",
  },
  quoted: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  booked: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  lost: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
  archived: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
};
