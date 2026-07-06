"use client";

/**
 * Phase-1 EPIC 2 · T2.2 — client gate for the v2 availability grid.
 *
 * Renders the new halls×slots grid only when the runtime flag venue_os_v2 is on
 * for the vendor; otherwise nothing (the existing calendar below is untouched).
 * Additive on purpose — the pilot gets the grid on top of the current calendar
 * rather than a risky wholesale replacement.
 */
import { useRuntimeFlag } from "@/lib/venue-os-runtime-flags";
import { CalendarSlotGridView } from "./calendar-slot-grid-view";

export function CalendarV2Gate() {
  const on = useRuntimeFlag("venue_os_v2");
  if (!on) return null;
  return (
    <div className="p-4 md:p-6 pb-0">
      <CalendarSlotGridView />
    </div>
  );
}

export default CalendarV2Gate;
