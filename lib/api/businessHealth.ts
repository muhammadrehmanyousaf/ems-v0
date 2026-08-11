import axiosInstance from "../axiosConfig";
import type { HealthSignals } from "@/lib/health/score";

/**
 * Vendor health signals — the four numbers behind the health score.
 *
 * The server sends `null` for anything it could not determine, which maps onto
 * the model's "unknown" (see lib/health/score.ts). The translation below turns
 * null into undefined deliberately: the scorer's contract is that a MISSING key
 * means unknown, and passing an explicit null would type-error rather than
 * quietly score a zero.
 */
export interface HealthSignalsResponse {
  hasBusiness: boolean;
  unansweredEnquiries: number | null;
  oldestUnansweredHours: number | null;
  hasPublishedAvailability: boolean | null;
  bookingsMissingPayment: number | null;
  bookingsAwaitingAction: number | null;
}

const orUnknown = <T>(v: T | null | undefined): T | undefined =>
  v == null ? undefined : v;

export function toSignals(r: HealthSignalsResponse): HealthSignals {
  return {
    hasBusiness: !!r.hasBusiness,
    unansweredEnquiries: orUnknown(r.unansweredEnquiries),
    // Only meaningful alongside a count, and the model reads it as
    // `?? null` anyway — but keep the distinction rather than defaulting to 0,
    // which would claim every unanswered lead arrived this second.
    oldestUnansweredHours: orUnknown(r.oldestUnansweredHours),
    hasPublishedAvailability: orUnknown(r.hasPublishedAvailability),
    bookingsMissingPayment: orUnknown(r.bookingsMissingPayment),
    bookingsAwaitingAction: orUnknown(r.bookingsAwaitingAction),
  };
}

export const BusinessHealthAPI = {
  async getSignals(businessId?: number | string | null): Promise<HealthSignals> {
    const res = await axiosInstance.get("/api/v1/analytics/health-signals", {
      params: businessId ? { businessId } : undefined,
    });
    return toSignals(res.data?.data ?? res.data);
  },
};
