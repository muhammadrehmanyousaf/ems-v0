/**
 * Promotions / Featured-listing API (§5).
 * Vendor: request a placement + list own requests. Super-admin: queue
 * + approve/reject. Pricing is indicative (D7 placeholder).
 */

import axiosInstance from "@/lib/axiosConfig";

export type PromotionPlacement = "homepage" | "category" | "city" | "search";
export type PromotionStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";

export interface PromotionRequestRow {
  id: number;
  businessId: number;
  requestedByUserId: number;
  placement: PromotionPlacement;
  windowDays: number;
  priceQuoted: number | string | null;
  status: PromotionStatus;
  note: string | null;
  decidedByUserId: number | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  business?: {
    id: number;
    name: string | null;
    city?: string | null;
    rating?: number | string | null;
    sponsored?: boolean;
    promotionEndsAt?: string | null;
    status?: string | null;
  } | null;
  requestedBy?: { id: number; fullName: string | null; email: string | null } | null;
}

export interface PricingPlacement {
  placement: PromotionPlacement;
  label: string;
  prices: { windowDays: number; priceQuoted: number }[];
}

export const PLACEMENT_LABEL: Record<PromotionPlacement, string> = {
  homepage: "Homepage hero",
  category: "Category top",
  city: "City top",
  search: "Search boost",
};

export class PromotionsAPI {
  static async getPricing(): Promise<PricingPlacement[]> {
    const res = await axiosInstance.get("/api/v1/promotions/pricing");
    return res.data?.data?.pricing ?? [];
  }

  static async listMine(): Promise<{ requests: PromotionRequestRow[]; pricing: PricingPlacement[] }> {
    const res = await axiosInstance.get("/api/v1/promotions/mine");
    return res.data?.data ?? { requests: [], pricing: [] };
  }

  static async create(input: {
    businessId: number;
    placement: PromotionPlacement;
    windowDays: number;
    note?: string;
  }): Promise<PromotionRequestRow> {
    const res = await axiosInstance.post("/api/v1/promotions", input);
    return res.data?.data?.request;
  }

  // Super-admin
  static async queue(status: PromotionStatus | "all" = "pending"): Promise<PromotionRequestRow[]> {
    const res = await axiosInstance.get(`/api/v1/promotions/admin/queue?status=${status}`);
    return res.data?.data?.requests ?? [];
  }

  static async approve(id: number, startsAt?: string): Promise<void> {
    await axiosInstance.post(`/api/v1/promotions/admin/${id}/approve`, startsAt ? { startsAt } : {});
  }

  static async reject(id: number, reason: string): Promise<void> {
    await axiosInstance.post(`/api/v1/promotions/admin/${id}/reject`, { reason });
  }
}
