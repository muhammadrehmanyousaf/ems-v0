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

// Deliverables tracker — per-booking deliverable pipeline (photos/video/
// album/drone for photographers; setup pics for decorators; etc).
export type DeliverableStatus = "pending" | "in_progress" | "delivered" | "approved" | "rejected";
export interface Deliverable {
  id: string;
  label: string;
  status: DeliverableStatus;
  etaDate?: string | null;
  link?: string;
  notes?: string;
}
export interface DeliverablesData { items: Deliverable[] }

// Caterer kitchen sheet (§16.2): the operational data that kills 15-25%
// food wastage — headcount lock + per-head menu quantities + staffing.
export interface KitchenMenuItem {
  id: string;
  item: string;          // e.g. "Chicken Karahi", "Mutton Pulao"
  perHead?: string;      // e.g. "200g", "1 piece" — free text, vendor's units
  notes?: string;
}
// Car-rental fleet + driver + fuel/km + deposit/damage (§16.5).
export type VehicleStatus = "planned" | "dispatched" | "returned" | "returned_damaged";
export interface VehicleAssignment {
  id: string;
  vehicle: string;             // e.g. "Civic ABK-123" or "Toyota Coaster"
  driver?: string;             // driver name (phone optional in notes)
  driverPhone?: string;
  route?: string;              // "Lahore → Murree → Lahore"
  departAt?: string;           // HH:MM
  returnAt?: string;
  startKm?: number | null;
  endKm?: number | null;
  fuelLitres?: number | null;
  fuelCost?: number | null;
  tollsCost?: number | null;
  deposit?: number | null;
  status: VehicleStatus;
  damageNotes?: string;
  notes?: string;
}
export interface CarRentalData {
  vehicles?: VehicleAssignment[];
  convoyNotes?: string;        // formation, pilot car, security etc.
  totalDepositHeld?: number | null;
  depositReturnedAt?: string | null;
}

// Decorator setup + decor-inventory condition tracking (§16.6).
export type DecorCondition = "planned" | "setup" | "returned" | "damaged" | "lost";
export interface DecorItem {
  id: string;
  item: string;                  // e.g. "Stage flower arch"
  qty?: number;
  source?: "own" | "rented";
  perUnitCost?: number | null;
  condition: DecorCondition;
  notes?: string;
}
export interface DecoratorSetupData {
  setupTime?: string;            // HH:MM
  breakdownTime?: string;
  setupCrew?: number | null;
  breakdownCrew?: number | null;
  transportTrips?: number | null;
  items?: DecorItem[];
  substitutionNotes?: string;    // flower availability subs etc.
  damageLossNotes?: string;
}

// Bridal-wear fitting / alteration schedule (§16.7).
export type BridalMilestoneKey =
  | "measurements" | "cut" | "stitched" | "fitting1" | "fitting2" | "final" | "delivered";
export interface BridalMilestone {
  key: BridalMilestoneKey;
  label: string;
  status: "pending" | "done";
  doneAt?: string | null;       // YYYY-MM-DD
  note?: string;
}
export interface BridalOutfit {
  id: string;
  name: string;                  // e.g. "Bridal Lehenga"
  type: "rental" | "purchase" | "custom";
  deposit?: number | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;    // for rentals
  damageNotes?: string;
}
export interface BridalWearData {
  milestones?: BridalMilestone[];
  outfits?: BridalOutfit[];
  alterationNotes?: string;
  depositHeld?: number | null;        // total held across outfits
  depositReturnedAt?: string | null;
}

export interface KitchenSheetData {
  headcount?: number | null;
  headcountLockedAt?: string | null;     // YYYY-MM-DD; null = not locked
  menu?: KitchenMenuItem[];
  staffing?: { waiters?: number; cooks?: number; labour?: number };
  prepStart?: string;                    // HH:MM
  cookStart?: string;
  serveTime?: string;
  halalConfirmed?: boolean;
  dietaryNotes?: string;                 // allergens, veg options, jain etc.
  leftoverPlan?: string;
}

