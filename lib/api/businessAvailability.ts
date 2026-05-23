import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

const v1 = `${BACKEND_URL}api/v1`;

// BK-048 — vendor vacation mode (lives on the Business row).
export interface VacationModeUpdate {
  vacationMode: boolean;
  vacationStartsAt?: string | null; // YYYY-MM-DD
  vacationEndsAt?: string | null;   // YYYY-MM-DD
  vacationMessage?: string | null;
}

// BK-011 — recurring vendor blocks.
// weekdayMask follows BusinessSlotTemplate convention: Mon=1, Tue=2, ..., Sun=64.
export interface RecurringBlock {
  id: number;
  businessId: number;
  weekdayMask: number;
  slotTemplateId: number | null;
  startDate: string;
  endDate: string | null;
  reason: string | null;
}

export const WEEKDAY_BITS = [
  { bit: 1, label: "Mon" },
  { bit: 2, label: "Tue" },
  { bit: 4, label: "Wed" },
  { bit: 8, label: "Thu" },
  { bit: 16, label: "Fri" },
  { bit: 32, label: "Sat" },
  { bit: 64, label: "Sun" },
];

export class BusinessAvailabilityAPI {
  // BK-048 — update vacation-mode fields on a Business via existing PATCH route.
  // (The bulk business update endpoint accepts these columns directly.)
  static async setVacationMode(
    businessId: number,
    body: VacationModeUpdate,
  ): Promise<{ business: unknown }> {
    const res = await axiosInstance.patch(
      `${v1}/businesses/user-business/${businessId}`,
      body,
    );
    return res.data?.data;
  }

  // Venue compliance pack — legal guest cap / closing time / one-dish policy.
  // Reuses the same user-business PATCH that vacation mode uses.
  static async setCompliance(
    businessId: number,
    body: {
      legalGuestCap?: number | null;
      eventClosingTime?: string | null;
      oneDishPolicy?: boolean;
    },
  ): Promise<{ business: unknown }> {
    const res = await axiosInstance.patch(
      `${v1}/businesses/user-business/${businessId}`,
      body,
    );
    return res.data?.data;
  }

  // BK-011 — list/create/delete recurring blocks for a business.
  static async listRecurringBlocks(
    businessId: number,
  ): Promise<{ blocks: RecurringBlock[] }> {
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/recurring-blocks`,
    );
    return res.data?.data;
  }

  static async createRecurringBlock(
    businessId: number,
    body: {
      weekdayMask: number;
      slotTemplateId?: number | null;
      startDate: string;
      endDate?: string | null;
      reason?: string;
    },
  ): Promise<{ block: RecurringBlock }> {
    const res = await axiosInstance.post(
      `${v1}/businesses/${businessId}/recurring-blocks`,
      body,
    );
    return res.data?.data;
  }

  static async deleteRecurringBlock(
    businessId: number,
    blockId: number,
  ): Promise<void> {
    await axiosInstance.delete(
      `${v1}/businesses/${businessId}/recurring-blocks/${blockId}`,
    );
  }

  // BK-008/15 + BK-019 + BK-053 — bulk slot availability for the calendar
  // grid. Backend caps at 60 days. Returns `days` keyed by YYYY-MM-DD with
  // per-template rows so the calendar can render "Lunch 2/3 · Dinner 1/3"
  // chips without N×templates round trips.
  static async getBulkAvailability(
    businessId: number,
    fromDate: string,
    toDate: string,
  ): Promise<{
    from: string;
    to: string;
    days: Record<string, SlotAvailabilityRow[]>;
  }> {
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/slots/availability/bulk`,
      { params: { from: fromDate, to: toDate } },
    );
    return res.data?.data;
  }
}

// Per (date, slotTemplate) shape — mirrors `slotService.availability()`.
export interface SlotAvailabilityRow {
  slotTemplateId: number;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  used: number;
  free: number;
  blocked: boolean;
  blockReason: string | null;
  runsThisWeekday: boolean;
  utilizationPct: number;
  lastSpot: boolean;
  thresholdPct: number;
}

