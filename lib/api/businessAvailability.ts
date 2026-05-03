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
