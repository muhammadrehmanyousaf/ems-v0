// Venue-OS P3-D — succession & equity (Faraid engine, exit valuation, pagri,
// succession plans) feature flag (OFF by default). The Partner Statement stays a
// free read-only surface; this gates the ownership write/plan tools. The backend
// 404s until ENABLE_OWNERSHIP.
//
//   NEXT_PUBLIC_OWNERSHIP_ON=true → render the succession panel
//   (unset / anything else)       → OFF (default)

const ON = process.env.NEXT_PUBLIC_OWNERSHIP_ON === "true";

/** Whether the succession & equity surface should render. OFF by default. */
export function isOwnershipOn(_businessId?: number | string | null): boolean {
  return ON;
}

export const OWNERSHIP_ON = isOwnershipOn();