// Henna / mehndi per-subject schedule (§16.4) — PK henna artists price
// per-hand (not flat), so each subject (bride / sister / aunty / guests)
// gets its own row with hands count + complexity tier + per-hand rate.
// Day-of timing: appointment + arrival + start + finish; plus travel
// charge, out-of-city flag, family bulk discount, and aftercare kit.
export type HennaComplexity = "simple" | "medium" | "bridal" | "intricate";
export interface HennaSubject {
  id: string;
  name: string;                       // "Bride", "Sister Ayesha", "Guest 3"
  hands: number | null;               // typically 2 (both hands), sometimes 4 (with feet)
  complexity: HennaComplexity;
  perHandRate: number | null;         // PKR per hand
  appointmentTime?: string;           // HH:MM
  startedAt?: string;                 // HH:MM (day-of actual)
  finishedAt?: string;
  notes?: string;
}
export interface HennaScheduleData {
  subjects?: HennaSubject[];
  artistArrivalTime?: string;         // HH:MM — when artist reaches venue
  sessionStartTime?: string;          // HH:MM — first hand started
  sessionEndTime?: string;            // HH:MM — last subject finished
  travelCharge?: number | null;       // PKR — outside-city or premium-area surcharge
  outOfCity?: boolean;
  familyBulkDiscount?: number | null; // PKR — flat off when whole family booked
  aftercareKitIncluded?: boolean;     // sugar-lemon paste, oil, gloves
  notes?: string;
}

