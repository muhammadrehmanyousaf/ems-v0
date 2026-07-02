/**
 * Vendor Portal Phase 2 #8.3 — Vendor expenses API client.
 *
 * Mirrors the backend at /api/v1/expenses. Vendor-scoped CRUD plus
 * a per-event P&L endpoint that aggregates inflows + outflows for
 * a single booking and runs them through the pure-function helper.
 */

import axiosInstance from "@/lib/axiosConfig";

export type ExpenseCategory =
  | "ingredients"
  | "fuel"
  | "labour"
  // Issue #42 — vendors needed a dedicated "salary" bucket so they
  // could separate monthly payroll from casual day-labour hours
  // (labour bucket above).
  | "salary"
  | "electricity"
  | "rentals"
  | "repairs"
  | "marketing"
  | "brokerage"
  | "tax"
  | "supplies"
  | "transport"
  | "other";

export type ExpensePaymentMethod =
  | "cash"
  | "bank_transfer"
  | "cheque"
  | "jazzcash"
  | "easypaisa"
  | "raast"
  | "ibft"
  | "card"
  | "other";

export interface VendorExpense {
  id: number;
  amount: number | string;
  category: ExpenseCategory;
  subcategory: string | null;
  vendorName: string | null;
  description: string | null;
  spentDate: string; // YYYY-MM-DD
  paymentMethod: ExpensePaymentMethod | null;
  photoUrl: string | null;
  bookingId: number | null;
  createdByUserId: number;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: number;
    bookingDate: string | null;
    customerName: string | null;
    totalAmount: number | string | null;
  } | null;
  // Venue-hierarchy: which space (hall/floor/partition) this expense hit.
  businessId?: number | null;
  subVenueId?: number | null;
  scopeType?: string | null;
  subVenue?: { id: number; name: string; kind?: string; depth?: number } | null;
}

export interface ExpenseSummary {
  total: number;
  byCategory: Partial<Record<ExpenseCategory, number>>;
}

export interface ExpenseListResponse {
  expenses: VendorExpense[];
  summary: ExpenseSummary;
}

export interface CreateExpenseInput {
  amount: number;
  category: ExpenseCategory;
  subcategory?: string;
  vendorName?: string;
  description?: string;
  spentDate: string;
  paymentMethod?: ExpensePaymentMethod;
  photoUrl?: string;
  bookingId?: number | null;
  businessId?: number | null;
  subVenueId?: number | null;
  scopeType?: string | null;
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export interface ExpenseFilters {
  bookingId?: number;
  category?: ExpenseCategory;
  from?: string;
  to?: string;
}

export interface PerEventPnl {
  gross: number;
  platformFee: number;
  received: number;
  receivedBySource: {
    transactions: number;
    receipts: number;
    pdcsCleared: number;
  };
  held: number;
  expenses: number;
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
  net: number;
  cashflow: number;
}

export class ExpensesAPI {
  static async list(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    const res = await axiosInstance.get(`/api/v1/expenses`, { params: filters });
    return (
      res.data?.data ??
      ({ expenses: [], summary: { total: 0, byCategory: {} } } as ExpenseListResponse)
    );
  }

  static async get(id: number): Promise<VendorExpense | null> {
    const res = await axiosInstance.get(`/api/v1/expenses/${id}`);
    return res.data?.data?.expense ?? null;
  }

  static async create(body: CreateExpenseInput): Promise<VendorExpense> {
    const res = await axiosInstance.post(`/api/v1/expenses`, body);
    return res.data?.data?.expense;
  }

  static async update(id: number, body: UpdateExpenseInput): Promise<VendorExpense> {
    const res = await axiosInstance.patch(`/api/v1/expenses/${id}`, body);
    return res.data?.data?.expense;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/expenses/${id}`);
  }

  /** GET /api/v1/expenses/booking/:bookingId/pnl */
  static async pnlForBooking(bookingId: number): Promise<PerEventPnl | null> {
    const res = await axiosInstance.get(
      `/api/v1/expenses/booking/${bookingId}/pnl`,
    );
    return res.data?.data?.pnl ?? null;
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: "Ingredients",
  fuel: "Fuel (diesel / petrol)",
  labour: "Casual labour",
  salary: "Salary / payroll",
  electricity: "Electricity",
  rentals: "Rentals",
  repairs: "Repairs",
  marketing: "Marketing",
  brokerage: "Broker commission",
  tax: "Tax (FBR / SECP)",
  supplies: "Supplies",
  transport: "Transport (non-fuel)",
  other: "Other",
};

export const EXPENSE_CATEGORY_TONES: Record<
  ExpenseCategory,
  { bg: string; text: string; border: string }
> = {
  ingredients: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-300" },
  fuel: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  labour: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  salary: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-300" },
  electricity: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-300" },
  rentals: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-300" },
  repairs: { bg: "bg-slate-50", text: "text-slate-800", border: "border-slate-300" },
  marketing: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  brokerage: { bg: "bg-pink-50", text: "text-pink-800", border: "border-pink-300" },
  tax: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  supplies: { bg: "bg-cyan-50", text: "text-cyan-800", border: "border-cyan-300" },
  transport: { bg: "bg-indigo-50", text: "text-indigo-800", border: "border-indigo-300" },
  other: { bg: "bg-neutral-100", text: "text-neutral-700", border: "border-neutral-300" },
};

export const EXPENSE_PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  raast: "Raast",
  ibft: "IBFT",
  card: "Card",
  other: "Other",
};
