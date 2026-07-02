// Venue-OS P3-C — financing modeller (committee / Ijarah / Shaadi-Qist BNPL +
// referral pack) feature flag (OFF by default). The backend 404s until ENABLE_FINANCING.
//
//   NEXT_PUBLIC_FINANCING_ON=true → render the financing modeller
//   (unset / anything else)       → OFF (default)

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const ON = process.env.NEXT_PUBLIC_FINANCING_ON === "true";

/** Whether the financing modeller surface should render. OFF by default; ON via
 *  env globally, or per-venue via the ENABLE_FINANCING runtime override. */
export function isFinancingOn(_businessId?: number | string | null): boolean {
  return ON || runtimeFlagOn("ENABLE_FINANCING");
}

export const FINANCING_ON = ON;
