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
  /**
   * `subVenueId` scopes the slots to one space:
   *
   *   undefined  every slot in the business (unchanged default — a venue whose
   *              slots are all space-scoped would otherwise show an empty picker)
   *   null       the venue-wide set only, for "no hall chosen yet"
   *   a number   that space's own slots, falling back to venue-wide
   *
   * The middle case is the one that was missing. Passing null used to be
   * indistinguishable from omitting the param, so a customer who had not picked
   * a hall was offered slots belonging privately to ONE hall — live on 3358,
   * "Morning 10:58-22:58" is private to space 3355 and was shown beside the
   * venue-wide "Lunch event" and "Dinner event", overlapping both.
   */
  static async getBulkAvailability(
    businessId: number,
    fromDate: string,
    toDate: string,
    subVenueId?: number | null,
  ): Promise<{
    from: string;
    to: string;
    days: Record<string, SlotAvailabilityRow[]>;
  }> {
    const scope =
      subVenueId === undefined ? {} : subVenueId === null ? { subVenueId: "none" } : { subVenueId };
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/slots/availability/bulk`,
      { params: { from: fromDate, to: toDate, ...scope } },
    );
    return res.data?.data;
  }

  // BK-008 — one day's slot availability (bulk with from==to). Returns the
  // per-slot rows the vendor sees when managing a single date.
  static async getDayAvailability(
    businessId: number,
    date: string,
    subVenueId?: number | null,
  ): Promise<SlotAvailabilityRow[]> {
    const r = await BusinessAvailabilityAPI.getBulkAvailability(businessId, date, date, subVenueId);
    return r?.days?.[date] ?? [];
  }
}

// ───────────────────────────────────────────────────────────────────
// BK-008 — per-(date, slot) blocks (BusinessSlotBlock). Distinct from the
// whole-day VendorBlockedDate leave the calendar toggle writes: this blocks
// ONE slot template on ONE date (e.g. "Evening band on the 15th — maintenance")
// while the day's other slots stay bookable. NULL slotTemplateId = whole day.
// Enforced at booking-create via slotService.assertSlotAvailable → isBlocked.
// ───────────────────────────────────────────────────────────────────

export interface SlotBlock {
  id: number;
  businessId: number;
  blockedDate: string; // YYYY-MM-DD
  slotTemplateId: number | null; // NULL = whole day
  reason: string | null;
  blockedByUserId: number | null;
}

export class SlotBlocksAPI {
  static async list(
    businessId: number,
    opts: { from?: string; to?: string } = {},
  ): Promise<SlotBlock[]> {
    const res = await axiosInstance.get(
      `${v1}/businesses/${businessId}/slots/blocks`,
      { params: opts },
    );
    return res.data?.data?.blocks ?? res.data?.data ?? [];
  }

  /** Block one slot on one date. `slotTemplateId: null` blocks the whole day.
   *  Throws a 409 (with `code`) when active holds/bookings sit on that slot. */
  static async block(
    businessId: number,
    body: { blockedDate: string; slotTemplateId?: number | null; reason?: string },
  ): Promise<SlotBlock> {
    const res = await axiosInstance.post(
      `${v1}/businesses/${businessId}/slots/blocks`,
      body,
    );
    return res.data?.data?.block ?? res.data?.data;
  }

  static async unblock(businessId: number, blockId: number): Promise<void> {
    await axiosInstance.delete(
      `${v1}/businesses/${businessId}/slots/blocks/${blockId}`,
    );
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
  /** Guests ONE booking of this slot may bring. NULL = no per-booking limit.
   *  Distinct from `capacity`, which counts concurrent bookings — the pair the
   *  vendor form conflated badly enough to publish "150 bookings at once". */
  unitGuestCapacity?: number | null;
  /** The space this slot belongs to; NULL = venue-wide. */
  subVenueId?: number | null;
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