// Structured day-of BEO / run-sheet (venue operations).
export interface BeoTimelineRow { time: string; activity: string }
export interface BeoData {
  spaces?: string;                  // halls / areas used
  guaranteedHeadcount?: number | null;
  setupTime?: string;               // HH:MM
  teardownTime?: string;            // HH:MM
  timeline?: BeoTimelineRow[];      // run-sheet rows
  crewNotes?: string;               // instructions for the crew
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
  beoJson?: BeoData | null;
  deliverablesJson?: DeliverablesData | null;
  kitchenSheetJson?: KitchenSheetData | null;
  bridalWearJson?: BridalWearData | null;
  decoratorSetupJson?: DecoratorSetupData | null;
  carRentalJson?: CarRentalData | null;
  hennaJson?: HennaScheduleData | null;
  notes: string | null;
  sentAt: string | null;
  signedAt: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
  customerShareToken?: string | null;
  shareTokenIssuedAt?: string | null;
  shareTokenExpiresAt?: string | null;
  shareTokenRevokedAt?: string | null;
  // FBR e-invoicing (Phase 3 #9.1)
  fbrSubmittedAt?: string | null;
  fbrInvoiceNumber?: string | null;
  fbrQrCodePayload?: string | null;
  fbrSubmissionStatus?:
    | "submitted"
    | "accepted"
    | "rejected"
    | "voided"
    | "pending"
    | null;
  fbrSubmissionErrors?: Array<{ path?: string; message: string }> | null;
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

// ─── Linked financials types (per-event P&L) ───────────────────────

export interface LinkedReceipt {
  id: number;
  amount: number | string;
  method: string;
  receivedDate: string;
  transactionRef: string | null;
  notes: string | null;
}
export interface LinkedPdc {
  id: number;
  chequeNumber: string;
  bankName: string;
  amount: number | string;
  chequeDate: string;
  depositDate: string | null;
  status: string;
  bounceReason: string | null;
}
export interface LinkedSupplierInvoice {
  id: number;
  supplierNameSnapshot: string;
  supplierCategorySnapshot: string | null;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number | string;
  amountPaid: number | string;
  status: string;
}
export interface LinkedBrokerCommission {
  id: number;
  brokerNameSnapshot: string;
  brokerTypeSnapshot: string | null;
  commissionType: string;
  commissionPct: number | string | null;
  commissionAmount: number | string;
  amountPaid: number | string;
  status: string;
  accruedDate: string;
  dueDate: string | null;
}
export interface LinkedExpense {
  id: number;
  category: string;
  subcategory: string | null;
  amount: number | string;
  spentDate: string;
  supplierName: string | null;
  paymentMethod: string;
  description: string | null;
}
export interface LinkedStaffShift {
  id: number;
  staffNameSnapshot: string;
  roleSnapshot: string;
  shiftDate: string;
  dihariRate: number | string;
  grossPayable: number | string;
  netPayable: number | string;
  paymentStatus: string;
  paidAmount: number | string | null;
  paidVia: string | null;
}
export interface LinkedInventoryMovement {
  id: number;
  type: string;
  quantity: number | string;
  occurredAt: string;
  reason: string | null;
  item?: { id: number; name: string; unit: string; category: string } | null;
}

export interface LinkedFinancialsPnl {
  gross: number;
  inflows: {
    receipts: number;
    pdcsHeld: number;
    pdcsCleared: number;
    pdcsBounced: number;
    totalReceived: number;
  };
  outflows: {
    supplierPaid: number;
    supplierUnpaid: number;
    commissionPaid: number;
    commissionUnpaid: number;
    expenses: number;
    expensesByCategory: Record<string, number>;
    staffPaid: number;
    staffPending: number;
    totalOutflows: number;
    totalCommitted: number;
  };
  net: number;
  cashflow: number;
  customerOutstanding: number;
}

export interface LinkedFinancials {
  bookingId: number | null;
  receipts: LinkedReceipt[];
  pdcs: LinkedPdc[];
  supplierInvoices: LinkedSupplierInvoice[];
  brokerCommissions: LinkedBrokerCommission[];
  expenses: LinkedExpense[];
  staffShifts: LinkedStaffShift[];
  inventoryMovements: LinkedInventoryMovement[];
  pnl: LinkedFinancialsPnl | null;
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
  beoJson?: BeoData | null;
  deliverablesJson?: DeliverablesData | null;
  kitchenSheetJson?: KitchenSheetData | null;
  bridalWearJson?: BridalWearData | null;
  decoratorSetupJson?: DecoratorSetupData | null;
  carRentalJson?: CarRentalData | null;
  hennaJson?: HennaScheduleData | null;
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
   * Submit the function sheet to FBR (Federal Board of Revenue,
   * Pakistan) for electronic invoicing. Required for vendors above
   * the Tier-1 threshold (>Rs. 10M / yr retail; sales-tax-registered
   * businesses).
   *
   * Provider-agnostic — when no adapter is configured the response
   * carries `result.ok = false` with `reason: 'no_provider'`. The
   * row is still stamped with the payload snapshot for replay when
   * sandbox creds eventually arrive.
   */
  static async submitFbr(
    id: number,
    body: { buyerNtn?: string; buyerNic?: string; paymentMode?: string } = {},
  ): Promise<{
    provider: string;
    result: {
      ok: boolean;
      reason?: string;
      fbrInvoiceNumber?: string;
      fbrQrCodePayload?: string;
      status?: string;
      errors?: Array<{ path?: string; message: string }>;
    };
    row: {
      fbrSubmittedAt: string | null;
      fbrInvoiceNumber: string | null;
      fbrQrCodePayload: string | null;
      fbrSubmissionStatus: string | null;
      fbrSubmissionErrors: any[] | null;
    };
  }> {
    const res = await axiosInstance.post(
      `/api/v1/function-sheets/${id}/fbr-submit`,
      body,
    );
    return res.data?.data;
  }

  /**
   * Cross-feature financial roll-up — receipts / PDCs / supplier
   * invoices / broker commissions / expenses / staff shifts /
   * inventory consumption tied to this sheet's bookingId. Plus
   * computed per-event P&L (gross / inflows / outflows / net /
   * cashflow / customer-outstanding).
   *
   * Returns empty arrays + null pnl when the sheet has no bookingId.
   */
  static async linkedFinancials(id: number): Promise<LinkedFinancials> {
    const res = await axiosInstance.get(
      `/api/v1/function-sheets/${id}/linked-financials`,
    );
    return (
      res.data?.data ?? {
        bookingId: null,
        receipts: [],
        pdcs: [],
        supplierInvoices: [],
        brokerCommissions: [],
        expenses: [],
        staffShifts: [],
        inventoryMovements: [],
        pnl: null,
      }
    );
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
