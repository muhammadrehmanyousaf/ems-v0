// Venue-OS P3-G — legal cockpit (489-F, consumer-court, Review War-Room) + ESG rule
// engine feature flags (OFF by default). The ETH-4 defamation lever is hard-gated in
// the backend regardless of these flags. Backend 404s until ENABLE_LEGAL / ENABLE_ESG.
//
//   NEXT_PUBLIC_LEGAL_ON=true → render the legal cockpit
//   NEXT_PUBLIC_ESG_ON=true   → render the ESG panel

import { runtimeFlagOn } from "@/lib/venue-os-runtime-flags";

const LEGAL = process.env.NEXT_PUBLIC_LEGAL_ON === "true";
const ESG = process.env.NEXT_PUBLIC_ESG_ON === "true";

/** Whether the legal cockpit surface should render. OFF by default; ON via env
 *  globally, or per-venue via the ENABLE_LEGAL runtime override. */
export function isLegalOn(_businessId?: number | string | null): boolean {
  return LEGAL || runtimeFlagOn("ENABLE_LEGAL");
}
/** Whether the ESG surface should render. OFF by default; ON via env globally,
 *  or per-venue via the ENABLE_ESG runtime override. */
export function isEsgOn(_businessId?: number | string | null): boolean {
  return ESG || runtimeFlagOn("ENABLE_ESG");
}

export const LEGAL_ON = LEGAL;
export const ESG_ON = ESG;
