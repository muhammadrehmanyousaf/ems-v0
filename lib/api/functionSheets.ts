/**
 * Vendor Portal Phase 1 #7.1 — Function Sheet API.
 *
 * Layer 1: CRUD + state-machine transition.
 * Layer 2: PDF generation (Quote / Contract / BEO / Invoice / Receipt).
 */

import axiosInstance from "@/lib/axiosConfig";

export type FunctionSheetState =
  | "draft"
  | "quote_sent"
  | "contract_pending"
  | "signed"
  | "beo_ready"
  | "invoiced"
  | "paid"
  | "archived"
  | "cancelled";

export type PdfVariant =
  | "quote"
  | "contract"
  | "beo"
  | "invoice"
  | "receipt";

export interface FunctionSheetLineItem {
  label: string;
  qty: number | string;
  unitPrice: number | string;
  total?: number | string;
  notes?: string | null;
}

export interface FunctionSheet {
  id: number;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  customerUserId: number | null;
  state: FunctionSheetState;
  title: string;
  eventDate: string | null;
  validUntil: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  lineItemsJson: FunctionSheetLineItem[];
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  grandTotal: number | string;
  termsJson: any;
  paymentScheduleJson: any;
  signaturesJson: any;
  notes: string | null;
  sentAt: string | null;
  signedAt: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  customerShareToken?: string | null;
  shareTokenIssuedAt?: string | null;
  shareTokenExpiresAt?: string | null;
  shareTokenRevokedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: { id: number; name: string | null; userId?: number } | null;
  booking?: {
    id: number;
    bookingDate: string | null;
    status: string | null;
  } | null;
  customer?: {
    id: number;
    fullName: string | null;
    email: string | null;
    phoneNumber?: string | null;
  } | null;
  createdBy?: { id: number; fullName: string | null; email: string | null } | null;
}

export interface FunctionSheetSummary {
  byState: Partial<Record<FunctionSheetState, number>>;
  totalGrand: number;
}

export interface ListResponse {
  functionSheets: FunctionSheet[];
  summary: FunctionSheetSummary;
}

export interface TransitionInput {
  to: FunctionSheetState;
  signatureSide?: "vendor" | "customer";
  signatureData?: any;
}

export interface AuditEvent {
  id: number;
  actorUserId: number | null;
  targetType: string;
  targetId: number;
  action: string;
  before: any | null;
  after: any | null;
  ipHash: string | null;
  userAgent: string | null;
  at: string;
  actor: { id: number; fullName: string | null; email: string | null } | null;
}

export interface PaymentScheduleEntry {
  label: string;
  dueDate?: string | null;
  amount: number;
  paidOn?: string | null;
}

export interface CreateFunctionSheetInput {
  businessId: number;
  title: string;
  bookingId?: number | null;
  customerUserId?: number | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  eventDate?: string | null;
  validUntil?: string | null;
  lineItemsJson?: FunctionSheetLineItem[];
  discountAmount?: number;
  taxAmount?: number;
  termsJson?: { lines: string[] } | { text: string } | string | null;
  paymentScheduleJson?: PaymentScheduleEntry[] | null;
  notes?: string;
}

export interface UpdateFunctionSheetInput {
  title?: string;
  bookingId?: number | null;
  customerUserId?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  eventDate?: string | null;
  validUntil?: string | null;
  lineItemsJson?: FunctionSheetLineItem[];
  discountAmount?: number;
  taxAmount?: number;
  termsJson?: { lines: string[] } | { text: string } | string | null;
  paymentScheduleJson?: PaymentScheduleEntry[] | null;
  signaturesJson?: any;
  notes?: string | null;
}

export class FunctionSheetAPI {
  static async list(filters: {
    state?: FunctionSheetState;
    bookingId?: number;
    customerUserId?: number;
    eventFrom?: string;
    eventTo?: string;
  } = {}): Promise<ListResponse> {
    const res = await axiosInstance.get(`/api/v1/function-sheets`, {
      params: filters,
    });
    return (
      res.data?.data ?? {
        functionSheets: [],
        summary: { byState: {}, totalGrand: 0 },
      }
    );
  }

  static async get(id: number): Promise<FunctionSheet | null> {
    const res = await axiosInstance.get(`/api/v1/function-sheets/${id}`);
    return res.data?.data?.functionSheet ?? null;
  }

  static async create(body: CreateFunctionSheetInput): Promise<FunctionSheet> {
    const res = await axiosInstance.post(`/api/v1/function-sheets`, body);
    return res.data?.data?.functionSheet;
  }

  static async update(
    id: number,
    body: UpdateFunctionSheetInput,
  ): Promise<FunctionSheet> {
    const res = await axiosInstance.patch(`/api/v1/function-sheets/${id}`, body);
    return res.data?.data?.functionSheet;
  }