// ───────────────────────────────────────────────────────────────────
// Phase 0 #6.2 — Slot Templates CRUD (vendor-side availability core).
// ───────────────────────────────────────────────────────────────────

export interface SlotTemplate {
  id: number;
  businessId: number;
  label: string;
  startTime: string; // HH:MM:SS
  endTime: string;
  capacity: number;
  weekdayMask: number;
  isActive: boolean;
  sortOrder: number;
  bufferAfterMinutes: number;
  unitGuestCapacity: number | null;
}

export interface UpsertSlotTemplateInput {
  label?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  weekdayMask?: number;
  isActive?: boolean;
  sortOrder?: number;
  bufferAfterMinutes?: number;
  unitGuestCapacity?: number | null;
}

export class SlotTemplatesAPI {
  static async list(
    businessId: number,
    opts: { onlyActive?: boolean } = {},
  ): Promise<SlotTemplate[]> {
    const params = opts.onlyActive === false ? { onlyActive: 'false' } : undefined;
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/slots`,
      { params },
    );
    return res.data?.data?.templates ?? res.data?.data ?? [];
  }

  static async create(
    businessId: number,
    body: UpsertSlotTemplateInput,
  ): Promise<SlotTemplate> {
    const res = await axiosInstance.post(
      `${v1}/businesses/${businessId}/slots`,
      body,
    );
    return res.data?.data?.template ?? res.data?.data;
  }

  static async update(
    businessId: number,
    templateId: number,
    body: UpsertSlotTemplateInput,
  ): Promise<SlotTemplate> {
    const res = await axiosInstance.patch(
      `${v1}/businesses/${businessId}/slots/${templateId}`,
      body,
    );
    return res.data?.data?.template ?? res.data?.data;
  }

  /** Soft-deactivate (the backend keeps the row for historical bookings). */
  static async deactivate(businessId: number, templateId: number): Promise<void> {
    await axiosInstance.delete(
      `${v1}/businesses/${businessId}/slots/${templateId}`,
    );
  }

  /** One-tap onboarding: seeds Morning / Afternoon / Evening templates. */
  static async seedDefaults(businessId: number): Promise<SlotTemplate[]> {
    const res = await axiosInstance.post(
      `${v1}/businesses/${businessId}/slots/templates/seed-defaults`,
    );
    return res.data?.data?.templates ?? [];
  }
}

// ───────────────────────────────────────────────────────────────────
// Phase 0 #6.4 — Per-date capacity overrides.
// ───────────────────────────────────────────────────────────────────

export interface CapacityOverride {
  id: number;
  businessId: number;
  forDate: string; // YYYY-MM-DD
  slotTemplateId: number | null; // NULL = day-wide
  capacityOverride: number;
  reason: string | null;
  createdByUserId: number | null;
}

export interface UpsertCapacityOverrideInput {
  forDate: string;
  slotTemplateId?: number | null;
  capacityOverride: number;
  reason?: string;
}

export class CapacityOverridesAPI {
  static async list(
    businessId: number,
    opts: { from?: string; to?: string } = {},
  ): Promise<CapacityOverride[]> {
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/slots/capacity-overrides`,
      { params: opts },
    );
    return res.data?.data?.overrides ?? res.data?.data ?? [];
  }

  static async set(
    businessId: number,
    body: UpsertCapacityOverrideInput,
  ): Promise<CapacityOverride> {
    const res = await axiosInstance.post(
      `${v1}/businesses/${businessId}/slots/capacity-overrides`,
      body,
    );
    return res.data?.data?.override ?? res.data?.data;
  }

  static async clear(businessId: number, overrideId: number): Promise<void> {
    await axiosInstance.delete(
      `${v1}/businesses/${businessId}/slots/capacity-overrides/${overrideId}`,
    );
  }
}
