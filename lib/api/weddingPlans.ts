/**
 * Shaadi Plan — WeddingPlan API client.
 *
 * Typed façade over `/api/v1/wedding-plans/*` (spec §4). A "plan" is a
 * WeddingUmbrella that also carries WeddingEvents (one per function:
 * Mayoun/Mehndi/…/Walima) and WeddingPlanItems (one per event×vendor
 * cart line). Mirrors the axios pattern of `lib/api/weddingUmbrellas.ts`
 * (`res.data?.data?.<key>` unwrapping, static-method class, defensive
 * fallbacks).
 *
 * The whole surface 404s while the BE flag `FEAT_WEDDING_PLAN` is off —
 * so a caller with the FE flag on but the BE flag off simply gets no
 * data (the pages degrade to an error/empty state).
 *
 * PATH ASSUMPTION (spec §4 writes item routes as "…/items/:itemId" with
 * an elided prefix): items are nested under their event, matching the
 * explicit `POST /wedding-plans/:id/events/:eventId/items`. So edit/
 * remove/inquire live at `/wedding-plans/:id/events/:eventId/items/:itemId`.
 * All item paths are built by `itemPath()` — one place to change if the
 * BE settled on a flat `/wedding-plans/:id/items/:itemId` instead.
 */

import axiosInstance from "@/lib/axiosConfig";
import type { BundleTier } from "@/lib/api/weddingUmbrellas";

export type { BundleTier } from "@/lib/api/weddingUmbrellas";

const BASE = "/api/v1/wedding-plans";

// ---------------------------------------------------------------------------
// Enums / canonical vocab (spec §3.1, §3.2, §7)
// ---------------------------------------------------------------------------

export type WeddingPlanStatus = "planning" | "active" | "completed" | "cancelled";

export type WeddingEventType =
  | "mayoun"
  | "mehndi"
  | "dholki"
  | "nikah"
  | "baraat"
  | "walima"
  | "reception"
  | "other";

export type PlanItemStatus =
  | "shortlisted"
  | "inquiry_sent"
  | "quoted"
  | "booked"
  | "declined"
  | "removed";

// ---------------------------------------------------------------------------
// Core rows
// ---------------------------------------------------------------------------

/** The plan itself (a WeddingUmbrella row, plan-native naming). */
export interface WeddingPlan {
  id: number;
  ownerUserId: number | null;
  title: string | null;
  weddingDate: string | null; // YYYY-MM-DD
  brideName: string | null;
  groomName: string | null;
  primaryCity: string | null;
  estimatedGuests: number | null;
  budgetMin: number | string | null; // PG DECIMAL → string via Sequelize
  budgetMax: number | string | null;
  culturalMetadataJson: Record<string, unknown> | null;
  status: WeddingPlanStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on the thin list endpoint as a convenience count.
  eventCount?: number;
  itemCount?: number;
}

/** A single vendor line inside an event (event × business). */
export interface PlanItem {
  id: number;
  umbrellaId: number;
  weddingEventId: number;
  businessId: number;
  vendorType: string | null;
  status: PlanItemStatus;
  quotedAmount: number | string | null;
  agreedAmount: number | string | null;
  /** Package / menu selection — the customer picked WHICH package; the server
   * prices it. Lets a package-only vendor (NULL minimumPrice) be cart-booked. */
  packageId: number | null;
  menuId: number | null;
  vehicleQuantity: number | null;
  bookingId: number | null;
  leadId: number | null;
  customOrderId: number | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Snapshot of the business for display — attached by GET /:id. */
  business?: {
    id: number;
    name: string;
    city?: string | null;
    vendorType?: string | null;
    images?: string[] | null;
  } | null;
  /** Live booking status once the line materialises — attached by GET /:id. */
  booking?: {
    id: number;
    status: string;
    paymentStatus?: string | null;
    totalAmount?: number | string | null;
  } | null;
}

/** One wedding function; its date/city/guests are shared by all its lines. */
export interface WeddingEvent {
  id: number;
  umbrellaId: number;
  eventType: WeddingEventType;
  title: string | null;
  eventDate: string | null; // YYYY-MM-DD
  city: string | null;
  expectedGuests: number | null;
  slotTime: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Grouped lines — attached by GET /:id. */
  items?: PlanItem[];
}

