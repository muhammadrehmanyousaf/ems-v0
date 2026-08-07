"use client";

/**
 * The halls × days availability grid.
 *
 * This used to be gated on the `venue_os_v2` runtime flag, so the grid a venue
 * needs most — which hall is free on which date — rendered for almost nobody.
 * The flag is gone: per the standing no-flags rule it was debt, and behind it
 * the per-hall calendar (WWL-100) could never be seen. The endpoint enforces
 * ownership itself; a flag was never what protected it.
 */
import { CalendarSlotGridView } from "./calendar-slot-grid-view";

export function CalendarV2Gate() {
  return (
    <div className="p-4 md:p-6 pb-0">
      <CalendarSlotGridView />
    </div>
  );
}

export default CalendarV2Gate;
