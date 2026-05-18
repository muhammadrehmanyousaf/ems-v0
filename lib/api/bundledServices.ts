/**
 * BK-100.52 — Bundled-services API client (Layer 1).
 *
 * Pakistani banquets routinely bundle catering + decor + DJ + valet
 * etc. directly into their venue price. This client wraps the backend
 * surface at /api/v1/businesses/:id/bundled-services + the outside-
 * vendor policy endpoint.
 */

import axiosInstance from "@/lib/axiosConfig";

export type BundledServiceCategory =
  | "catering"
  | "decor"
  | "dj"
  | "sound"
  | "photography"
  | "videography"
  | "valet"
  | "generator"
  | "floral"
  | "mehndi_artist"
  | "makeup"
  | "henna"
  | "live_streaming"
  | "cake"
  | "mithai"
  | "marquee"
  | "furniture"
  | "lighting"
  | "other";

export type BundledServicePriceModel =
  | "per_plate"
  | "flat"
  | "percentage_of_total"
  | "free";

export interface BundledService {
  id: number;
  businessId: number;
  category: BundledServiceCategory;
  name: string;
  description: string | null;
  priceModel: BundledServicePriceModel;
  /** Postgres DECIMAL → string via Sequelize. */
  priceAmount: number | string;
  included: boolean;
  mandatory: boolean;
  displayOrder: number;
  isActive: boolean;
  constraintsJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BundledServicesResponse {
  services: BundledService[];
  outsideVendorsAllowed: boolean | null;
  outsideVendorFee: number | string | null;
}

export interface UpsertBundledServiceInput {
  category?: BundledServiceCategory;
  name?: string;
  description?: string | null;
  priceModel?: BundledServicePriceModel;
  priceAmount?: number;
  included?: boolean;
  mandatory?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  constraintsJson?: Record<string, unknown> | null;
}

export interface OutsideVendorPolicyInput {
  outsideVendorsAllowed?: boolean | null;
  outsideVendorFee?: number | null;
}

export class BundledServicesAPI {
  /**
   * GET /api/v1/businesses/:id/bundled-services
   *
   * Public-ish — returns active rows for non-owners. Pass
   * `includeInactive=true` (owner / admin only) to also get inactive
   * rows.
   */
  static async list(
    businessId: number,
    opts: { includeInactive?: boolean } = {},
  ): Promise<BundledServicesResponse> {
    const params = opts.includeInactive ? { includeInactive: "true" } : undefined;
    const res = await axiosInstance.get(
      `/api/v1/businesses/${businessId}/bundled-services`,
      { params },
    );
    return res.data?.data ?? { services: [], outsideVendorsAllowed: null, outsideVendorFee: null };
  }

  static async create(
    businessId: number,
    body: UpsertBundledServiceInput,
  ): Promise<BundledService> {
    const res = await axiosInstance.post(
      `/api/v1/businesses/${businessId}/bundled-services`,
      body,
    );
    return res.data?.data?.service;
  }

  static async update(
    businessId: number,
    serviceId: number,
    body: UpsertBundledServiceInput,
  ): Promise<BundledService> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${businessId}/bundled-services/${serviceId}`,
      body,
    );
    return res.data?.data?.service;
  }

  static async remove(businessId: number, serviceId: number): Promise<void> {
    await axiosInstance.delete(
      `/api/v1/businesses/${businessId}/bundled-services/${serviceId}`,
    );
  }

  /** PATCH /api/v1/businesses/:id/outside-vendor-policy */
  static async setOutsideVendorPolicy(
    businessId: number,
    body: OutsideVendorPolicyInput,
  ): Promise<{
    outsideVendorsAllowed: boolean | null;
    outsideVendorFee: number | string | null;
  }> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${businessId}/outside-vendor-policy`,
      body,
    );
    return res.data?.data;
  }
}

// Friendly category labels for the FE (Pakistani-customer-facing).
export const BUNDLED_CATEGORY_LABELS: Record<BundledServiceCategory, string> = {
  catering: "Catering",
  decor: "Decoration",
  dj: "DJ",
  sound: "Sound system",
  photography: "Photography",
  videography: "Videography",
  valet: "Valet parking",
  generator: "Generator backup",
  floral: "Floral",
  mehndi_artist: "Mehndi artist",
  makeup: "Makeup",
  henna: "Henna",
  live_streaming: "Live streaming",
  cake: "Wedding cake",
  mithai: "Mithai & sweets",
  marquee: "Marquee / tent",
  furniture: "Furniture rental",
  lighting: "Lighting",
  other: "Other",
};

export const BUNDLED_PRICE_MODEL_LABELS: Record<BundledServicePriceModel, string> = {
  per_plate: "Per plate",
  flat: "Flat fee",
  percentage_of_total: "% of booking total",
  free: "Free / included",
};
