// Venue-OS P3-D — succession & equity (Faraid engine, exit valuation, pagri,
// succession plans) feature flag (OFF by default). The Partner Statement stays a
// free read-only surface; this gates the ownership write/plan tools. The backend
// 404s until ENABLE_OWNERSHIP.
//
//   NEXT_PUBLIC_OWNERSHIP_ON=true → render for everyone, OR
//   a per-business FeatureFlagOverride (ENABLE_OWNERSHIP) → render for that venue.
import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const ON = process.env.NEXT_PUBLIC_OWNERSHIP_ON === "true";

/** Whether the succession & equity surface should render. OFF by default;
 *  ON globally via env, or per-venue via the runtime override. */
export function isOwnershipOn(_businessId?: number | string | null): boolean {
  return ON || runtimeFlagOn("ENABLE_OWNERSHIP");
}

export const OWNERSHIP_ON = ON;
