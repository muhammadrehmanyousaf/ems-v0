/**
 * BK-100.51 — Multi-resource capacity API client (Layer 1).
 *
 * Vendors with parallel-capacity realities (banquet with 3 halls,
 * caterer with kitchen-capacity-by-guests, photographer studio with
 * 5 crews, marquee company with 20 tents) declare their resources
 * here. Slot-engine integration ships in Layer 2 behind the
 * `useMultiResourceCapacity` opt-in flag.
 */

import axiosInstance from "@/lib/axiosConfig";

export type BusinessResourceKind =
  | "hall"
  | "kitchen_capacity_guests"
  | "photographer_crew"
  | "videographer_crew"
  | "decor_team"
  | "dj_setup"
  | "sound_system_setup"
  | "tent"
  | "driver_car"
  | "stage"
  | "henna_artist_seat"
  | "makeup_chair"
  | "live_cooking_station"
  | "generic_unit";

export interface BusinessResource {
  id: number;
  businessId: number;
  kind: BusinessResourceKind;
  label: string;
  quantity: number;
  capacityUnit: number | null;
  unitsPerBooking: number;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  constraintsJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessResourcesResponse {
  resources: BusinessResource[];
  useMultiResourceCapacity: boolean;
}

export interface UpsertResourceInput {
  kind?: BusinessResourceKind;
  label?: string;
  quantity?: number;
  capacityUnit?: number | null;
  unitsPerBooking?: number;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  constraintsJson?: Record<string, unknown> | null;
}

export class BusinessResourcesAPI {
  /**
   * GET /api/v1/businesses/:id/resources
   * Public-ish; pass `includeInactive=true` for owner/admin to also
   * get inactive rows.
   */
  static async list(
    businessId: number,
    opts: { includeInactive?: boolean } = {},
  ): Promise<BusinessResourcesResponse> {
    const params = opts.includeInactive ? { includeInactive: "true" } : undefined;
    const res = await axiosInstance.get(
      `/api/v1/businesses/${businessId}/resources`,
      { params },
    );
    return (
      res.data?.data ?? { resources: [], useMultiResourceCapacity: false }
    );
  }

  static async create(
    businessId: number,
    body: UpsertResourceInput,
  ): Promise<BusinessResource> {
    const res = await axiosInstance.post(
      `/api/v1/businesses/${businessId}/resources`,
      body,
    );
    return res.data?.data?.resource;
  }

  static async update(
    businessId: number,
    resourceId: number,
    body: UpsertResourceInput,
  ): Promise<BusinessResource> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${businessId}/resources/${resourceId}`,
      body,
    );
    return res.data?.data?.resource;
  }

  static async remove(businessId: number, resourceId: number): Promise<void> {
    await axiosInstance.delete(
      `/api/v1/businesses/${businessId}/resources/${resourceId}`,
    );
  }

  /** PATCH /api/v1/businesses/:id/multi-resource-capacity */
  static async setMultiResourceFlag(
    businessId: number,
    useMultiResourceCapacity: boolean,
  ): Promise<{ useMultiResourceCapacity: boolean }> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${businessId}/multi-resource-capacity`,
      { useMultiResourceCapacity },
    );
    return res.data?.data;
  }
}

// Customer-friendly label + helper text per kind.
export const RESOURCE_KIND_LABELS: Record<
  BusinessResourceKind,
  { label: string; hint: string }
> = {
  hall: {
    label: "Hall / room",
    hint: "A bookable hall (Main Hall, Garden Lawn, etc.). Optional capacity = max seated guests.",
  },
  kitchen_capacity_guests: {
    label: "Kitchen capacity",
    hint: "Caterer kitchen — capacity is total guests/night you can serve.",
  },
  photographer_crew: {
    label: "Photographer crew",
    hint: "One bookable photographer team (lead + assist). Studio with 5 crews = quantity 5.",
  },
  videographer_crew: {
    label: "Videographer crew",
    hint: "One bookable videography team.",
  },
  decor_team: {
    label: "Decor team",
    hint: "One parallel decor-setup crew. Decorator with 2 teams = quantity 2.",
  },
  dj_setup: {
    label: "DJ setup",
    hint: "One audio rig + DJ. DJ company with 3 rigs = quantity 3.",
  },
  sound_system_setup: {
    label: "Sound system",
    hint: "Standalone sound system rental (no DJ).",
  },
  tent: {
    label: "Tent / marquee",
    hint: "Marquee inventory. Owns 20 tents = quantity 20. Optional capacity = max guests/tent.",
  },
  driver_car: {
    label: "Car / driver",
    hint: "One bookable car (and driver). Fleet of 12 = quantity 12.",
  },
  stage: {
    label: "Stage",
    hint: "One mehndi/baraat stage. Decorator with 3 stages = quantity 3.",
  },
  henna_artist_seat: {
    label: "Henna seat",
    hint: "Parallel henna chair. Studio with 4 chairs = quantity 4.",
  },
  makeup_chair: {
    label: "Makeup chair",
    hint: "Parallel makeup chair / station.",
  },
  live_cooking_station: {
    label: "Live cooking station",
    hint: "Chaat / paan / tandoor / juice corner.",
  },
  generic_unit: {
    label: "Other",
    hint: "Catch-all for resources that don't fit a specific kind.",
  },
};