// ---------------------------------------------------------------------------
// Computed blocks on GET /:id (spec §4, §5)
// ---------------------------------------------------------------------------

/** Plan-wide money roll-up across all active lines. */
export interface PlanBudgetSummary {
  /** Sum of agreedAmount across active (non-removed/declined) lines. */
  itemsSubtotal: number;
  /** Sum for lines already booked. */
  bookedTotal: number;
  /** Estimated bundle savings at the current final-count tier. */
  estimatedSavings: number;
  /** Subtotal minus estimated savings. */
  projectedTotal: number;
  budgetMin: number | null;
  budgetMax: number | null;
  /** Count of active (bookable) lines. */
  itemCount: number;
  /** Count of events that would result in a booking (≥1 bookable line). */
  bookableEventCount: number;
}

/**
 * Non-order-dependent discount preview (spec §5). `eligibleCount` is the
 * number of *events* that will book — an event with ≥1 bookable line
 * counts once. `percent` is the tier for the *final* projected count,
 * computed once.
 */
export interface PlanDiscountPreview {
  eligibleCount: number;
  tier: BundleTier | null;
  percent: number;
  subtotal: number;
  estimatedSavings: number;
}

/** GET /wedding-plans/:id — the full plan the builder renders. */
export interface PlanFull {
  plan: WeddingPlan;
  events: WeddingEvent[];
  budget: PlanBudgetSummary;
  discount: PlanDiscountPreview;
  tiers: BundleTier[];
}

// ---------------------------------------------------------------------------
// Availability + checkout (spec §4, §6)
// ---------------------------------------------------------------------------

export type AvailabilityStatus = "available" | "unavailable" | "unknown";

export interface AvailabilityResult {
  itemId: number;
  status: AvailabilityStatus | string;
  /** Human-readable warning ("This slot was just taken"). */
  message?: string | null;
  businessId?: number;
  weddingEventId?: number;
}

export interface CheckoutBooked {
  itemId: number;
  bookingId: number;
  weddingEventId?: number;
}
export interface CheckoutSkipped {
  itemId: number;
  reason: string;
  weddingEventId?: number;
}
export interface CheckoutFailed {
  itemId: number;
  error: string;
  weddingEventId?: number;
}

/** POST /wedding-plans/:id/checkout — the orchestrator's per-line report. */
export interface CheckoutOutcome {
  plan?: WeddingPlan;
  booked: CheckoutBooked[];
  skipped: CheckoutSkipped[];
  failed: CheckoutFailed[];
  discountPercent?: number;
  totals?: {
    subtotal?: number;
    discount?: number;
    total?: number;
  };
}

// ---------------------------------------------------------------------------
// Unified "pay for my whole wedding" (GET /:id/payment-summary)
// ---------------------------------------------------------------------------

export type PlanPaymentType = "down_payment" | "remaining_payment";

/** One Booking child in the plan's pay manifest. */
export interface PlanPayableBooking {
  bookingId: number;
  status: string;
  paymentStatus: string;
  eventType: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  vendorName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  downPayment: number;
  /** True when money is still owed AND the per-booking endpoint will accept it. */
  payable: boolean;
  /** Which payment the FE hands to the existing pay component. */
  paymentType: PlanPaymentType | null;
  /** The amount the SERVER will charge for that paymentType. */
  dueNow: number;
  /** Why it isn't payable (settled|cancelled|not_ready|zero), else null. */
  reason: string | null;
}

export interface PlanPaymentAggregate {
  totalCount: number;
  payableCount: number;
  settledCount: number;
  totalDueNow: number;
  totalBooked: number;
}

