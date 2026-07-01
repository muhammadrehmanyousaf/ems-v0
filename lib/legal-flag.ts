// Venue-OS P3-G — legal cockpit (489-F, consumer-court, Review War-Room) + ESG rule
// engine feature flags (OFF by default). The ETH-4 defamation lever is hard-gated in
// the backend regardless of these flags. Backend 404s until ENABLE_LEGAL / ENABLE_ESG.
//
//   NEXT_PUBLIC_LEGAL_ON=true → render the legal cockpit
//   NEXT_PUBLIC_ESG_ON=true   → render the ESG panel

const LEGAL = process.env.NEXT_PUBLIC_LEGAL_ON === "true";
const ESG = process.env.NEXT_PUBLIC_ESG_ON === "true";

/** Whether the legal cockpit surface should render. OFF by default. */
export function isLegalOn(_businessId?: number | string | null): boolean {
  return LEGAL;
}
/** Whether the ESG surface should render. OFF by default. */
export function isEsgOn(_businessId?: number | string | null): boolean {
  return ESG;
}

export const LEGAL_ON = isLegalOn();
export const ESG_ON = isEsgOn();
