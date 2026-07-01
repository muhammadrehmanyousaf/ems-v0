// Venue-OS P3-B — capex / asset-ROI (buy-vs-rent-vs-lease + payback + replacement
// reserve) feature flag (OFF by default). The backend 404s until ENABLE_CAPEX.
//
//   NEXT_PUBLIC_CAPEX_ON=true → render the capex ROI panel
//   (unset / anything else)   → OFF (default)

const ON = process.env.NEXT_PUBLIC_CAPEX_ON === "true";

/** Whether the capex / asset-ROI surface should render. OFF by default. */
export function isCapexOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const CAPEX_ON = isCapexOn();