/** GET /wedding-plans/:id/payment-summary — the unified pay manifest. */
export interface PlanPaymentSummary {
  umbrellaId: number;
  planTitle: string | null;
  weddingDate: string | null;
  currency: string;
  bookings: PlanPayableBooking[];
  aggregate: PlanPaymentAggregate;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface CreatePlanInput {
  title?: string;
  weddingDate?: string;
  brideName?: string;
  groomName?: string;
  primaryCity?: string;
  estimatedGuests?: number;
  budgetMin?: number;
  budgetMax?: number;
  culturalMetadataJson?: Record<string, unknown>;
  notes?: string;
}

export type UpdatePlanInput = Partial<
  CreatePlanInput & { status: WeddingPlanStatus }
>;

export interface CreateEventInput {
  eventType: WeddingEventType;
  title?: string;
  eventDate?: string;
  city?: string;
  expectedGuests?: number;
  slotTime?: string;
  notes?: string;
  sortOrder?: number;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface AddItemInput {
  businessId: number;
  vendorType?: string;
  agreedAmount?: number;
  notes?: string;
  packageId?: number | null;
  menuId?: number | null;
  vehicleQuantity?: number | null;
}

export interface UpdateItemInput {
  agreedAmount?: number | null;
  notes?: string;
  status?: PlanItemStatus;
  /** Package/menu selection (a price is never sent — the server prices it). */
  packageId?: number | null;
  menuId?: number | null;
  vehicleQuantity?: number | null;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

/** Nested item path — see PATH ASSUMPTION in the file header. */
// The BE mutation routes for a single item are NON-nested — PATCH/DELETE
// `/wedding-plans/:id/items/:itemId` and POST `.../:itemId/inquire` (only ADD
// is nested under the event: POST `/:id/events/:eventId/items`). Building the
// nested path here made update / remove / inquire hit the API catch-all (a
// silent 200 that changes nothing — no price save, no remove, no inquiry).
// `eventId` stays in the signature (callers pass it) but isn't part of the URL.
function itemPath(planId: number, _eventId: number, itemId: number): string {
  return `${BASE}/${planId}/items/${itemId}`;
}

export class WeddingPlansAPI {
  // --- Plan lifecycle -----------------------------------------------------

  /** GET /wedding-plans/mine — caller's plans (thin). */
  static async listMine(): Promise<WeddingPlan[]> {
    const res = await axiosInstance.get(`${BASE}/mine`);
    const d = res.data?.data;
    return d?.plans ?? (Array.isArray(d) ? d : []);
  }

  /** POST /wedding-plans — create a plan (returns it with empty events/items). */
  static async create(body: CreatePlanInput): Promise<WeddingPlan> {
    const res = await axiosInstance.post(BASE, body);
    return res.data?.data?.plan ?? res.data?.data;
  }

  /** GET /wedding-plans/:id — full plan (events + items + budget + discount). */
  static async getFull(id: number): Promise<PlanFull | null> {
    const res = await axiosInstance.get(`${BASE}/${id}`);
    const d = res.data?.data;
    if (!d) return null;
    // Normalise: events[] may already carry items[]; if the BE sent a
    // flat items[] instead, group it by event so the builder never has
    // to care which shape arrived.
    const events: WeddingEvent[] = Array.isArray(d.events) ? d.events : [];
    const flatItems: PlanItem[] = Array.isArray(d.items) ? d.items : [];
    if (flatItems.length && events.every((e) => !e.items)) {
      for (const e of events) {
        e.items = flatItems.filter((it) => it.weddingEventId === e.id);
      }
    }
    return {
      plan: d.plan ?? d.umbrella ?? d,
      events,
      budget: d.budget ?? emptyBudget(),
      discount: d.discount ?? d.bundle ?? emptyDiscount(),
      tiers: Array.isArray(d.tiers) ? d.tiers : [],
    };
  }

  /** PATCH /wedding-plans/:id — partial update. */
  static async update(id: number, body: UpdatePlanInput): Promise<WeddingPlan> {
    const res = await axiosInstance.patch(`${BASE}/${id}`, body);
    return res.data?.data?.plan ?? res.data?.data;
  }

  /** DELETE /wedding-plans/:id — soft delete. */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`${BASE}/${id}`);
  }

  // --- Events -------------------------------------------------------------

  /** POST /wedding-plans/:id/events — add a function. */
  static async addEvent(
    planId: number,
    body: CreateEventInput,
  ): Promise<WeddingEvent> {
    const res = await axiosInstance.post(`${BASE}/${planId}/events`, body);
    return res.data?.data?.event ?? res.data?.data;
  }

  /** PATCH /wedding-plans/:id/events/:eventId — edit a function. */
  static async updateEvent(
    planId: number,
    eventId: number,
    body: UpdateEventInput,
  ): Promise<WeddingEvent> {
    const res = await axiosInstance.patch(
      `${BASE}/${planId}/events/${eventId}`,
      body,
    );
    return res.data?.data?.event ?? res.data?.data;
  }

  /** DELETE /wedding-plans/:id/events/:eventId — remove (409 if booked lines). */
  static async removeEvent(planId: number, eventId: number): Promise<void> {
    await axiosInstance.delete(`${BASE}/${planId}/events/${eventId}`);
  }

