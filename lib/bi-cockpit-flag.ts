// Venue-OS P3-A — BI cockpit feature flag (OFF by default). Cross-venue KPI cockpit
// + same-store league table + Hijri-aligned YoY + drilldown. Pure read-models over
// the GL; the backend 404s until ENABLE_BI_COCKPIT.
//
//   NEXT_PUBLIC_BI_COCKPIT_ON=true  → render the BI cockpit
//   (unset / anything else)         → OFF (default)

const ON = process.env.NEXT_PUBLIC_BI_COCKPIT_ON === "true";

/** Whether the BI cockpit surface should render. OFF by default. */
export function isBiCockpitOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const BI_COCKPIT_ON = isBiCockpitOn();
