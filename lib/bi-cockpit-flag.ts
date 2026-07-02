// Venue-OS P3-A — BI cockpit feature flag (OFF by default). Cross-venue KPI cockpit
// + same-store league table + Hijri-aligned YoY + drilldown. Pure read-models over
// the GL; the backend 404s until ENABLE_BI_COCKPIT.
//
//   NEXT_PUBLIC_BI_COCKPIT_ON=true  → render the BI cockpit
//   (unset / anything else)         → OFF (default)

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const ON = process.env.NEXT_PUBLIC_BI_COCKPIT_ON === "true";

/** Whether the BI cockpit surface should render. OFF by default; ON via env
 *  globally, or per-venue via the ENABLE_BI_COCKPIT runtime override. */
export function isBiCockpitOn(_businessId?: number | string | null): boolean {
  return ON || runtimeFlagOn("ENABLE_BI_COCKPIT");
}

export const BI_COCKPIT_ON = ON;
