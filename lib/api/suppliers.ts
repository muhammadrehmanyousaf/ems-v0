/**
 * Vendor Portal Phase 2 #8.4 — Supplier ledger API.
 *
 * Mirrors backend at /api/v1/suppliers. Suppliers are the vendor's
 * directory; SupplierInvoices is the A/P ledger with embedded
 * payment tracking via amountPaid + auto-transition to 'paid' on
 * full settlement. Payments route through /invoices/:id/payment,
 * direct status changes through /invoices/:id/transition.
 */

import axiosInstance from "@/lib/axiosConfig";

export type SupplierCategory =
  | "meat"
  | "produce"
  | "atta_grains"
  | "dairy"
  | "oil_ghee"
  | "spices"
  | "frozen_seafood"
  | "bakery_sweets"
  | "flowers"
  | "decor_materials"
  | "linen_uniforms"
  | "equipment_rental"
  | "generator_rental"
  | "vehicle_rental"
  | "brokerage"
  | "utilities"
  | "transport_fuel"
  | "stationery"
  | "professional_services"
  | "other";

export type InvoiceStatus =
  | "draft"
  | "received"
  | "partially_paid"
  | "paid"
  | "disputed"
  | "void"
  | "overdue";

export type SupplierPaymentMethod =
  | "cash"
  | "jazzcash"
  | "easypaisa"
  | "raast"
  | "ibft"
  | "bank_transfer"
  | "sadapay"
  | "nayapay"
  | "cheque"
  | "post_dated_cheque"
  | "other";

export interface SupplierBusinessInfo {
  id: number;
  name: string | null;
}

export interface Supplier {
  id: number;
  businessId: number;
  createdByUserId: number;
  name: string;
  category: SupplierCategory;
  contactPerson: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  address: string | null;
  ntn: string | null;
  strn: string | null;
  defaultPaymentTermsDays: number;
  creditLimit: number | string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  jazzcashNumber: string | null;
  easypaisaNumber: string | null;
  raastId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  business?: SupplierBusinessInfo | null;
  invoices?: SupplierInvoice[];
}

export interface SupplierInvoice {
  id: number;
  supplierId: number | null;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  supplierNameSnapshot: string;
  supplierCategorySnapshot: SupplierCategory | null;
  invoiceNumber: string | null;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  description: string | null;
  attachmentUrl: string | null;
  status: InvoiceStatus;
  statusReason: string | null;
  lastPaymentAt: string | null;
  lastPaymentVia: SupplierPaymentMethod | null;
  lastPaymentRef: string | null;
  receivedAt: string | null;
  fullyPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: number;
    name: string;
    category: SupplierCategory;
    isActive?: boolean;
  } | null;
  booking?: {
    id: number;
    bookingDate: string | null;
    status: string | null;
  } | null;
}

export interface SupplierSummary {
  byCategory: Partial<Record<SupplierCategory, number>>;
  activeCount: number;
  inactiveCount: number;
}

export interface InvoiceSummary {
  byStatus: Partial<Record<InvoiceStatus, number>>;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface AgingBucket {
  count: number;
  total: number;
}
export interface SupplierAgingRow {
  supplierId: number | null;
  supplierName: string;
  supplierCategory: SupplierCategory | null;
  outstanding: number;
  invoiceCount: number;
}
export interface AgingReport {
  buckets: {
    current: AgingBucket;
    d0_7: AgingBucket;
    d8_30: AgingBucket;
    d31_60: AgingBucket;
    d60plus: AgingBucket;
  };
  perSupplier: SupplierAgingRow[];
  grandTotal: number;
}

export interface CreateSupplierInput {
  businessId: number;
  name: string;
  category?: SupplierCategory;
  contactPerson?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  address?: string;
  ntn?: string;
  strn?: string;
  defaultPaymentTermsDays?: number;
  creditLimit?: number;
  bankName?: string;
  bankAccountNumber?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  raastId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {}

export interface CreateInvoiceInput {
  businessId: number;
  supplierId?: number;
  bookingId?: number;
  supplierNameSnapshot?: string;
  supplierCategorySnapshot?: SupplierCategory;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount?: number;
  description?: string;
  attachmentUrl?: string;
}

export interface UpdateInvoiceInput {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  subtotal?: number;
  taxAmount?: number;
  bookingId?: number | null;
  description?: string | null;
  attachmentUrl?: string | null;
}

export interface RecordPaymentInput {
  amount: number;
  method: SupplierPaymentMethod;
  ref?: string;
  paymentDate?: string;
}

export interface TransitionInvoiceInput {
  to: InvoiceStatus;
  statusReason?: string;
}

export class SupplierAPI {
  // ─── Suppliers ────────────────────────────────────────────────
  static async list(filters: {
    category?: SupplierCategory;
    isActive?: boolean;
    businessId?: number;
    search?: string;
  } = {}): Promise<{ suppliers: Supplier[]; summary: SupplierSummary }> {
    const params: Record<string, any> = { ...filters };
    if (typeof filters.isActive === "boolean") {
      params.isActive = filters.isActive ? "true" : "false";
    }
    const res = await axiosInstance.get(`/api/v1/suppliers`, { params });
    return (
      res.data?.data ?? {
        suppliers: [],
        summary: { byCategory: {}, activeCount: 0, inactiveCount: 0 },
      }
    );
  }

