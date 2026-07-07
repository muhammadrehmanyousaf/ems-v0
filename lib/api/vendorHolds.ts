/**
 * Phase-3 EPIC 4 · PWA-02 — vendor date-holds API client.
 *
 * Mirrors /api/v1/vendor-holds. A vendor tentatively holds a date on their own
 * calendar. Online → these endpoints; offline → the FE queues a hold_date op in
 * the outbox (lib/outbox) and it syncs via /api/v1/sync/outbox. Both share the
 * same race-safe slot guard on the backend.
 */

import axiosInstance from "@/lib/axiosConfig";

export interface VendorHold {
  id: number;
  businessId: number;
  holdDate: string; // YYYY-MM-DD
  holdTime: string;
  expiresAt: string;
  bookingId: number | null;
  createdAt: string;
}

export interface PlaceHoldInput {
  businessId?: number;
  holdDate: string;
  holdTime: string;
}

export class VendorHoldsAPI {
  static async list(): Promise<VendorHold[]> {
    const res = await axiosInstance.get(`/api/v1/vendor-holds`);
    return res.data?.data?.holds ?? [];
  }

  /** Place (or extend own) a hold. Throws on 409 conflict (slot taken). */
  static async place(body: PlaceHoldInput): Promise<{ holdId: number; alreadyHeld: boolean; expiresAt: string }> {
    const res = await axiosInstance.post(`/api/v1/vendor-holds`, body);
    return res.data?.data;
  }

  static async release(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/vendor-holds/${id}`);
  }
}

/** Pakistani-wedding-relevant slot labels for the hold picker. */
export const HOLD_SLOT_PRESETS = ["Morning", "Afternoon", "Evening", "Full day", "Mehndi", "Baraat", "Walima"] as const;
