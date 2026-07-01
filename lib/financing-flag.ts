// Venue-OS P3-C — financing modeller (committee / Ijarah / Shaadi-Qist BNPL +
// referral pack) feature flag (OFF by default). The backend 404s until ENABLE_FINANCING.
//
//   NEXT_PUBLIC_FINANCING_ON=true → render the financing modeller
//   (unset / anything else)       → OFF (default)

const ON = process.env.NEXT_PUBLIC_FINANCING_ON === "true";

/** Whether the financing modeller surface should render. OFF by default. */
export function isFinancingOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const FINANCING_ON = isFinancingOn();