  static async get(
    id: number,
  ): Promise<{ supplier: Supplier; outstanding: number } | null> {
    const res = await axiosInstance.get(`/api/v1/suppliers/${id}`);
    return res.data?.data ?? null;
  }

  static async create(body: CreateSupplierInput): Promise<Supplier> {
    const res = await axiosInstance.post(`/api/v1/suppliers`, body);
    return res.data?.data?.supplier;
  }

  static async update(
    id: number,
    body: UpdateSupplierInput,
  ): Promise<Supplier> {
    const res = await axiosInstance.patch(`/api/v1/suppliers/${id}`, body);
    return res.data?.data?.supplier;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/suppliers/${id}`);
  }

  // ─── Invoices ─────────────────────────────────────────────────
  static async listInvoices(filters: {
    supplierId?: number;
    bookingId?: number;
    businessId?: number;
    status?: InvoiceStatus;
    from?: string;
    to?: string;
  } = {}): Promise<{ invoices: SupplierInvoice[]; summary: InvoiceSummary }> {
    const res = await axiosInstance.get(`/api/v1/suppliers/invoices`, {
      params: filters,
    });
    return (
      res.data?.data ?? {
        invoices: [],
        summary: {
          byStatus: {},
          totalAmount: 0,
          totalPaid: 0,
          totalOutstanding: 0,
        },
      }
    );
  }

  static async getInvoice(id: number): Promise<SupplierInvoice | null> {
    const res = await axiosInstance.get(`/api/v1/suppliers/invoices/${id}`);
    return res.data?.data?.invoice ?? null;
  }

  static async createInvoice(
    body: CreateInvoiceInput,
  ): Promise<SupplierInvoice> {
    const res = await axiosInstance.post(`/api/v1/suppliers/invoices`, body);
    return res.data?.data?.invoice;
  }

  static async updateInvoice(
    id: number,
    body: UpdateInvoiceInput,
  ): Promise<SupplierInvoice> {
    const res = await axiosInstance.patch(
      `/api/v1/suppliers/invoices/${id}`,
      body,
    );
    return res.data?.data?.invoice;
  }

  static async recordPayment(
    id: number,
    body: RecordPaymentInput,
  ): Promise<{
    invoice: SupplierInvoice;
    payment: { amount: number; method: string; ref: string | null };
    result: {
      newAmountPaid: number;
      newAmountOutstanding: number;
      newStatus: InvoiceStatus;
      autoTransitioned: boolean;
    };
  }> {
    const res = await axiosInstance.post(
      `/api/v1/suppliers/invoices/${id}/payment`,
      body,
    );
    return res.data?.data;
  }

  static async transitionInvoice(
    id: number,
    body: TransitionInvoiceInput,
  ): Promise<SupplierInvoice> {
    const res = await axiosInstance.post(
      `/api/v1/suppliers/invoices/${id}/transition`,
      body,
    );
    return res.data?.data?.invoice;
  }

  static async removeInvoice(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/suppliers/invoices/${id}`);
  }

  static async aging(filters: { businessId?: number } = {}): Promise<AgingReport> {
    const res = await axiosInstance.get(`/api/v1/suppliers/aging`, {
      params: filters,
    });
    return (
      res.data?.data ?? {
        buckets: {
          current: { count: 0, total: 0 },
          d0_7: { count: 0, total: 0 },
          d8_30: { count: 0, total: 0 },
          d31_60: { count: 0, total: 0 },
          d60plus: { count: 0, total: 0 },
        },
        perSupplier: [],
        grandTotal: 0,
      }
    );
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  meat: "Meat",
  produce: "Produce / sabzi",
  atta_grains: "Atta / grains",
  dairy: "Dairy",
  oil_ghee: "Oil / ghee",
  spices: "Spices",
  frozen_seafood: "Frozen seafood",
  bakery_sweets: "Bakery / sweets",
  flowers: "Flowers",
  decor_materials: "Decor materials",
  linen_uniforms: "Linen / uniforms",
  equipment_rental: "Equipment rental",
  generator_rental: "Generator rental",
  vehicle_rental: "Vehicle rental",
  brokerage: "Brokerage",
  utilities: "Utilities",
  transport_fuel: "Transport / fuel",
  stationery: "Stationery",
  professional_services: "Professional services",
  other: "Other",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  received: "Received",
  partially_paid: "Partially paid",
  paid: "Paid",
  disputed: "Disputed",
  void: "Voided",
  overdue: "Overdue",
};

export const PAYMENT_METHOD_LABELS: Record<SupplierPaymentMethod, string> = {
  cash: "Cash",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "IBFT",
  bank_transfer: "Bank transfer",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
  cheque: "Cheque",
  post_dated_cheque: "Post-dated cheque",
  other: "Other",
};

export const INVOICE_STATUS_TONES: Record<
  InvoiceStatus,
  { bg: string; text: string; border: string }
> = {
  draft: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
  received: {
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
