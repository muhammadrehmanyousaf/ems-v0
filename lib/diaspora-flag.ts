// Venue-OS P3-H — diaspora FX rail + multi-vendor ServiceLines feature flags (OFF by
// default). Backend 404s until ENABLE_DIASPORA_FX / ENABLE_MULTIVENDOR_TYPES.
//
//   NEXT_PUBLIC_DIASPORA_FX_ON=true       → render the FX rail
//   NEXT_PUBLIC_MULTIVENDOR_TYPES_ON=true → render the service-line panel

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const FX = process.env.NEXT_PUBLIC_DIASPORA_FX_ON === "true";
const MV = process.env.NEXT_PUBLIC_MULTIVENDOR_TYPES_ON === "true";

/** Whether the diaspora FX rail should render. OFF by default; ON via env globally,
 *  or per-venue via the ENABLE_DIASPORA_FX runtime override. */
export function isDiasporaFxOn(_businessId?: number | string | null): boolean {
  return FX || runtimeFlagOn("ENABLE_DIASPORA_FX");
}
/** Whether the multi-vendor service-line surface should render. OFF by default; ON
 *  via env globally, or per-venue via the ENABLE_MULTIVENDOR_TYPES runtime override. */
export function isMultivendorTypesOn(_businessId?: number | string | null): boolean {
  return MV || runtimeFlagOn("ENABLE_MULTIVENDOR_TYPES");
}

export const DIASPORA_FX_ON = FX;
export const MULTIVENDOR_TYPES_ON = MV;
