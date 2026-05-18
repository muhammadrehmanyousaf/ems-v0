/**
 * BK-100.2 — WeddingUmbrella API client (Layer 1).
 *
 * Mirrors the backend at /api/v1/wedding-umbrellas. Layer 1 surface:
 * CRUD on the umbrella row + link/unlink one existing Booking.
 * Cascade semantics (umbrella-cancel → child-cancel) ship in Layer 2.
 *
 * The umbrella primitive models a Pakistani multi-event wedding —
 * Dholki → Mayoun → Mehndi → Nikah → Baraat → Rukhsati → Walima →
 * Reception, often spread across 2-3 weekends. Children are Booking
 * rows linked via the optional `Booking.umbrellaId` column.
 */

import axiosInstance from "@/lib/axiosConfig";

export type UmbrellaStatus =
  | "planning"
  | "active"
  | "completed"
  | "cancelled";

export interface WeddingUmbrella {
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
  status: UmbrellaStatus;
  notes: string | null;
  forceMajeure: boolean;
  createdAt: string;
  updatedAt: string;
  // Loaded only on GET /:id — minimal child shape (server attribute list).
  bookings?: Array<{
    id: number;
    customerName: string;
    bookingDate: string;
    bookingTime: string;
    status: string;
    paymentStatus: string;
    totalAmount: number | string;
    downPayment: number | string;
    eventCity: string | null;
    serviceLocationMode:
      | "at_vendor"
      | "at_customer_home"
      | "at_customer_plot"
      | "at_third_party"
      | null;
    bookingDetails?: Array<{
      id: number;
      businessId: number;
      business?: { id: number; name: string } | null;
    }>;
  }>;
}

export interface CreateUmbrellaInput {
  title?: string;
  weddingDate?: string; // ISO date / YYYY-MM-DD
  brideName?: string;
  groomName?: string;
  primaryCity?: string;
  estimatedGuests?: number;
  budgetMin?: number;
  budgetMax?: number;
  culturalMetadataJson?: Record<string, unknown>;
  notes?: string;
}

export type UpdateUmbrellaInput = Partial<
  CreateUmbrellaInput & {
    status: UmbrellaStatus;
    forceMajeure: boolean;
  }
>;

/**
 * BK-100.2 Layer 2b — bundle-discount preview block returned by GET
 * /api/v1/wedding-umbrellas/:id and the dedicated preview-bundle
 * endpoint. Pure read; the discount is only ACTUALLY APPLIED at
 * Booking creation time in Layer 2c (multi-event flow).
 */
export interface BundleTier {
  minCount: number;
  percent: number;
}

export interface BundlePreview {
  eligibleCount: number;
  tier: BundleTier | null;
  percent: number;
  subtotal: number;
  estimatedSavings: number;
}

export interface UmbrellaStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
}

export interface UmbrellaDetailResponse {
  umbrella: WeddingUmbrella;
  stats: UmbrellaStats;
  bundle: BundlePreview;
  tiers: BundleTier[];
}

export class WeddingUmbrellasAPI {
  /** GET /api/v1/wedding-umbrellas/mine — caller's umbrellas. */
  static async listMine(): Promise<WeddingUmbrella[]> {
    const res = await axiosInstance.get("/api/v1/wedding-umbrellas/mine");
    return res.data?.data?.umbrellas ?? [];
  }

  /** POST /api/v1/wedding-umbrellas — create a new umbrella. */
  static async create(body: CreateUmbrellaInput): Promise<WeddingUmbrella> {
    const res = await axiosInstance.post("/api/v1/wedding-umbrellas", body);
    return res.data?.data?.umbrella;
  }

  /** GET /api/v1/wedding-umbrellas/:id — with children. */
  static async get(id: number): Promise<WeddingUmbrella | null> {
    const res = await axiosInstance.get(`/api/v1/wedding-umbrellas/${id}`);
    return res.data?.data?.umbrella ?? null;
  }

  /** GET /api/v1/wedding-umbrellas/:id — full response with stats + bundle. */
  static async getDetail(id: number): Promise<UmbrellaDetailResponse | null> {
    const res = await axiosInstance.get(`/api/v1/wedding-umbrellas/${id}`);
    return res.data?.data ?? null;
  }

  /** GET /api/v1/wedding-umbrellas/:id/preview-bundle — bundle preview only. */
  static async previewBundle(id: number): Promise<{ bundle: BundlePreview; tiers: BundleTier[] } | null> {
    const res = await axiosInstance.get(
      `/api/v1/wedding-umbrellas/${id}/preview-bundle`,
    );
    return res.data?.data ?? null;
  }

  /** PATCH /api/v1/wedding-umbrellas/:id — partial update. */
  static async update(
    id: number,
    body: UpdateUmbrellaInput,
  ): Promise<WeddingUmbrella> {
    const res = await axiosInstance.patch(
      `/api/v1/wedding-umbrellas/${id}`,
      body,
    );
    return res.data?.data?.umbrella;
  }

  /** DELETE /api/v1/wedding-umbrellas/:id — soft delete (paranoid). */
  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/wedding-umbrellas/${id}`);
  }

  /** POST /api/v1/wedding-umbrellas/:id/link — attach a Booking. */
  static async linkBooking(
    umbrellaId: number,
    bookingId: number,
  ): Promise<{ id: number; umbrellaId: number }> {
    const res = await axiosInstance.post(
      `/api/v1/wedding-umbrellas/${umbrellaId}/link`,
      { bookingId },
    );
    return res.data?.data?.booking;
  }

  /** POST /api/v1/wedding-umbrellas/:id/unlink — detach a Booking. */
  static async unlinkBooking(
    umbrellaId: number,
    bookingId: number,
  ): Promise<{ id: number; umbrellaId: null }> {
    const res = await axiosInstance.post(
      `/api/v1/wedding-umbrellas/${umbrellaId}/unlink`,
      { bookingId },
    );
    return res.data?.data?.booking;
  }

  /**
   * POST /api/v1/wedding-umbrellas/:id/cancel — BK-100.2 Layer 2c.
   *
   * Cascades cancel through every active child Booking + flips the
   * umbrella row to status='cancelled'. Returns per-child outcome so
   * the FE can show exactly what was cancelled vs. skipped.
   *
   * - `cascaded[]`: children we transitioned to Cancelled (from
   *   Pending / Awaiting Payment / Confirmed).
   * - `skipped[]`: children we left alone (already Completed,
   *   already Cancelled, or refused by state-machine).
   * - `failed[]`: children where the per-row transition threw (rare,
   *   reported for triage).
   *
   * Idempotent: calling on an already-cancelled umbrella returns
   * `{ noop: true }` with empty cascade arrays.
   */
  static async cancel(
    umbrellaId: number,
    body: { reason?: string; cascadeChildren?: boolean; forceMajeure?: boolean } = {},
  ): Promise<UmbrellaCancelResponse> {
    const res = await axiosInstance.post(
      `/api/v1/wedding-umbrellas/${umbrellaId}/cancel`,
      body,
    );
    return res.data?.data;
  }
}

export interface UmbrellaCancelOutcome {
  id: number;
  from?: string;
  to?: string;
  status?: string;
  reason?: string;
  error?: string;
}

export interface UmbrellaCancelResponse {
  umbrella: WeddingUmbrella;
  cascaded: UmbrellaCancelOutcome[];
  skipped: UmbrellaCancelOutcome[];
  failed: UmbrellaCancelOutcome[];
  noop?: boolean;
}