  // --- Plan items (event × vendor lines) ----------------------------------

  /** POST /wedding-plans/:id/events/:eventId/items — add a vendor line. */
  static async addItem(
    planId: number,
    eventId: number,
    body: AddItemInput,
  ): Promise<PlanItem> {
    const res = await axiosInstance.post(
      `${BASE}/${planId}/events/${eventId}/items`,
      body,
    );
    return res.data?.data?.item ?? res.data?.data;
  }

  /** PATCH …/items/:itemId — edit agreedAmount / notes / status. */
  static async updateItem(
    planId: number,
    eventId: number,
    itemId: number,
    body: UpdateItemInput,
  ): Promise<PlanItem> {
    const res = await axiosInstance.patch(itemPath(planId, eventId, itemId), body);
    return res.data?.data?.item ?? res.data?.data;
  }

  /** DELETE …/items/:itemId — soft-remove (status→removed; 409 if booked). */
  static async removeItem(
    planId: number,
    eventId: number,
    itemId: number,
  ): Promise<void> {
    await axiosInstance.delete(itemPath(planId, eventId, itemId));
  }

  /** POST …/items/:itemId/inquire — send a form_inquiry Lead for this line. */
  static async inquireItem(
    planId: number,
    eventId: number,
    itemId: number,
    body: { message?: string } = {},
  ): Promise<PlanItem> {
    const res = await axiosInstance.post(
      `${itemPath(planId, eventId, itemId)}/inquire`,
      body,
    );
    return res.data?.data?.item ?? res.data?.data;
  }

  // --- Availability + checkout -------------------------------------------

  /** POST /wedding-plans/:id/availability — per-line availability report. */
  static async availability(
    planId: number,
    body: { itemIds?: number[] } = {},
  ): Promise<AvailabilityResult[]> {
    const res = await axiosInstance.post(`${BASE}/${planId}/availability`, body);
    const d = res.data?.data;
    return d?.results ?? (Array.isArray(d) ? d : []);
  }

  /** POST /wedding-plans/:id/checkout — book the chosen lines. */
  static async checkout(
    planId: number,
    body: { itemIds: number[] },
  ): Promise<CheckoutOutcome> {
    const res = await axiosInstance.post(`${BASE}/${planId}/checkout`, body);
    const d = res.data?.data ?? {};
    return {
      plan: d.plan,
      booked: Array.isArray(d.booked) ? d.booked : [],
      skipped: Array.isArray(d.skipped) ? d.skipped : [],
      failed: Array.isArray(d.failed) ? d.failed : [],
      discountPercent: d.discountPercent,
      totals: d.totals,
    };
  }

  // --- Unified "pay for my whole wedding" --------------------------------

  /**
   * GET /wedding-plans/:id/payment-summary — every payable Booking child
   * (each with its due-now amount + paymentType) plus the aggregate total
   * owed. Drives the "Pay for my wedding" flow, which then reuses the
   * existing per-booking pay component once per booking (each settling via
   * the unchanged webhook). Returns null while the BE flag is off (404).
   */
  static async paymentSummary(planId: number): Promise<PlanPaymentSummary | null> {
    const res = await axiosInstance.get(`${BASE}/${planId}/payment-summary`);
    const d = res.data?.data;
    if (!d) return null;
    return {
      umbrellaId: d.umbrellaId ?? planId,
      planTitle: d.planTitle ?? null,
      weddingDate: d.weddingDate ?? null,
      currency: d.currency ?? "pkr",
      bookings: Array.isArray(d.bookings) ? d.bookings : [],
      aggregate: d.aggregate ?? {
        totalCount: 0,
        payableCount: 0,
        settledCount: 0,
        totalDueNow: 0,
        totalBooked: 0,
      },
    };
  }
}

function emptyBudget(): PlanBudgetSummary {
  return {
    itemsSubtotal: 0,
    bookedTotal: 0,
    estimatedSavings: 0,
    projectedTotal: 0,
    budgetMin: null,
    budgetMax: null,
    itemCount: 0,
    bookableEventCount: 0,
  };
}

function emptyDiscount(): PlanDiscountPreview {
  return { eligibleCount: 0, tier: null, percent: 0, subtotal: 0, estimatedSavings: 0 };
}
