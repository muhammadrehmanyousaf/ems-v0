/**
 * FEAT_QUOTE_NEGOTIATION — customer↔vendor quote/haggle API client.
 *
 * Mirrors /api/v1/quotes (auth'd + owner-scoped + flag-gated → 404 when dark).
 * Everything a customer haggling a Pakistani wedding vendor needs: open an
 * inquiry, see their own quotes, accept / counter / decline; and the vendor side:
 * see incoming quotes for a business they own, and respond / counter.
 */

import axiosInstance from "@/lib/axiosConfig";

export type QuoteStatus = "inquiry" | "quoted" | "countered" | "accepted" | "declined";
export type QuoteParty = "customer" | "vendor";

export interface QuoteHistoryEntry {
  by: QuoteParty;
  price: number | null;
  message: string | null;
  at: string;
}

export interface Quote {
  id: number;
  businessId: number;
  customerUserId: number | null;
  status: QuoteStatus;
  quotedPrice: string | number | null;
  lastCounterBy: QuoteParty | null;
  eventType: string | null;
  deliveryDate: string | null; // YYYY-MM-DD (the event date)
  guestCount: number | null;
  note: string | null;
  counterHistory: QuoteHistoryEntry[] | null;
  createdAt: string;
  updatedAt: string;
  // Populated on list endpoints:
  business?: { id: number; name: string | null; city: string | null; slug: string | null };
  customer?: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null };
}

export interface CreateQuoteInput {
  businessId: number;
  eventType?: string;
  eventDate?: string; // YYYY-MM-DD
  guestCount?: number;
  notes?: string;
}

const one = (res: any): Quote => res?.data?.data?.quote;
const many = (res: any): Quote[] => res?.data?.data?.quotes ?? [];

export class QuotesAPI {
  /** Customer opens a quote inquiry against a business. */
  static async create(body: CreateQuoteInput): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes`, body));
  }

  /** The customer's own quotes (newest first). */
  static async listMine(): Promise<Quote[]> {
    return many(await axiosInstance.get(`/api/v1/quotes/mine`));
  }

  /** A vendor's incoming customer quotes for a business they own. */
  static async listForBusiness(businessId: number): Promise<Quote[]> {
    return many(await axiosInstance.get(`/api/v1/quotes/business/${businessId}`));
  }

  static async getOne(id: number): Promise<Quote> {
    return one(await axiosInstance.get(`/api/v1/quotes/${id}`));
  }

  /** Vendor sends a price → quoted. */
  static async respond(id: number, quotedPrice: number, message?: string): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/respond`, { quotedPrice, message }));
  }

  /** Either side proposes a new price → countered. */
  static async counter(id: number, price: number, message?: string): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/counter`, { price, message }));
  }

  /** Accept the standing offer → accepted. */
  static async accept(id: number, message?: string): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/accept`, { message }));
  }

  /** Walk away → declined. */
  static async decline(id: number, reason?: string): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/decline`, { reason }));
  }
}

// ── Shared view helpers ──────────────────────────────────────────────

export const QUOTE_EVENT_TYPES = [
  { value: "", label: "Not sure yet" },
  { value: "mehndi", label: "Mehndi" },
  { value: "nikah", label: "Nikah" },
  { value: "baraat", label: "Baraat" },
  { value: "walima", label: "Walima" },
  { value: "engagement", label: "Engagement" },
  { value: "dholki", label: "Dholki" },
  { value: "other", label: "Other" },
] as const;

/** Whose turn is it? The ball is with the party who did NOT move last. */
export function isMyTurn(quote: Quote, myRole: QuoteParty): boolean {
  if (quote.status === "accepted" || quote.status === "declined") return false;
  return quote.lastCounterBy != null && quote.lastCounterBy !== myRole;
}

/** Is there a standing price you could accept/counter? */
export function hasStandingOffer(quote: Quote): boolean {
  return quote.status === "quoted" || quote.status === "countered";
}

export function formatPkr(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return `Rs ${n.toLocaleString("en-PK")}`;
}

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "inquiry": return "New request";
    case "quoted": return "Quote sent";
    case "countered": return "Counter offer";
    case "accepted": return "Accepted";
    case "declined": return "Declined";
    default: return status;
  }
}