  static async transition(
    id: number,
    body: TransitionInput,
  ): Promise<FunctionSheet> {
    const res = await axiosInstance.post(
      `/api/v1/function-sheets/${id}/transition`,
      body,
    );
    return res.data?.data?.functionSheet;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/function-sheets/${id}`);
  }

  /**
   * Returns the PDF as a Blob — caller decides whether to download
   * via a temp <a> tag or open in a new tab.
   */
  static async pdfBlob(id: number, variant?: PdfVariant): Promise<Blob> {
    const res = await axiosInstance.get(`/api/v1/function-sheets/${id}/pdf`, {
      params: variant ? { variant } : {},
      responseType: "blob",
    });
    return res.data;
  }

  /**
   * Pre-built URL the FE can stuff into <a target="_blank"> to preview
   * the PDF in a new tab (browser handles the Bearer auth via the same
   * axios interceptor — uses fetch + saveAs).
   */
  static pdfUrl(id: number, variant?: PdfVariant): string {
    const params = variant ? `?variant=${encodeURIComponent(variant)}` : "";
    return `/api/v1/function-sheets/${id}/pdf${params}`;
  }

  /**
   * Issue (or rotate) a customer-share token. Previous link dies
   * instantly. expiresInDays defaults to 30, clamped 1-365.
   */
  static async issueShareToken(
    id: number,
    expiresInDays = 30,
  ): Promise<{
    token: string;
    issuedAt: string;
    expiresAt: string;
    expiresInDays: number;
  }> {
    const res = await axiosInstance.post(
      `/api/v1/function-sheets/${id}/share-token`,
      { expiresInDays },
    );
    return res.data?.data;
  }

  /**
   * Revoke (flag-dead, do NOT clear) the share token. Vendor can
   * re-issue afterwards.
   */
  static async revokeShareToken(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/function-sheets/${id}/share-token`);
  }

  /**
   * Append-only chronological audit log of every mutation on the
   * sheet (create / update / state changes / signatures / share-token
   * issue+revoke / PDF generation / WhatsApp sends / customer signing
   * via public token). Hydrated with actor display names.
   */
  static async auditLog(
    id: number,
    limit = 50,
  ): Promise<{ events: AuditEvent[] }> {
    const res = await axiosInstance.get(
      `/api/v1/function-sheets/${id}/audit-log`,
      { params: { limit } },
    );
    return res.data?.data ?? { events: [] };
  }

  /**
   * Send the PDF for the requested variant to a WhatsApp number via
   * the active adapter. Returns the provider result + delivery
   * metadata (filename, bytes). Best-effort — when no provider is
   * configured the response carries `result.ok = false` with
   * `reason: 'no_provider'`.
   */
  static async sendWhatsapp(
    id: number,
    body: { variant?: PdfVariant; to?: string; body?: string },
  ): Promise<{
    provider: string;
    to: string;
    variant: PdfVariant;
    filename: string;
    bytes: number;
    result: {
      ok: boolean;
      reason?: string;
      providerMessageId?: string;
    };
  }> {
    const res = await axiosInstance.post(
      `/api/v1/function-sheets/${id}/send-whatsapp`,
      body,
    );
    return res.data?.data;
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const STATE_LABELS: Record<FunctionSheetState, string> = {
  draft: "Draft",
  quote_sent: "Quote sent",
  contract_pending: "Contract pending",
  signed: "Signed",
  beo_ready: "BEO ready",
  invoiced: "Invoiced",
  paid: "Paid",
  archived: "Archived",
  cancelled: "Cancelled",
};

export const PDF_VARIANT_LABELS: Record<PdfVariant, string> = {
  quote: "Quotation",
  contract: "Service Contract",
  beo: "Banquet Event Order (BEO)",
  invoice: "Tax Invoice",
  receipt: "Payment Receipt",
};

// Maps a state to which variants are legal to print (mirrors backend
// VARIANT_MIN_STATE + STATE_ORDER).
const STATE_ORDER: FunctionSheetState[] = [
  "draft",
  "quote_sent",
  "contract_pending",
  "signed",
  "beo_ready",
  "invoiced",
  "paid",
  "archived",
];
const VARIANT_MIN: Record<PdfVariant, FunctionSheetState> = {
  quote: "draft",
  contract: "contract_pending",
  beo: "beo_ready",
  invoice: "invoiced",
  receipt: "paid",
};

export function variantsAvailable(state: FunctionSheetState): PdfVariant[] {
  if (state === "cancelled") return ["quote"]; // historical view only
  const rank = STATE_ORDER.indexOf(state);
  if (rank < 0) return ["quote"];
  return (Object.keys(VARIANT_MIN) as PdfVariant[]).filter((v) => {
    const min = STATE_ORDER.indexOf(VARIANT_MIN[v]);
    return min >= 0 && rank >= min;
  });
}

export const STATE_TONES: Record<
  FunctionSheetState,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
  quote_sent: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  contract_pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  signed: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-300",
  },
  beo_ready: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  invoiced: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-400",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  archived: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
  cancelled: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-300",
  },
};
