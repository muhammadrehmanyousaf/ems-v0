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
  // WW-QUOTE-PIPELINE — a trail entry can now carry the whole document that was
  // on the table at that moment, so "v2" can be re-opened rather than inferred
  // from a bare price.
  version?: number | null;
  lines?: QuoteLine[] | null;
  validUntil?: string | null;
  bookingId?: number | null;
  siteVisitAt?: string | null;
  siteVisitStatus?: SiteVisitStatus | null;
}

/** WW-QUOTE-PIPELINE — one row of a quotation. */
export type QuoteLineKind = "hall" | "package" | "menu" | "extra" | "discount" | "tax";
export type QuoteLineUnit = "per_event" | "per_head" | "percent";

export interface QuoteLine {
  label: string;
  kind: QuoteLineKind;
  unit: QuoteLineUnit;
  unitPrice: number;
  qty: number | null;
  note?: string | null;
  /** Server-computed. Never sent up — the server derives it from the row. */
  total?: number;
}

export type SiteVisitStatus = "proposed" | "confirmed" | "completed" | "declined";

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
  // ── WW-QUOTE-PIPELINE (migration 20260824140000) ──
  /** The priced breakdown. NULL on a legacy single-number quote. */
  lineItems: QuoteLine[] | null;
  /** YYYY-MM-DD. After this the quote can't be countered or accepted. */
  validUntil: string | null;
  /** Bumped on each vendor revision, so both sides can refer to "v2". */
  version: number | null;
  /** The slot agreed during negotiation — needed to turn this into a booking. */
  eventTime: string | null;
  siteVisitAt: string | null;
  siteVisitStatus: SiteVisitStatus | null;
  /** Set once accepted — the booking this quote became. */
  bookingId: number | null;
  // Populated on list endpoints:
  business?: { id: number; name: string | null; city: string | null; slug: string | null };
  customer?: { id: number; fullName: string | null; email: string | null; phoneNumber: string | null };
}

/** Optional document fields carried by respond / counter. */
export interface QuoteDocumentInput {
  lineItems?: QuoteLine[];
  /** YYYY-MM-DD */
  validUntil?: string | null;
  /** HH:mm */
  eventTime?: string | null;
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

  /**
   * Vendor sends a price → quoted.
   *
   * `extras` are all optional. Omit them and this is the old single-number
   * quote, unchanged — which is what every negotiation already in flight uses.
   */
  static async respond(
    id: number,
    quotedPrice: number,
    message?: string,
    extras?: QuoteDocumentInput,
  ): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/respond`, { quotedPrice, message, ...extras }));
  }

  /** Either side proposes a new price → countered. */
  static async counter(
    id: number,
    price: number,
    message?: string,
    extras?: QuoteDocumentInput,
  ): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/counter`, { price, message, ...extras }));
  }

  /**
   * Accept the standing offer → accepted, AND create the booking.
   *
   * Returns the booking id alongside the quote so the caller can send the
   * customer straight to paying the advance. Before WW-QUOTE-PIPELINE this
   * endpoint accepted the quote and created nothing at all.
   */
  static async accept(id: number, message?: string): Promise<{ quote: Quote; bookingId: number | null }> {
    const res = await axiosInstance.post(`/api/v1/quotes/${id}/accept`, { message });
    return {
      quote: res?.data?.data?.quote,
      bookingId: res?.data?.data?.bookingId ?? null,
    };
  }

  /** Propose / confirm / decline / complete the family's walk-through. */
  static async siteVisit(
    id: number,
    action: "propose" | "confirm" | "decline" | "complete",
    at?: string,
    message?: string,
  ): Promise<Quote> {
    return one(await axiosInstance.post(`/api/v1/quotes/${id}/site-visit`, { action, at, message }));
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

/**
 * WW-QUOTE-PIPELINE — price a set of lines client-side.
 *
 * Mirrors `src/utils/quoteDocument.js` on the server, and for the same reason
 * the pricing mirrors exist: the vendor must see, while typing, exactly the
 * total the server will compute. The server remains the authority — it
 * recomputes and ignores whatever total we send — but a builder that showed a
 * different number while you typed would be worse than no builder.
 *
 * Charges first, then percent lines against the charge subtotal, whatever order
 * the rows are in.
 */
export function priceQuoteLines(
  lines: QuoteLine[],
  guestCount: number | null | undefined,
): { subtotal: number; total: number; priced: QuoteLine[] } {
  const heads = Math.max(0, Math.floor(Number(guestCount) || 0));
  const round = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

  const charges = lines.filter((l) => l.unit !== "percent");
  const adjustments = lines.filter((l) => l.unit === "percent");

  let subtotal = 0;
  const priced: QuoteLine[] = [];
  for (const l of charges) {
    const qty =
      l.unit === "per_head"
        ? Math.max(0, Math.floor(Number(l.qty) || heads))
        : Math.max(1, Math.floor(Number(l.qty) || 1));
    const total = round((Number(l.unitPrice) || 0) * qty);
    subtotal = round(subtotal + total);
    priced.push({ ...l, qty, total });
  }
  let total = subtotal;
  for (const l of adjustments) {
    const amount = round((subtotal * (Number(l.unitPrice) || 0)) / 100);
    total = round(total + amount);
    priced.push({ ...l, qty: null, total: amount });
  }
  return { subtotal, total, priced };
}

/**
 * Has the quote lapsed? Inclusive of the final day — a quote valid until the
 * 30th is good all of the 30th.
 */
export function quoteIsExpired(quote: Pick<Quote, "validUntil">): boolean {
  if (!quote.validUntil) return false;
  const today = new Date().toISOString().slice(0, 10);
  return today > String(quote.validUntil).slice(0, 10);
}

export const SITE_VISIT_LABELS: Record<SiteVisitStatus, string> = {
  proposed: "Visit proposed",
  confirmed: "Visit confirmed",
  completed: "Visit done",
  declined: "Visit declined",
};

export const QUOTE_LINE_KINDS: { value: QuoteLineKind; label: string }[] = [
  { value: "hall", label: "Hall / venue" },
  { value: "menu", label: "Menu" },
  { value: "package", label: "Package" },
  { value: "extra", label: "Extra" },
  { value: "discount", label: "Discount" },
  { value: "tax", label: "Tax" },
];

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
