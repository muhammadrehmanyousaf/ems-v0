/**
 * What the booking picker knows about one day (CUSTOMER-003 / 004 / 017).
 *
 *   free         the venue answered and the day is open
 *   partial      some of the day's periods / slots are taken
 *   unavailable  the venue answered and there is nothing to book
 *   pending      we have not heard back yet
 *   unknown      the lookup failed; stay permissive (the server still refuses at submit)
 *
 * The month answer has two SHAPES, and an absent day means opposite things in them:
 *   - slot templates (the venue sells named slots): the answer lists EVERY day, so an absent day is closed;
 *   - fixed periods (no templates): `/bookings/availability` is an EXCEPTIONS list (only days that carry a booking
 *     or a block), so an absent day is a day nobody has booked: free. Reading it the template way made every day
 *     of a template-less venue "not available" the moment the month loaded, and a failed request (which the
 *     client turned into `{}`) did the same.
 */

export type MonthLoadState = "loading" | "ready" | "error" | undefined;
export type DayKnowledge = "free" | "partial" | "unavailable" | "pending" | "unknown";
export interface DayAvailabilityLike {
  isBlocked?: boolean;
  availableSlots: readonly unknown[];
  bookedSlots: readonly unknown[];
}

export function dayKnowledgeOf(avail: DayAvailabilityLike | undefined, state: MonthLoadState, useTemplates: boolean): DayKnowledge {
  if (avail) {
    if (avail.isBlocked || avail.availableSlots.length === 0) return "unavailable";
    return avail.bookedSlots.length > 0 ? "partial" : "free";
  }
  if (state === "ready") return useTemplates ? "unavailable" : "free";
  if (state === "error") return "unknown";
  return "pending";
}
