// Venue-OS P3-B — capex / asset-ROI (buy-vs-rent-vs-lease + payback + replacement
// reserve) feature flag (OFF by default). The backend 404s until ENABLE_CAPEX.
//
//   NEXT_PUBLIC_CAPEX_ON=true → render the capex ROI panel
//   (unset / anything else)   → OFF (default)

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const ON = process.env.NEXT_PUBLIC_CAPEX_ON === "true";

/** Whether the capex / asset-ROI surface should render. OFF by default; ON via env
 *  globally, or per-venue via the ENABLE_CAPEX runtime override. */
export function isCapexOn(_businessId?: number | string | null): boolean {
  return ON || runtimeFlagOn("ENABLE_CAPEX");
}

export const CAPEX_ON = ON;
